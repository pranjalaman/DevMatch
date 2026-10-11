import os
import json
import logging
import secrets
import time
from pathlib import Path

from app.routers.auth import router as auth_router
from app.routers.me import router as me_router
from app.routers.projects import router as projects_router
from app.routers.skills import router as skills_router
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

load_dotenv()

app_env = os.getenv("APP_ENV", "development")
secret_key = os.getenv("SECRET_KEY")
if app_env == "production" and not secret_key:
    raise RuntimeError("SECRET_KEY must be set when APP_ENV=production")
if not secret_key:
    secret_key = secrets.token_urlsafe(32)

app = FastAPI(
    docs_url=None if app_env == "production" else "/docs",
    redoc_url=None if app_env == "production" else "/redoc",
)
app.add_middleware(
    SessionMiddleware,
    secret_key=secret_key or "dev-only-change-me",
    same_site="lax",
    https_only=app_env == "production",
)
logger = logging.getLogger("devmatch.requests")


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, error: HTTPException):
    detail = error.detail
    if isinstance(detail, dict):
        message = detail.get("message", "Request failed")
        fields = detail.get("fields", {})
    else:
        message = str(detail)
        fields = {}

    return JSONResponse(
        status_code=error.status_code,
        content={
            "error": {
                "code": {
                    401: "unauthorized",
                    403: "forbidden",
                    409: "conflict",
                    404: "not_found",
                    400: "bad_request",
                    415: "bad_request",
                    503: "service_unavailable",
                    422: "validation_error",
                    429: "rate_limited",
                }.get(error.status_code, "request_error"),
                "message": message,
                "fields": fields,
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, error: Exception):
    logger.error(
        json.dumps(
            {
                "event": "unhandled_error",
                "method": request.method,
                "path": request.url.path,
                "error_type": type(error).__name__,
            }
        )
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "internal_error",
                "message": "An unexpected error occurred",
                "fields": {},
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, error: RequestValidationError):
    fields = {}
    for item in error.errors():
        field = ".".join(str(part) for part in item["loc"] if part != "body")
        fields[field] = item["msg"]

    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "validation_error",
                "message": "Invalid input",
                "fields": fields,
            }
        },
    )


@app.middleware("http")
async def request_policy_and_logging(request: Request, call_next):
    started = time.perf_counter()
    if (
        request.url.path.startswith("/api/")
        and request.method in {"POST", "PUT", "PATCH", "DELETE"}
        and request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
        != "application/json"
    ):
        response = JSONResponse(
            status_code=415,
            content={
                "error": {
                    "code": "bad_request",
                    "message": "State-changing API requests must use application/json",
                    "fields": {},
                }
            },
        )
    else:
        response = await call_next(request)
    logger.info(
        json.dumps(
            {
                "event": "http_request",
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": round((time.perf_counter() - started) * 1000, 2),
            }
        )
    )
    return response

app.include_router(auth_router)
app.include_router(me_router)
app.include_router(projects_router)
app.include_router(skills_router)


@app.get("/api/health")
async def api_health_check():
    return {"status": "ok"}


FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/")
async def index():
    return FileResponse(FRONTEND_DIR / "index.html")