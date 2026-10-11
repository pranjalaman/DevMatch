from app.database.db import get_db
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("")
def list_skills(connection=Depends(get_db)):
    rows = connection.execute(
        "SELECT slug, label FROM skills ORDER BY label"
    ).fetchall()
    return rows
