from collections import defaultdict
from difflib import get_close_matches
from fractions import Fraction
from typing import Any

from app.database.db import get_db
from app.github_client import decide_repo_meta, fetch_repo_metadata
from app.matcher import build_suggestion_groups, visible_match
from app.skill_names import resolve_skill_list
from app.routers.me import require_user_id, require_write_user_id
from app.schemas.project import (
    ProjectCreate,
    ProjectRoleInput,
    ProjectUpdate,
    RoleUpdate,
    clean_project_filters,
    resolve_role_replacement,
)
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from psycopg.types.json import Jsonb

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _match_sort_key(item: dict) -> tuple:
    match = item["match"] or {}
    fit_size = item.get("_fit_size") or 0
    fit = Fraction(item.get("_fit_overlap") or 0, fit_size) if fit_size else Fraction(0)
    return (match.get("score", 0), fit, item["created_at"], item["id"])


def _project_extras(connection, project_ids: list[int]) -> tuple[dict, dict]:
    if not project_ids:
        return {}, {}

    skills_by_project: dict[int, set[str]] = defaultdict(set)
    roles_by_project: dict[int, list[dict[str, Any]]] = defaultdict(list)
    role_ids = []
    for row in connection.execute(
        """
        SELECT id, project_id, title, filled
        FROM roles
        WHERE project_id = ANY(%s)
        ORDER BY id
        """,
        (project_ids,),
    ).fetchall():
        role = {
            "id": row["id"],
            "title": row["title"],
            "skills": [],
            "filled": row["filled"],
        }
        roles_by_project[row["project_id"]].append(role)
        role_ids.append(row["id"])

    if role_ids:
        roles_by_id = {
            role["id"]: role
            for roles in roles_by_project.values()
            for role in roles
        }
        for row in connection.execute(
            """
            SELECT rs.role_id, s.slug
            FROM role_skills rs
            JOIN skills s ON s.id = rs.skill_id
            WHERE rs.role_id = ANY(%s)
            ORDER BY s.slug
            """,
            (role_ids,),
        ).fetchall():
            roles_by_id[row["role_id"]]["skills"].append(row["slug"])

    for project_id, roles in roles_by_project.items():
        for role in roles:
            skills_by_project[project_id].update(role["skills"])

    return (
        {project_id: sorted(skills) for project_id, skills in skills_by_project.items()},
        roles_by_project,
    )


def _format_project(
    row: dict,
    skills: list[str],
    roles: list[dict],
    user_id: int | None,
    user_skills: set[str],
    include_details: bool,
) -> dict:
    open_roles = [role for role in roles if not role["filled"]]
    result = {
        "id": row["id"],
        "title": row["title"],
        "summary": row["summary"],
        "open_roles": len(open_roles),
        "status": row["status"],
        "owner": {"id": row["owner_id"], "name": row["owner_name"]},
        "created_at": row["created_at"],
        "match": None,
    }

    if not include_details:
        result["skills"] = skills

    payload = visible_match(user_id, row["owner_id"], user_skills, roles)
    if payload is None:
        result["match"] = None
    else:
        result["_fit_overlap"] = payload.pop("fit_overlap")
        result["_fit_size"] = payload.pop("fit_size")
        result["match"] = payload
        if include_details:
            result.pop("_fit_overlap", None)
            result.pop("_fit_size", None)

    if include_details:
        result.update(
            {
                "description": row["description"],
                "roles": roles,
                "repo_url": row["repo_url"],
                "repo_meta": row["repo_meta"],
            }
        )
        if user_id is not None:
            result["contact_email"] = row["contact_email"]
            result["contact_url"] = row["contact_url"]

    return result


def _get_user_skills(connection, user_id: int | None) -> set[str]:
    if user_id is None:
        return set()
    rows = connection.execute(
        """
        SELECT s.slug
        FROM user_skills us
        JOIN skills s ON s.id = us.skill_id
        WHERE us.user_id = %s
        """,
        (user_id,),
    ).fetchall()
    return {row["slug"] for row in rows}


def _skill_catalog(connection):
    return connection.execute("SELECT slug, label FROM skills").fetchall()


def _unknown_skill_message(unknown: list[str], catalog) -> str:
    known_slugs = [row["slug"] for row in catalog]
    suggestions = []
    for skill in unknown:
        suggestions.extend(get_close_matches(skill, known_slugs, n=3, cutoff=0.55))
    suggestion_text = (
        f". Did you mean: {', '.join(dict.fromkeys(suggestions))}?"
        if suggestions
        else ""
    )
    return f"Unknown skills: {', '.join(unknown)}{suggestion_text}"


