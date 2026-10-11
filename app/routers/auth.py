import psycopg
from app.database.db import get_db
from app.schemas import AuthResponse, LoginData, SignupData
from fastapi import APIRouter, Depends, HTTPException, Request
from pwdlib import PasswordHash

router = APIRouter(prefix="/api/auth", tags=["auth"])
password_hash = PasswordHash.recommended()


@router.post("/signup", status_code=201, response_model=AuthResponse)
def signup(data: SignupData, request: Request, connection=Depends(get_db)):
    try:
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


@router.post("/login", response_model=AuthResponse)
def login(data: LoginData, request: Request, connection=Depends(get_db)):
    try:
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

    if not user or not user["password_hash"] or not password_hash.verify(
        data.password, user["password_hash"]
    ):
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