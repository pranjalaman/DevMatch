import os

from app.routers.auth import router as auth_router
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

load_dotenv()

app_env = os.getenv("APP_ENV", "development")
secret_key = os.getenv("SECRET_KEY")

app = FastAPI()
app.add_middleware(
    SessionMiddleware,
    secret_key=secret_key or "dev-only-change-me",
    same_site="lax",
    https_only=app_env == "production",
)


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, error: HTTPException):
    return JSONResponse(
        status_code=error.status_code,
        content={
            "error": {
                "code": {
                    401: "unauthorized",
                    409: "conflict",
                    503: "service_unavailable",
                }.get(error.status_code, "request_error"),
                "message": str(error.detail),
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, error: RequestValidationError):
    fields = {}
    for item in error.errors():
        fields[str(item["loc"][-1])] = item["msg"]

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




app.include_router(auth_router)

@app.get("/")
async def health_check():
    return {"status": "ok"}