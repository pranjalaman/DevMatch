import json
import logging
import os
import re
from datetime import UTC, datetime, timedelta
from http.client import HTTPException as HTTPClientError
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)
_REPO_PATH = re.compile(r"^https://github\.com/([\w.-]+)/([\w.-]+)/?$")
_CACHE_AGE = timedelta(hours=6)


def fetch_repo_metadata(repo_url: str, *, force: bool = False, cached: dict | None = None):
    if not repo_url:
        return None

    match = _REPO_PATH.fullmatch(repo_url)
    if not match:
        return None

    now = datetime.now(UTC)
    if not force and cached:
        fetched_at = cached.get("fetched_at")
        if fetched_at:
            try:
                fetched = datetime.fromisoformat(fetched_at.replace("Z", "+00:00"))
                if now - fetched < _CACHE_AGE:
                    return cached
            except (TypeError, ValueError):
                pass

    owner, repository = match.groups()
    request = Request(
        f"https://api.github.com/repos/{owner}/{repository}",
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "DevMatch",
        },
    )
    token = os.getenv("GITHUB_TOKEN")
    if token:
        request.add_header("Authorization", f"Bearer {token}")

    try:
        with urlopen(request, timeout=3) as response:
            data = json.load(response)
        return {
            "stars": data["stargazers_count"],
            "language": data.get("language"),
            "pushed_at": data.get("pushed_at"),
            "fetched_at": now.isoformat(),
        }
    except (
        HTTPClientError,
        HTTPError,
        URLError,
        TimeoutError,
        OSError,
        ValueError,
        KeyError,
    ) as error:
        logger.warning("GitHub repository metadata fetch failed: %s", type(error).__name__)
        return None
