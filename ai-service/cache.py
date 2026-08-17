"""Thread-safe in-memory cache with TTL support."""
from __future__ import annotations

import time
import threading
from typing import Any, Optional


class TTLCache:
    def __init__(self, default_ttl: int = 300, max_size: int = 1000):
        self._store: dict[str, tuple[Any, float]] = {}
        self._lock = threading.Lock()
        self._default_ttl = default_ttl
        self._max_size = max_size

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key in self._store:
                value, expires_at = self._store[key]
                if expires_at > time.time():
                    return value
                del self._store[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        with self._lock:
            if len(self._store) >= self._max_size:
                self._evict()
            self._store[key] = (value, time.time() + (ttl or self._default_ttl))

    def invalidate(self, key: str) -> bool:
        with self._lock:
            if key in self._store:
                del self._store[key]
                return True
        return False

    def clear(self) -> None:
        with self._lock:
            self._store.clear()

    def _evict(self) -> None:
        now = time.time()
        expired = [k for k, (_, exp) in self._store.items() if exp <= now]
        for k in expired:
            del self._store[k]
        if len(self._store) >= self._max_size:
            oldest = min(self._store, key=lambda k: self._store[k][1])
            del self._store[oldest]

    @property
    def size(self) -> int:
        return len(self._store)


embedding_cache = TTLCache(default_ttl=3600, max_size=5000)
recommendation_cache = TTLCache(default_ttl=300, max_size=500)
skill_graph_cache = TTLCache(default_ttl=7200, max_size=50)
