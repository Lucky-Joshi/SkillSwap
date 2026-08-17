"""Core recommendation engine.

Compatibility Score = 40% Skill Match
                    + 20% Mutual Learning Interest
                    + 15% Availability
                    + 10% Teaching Rating
                    + 10% Experience Level
                    +  5% Department Similarity

Skill Match uses semantic similarity (SBERT or TF-IDF fallback) plus the
skill knowledge graph, so "ReactJS" and "React" match, and a Next.js mentor
can be recommended to a React learner.
"""
from __future__ import annotations

import hashlib
import json
from typing import Dict, List

import numpy as np

from embeddings import overlap
from similarity import match_sets, skill_similarity
from cache import recommendation_cache
from config import config
import skill_graph

AVAILABILITY_WEIGHT = {"anytime": 1.0, "evenings": 0.9, "mornings": 0.8, "weekends": 0.8, "weekdays": 0.7, "": 0.4}
YEAR_VALUE = {"1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "Graduate": 5, "": 0}


def _semantic_match(learn: List[str], teach: List[str]) -> tuple[float, List[str]]:
    if not learn or not teach:
        return 0.0, []
    reasons = []
    score_sum = 0.0
    for skill in learn:
        best_score = 0.0
        for candidate in teach:
            s = skill_similarity(skill, candidate)
            if skill_graph.can_cover(candidate, skill, hops=2):
                s = max(s, 0.75)
            best_score = max(best_score, s)
        if best_score >= 0.55:
            reasons.append(skill)
        score_sum += best_score
    return score_sum / max(len(learn), 1), reasons


def _cache_key(user: Dict, candidates: List[Dict], mode: str) -> str:
    user_hash = hashlib.md5(json.dumps(user, sort_keys=True, default=str).encode()).hexdigest()[:12]
    cand_ids = sorted([c.get("id", "") for c in candidates])
    cand_hash = hashlib.md5(json.dumps(cand_ids).encode()).hexdigest()[:12]
    return f"rec:{user_hash}:{cand_hash}:{mode}"


def rank_candidates(
    user: Dict,
    candidates: List[Dict],
    mode: str = "mentors",
    limit: int = 20,
) -> List[Dict]:
    cache_key = _cache_key(user, candidates, mode)
    cached = recommendation_cache.get(cache_key)
    if cached is not None:
        return cached[:limit]

    results = []
    for cand in candidates:
        cand_teach = cand.get("canTeach") or cand.get("skills") or []
        cand_learn = cand.get("wantToLearn") or []

        if mode == "mentors":
            skill_match, reasons = _semantic_match(user.get("wantToLearn", []), cand_teach)
            mutual, mutual_skills = _semantic_match(user.get("canTeach", []), cand_learn)
        else:
            skill_match, reasons = _semantic_match(user.get("canTeach", []), cand_learn)
            mutual, mutual_skills = _semantic_match(user.get("wantToLearn", []), cand_teach)

        availability = AVAILABILITY_WEIGHT.get((cand.get("availability") or "").lower(), 0.5)
        teaching_rating = min(float(cand.get("rating", 0) or 0) / 5.0, 1.0)
        experience = min((YEAR_VALUE.get(cand.get("year", ""), 0) or 0) / 4.0, 1.0)
        department = 1.0 if user.get("department") and cand.get("department") and str(user["department"]).lower() == str(cand["department"]).lower() else 0.0

        score = (
            skill_match * config.weight_skill_match
            + mutual * config.weight_mutual_interest
            + availability * config.weight_availability
            + teaching_rating * config.weight_rating
            + experience * config.weight_experience
            + department * config.weight_department
        )
        score = round(max(0.0, min(score, 100.0)), 1)

        results.append(
            {
                "userId": cand.get("id"),
                "score": score,
                "breakdown": {
                    "skillMatch": round(skill_match * 100),
                    "mutualInterest": round(mutual * 100),
                    "availability": round(availability * 100),
                    "teachingRating": round(teaching_rating * 100),
                    "experience": round(experience * 100),
                    "department": round(department * 100),
                },
                "reasons": reasons,
                "mutualSkills": mutual_skills,
            }
        )

    results.sort(key=lambda r: r["score"], reverse=True)
    recommendation_cache.set(cache_key, results)
    return results[:limit]