def _validate_role_skills(connection, data: ProjectCreate | ProjectUpdate):
    if data.roles is None:
        return
    catalog = _skill_catalog(connection)
    distinct = []
    unknown = []
    for role in data.roles:
        resolved, missing = resolve_skill_list(list(role.skills), catalog)
        unknown.extend(missing)
        role.skills = resolved
        for skill in resolved:
            if skill not in distinct:
                distinct.append(skill)
    if unknown:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Invalid input",
                "fields": {"roles": _unknown_skill_message(unknown, catalog)},
            },
        )
    if len(distinct) > 15:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Invalid input",
                "fields": {"roles": "A project can use at most 15 distinct skills across its roles"},
            },
        )


def _replace_roles(connection, project_id: int, roles: list[ProjectRoleInput] | list[dict]):
    current_rows = connection.execute(
        "SELECT id, filled FROM roles WHERE project_id = %s",
        (project_id,),
    ).fetchall()
    try:
        writes, removed_ids = resolve_role_replacement(current_rows, roles)
    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail={"message": "Invalid input", "fields": {"roles": str(error)}},
        ) from error

    for role in writes:
        role_id = role["id"]
        role_title = role["title"]
        role_filled = role["filled"]
        role_skills = role["skills"]

        if role_id is None:
            role_id = connection.execute(
                """
                INSERT INTO roles (project_id, title, filled)
                VALUES (%s, %s, %s)
                RETURNING id
                """,
                (project_id, role_title, role_filled),
            ).fetchone()["id"]
        else:
            connection.execute(
                "UPDATE roles SET title = %s, filled = %s WHERE id = %s",
                (role_title, role_filled, role_id),
            )

        connection.execute("DELETE FROM role_skills WHERE role_id = %s", (role_id,))
        connection.execute(
            """
            INSERT INTO role_skills (role_id, skill_id)
            SELECT %s, id FROM skills WHERE slug = ANY(%s)
            """,
            (role_id, role_skills),
        )

    for removed_id in removed_ids:
        connection.execute("DELETE FROM roles WHERE id = %s", (removed_id,))


def _fetch_project(connection, project_id: int):
    return connection.execute(
        """
        SELECT p.id, p.owner_id, p.title, p.summary, p.description, p.status,
               p.contact_email, p.contact_url, p.repo_url, p.repo_meta, p.created_at,
               u.name AS owner_name
        FROM projects p
        JOIN users u ON u.id = p.owner_id
        WHERE p.id = %s
        """,
        (project_id,),
    ).fetchone()


def _refresh_repo_metadata(
    connection,
    project_id: int,
    repo_url: str | None,
    cached: dict | None = None,
    force: bool = False,
    url_changed: bool = False,
    url_removed: bool = False,
):
    previous = cached if isinstance(cached, dict) else None
    if url_removed or not repo_url:
        metadata = None
    else:
        fetch = fetch_repo_metadata(
            repo_url,
            force=force,
            cached=None if url_changed else previous,
        )
        metadata = decide_repo_meta(
            url_removed=False,
            url_changed=url_changed,
            fetch=fetch,
            previous=None if url_changed else previous,
        )
    connection.execute(
        "UPDATE projects SET repo_meta = %s WHERE id = %s",
        (Jsonb(metadata) if metadata is not None else None, project_id),
    )


def _get_detail(connection, project_row: dict, user_id: int | None) -> dict:
    skills_by_project, roles_by_project = _project_extras(
        connection, [project_row["id"]]
    )
    return _format_project(
        project_row,
        skills_by_project.get(project_row["id"], []),
        roles_by_project.get(project_row["id"], []),
        user_id,
        _get_user_skills(connection, user_id),
        include_details=True,
    )


def _valid_session_user_id(connection, request: Request) -> int | None:
    user_id = request.session.get("user_id")
    if user_id is None:
        return None
    exists = connection.execute(
        "SELECT id FROM users WHERE id = %s",
        (user_id,),
    ).fetchone()
    if exists is None:
        request.session.clear()
        return None
    return user_id


