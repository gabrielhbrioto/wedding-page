from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt  # type: ignore[import-untyped]
from passlib.context import CryptContext  # type: ignore[import-untyped]


ALGORITHM = "HS256"
ROLE_ADMIN = "admin"
ACCESS_COOKIE_NAME = "access_token"
REFRESH_COOKIE_NAME = "refresh_token"

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return _pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    *,
    user_id: str,
    email: str,
    role: str,
    duration_minutes: int,
    secret_key: str,
) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=duration_minutes)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": int(expires_at.timestamp()),
    }
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def create_refresh_token(
    *,
    user_id: str,
    email: str,
    role: str,
    duration_days: int,
    secret_key: str,
) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=duration_days)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": int(expires_at.timestamp()),
        "type": "refresh",
    }
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def verify_access_token(token: str, secret_key: str) -> dict:
    payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
    _ensure_common_claims(payload)
    return payload


def verify_refresh_token(token: str, secret_key: str) -> dict:
    payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
    _ensure_common_claims(payload)
    if payload.get("type") != "refresh":
        raise JWTError("Invalid token type")
    return payload


def _ensure_common_claims(payload: dict) -> None:
    sub = payload.get("sub")
    email = payload.get("email")
    role = payload.get("role")
    exp = payload.get("exp")
    if not isinstance(sub, str) or not sub:
        raise JWTError("Missing sub")
    if not isinstance(email, str) or not email:
        raise JWTError("Missing email")
    if not isinstance(role, str) or role != ROLE_ADMIN:
        raise JWTError("Missing role")
    if not isinstance(exp, int):
        raise JWTError("Missing exp")
