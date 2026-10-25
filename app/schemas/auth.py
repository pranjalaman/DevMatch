from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.academic_year import joined_year_in_window
from app.schemas.user import UserResponse

BranchCode = Literal["CSE", "IT", "ECE", "EE", "ME", "CE", "CHE", "MIN", "MET", "PIE"]


class SignupData(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    branch: BranchCode
    joined_year: int

    @field_validator("name", "branch", mode="before")
    @classmethod
    def strip_required_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("joined_year")
    @classmethod
    def joining_year_is_in_window(cls, value):
        if not joined_year_in_window(value, date.today()):
            raise ValueError("Choose a year from the current year back through four years")
        return value


class LoginData(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user: UserResponse
