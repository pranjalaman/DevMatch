from collections.abc import Iterable
from dataclasses import dataclass


@dataclass(frozen=True)
class MatchResult:
    score: int
    matched_skills: list[str]
    best_role: str | None
    role_fit: float


def calculate_match(
    user_skills: Iterable[str],
    project_skills: Iterable[str],
    roles: Iterable[dict],
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
    students: Iterable[dict],
    limit: int = 5,
) -> list[dict]:
    required = set(role_skills)
    if not required:
        return []

    suggestions = []
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


SKILL_ALIASES = {
    "js": "javascript",
    "py": "python",
    "reactjs": "react",
    "react.js": "react",
    "node": "nodejs",
    "node.js": "nodejs",
    "postgres": "postgresql",
    "ml": "machine-learning",
    "cpp": "c++",
    "ts": "typescript",
}


def normalize_skill(value: str) -> str:
    normalized = " ".join(value.lower().split())
    return SKILL_ALIASES.get(normalized, normalized)
