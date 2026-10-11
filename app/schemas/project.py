import re
from typing import Literal
from urllib.parse import urlsplit

from pydantic import BaseModel, EmailStr, Field, StrictBool, field_validator


GITHUB_REPO_PATTERN = re.compile(r"^https://github\.com/[\w.-]+/[\w.-]+/?$")


def clean_required_text(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("This field is required")
    return value


def validate_web_url(value: str | None) -> str | None:
    if value is None:
        return value
    parsed = urlsplit(value)
    if (
        parsed.scheme not in {"http", "https"}
        or not parsed.hostname
        or any(character.isspace() for character in value)
    ):
        raise ValueError("Enter a valid http(s) URL")
    try:
        parsed.port
    except ValueError as error:
        raise ValueError("Enter a valid http(s) URL") from error
    return value


class ProjectRoleInput(BaseModel):
    id: int | None = Field(default=None, gt=0)
    title: str = Field(min_length=1, max_length=60)
    skills: list[str] = Field(min_length=1, max_length=15)
    filled: bool = False

    @field_validator("title", mode="before")
    @classmethod
    def strip_title(cls, value):
        return clean_required_text(value) if isinstance(value, str) else value

    @field_validator("skills")
    @classmethod
    def remove_duplicate_skills(cls, skills):
        return list(dict.fromkeys(skill.strip() for skill in skills))


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    summary: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=4000)
    skills: list[str] = Field(min_length=1, max_length=15)
    contact_email: EmailStr
    contact_url: str | None = None
    repo_url: str | None = None
    roles: list[ProjectRoleInput] = Field(default_factory=list, max_length=10)

    @field_validator("title", "summary", "description", mode="before")
    @classmethod
    def strip_required_fields(cls, value):
        return clean_required_text(value) if isinstance(value, str) else value

    @field_validator("skills")
    @classmethod
    def remove_duplicate_skills(cls, skills):
        return list(dict.fromkeys(skill.strip() for skill in skills))

    @field_validator("contact_url")
    @classmethod
    def validate_contact_url(cls, value):
        return validate_web_url(value)

    @field_validator("repo_url")
    @classmethod
    def validate_repo_url(cls, value):
        if value is not None and not GITHUB_REPO_PATTERN.fullmatch(value):
            raise ValueError("Must look like https://github.com/owner/repo")
        return value


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=80)
    summary: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1, max_length=4000)
    skills: list[str] | None = Field(default=None, min_length=1, max_length=15)
    contact_email: EmailStr | None = None
    contact_url: str | None = None
    repo_url: str | None = None
    roles: list[ProjectRoleInput] | None = Field(default=None, max_length=10)
    status: Literal["open", "closed"] | None = None

    @field_validator("title", "summary", "description", mode="before")
    @classmethod
    def strip_optional_fields(cls, value):
        if value is None:
            raise ValueError("This field cannot be null")
        return clean_required_text(value) if isinstance(value, str) else value

    @field_validator("skills")
    @classmethod
    def remove_duplicate_skills(cls, skills):
        if skills is None:
            raise ValueError("This field cannot be null")
        return list(dict.fromkeys(skill.strip() for skill in skills))

    @field_validator("contact_email", "status", "roles", mode="before")
    @classmethod
    def reject_null_required_updates(cls, value):
        if value is None:
            raise ValueError("This field cannot be null")
        return value

    @field_validator("contact_url")
    @classmethod
    def validate_contact_url(cls, value):
        return validate_web_url(value)

    @field_validator("repo_url")
    @classmethod
    def validate_repo_url(cls, value):
        if value is not None and not GITHUB_REPO_PATTERN.fullmatch(value):
            raise ValueError("Must look like https://github.com/owner/repo")
        return value


class RoleUpdate(BaseModel):
    filled: StrictBool
