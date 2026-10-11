from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request

_WINDOW_SECONDS = 60
_requests: dict[str, deque[float]] = defaultdict(deque)
_lock = Lock()


def enforce_limit(key: str, limit: int) -> None:
    now = monotonic()
    with _lock:
        if len(_requests) > 10_000:
            for old_key, old_events in list(_requests.items()):
                while old_events and now - old_events[0] >= _WINDOW_SECONDS:
                    old_events.popleft()
                if not old_events:
                    del _requests[old_key]
        events = _requests[key]
        while events and now - events[0] >= _WINDOW_SECONDS:
            events.popleft()
        if len(events) >= limit:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please wait before trying again.",
            )
        events.append(now)


def enforce_auth_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    enforce_limit(f"auth:{client_ip}", 10)


def enforce_write_limit(user_id: int) -> None:
    enforce_limit(f"write:{user_id}", 60)
