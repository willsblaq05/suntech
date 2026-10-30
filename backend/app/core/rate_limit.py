"""A small in-process sliding-window rate limiter.

Good enough for the single-process MVP (SQLite + one uvicorn worker).
If the app is ever run with multiple workers or behind a load balancer,
move to a shared counter (e.g. Redis) — local memory is per-process.
"""

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from .config import settings


class SlidingWindowRateLimiter:
    """Allows ``max_requests`` per ``window_seconds`` per key."""

    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def hit(self, key: str) -> None:
        """Count a request for ``key``; raise 429 if over the limit."""
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self._lock:
            hits = self._hits[key]
            while hits and hits[0] < cutoff:
                hits.popleft()
            if len(hits) >= self.max_requests:
                retry_after = max(1, int(self.window_seconds - (now - hits[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again shortly.",
                    headers={"Retry-After": str(retry_after)},
                )
            hits.append(now)
            # Opportunistically forget forgotten clients to bound memory.
            if len(self._hits) > 10_000:
                self._hits = defaultdict(
                    deque,
                    {k: v for k, v in self._hits.items() if v},
                )


lead_create_limiter = SlidingWindowRateLimiter(
    max_requests=settings.RATE_LIMIT_LEAD_CREATE_PER_MINUTE,
    window_seconds=60.0,
)


def check_lead_create_rate_limit(request: Request) -> None:
    """Dependency applying the per-IP limit to public lead submission.

    Note: replaced (not skipped) in tests so the production limit never
    interferes with the test suite; the 429 behaviour is tested directly.
    """
    host = request.client.host if request.client else "unknown"
    lead_create_limiter.hit(host)
