from pydantic import EmailStr, Field

from app.schemas.base import CamelModel

USERNAME_PATTERN = r"^[a-zA-Z0-9_]{3,20}$"


class RegisterRequest(CamelModel):
    name: str
    username: str = Field(pattern=USERNAME_PATTERN)
    email: EmailStr
    password: str = Field(min_length=8)
    phone: str | None = None


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
