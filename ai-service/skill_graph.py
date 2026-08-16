"""Skill knowledge graph built with networkx.

Represents prerequisite/relationship edges between skills so that a mentor
who knows Next.js can still be recommended to a React learner:

    JavaScript -> React -> Redux -> Next.js
"""
from __future__ import annotations

from typing import Dict, List

import networkx as nx

RELATIONS: Dict[str, List[str]] = {
    "JavaScript": ["React", "Node.js", "Next.js", "Vue.js", "TypeScript"],
    "React": ["Redux", "Next.js", "React Native", "Tailwind CSS", "GraphQL"],
    "TypeScript": ["React", "Next.js", "Angular"],
    "HTML & CSS": ["JavaScript", "Tailwind CSS", "React", "Bootstrap"],
    "Python": ["NumPy", "Pandas", "Django", "Flask", "Machine Learning", "FastAPI"],
    "NumPy": ["Pandas", "Data Science"],
    "Pandas": ["Data Analysis", "Data Science"],
    "Statistics": ["Machine Learning", "Data Science"],
    "Machine Learning": ["Deep Learning", "TensorFlow", "PyTorch", "Natural Language Processing"],
    "Deep Learning": ["Natural Language Processing", "Computer Vision"],
    "Node.js": ["Express.js", "MongoDB", "GraphQL", "Next.js"],
    "SQL": ["PostgreSQL", "MongoDB", "Data Science"],
    "Java": ["Kotlin", "Spring"],
    "Docker": ["Kubernetes", "CI/CD", "AWS"],
    "Git & GitHub": ["CI/CD"],
}

ALIASES: Dict[str, str] = {
    "reactjs": "React",
    "react.js": "React",
    "node": "Node.js",
    "nodejs": "Node.js",
    "express": "Express.js",
    "nextjs": "Next.js",
    "js": "JavaScript",
    "es6": "JavaScript",
    "ts": "TypeScript",
    "py": "Python",
    "ml": "Machine Learning",
    "dl": "Deep Learning",
    "nlp": "Natural Language Processing",
    "golang": "Go",
    "cpp": "C / C++",
    "mysql": "SQL",
    "postgres": "SQL",
    "postgresql": "SQL",
    "html": "HTML & CSS",
    "css": "HTML & CSS",
    "ui/ux design": "UX/UI Design",
    "ui": "UX/UI Design",
    "ux": "UX/UI Design",
    "excel": "Excel",
}

_graph = None


def _build() -> nx.DiGraph:
    global _graph
    if _graph is None:
        _graph = nx.DiGraph()
        for parent, children in RELATIONS.items():
            _graph.add_node(parent)
            for child in children:
                _graph.add_node(child)
                _graph.add_edge(parent, child)
    return _graph


def normalize(skill: str) -> str:
    key = skill.strip().lower()
    return ALIASES.get(key, skill.strip())


def related(skill: str, depth: int = 2, limit: int = 10) -> List[str]:
    g = _build()
    skill = normalize(skill)
    if skill not in g:
        return []
    out: List[str] = []
    seen = {skill}
    for _, target in nx.bfs_edges(g, skill, depth_limit=depth):
        if target not in seen:
            seen.add(target)
            out.append(target)
        if len(out) >= limit:
            break
    return out


def can_cover(teacher_skill: str, learner_skill: str, hops: int = 2) -> bool:
    """True if knowing teacher_skill reasonably covers learner_skill via graph.

    Edges point from prerequisite -> advanced, so a teacher who knows Next.js
    (a descendant of React) can still help a React learner. The check works in
    both directions within `hops` steps.
    """
    g = _build()
    teacher = normalize(teacher_skill)
    learner = normalize(learner_skill)
    if teacher == learner:
        return True
    if teacher not in g or learner not in g:
        return False
    for a, b in [(learner, teacher), (teacher, learner)]:
        if nx.has_path(g, a, b):
            length = nx.shortest_path_length(g, a, b)
            if length <= hops:
                return True
    return False


def graph_payload() -> dict:
    g = _build()
    return {
        "nodes": [{"id": n} for n in g.nodes],
        "edges": [{"source": s, "target": t} for s, t in g.edges],
    }
