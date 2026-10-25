from collections.abc import Iterable
from dataclasses import dataclass
from typing import TypedDict


class Role(TypedDict):
    id: int
    title: str
    skills: list[str]
    filled: bool


class Student(TypedDict):
    id: int
    name: str
    branch: str
    standing: str
    skills: list[str]


class SuggestedMember(TypedDict):
    id: int
    name: str
    branch: str
    standing: str
    matched_skills: list[str]
    score: int


@dataclass(frozen=True)
class MatchResult:
    score: int
    matched_skills: list[str]
    best_role: str | None
    role_fit: float
    fit_overlap: int
    fit_size: int


def _half_up(numerator: int, denominator: int) -> int:
    if denominator <= 0 or numerator <= 0:
        return 0
    return (numerator + denominator // 2) // denominator


def _weighted_score(
    role_overlap: int,
    role_size: int,
    stack_overlap: int,
    stack_size: int,
) -> int:
    if stack_size <= 0:
        return 0
    if role_size <= 0 or role_overlap <= 0:
        return _half_up(400 * stack_overlap, 10 * stack_size)
    numerator = 6 * role_overlap * stack_size + 4 * stack_overlap * role_size
    denominator = 10 * role_size * stack_size
    return _half_up(100 * numerator, denominator)


def _is_better_role(
    candidate: tuple[int, int, int, int],
    current: tuple[int, int, int, int] | None,
) -> bool:
    overlap, size, _role_id, _order = candidate
    if overlap <= 0 or size <= 0:
        return False
    if current is None:
        return True
    current_overlap, current_size, current_id, _current_order = current
    if overlap * current_size != current_overlap * size:
        return overlap * current_size > current_overlap * size
    if overlap != current_overlap:
        return overlap > current_overlap
    return candidate[2] < current_id


def calculate_match(
    user_skills: Iterable[str],
    project_skills: Iterable[str],
    roles: Iterable[Role],
) -> MatchResult:
    user_set = set(user_skills)
    project_set = set(project_skills)
    stack_overlap = len(user_set & project_set)

    best: tuple[int, int, int, str, set[str]] | None = None
    for role in roles:
        if role["filled"]:
            continue
        required = set(role["skills"])
        if not required:
            continue
        overlap_skills = user_set & required
        candidate = (len(overlap_skills), len(required), role["id"])
        current = None if best is None else (best[0], best[1], best[2], 0)
        if _is_better_role((*candidate, 0), current):
            best = (*candidate, role["title"], overlap_skills)

    if best is None:
        return MatchResult(
            score=_weighted_score(0, 0, stack_overlap, len(project_set)),
            matched_skills=[],
            best_role=None,
            role_fit=0.0,
            fit_overlap=0,
            fit_size=0,
        )

    role_overlap, role_size, _role_id, title, best_skills = best
    ordered = sorted(best_skills)
    remaining = sorted((user_set & project_set) - best_skills)
    return MatchResult(
        score=_weighted_score(role_overlap, role_size, stack_overlap, len(project_set)),
        matched_skills=(ordered + remaining)[:3],
        best_role=title,
        role_fit=role_overlap / role_size,
        fit_overlap=role_overlap,
        fit_size=role_size,
    )


def visible_match(
    viewer_id: int | None,
    owner_id: int,
    user_skills: Iterable[str],
    roles: Iterable[Role],
) -> dict | None:
    role_list = list(roles)
    skills = list(user_skills)
    open_roles = [role for role in role_list if not role["filled"]]
    if viewer_id is None or not skills or viewer_id == owner_id or not open_roles:
        return None
    open_skills = sorted({skill for role in open_roles for skill in role["skills"]})
    match = calculate_match(skills, open_skills, role_list)
    return {
        "score": match.score,
        "matched_skills": match.matched_skills,
        "best_role": match.best_role,
        "role_fit": match.role_fit,
        "fit_overlap": match.fit_overlap,
        "fit_size": match.fit_size,
    }


def build_suggestion_groups(
    status: str,
    owner_id: int,
    roles: Iterable[Role],
    students: Iterable[Student],
) -> list[dict]:
    if status != "open":
        return []
    student_list = list(students)
    return [
        {
            "role_id": role["id"],
            "title": role["title"],
            "suggestions": suggest_members(owner_id, role["skills"], student_list),
        }
        for role in roles
        if not role["filled"]
    ]


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
                "standing": student["standing"],
                "matched_skills": matched,
                "score": _half_up(100 * len(matched), len(required)),
            }
        )

    suggestions.sort(key=lambda student: (-student["score"], student["name"].casefold()))
    return suggestions[:limit]
