from collections.abc import Iterable
from dataclasses import dataclass
from typing import TypedDict


class Role(TypedDict):
    title: str
    skills: list[str]
    filled: bool


class Student(TypedDict):
    id: int
    name: str
    branch: str
    year: int
    skills: list[str]


class SuggestedMember(TypedDict):
    id: int
    name: str
    branch: str
    year: int
    matched_skills: list[str]
    score: int


@dataclass(frozen=True)
class MatchResult:
    score: int
    matched_skills: list[str]
    best_role: str | None
    role_fit: float


def calculate_match(
    user_skills: Iterable[str],
    project_skills: Iterable[str],
    roles: Iterable[Role],
) -> MatchResult:
    user_set = set(user_skills)
    project_set = set(project_skills)
    matched = sorted(user_set & project_set)
    stack_coverage = len(matched) / len(project_set) if project_set else 0

    role_fit = 0.0
    best_role = None
    for role in roles:
        if role["filled"]:
            continue
        required = set(role["skills"])
        fit = len(user_set & required) / len(required) if required else 0
        if fit > role_fit:
            role_fit = fit
            best_role = role["title"]

    return MatchResult(
        score=round(100 * (0.6 * role_fit + 0.4 * stack_coverage)),
        matched_skills=matched[:3],
        best_role=best_role,
        role_fit=role_fit,
    )


def suggest_members(
    owner_id: int,
    role_skills: Iterable[str],
    students: Iterable[Student],
    limit: int = 5,
) -> list[SuggestedMember]:
    required = set(role_skills)
    if not required:
        return []

    suggestions: list[SuggestedMember] = []
    for student in students:
        if student["id"] == owner_id:
            continue
        matched = sorted(set(student["skills"]) & required)
        if not matched:
            continue
        suggestions.append(
            {
                "id": student["id"],
                "name": student["name"],
                "branch": student["branch"],
                "year": student["year"],
                "matched_skills": matched,
                "score": round(100 * len(matched) / len(required)),
            }
        )

    suggestions.sort(key=lambda student: (-student["score"], student["name"].casefold()))
    return suggestions[:limit]

