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


def reject_line_breaks(value: str) -> str:
    if any(character in value for character in "\r\n"):
        raise ValueError("Must be a single line")
    return value


def _role_value(role, name, default=None):
    if isinstance(role, dict):
        return role.get(name, default)
    return getattr(role, name, default)


def resolve_role_replacement(current_rows: list[dict], submitted_roles: list) -> tuple[list[dict], set[int]]:
    current_ids = {row["id"] for row in current_rows}
    filled_by_id = {row["id"]: row["filled"] for row in current_rows}
    submitted_ids = {
        role_id
        for role in submitted_roles
        if (role_id := _role_value(role, "id")) is not None
    }
    if not submitted_ids.issubset(current_ids):
        raise ValueError("A role does not belong to this project")

    writes = []
    for role in submitted_roles:
        role_id = _role_value(role, "id")
        filled = _role_value(role, "filled", None)
        if filled is None:
            filled = False if role_id is None else filled_by_id[role_id]
        writes.append(
            {
                "id": role_id,
                "title": _role_value(role, "title"),
                "skills": list(_role_value(role, "skills", [])),
                "filled": filled,
            }
        )
    return writes, current_ids - submitted_ids


def clean_project_filters(q: str | None, skill: list[str]) -> tuple[str | None, list[str]]:
    if len(skill) > 10:
        raise ValueError("Choose at most 10 skills")
    wanted = list(dict.fromkeys(skill))
    if q is None:
        return None, wanted
    trimmed = q.strip()
    if len(trimmed) > 100:
        raise ValueError("Search must be 100 characters or fewer")
    if not trimmed:
        return None, wanted
    return trimmed, wanted


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
    filled: bool | None = None

    @field_validator("title", mode="before")
    @classmethod
    def strip_title(cls, value):
        if isinstance(value, str):
            return reject_line_breaks(clean_required_text(value))
        return value

    @field_validator("skills")
    @classmethod
    def remove_duplicate_skills(cls, skills):
        return list(dict.fromkeys(skill.strip() for skill in skills))


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    summary: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=4000)
    contact_email: EmailStr
    contact_url: str | None = None
    repo_url: str | None = None
    roles: list[ProjectRoleInput] = Field(default_factory=list, max_length=10)

    @field_validator("title", "summary", "description", mode="before")
    @classmethod
    def strip_required_fields(cls, value):
        return clean_required_text(value) if isinstance(value, str) else value

    @field_validator("title", "summary")
    @classmethod
    def single_line_listing_text(cls, value):
        return reject_line_breaks(value)

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

    @field_validator("title", "summary")
    @classmethod
    def single_line_listing_text(cls, value):
        if value is None:
            return value
        return reject_line_breaks(value)

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