@router.get("")
def list_projects(
    request: Request,
    q: str | None = None,
    skill: list[str] = Query(default=[]),
    status: str = Query(default="open", pattern="^(open|closed)$"),
    sort: str | None = Query(default=None, pattern="^(match|new)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    connection=Depends(get_db),
):
    try:
        q, skill = clean_project_filters(q, skill)
    except ValueError as error:
        field = "q" if "Search" in str(error) else "skill"
        raise HTTPException(
            status_code=422,
            detail={"message": "Invalid input", "fields": {field: str(error)}},
        ) from error
    where = ["p.status = %s"]
    parameters: list[Any] = [status]
    if q:
        escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        where.append("(p.title ILIKE %s ESCAPE '\\' OR p.summary ILIKE %s ESCAPE '\\')")
        parameters.extend([f"%{escaped}%", f"%{escaped}%"])
    if skill:
        where.append(
            """
            p.id IN (
                SELECT project_id
                FROM (
                    SELECT r.project_id, s.slug
                    FROM roles r
                    JOIN role_skills rs ON rs.role_id = r.id
                    JOIN skills s ON s.id = rs.skill_id
                    WHERE r.filled = false
                ) project_skills_union
                WHERE slug = ANY(%s)
                GROUP BY project_id
                HAVING COUNT(DISTINCT slug) = %s
            )
            """
        )
        parameters.extend([skill, len(skill)])

    rows = connection.execute(
        f"""
        SELECT p.id, p.owner_id, p.title, p.summary, p.description, p.status,
               p.contact_email, p.contact_url, p.repo_url, p.repo_meta, p.created_at,
               u.name AS owner_name
        FROM projects p
        JOIN users u ON u.id = p.owner_id
        WHERE {" AND ".join(where)}
        ORDER BY p.created_at DESC, p.id DESC
        """,
        parameters,
    ).fetchall()

    user_id = _valid_session_user_id(connection, request)
    user_skills = _get_user_skills(connection, user_id)
    skills_by_project, roles_by_project = _project_extras(
        connection, [row["id"] for row in rows]
    )
    items = [
        _format_project(
            row,
            skills_by_project.get(row["id"], []),
            roles_by_project.get(row["id"], []),
            user_id,
            user_skills,
            include_details=False,
        )
        for row in rows
    ]
    selected_sort = sort or ("match" if user_skills else "new")
    if selected_sort == "match" and user_skills:
        items.sort(key=_match_sort_key, reverse=True)
    for item in items:
        item.pop("_fit_overlap", None)
        item.pop("_fit_size", None)

    total = len(items)
    offset = (page - 1) * page_size
    return {
        "items": items[offset : offset + page_size],
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.get("/{project_id}")
def get_project(
    project_id: int,
    request: Request,
    connection=Depends(get_db),
):
    project = _fetch_project(connection, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return _get_detail(connection, project, _valid_session_user_id(connection, request))


@router.post("", status_code=201)
def create_project(
    data: ProjectCreate,
    request: Request,
    connection=Depends(get_db),
):
    user_id = require_write_user_id(request)
    _validate_role_skills(connection, data)
    project = connection.execute(
        """
        INSERT INTO projects (
            owner_id, title, summary, description, contact_email,
            contact_url, repo_url
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            user_id,
            data.title,
            data.summary,
            data.description,
            str(data.contact_email),
            data.contact_url,
            data.repo_url,
        ),
    ).fetchone()
    project_id = project["id"]
    _replace_roles(connection, project_id, data.roles)
    if data.repo_url:
        _refresh_repo_metadata(connection, project_id, data.repo_url, url_changed=True)
    return _get_detail(connection, _fetch_project(connection, project_id), user_id)


@router.patch("/{project_id}")
def update_project(
    project_id: int,
    data: ProjectUpdate,
    request: Request,
    connection=Depends(get_db),
):
    user_id = require_write_user_id(request)
    project = _fetch_project(connection, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the project owner can do that")

    changes = data.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(
            status_code=422,
            detail={"message": "Invalid input", "fields": {"body": "No changes provided"}},
        )
    _validate_role_skills(connection, data)

    columns = {
        "title": "title",
        "summary": "summary",
        "description": "description",
        "contact_email": "contact_email",
        "contact_url": "contact_url",
        "repo_url": "repo_url",
        "status": "status",
    }
    sql_values = []
    assignments = []
    for field, column in columns.items():
        if field in changes:
            assignments.append(f"{column} = %s")
            value = changes[field]
            if field == "contact_email" and value is not None:
                value = str(value)
            sql_values.append(value)
    if assignments:
        sql_values.append(project_id)
        connection.execute(
            f"UPDATE projects SET {', '.join(assignments)}, updated_at = now() WHERE id = %s",
            sql_values,
        )
    if "roles" in changes:
        _replace_roles(connection, project_id, data.roles if data.roles is not None else changes["roles"])

    updated_project = _fetch_project(connection, project_id)
    resulting_repo_url = updated_project["repo_url"]
    if resulting_repo_url is None:
        if "repo_url" in changes:
            _refresh_repo_metadata(
                connection,
                project_id,
                None,
                url_removed=True,
            )
    else:
        _refresh_repo_metadata(
            connection,
            project_id,
            resulting_repo_url,
            cached=project["repo_meta"] if isinstance(project.get("repo_meta"), dict) else None,
            url_changed=resulting_repo_url != project["repo_url"],
        )
    return _get_detail(connection, _fetch_project(connection, project_id), user_id)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    request: Request,
    connection=Depends(get_db),
):
    user_id = require_write_user_id(request)
    project = connection.execute(
        "SELECT owner_id FROM projects WHERE id = %s",
        (project_id,),
    ).fetchone()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the project owner can do that")
    connection.execute("DELETE FROM projects WHERE id = %s", (project_id,))


@router.patch("/{project_id}/roles/{role_id}")
def update_project_role(
    project_id: int,
    role_id: int,
    data: RoleUpdate,
    request: Request,
    connection=Depends(get_db),
):
    user_id = require_write_user_id(request)
    project = connection.execute(
        "SELECT owner_id FROM projects WHERE id = %s",
        (project_id,),
    ).fetchone()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the project owner can do that")
    role = connection.execute(
        """
        UPDATE roles SET filled = %s
        WHERE id = %s AND project_id = %s
        RETURNING id, title, filled
        """,
        (data.filled, role_id, project_id),
    ).fetchone()
    if role is None:
        raise HTTPException(status_code=404, detail="Role not found")
    role["skills"] = [
        row["slug"]
        for row in connection.execute(
            """
            SELECT s.slug
            FROM role_skills rs
            JOIN skills s ON s.id = rs.skill_id
            WHERE rs.role_id = %s
            ORDER BY s.slug
            """,
            (role_id,),
        ).fetchall()
    ]
    return role


@router.get("/{project_id}/suggestions")
def get_project_suggestions(
    project_id: int,
    request: Request,
    connection=Depends(get_db),
):
    user_id = require_user_id(request)
    project = connection.execute(
        "SELECT owner_id, status FROM projects WHERE id = %s",
        (project_id,),
    ).fetchone()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the project owner can do that")
    if project["status"] != "open":
        return {"roles": []}

    roles = connection.execute(
        """
        SELECT id, title
        FROM roles
        WHERE project_id = %s AND filled = false
        ORDER BY id
        """,
        (project_id,),
    ).fetchall()
    role_ids = [role["id"] for role in roles]
    if not role_ids:
        return {"roles": []}

    role_skills: dict[int, list[str]] = defaultdict(list)
    for row in connection.execute(
        """
        SELECT rs.role_id, s.slug
        FROM role_skills rs
        JOIN skills s ON s.id = rs.skill_id
        WHERE rs.role_id = ANY(%s)
        ORDER BY s.slug
        """,
        (role_ids,),
    ).fetchall():
        role_skills[row["role_id"]].append(row["slug"])

    students: dict[int, dict] = {}
    for row in connection.execute(
        """
        SELECT u.id, u.name, u.branch, u.year, s.slug
        FROM users u
        JOIN user_skills us ON us.user_id = u.id
        JOIN skills s ON s.id = us.skill_id
        WHERE u.id <> %s
        ORDER BY u.id, s.slug
        """,
        (project["owner_id"],),
    ).fetchall():
        student = students.setdefault(
            row["id"],
            {
                "id": row["id"],
                "name": row["name"],
                "branch": row["branch"],
                "year": row["year"],
                "skills": [],
            },
        )
        student["skills"].append(row["slug"])

    role_inputs = [
        {
            "id": role["id"],
            "title": role["title"],
            "skills": role_skills.get(role["id"], []),
            "filled": False,
        }
        for role in roles
    ]
    return {
        "roles": build_suggestion_groups(
            project["status"],
            project["owner_id"],
            role_inputs,
            students.values(),
        )
    }


@router.post("/{project_id}/refresh-repo")
def refresh_project_repo(
    project_id: int,
    request: Request,
    connection=Depends(get_db),
):
    user_id = require_write_user_id(request)
    project = _fetch_project(connection, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the project owner can do that")
    if not project["repo_url"]:
        raise HTTPException(status_code=422, detail="Project has no GitHub repository")
    _refresh_repo_metadata(
        connection,
        project_id,
        project["repo_url"],
        cached=project["repo_meta"],
        force=True,
    )
    return _get_detail(connection, _fetch_project(connection, project_id), user_id)
