"""Embedding utilities with graceful degradation.

If `sentence-transformers` is installed we use a real SBERT model for
semantic similarity. Otherwise we fall back to TF-IDF (scikit-learn) or a
token-overlap Jaccard score so the service works out of the box.
"""
from __future__ import annotations

import re
from typing import List

import numpy as np

_encoder = None


def _normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9\s]", " ", text.lower())


def load_encoder():
    global _encoder
    if _encoder is not None:
        return _encoder
    try:
        from sentence_transformers import SentenceTransformer

        _encoder = SentenceTransformer("all-MiniLM-L6-v2")
        print("[embeddings] SBERT model loaded: all-MiniLM-L6-v2")
    except Exception as exc:  # pragma: no cover
        print(f"[embeddings] sentence-transformers unavailable ({exc}); using TF-IDF")
        _encoder = False
    return _encoder


def encode(texts: List[str]) -> np.ndarray:
    """Return a (n, d) embedding matrix. Falls back to TF-IDF vectors."""
    encoder = load_encoder()
    if encoder:
        return np.asarray(encoder.encode(texts, normalize_embeddings=True))

    from sklearn.feature_extraction.text import TfidfVectorizer

    vectorizer = TfidfVectorizer(token_pattern=r"[a-z0-9]+", stop_words="english")
    cleaned = [_normalize(t) for t in texts]
    return np.asarray(vectorizer.fit_transform(cleaned).toarray())


def cosine(a: np.ndarray, b: np.ndarray) -> float:
    if a.size == 0 or b.size == 0:
        return 0.0
    a = a / np.linalg.norm(a) if np.linalg.norm(a) else a
    b = b / np.linalg.norm(b) if np.linalg.norm(b) else b
    return float(np.dot(a, b))


def text_similarity(a: str, b: str) -> float:
    """Semantic similarity of two strings in [0, 1]."""
    if a.lower() == b.lower():
        return 1.0
    embeddings = encode([a, b])
    return max(0.0, cosine(embeddings[0], embeddings[1]))


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
