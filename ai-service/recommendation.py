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

from typing import Dict, List

import numpy as np

from embeddings import overlap
from similarity import match_sets, skill_similarity
import skill_graph

AVAILABILITY_WEIGHT = {"anytime": 1.0, "evenings": 0.9, "mornings": 0.8, "weekends": 0.8, "weekdays": 0.7, "": 0.4}
YEAR_VALUE = {"1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "Graduate": 5, "": 0}


def _semantic_match(learn: List[str], teach: List[str]) -> tuple[float, List[str]]:
    """Semantic skill-match score + matched reasons (with graph boost)."""
    if not learn or not teach:
        return 0.0, []
    reasons = []
    score_sum = 0.0
    for skill in learn:
        best_score = 0.0
        for candidate in teach:
            s = skill_similarity(skill, candidate)
            # graph boost: teacher knows a downstream skill
            if skill_graph.can_cover(candidate, skill, hops=2):
                s = max(s, 0.75)
            best_score = max(best_score, s)
        if best_score >= 0.55:
            reasons.append(skill)
        score_sum += best_score
    return score_sum / max(len(learn), 1), reasons


def rank_candidates(
    user: Dict,
    candidates: List[Dict],
    mode: str = "mentors",
    limit: int = 20,
) -> List[Dict]:
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
            skill_match * 40
            + mutual * 20
            + availability * 15
            + teaching_rating * 10
            + experience * 10
            + department * 5
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
    return results[:limit]
