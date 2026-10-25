from difflib import get_close_matches

from app.academic_year import with_standing
from app.database.db import get_db
from app.skill_names import resolve_skill_list
from app.rate_limit import enforce_write_limit
from app.schemas.profile import ProfileDetails, ProfileResponse, SkillsData, SkillsResponse
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
        SELECT id, name, email, branch, joined_year, github_url, gender, dob
        FROM users
        WHERE id = %s
        """,
        (user_id,),
    ).fetchone()

    if not user:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Please log in again")

    user["skills"] = get_user_skills(connection, user_id)
    return with_standing(user)


@router.patch("/me", response_model=ProfileResponse)
def update_profile(
    data: ProfileDetails,
    request: Request,
    connection=Depends(get_db),
):
    user_id = require_write_user_id(request)
    user = connection.execute(
        """
        UPDATE users
        SET joined_year = %s, github_url = %s, gender = %s, dob = %s
        WHERE id = %s
        RETURNING id, name, email, branch, joined_year, github_url, gender, dob
        """,
        (data.joined_year, data.github_url, data.gender, data.dob, user_id),
    ).fetchone()
    if not user:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Please log in again")
    user["skills"] = get_user_skills(connection, user_id)
    return with_standing(user)


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

    catalog = connection.execute("SELECT slug, label FROM skills").fetchall()
    skills, unknown_skills = resolve_skill_list(list(data.skills), catalog)
    if unknown_skills:
        known_slugs = [row["slug"] for row in catalog]
        suggestions = []
        for skill in unknown_skills:
            suggestions.extend(get_close_matches(skill, known_slugs, n=3, cutoff=0.55))
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