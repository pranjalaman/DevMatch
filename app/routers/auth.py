import os

import psycopg
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field, field_validator
from pwdlib import PasswordHash
from psycopg.rows import dict_row

router = APIRouter(prefix="/api/auth", tags=["auth"])
password_hash = PasswordHash.recommended()


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


def connect_to_database():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not set")

    return psycopg.connect(database_url, row_factory=dict_row)


@router.post("/signup", status_code=201)
def signup(data: SignupData, request: Request):
    try:
        with connect_to_database() as connection:
            user = connection.execute(
                """
                INSERT INTO users (name, email, password_hash, branch, year)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, name, email, branch, year
                """,
                (
                    data.name,
                    str(data.email).lower(),
                    password_hash.hash(data.password),
                    data.branch,
                    data.year,
                ),
            ).fetchone()
    except psycopg.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Email is already registered")
    except psycopg.Error:
        raise HTTPException(status_code=503, detail="Could not connect to the database")

    request.session["user_id"] = user["id"]
    return {"user": user}


@router.post("/login")
def login(data: LoginData, request: Request):
    try:
        with connect_to_database() as connection:
            user = connection.execute(
                """
                SELECT id, name, email, branch, year, password_hash
                FROM users
                WHERE lower(email) = %s
                """,
                (str(data.email).lower(),),
            ).fetchone()
    except psycopg.Error:
        raise HTTPException(status_code=503, detail="Could not connect to the database")

    if not user or not password_hash.verify(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")

    request.session["user_id"] = user["id"]
    del user["password_hash"]
    return {"user": user}


@router.post("/logout")
def logout(request: Request):
    if "user_id" not in request.session:
        raise HTTPException(status_code=401, detail="Please log in first")

    request.session.clear()
    return {"message": "Logged out"}