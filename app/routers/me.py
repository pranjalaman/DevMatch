from difflib import get_close_matches

from app.database.db import get_db
from app.matcher import normalize_skill
from app.rate_limit import enforce_write_limit
from app.schemas.profile import ProfileResponse, SkillsData, SkillsResponse
from fastapi import APIRouter, Depends, HTTPException, Request

router = APIRouter(prefix="/api", tags=["profile"])


def require_user_id(request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Please log in first")
    return user_id


def require_write_user_id(request: Request):
    user_id = require_user_id(request)
    enforce_write_limit(user_id)
    return user_id


def get_user_skills(connection, user_id):
    rows = connection.execute(
        """
        SELECT skills.slug
        FROM skills
        JOIN user_skills ON user_skills.skill_id = skills.id
        WHERE user_skills.user_id = %s
        ORDER BY skills.slug
        """,
        (user_id,),
    ).fetchall()
    return [row["slug"] for row in rows]


@router.get("/me", response_model=ProfileResponse)
def get_me(request: Request, connection=Depends(get_db)):
    user_id = require_user_id(request)
    user = connection.execute(
        """
        SELECT id, name, email, branch, year, github_url
        FROM users
        WHERE id = %s
        """,
        (user_id,),
    ).fetchone()

    if not user:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Please log in again")

    user["skills"] = get_user_skills(connection, user_id)
    return user


@router.put("/me/skills", response_model=SkillsResponse)
def replace_my_skills(
    data: SkillsData,
    request: Request,
    connection=Depends(get_db),
):
    user_id = require_write_user_id(request)

    user_exists = connection.execute(
        "SELECT id FROM users WHERE id = %s", (user_id,)
    ).fetchone()
    if not user_exists:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Please log in again")

    skills = []
    for skill in data.skills:
        normalized = normalize_skill(skill)
        if normalized and normalized not in skills:
            skills.append(normalized)

    if skills:
        found = connection.execute(
            "SELECT slug FROM skills WHERE slug = ANY(%s)", (skills,)
        ).fetchall()
        found_skills = {row["slug"] for row in found}
        unknown_skills = [skill for skill in skills if skill not in found_skills]
        if unknown_skills:
            all_skills = connection.execute("SELECT slug FROM skills").fetchall()
            known_slugs = [row["slug"] for row in all_skills]
            suggestions = []
            for skill in unknown_skills:
                close = get_close_matches(skill, known_slugs, n=3, cutoff=0.55)
                suggestions.extend(close)
            suggestion_text = (
                f". Did you mean: {', '.join(dict.fromkeys(suggestions))}?"
                if suggestions
                else ""
            )
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Invalid input",
                    "fields": {
                        "skills": (
                            f"Unknown skills: {', '.join(unknown_skills)}"
                            f"{suggestion_text}"
                        )
                    },
                },
            )

    connection.execute("DELETE FROM user_skills WHERE user_id = %s", (user_id,))
    for skill in skills:
        connection.execute(
            """
            INSERT INTO user_skills (user_id, skill_id)
            SELECT %s, id FROM skills WHERE slug = %s
            """,
            (user_id, skill),
        )

    return {"skills": get_user_skills(connection, user_id)}