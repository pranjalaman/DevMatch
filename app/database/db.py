import os

import psycopg
from fastapi import HTTPException
from psycopg.rows import dict_row


def get_db():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not set")

    try:
        connection = psycopg.connect(database_url, row_factory=dict_row)
    except psycopg.Error:
        raise HTTPException(status_code=503, detail="Could not connect to the database")

    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()