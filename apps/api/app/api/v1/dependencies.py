import uuid

from fastapi import Depends, HTTPException, Request, Response, status
from jose import JWTError  # type: ignore[import-untyped]
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.utils.security import (
    ACCESS_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
    create_access_token,
    verify_access_token,
    verify_refresh_token,
)


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


def require_admin(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AdminUser:
    payload = None

    access_token = request.cookies.get(ACCESS_COOKIE_NAME)
    if access_token:
        try:
            payload = verify_access_token(access_token, settings.SECRET_KEY)
        except JWTError:
            payload = None

    if payload is None:
        refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
        if refresh_token:
            try:
                refresh_payload = verify_refresh_token(
                    refresh_token,
                    settings.SECRET_KEY,
                )
                new_access_token = create_access_token(
                    user_id=refresh_payload["sub"],
                    email=refresh_payload["email"],
                    role=refresh_payload["role"],
                    duration_minutes=settings.ACCESS_TOKEN_DURATION,
                    secret_key=settings.SECRET_KEY,
                )
                _set_access_cookie(response, new_access_token)
                payload = refresh_payload
            except JWTError:
                payload = None

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nao autenticado.",
        )

    try:
        user_id = uuid.UUID(payload["sub"])
    except (ValueError, KeyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acesso invalido.",
        ) from exc

    admin = db.scalar(
        select(AdminUser).where(
            AdminUser.id == user_id,
            AdminUser.active.is_(True),
        )
    )
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario admin nao encontrado ou inativo.",
        )

    return admin
