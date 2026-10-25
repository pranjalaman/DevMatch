from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.user import UserResponse

BranchCode = Literal["CSE", "IT", "ECE", "EE", "ME", "CE", "CHE", "MIN", "MET", "PIE"]


class SignupData(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    branch: BranchCode
    year: int = Field(ge=1, le=5)

    @field_validator("name", "branch", mode="before")
    @classmethod
    def strip_required_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class LoginData(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user: UserResponse
