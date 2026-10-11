from pydantic import BaseModel, EmailStr, Field, field_validator


class SignupData(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8)
    branch: str = Field(min_length=1)
    year: int = Field(ge=1, le=5)

    @field_validator("name", "branch", mode="before")
    @classmethod
    def strip_required_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class LoginData(BaseModel):
    email: EmailStr
    password: str


class SkillsData(BaseModel):
    skills: list[str] = Field(max_length=30)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    branch: str
    year: int
    github_url: str | None = None


class AuthResponse(BaseModel):
    user: UserResponse


class ProfileResponse(UserResponse):
    skills: list[str]


class SkillsResponse(BaseModel):
    skills: list[str]