"""SkillSwap AI Service — FastAPI.

Endpoints:
  GET  /health
  POST /recommendations      semantic mentor/learner ranking
  POST /roadmap              learning roadmap for a goal
  POST /resume/parse         extract skills from resume text/path
  GET  /skills/graph         skill knowledge graph
  POST /skills/related       related skills via graph
  POST /skills/similarity    semantic similarity between two skills
"""
from __future__ import annotations

from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

import recommendation
import roadmap
import skill_graph
from resume_parser import extract_from_file, extract_skills
from similarity import skill_similarity
from embeddings import text_similarity

app = FastAPI(
    title="SkillSwap AI Service",
    version="1.0.0",
    description="Semantic skill matching, roadmaps, resume parsing and skill graphs.",
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "skillswap-ai"}


# ---------- models ----------
class Candidate(BaseModel):
    id: str
    skills: Optional[List[str]] = []
    canTeach: Optional[List[str]] = None
    wantToLearn: Optional[List[str]] = None
    department: str = ""
    year: str = ""
    availability: str = ""
    rating: float = 0.0


class RecommendationRequest(BaseModel):
    user: Dict
    candidates: List[Candidate]
    mode: str = "mentors"
    limit: int = 20


class GoalRequest(BaseModel):
    goal: str


class ResumeTextRequest(BaseModel):
    text: str


class ResumeFileRequest(BaseModel):
    file_path: str


class SkillPair(BaseModel):
    skill_a: str
    skill_b: str


class RelatedRequest(BaseModel):
    skill: str


# ---------- endpoints ----------
@app.post("/recommendations")
def recommendations(req: RecommendationRequest):
    candidates = [c.dict() for c in req.candidates]
    user = dict(req.user)
    results = recommendation.rank_candidates(user, candidates, mode=req.mode, limit=req.limit)
    return {"mode": req.mode, "count": len(results), "results": results}


@app.post("/roadmap")
def roadmap_endpoint(req: GoalRequest):
    if not req.goal.strip():
        raise HTTPException(status_code=400, detail="goal is required")
    return roadmap.generate_roadmap(req.goal)


@app.post("/resume/parse")
def parse_resume(req: ResumeFileRequest):
    try:
        result = extract_from_file(req.file_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="file not found")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"could not parse file: {exc}")
    return result


@app.post("/resume/text")
def parse_resume_text(req: ResumeTextRequest):
    return extract_skills(req.text)


@app.get("/skills/graph")
def skills_graph():
    return skill_graph.graph_payload()


@app.post("/skills/related")
def related_skills(req: RelatedRequest):
    related = skill_graph.related(req.skill)
    return {"skill": req.skill, "related": related}


@app.post("/skills/similarity")
def skills_similarity(req: SkillPair):
    return {"skill_a": req.skill_a, "skill_b": req.skill_b, "score": round(skill_similarity(req.skill_a, req.skill_b), 4)}


@app.post("/text/similarity")
def text_sim(req: SkillPair):
    return {"text_a": req.skill_a, "text_b": req.skill_b, "score": round(text_similarity(req.skill_a, req.skill_b), 4)}
