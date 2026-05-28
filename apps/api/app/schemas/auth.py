from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)
    remember_me: bool = False


class LoginResponse(BaseModel):
    success: bool
    token_type: str = "bearer"
    access_expires_in: int
    remember_me: bool


class MeResponse(BaseModel):
    id: str
    email: EmailStr
    name: str | None = None
    role: str = "admin"
