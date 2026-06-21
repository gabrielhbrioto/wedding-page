from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .dependencies import require_admin
from app.core.config import settings
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.schemas.auth import LoginRequest, LoginResponse, MeResponse
from app.utils.security import (
    ACCESS_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
    ROLE_ADMIN,
    create_access_token,
    create_refresh_token,
    verify_password,
)

router = APIRouter()


def _cookie_secure() -> bool:
    return settings.APP_ENV.lower() in {"prod", "production"}


def _set_access_cookie(response: Response, token: str) -> None:
    max_age = settings.ACCESS_TOKEN_DURATION * 60
    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=_cookie_secure(),
        samesite="lax",
        max_age=max_age,
        path="/",
    )


def _set_refresh_cookie(response: Response, token: str) -> None:
    max_age = settings.REFRESH_TOKEN_DURATION_DAYS * 24 * 60 * 60
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=_cookie_secure(),
        samesite="lax",
        max_age=max_age,
        path="/",
    )


@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):

    normalized_email = payload.email.strip().lower()

    admin = db.scalar(
        select(AdminUser).where(
            func.lower(AdminUser.email) == normalized_email,
            AdminUser.active.is_(True),
        )
    )
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha invalidos.",
        )

    access_token = create_access_token(
        user_id=str(admin.id),
        email=admin.email,
        role=ROLE_ADMIN,
        duration_minutes=settings.ACCESS_TOKEN_DURATION,
        secret_key=settings.SECRET_KEY,
    )
    _set_access_cookie(response, access_token)

    if payload.remember_me:
        refresh_token = create_refresh_token(
            user_id=str(admin.id),
            email=admin.email,
            role=ROLE_ADMIN,
            duration_days=settings.REFRESH_TOKEN_DURATION_DAYS,
            secret_key=settings.SECRET_KEY,
        )
        _set_refresh_cookie(response, refresh_token)
    else:
        response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/")

    return LoginResponse(
        success=True,
        access_expires_in=settings.ACCESS_TOKEN_DURATION * 60,
        remember_me=payload.remember_me,
    )


@router.post("/logout")
def logout(
    response: Response,
    _: AdminUser = Depends(require_admin),
):
    response.delete_cookie(key=ACCESS_COOKIE_NAME, path="/")
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/")
    return {"success": True}


@router.get("/me", response_model=MeResponse)
def me(
    current_admin: AdminUser = Depends(require_admin),
):
    return MeResponse(
        id=str(current_admin.id),
        email=current_admin.email,
        name=current_admin.name,
        role=ROLE_ADMIN,
    )

