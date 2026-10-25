import secrets


def resolve_session_secret(app_env: str | None, secret_key: str | None) -> str:
    environment = app_env or "development"
    if environment != "development" and not secret_key:
        raise RuntimeError("SECRET_KEY must be set when APP_ENV is not development")
    if not secret_key:
        return secrets.token_urlsafe(32)
    return secret_key
