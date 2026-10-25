from datetime import date

from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    branch: str
    joined_year: int
    standing: str
    github_url: str | None = None
    gender: str | None = None
    dob: date | None = None
