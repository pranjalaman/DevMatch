import re
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.academic_year import joined_year_in_window
from app.schemas.user import UserResponse

_GITHUB_PROFILE = re.compile(r"^https://github\.com/[\w.-]+/?$")
Gender = Literal["female", "male", "other"]


class ProfileDetails(BaseModel):
    joined_year: int
    github_url: str | None = None
    gender: Gender | None = None
    dob: date | None = None

    @field_validator("joined_year")
    @classmethod
    def joining_year_is_in_window(cls, value):
        if not joined_year_in_window(value, date.today()):
            raise ValueError("Choose a year from the current year back through five years")
        return value

    @field_validator("github_url", "gender", mode="before")
    @classmethod
    def blank_is_empty(cls, value):
        if isinstance(value, str) and value.strip() == "":
            return None
        return value.strip() if isinstance(value, str) else value

    @field_validator("github_url")
    @classmethod
    def github_profile_link(cls, value):
        if value is None:
            return None
        if not _GITHUB_PROFILE.fullmatch(value):
            raise ValueError("Use a profile link like https://github.com/your-name")
        return value.rstrip("/")

    @field_validator("dob", mode="before")
    @classmethod
    def blank_date_is_empty(cls, value):
        if value is None or value == "":
            return None
        return value

    @field_validator("dob")
    @classmethod
    def dob_is_in_the_past(cls, value):
        if value is None:
            return None
        today = date.today()
        if value > today:
            raise ValueError("Date of birth cannot be in the future")
        if value.year < today.year - 100:
            raise ValueError("Enter a real date of birth")
        return value


class SkillsData(BaseModel):
    skills: list[str] = Field(max_length=30)


class ProfileResponse(UserResponse):
    skills: list[str]


class SkillsResponse(BaseModel):
    skills: list[str]
