"""Embedding utilities with graceful degradation and caching.

If `sentence-transformers` is installed we use a real SBERT model for
semantic similarity. Otherwise we fall back to TF-IDF (scikit-learn) or a
token-overlap Jaccard score so the service works out of the box.
"""
from __future__ import annotations

import re
import threading
from typing import List

import numpy as np

from cache import embedding_cache

_encoder = None
_encoder_lock = threading.Lock()
_encoder_loaded = False


def _normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9\s]", " ", text.lower())


def load_encoder():
    global _encoder, _encoder_loaded
    if _encoder_loaded:
        return _encoder
    with _encoder_lock:
        if _encoder_loaded:
            return _encoder
        try:
            from sentence_transformers import SentenceTransformer
            _encoder = SentenceTransformer("all-MiniLM-L6-v2")
            print("[embeddings] SBERT model loaded: all-MiniLM-L6-v2")
        except Exception as exc:
            print(f"[embeddings] sentence-transformers unavailable ({exc}); using TF-IDF")
            _encoder = False
        _encoder_loaded = True
    return _encoder


def encode(texts: List[str]) -> np.ndarray:
    cache_key = f"encode:{hash(tuple(sorted(texts)))}"
    cached = embedding_cache.get(cache_key)
    if cached is not None:
        return cached

    encoder = load_encoder()
    if encoder:
        result = np.asarray(encoder.encode(texts, normalize_embeddings=True))
    else:
        from sklearn.feature_extraction.text import TfidfVectorizer
        vectorizer = TfidfVectorizer(token_pattern=r"[a-z0-9]+", stop_words="english")
        cleaned = [_normalize(t) for t in texts]
        result = np.asarray(vectorizer.fit_transform(cleaned).toarray())

    embedding_cache.set(cache_key, result)
    return result


def cosine(a: np.ndarray, b: np.ndarray) -> float:
    if a.size == 0 or b.size == 0:
        return 0.0
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a / norm_a, b / norm_b))


def text_similarity(a: str, b: str) -> float:
    cache_key = f"tsim:{a.lower().strip()}:{b.lower().strip()}"
    cached = embedding_cache.get(cache_key)
    if cached is not None:
        return cached

    if a.lower().strip() == b.lower().strip():
        return 1.0
    embeddings = encode([a, b])
    score = max(0.0, cosine(embeddings[0], embeddings[1]))
    embedding_cache.set(cache_key, score)
    return score


def jaccard(a: List[str], b: List[str]) -> float:
    sa, sb = set(a), set(b)
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def overlap(a: List[str], b: List[str]) -> float:
    if not a or not b:
        return 0.0
    sb = set(b)
    return sum(1 for x in set(a) if x in sb) / max(len(a), 1)
