from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


class SkillsData(BaseModel):
    skills: list[str] = Field(max_length=30)


class ProfileResponse(UserResponse):
    skills: list[str]


class SkillsResponse(BaseModel):
    skills: list[str]
