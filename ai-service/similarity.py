"""Semantic similarity helpers built on embeddings.py."""
from __future__ import annotations

import numpy as np
from typing import List, Optional

from embeddings import encode, cosine, text_similarity, jaccard, overlap
from cache import embedding_cache


def _tokens(text: str) -> List[str]:
    import re
    return set(re.sub(r"[^a-z0-9\s]", " ", text.lower()).split())


def skill_similarity(skill_a: str, skill_b: str) -> float:
    cache_key = f"skillsim:{skill_a.lower()}:{skill_b.lower()}"
    cached = embedding_cache.get(cache_key)
    if cached is not None:
        return cached

    if skill_a.lower() == skill_b.lower():
        return 1.0
    sem = text_similarity(skill_a, skill_b)
    tok = jaccard(_tokens(skill_a), _tokens(skill_b))
    score = float(max(sem, tok * 0.9))
    embedding_cache.set(cache_key, score)
    return score


def best_match(skill: str, candidates: List[str], threshold: float = 0.55):
    if not candidates:
        return None, 0.0
    scores = [skill_similarity(skill, c) for c in candidates]
    best_idx = int(np.argmax(scores))
    return candidates[best_idx], float(scores[best_idx])


def match_sets(a: List[str], b: List[str], threshold: float = 0.55):
    matched = []
    used = set()
    for item in _dedupe(a):
        best, score = best_match(item, b, threshold)
        if best is not None and score >= threshold and best not in used:
            used.add(best)
            matched.append((item, best, round(score, 3)))
    coverage_a = len(matched) / max(len(set(a)), 1)
    return matched, coverage_a


def _dedupe(items: List[str]) -> List[str]:
    seen = set()
    out = []
    for it in items:
        key = it.lower()
        if key not in seen:
            seen.add(key)
            out.append(it)
    return out
