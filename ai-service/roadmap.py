"""Learning roadmap generator.

Input: "I want to become a Data Scientist"
Output: ordered roadmap steps (Python -> NumPy -> Pandas -> Statistics ->
Machine Learning -> Deep Learning -> Projects -> Interview Prep).

Uses templates + a generic fallback chain builder.
"""
from __future__ import annotations

from typing import Dict, List

TEMPLATES: Dict[str, List[Dict]] = {
    "data scientist": [
        {"title": "Python Fundamentals", "description": "Syntax, control flow, functions, OOP.", "skills": ["Python"], "weeks": 2, "hours": 20},
        {"title": "NumPy & Data Manipulation", "description": "Arrays, vectorized operations.", "skills": ["NumPy"], "weeks": 1, "hours": 12},
        {"title": "Pandas & Data Wrangling", "description": "DataFrames, cleaning, joining.", "skills": ["Pandas"], "weeks": 2, "hours": 18},
        {"title": "Statistics & Probability", "description": "Distributions, hypothesis testing, regression.", "skills": ["Statistics"], "weeks": 3, "hours": 25},
        {"title": "Data Visualization", "description": "Matplotlib, Seaborn, storytelling.", "skills": ["Data Analysis"], "weeks": 1, "hours": 10},
        {"title": "Machine Learning", "description": "Supervised & unsupervised with scikit-learn.", "skills": ["Machine Learning"], "weeks": 4, "hours": 40},
        {"title": "Deep Learning", "description": "Neural networks with TensorFlow / PyTorch.", "skills": ["Deep Learning"], "weeks": 4, "hours": 35},
        {"title": "Real-World Projects", "description": "Portfolio projects on real datasets.", "skills": ["Machine Learning"], "weeks": 4, "hours": 45},
        {"title": "Interview Preparation", "description": "SQL, ML case studies, behavioral rounds.", "skills": ["SQL", "Communication"], "weeks": 2, "hours": 15},
    ],
    "web developer": [
        {"title": "HTML, CSS & JavaScript", "description": "Semantics, flexbox/grid, DOM.", "skills": ["HTML & CSS", "JavaScript"], "weeks": 3, "hours": 30},
        {"title": "Git & GitHub", "description": "Version control, branching, PRs.", "skills": ["Git & GitHub"], "weeks": 1, "hours": 8},
        {"title": "Modern Frontend Framework", "description": "Components, state, hooks (React).", "skills": ["React"], "weeks": 4, "hours": 40},
        {"title": "Backend Fundamentals", "description": "REST APIs with Node + Express.", "skills": ["Node.js", "Express.js"], "weeks": 3, "hours": 30},
        {"title": "Databases", "description": "Modeling, SQL & MongoDB.", "skills": ["SQL", "MongoDB"], "weeks": 2, "hours": 20},
        {"title": "Auth, Security & Deployment", "description": "JWT, HTTPS, hosting.", "skills": ["Docker", "CI/CD"], "weeks": 2, "hours": 20},
        {"title": "Full-Stack Projects", "description": "2-3 portfolio-ready apps.", "skills": ["React", "Node.js"], "weeks": 4, "hours": 50},
        {"title": "Interview Preparation", "description": "DSA, system design basics, live coding.", "skills": ["Data Structures & Algorithms"], "weeks": 3, "hours": 25},
    ],
    "ml engineer": [
        {"title": "Python & SQL", "description": "Strong Python + data querying.", "skills": ["Python", "SQL"], "weeks": 3, "hours": 30},
        {"title": "Math for ML", "description": "Linear algebra, calculus, probability.", "skills": ["Statistics"], "weeks": 3, "hours": 30},
        {"title": "Data Science Toolkit", "description": "NumPy, Pandas, matplotlib.", "skills": ["NumPy", "Pandas"], "weeks": 2, "hours": 20},
        {"title": "Classic Machine Learning", "description": "scikit-learn end to end.", "skills": ["Machine Learning"], "weeks": 4, "hours": 40},
        {"title": "Deep Learning", "description": "PyTorch / TensorFlow, CNNs, RNNs.", "skills": ["Deep Learning", "PyTorch"], "weeks": 5, "hours": 50},
        {"title": "MLOps", "description": "Docker, model serving, CI/CD.", "skills": ["Docker", "CI/CD"], "weeks": 3, "hours": 25},
        {"title": "Capstone Projects", "description": "2-3 deployed ML products.", "skills": ["Machine Learning"], "weeks": 4, "hours": 45},
        {"title": "Interview Preparation", "description": "ML theory, coding, system design.", "skills": ["Data Structures & Algorithms"], "weeks": 3, "hours": 20},
    ],
    "android developer": [
        {"title": "Kotlin / Java Basics", "description": "OOP with Kotlin.", "skills": ["Java"], "weeks": 3, "hours": 25},
        {"title": "App Fundamentals", "description": "Activities, layouts, intents.", "skills": ["React Native"], "weeks": 2, "hours": 15},
        {"title": "Modern UI", "description": "Jetpack Compose declarative UI.", "skills": ["UX/UI Design"], "weeks": 3, "hours": 25},
        {"title": "Networking & Data", "description": "REST APIs, Room database.", "skills": ["REST APIs", "SQL"], "weeks": 3, "hours": 25},
        {"title": "Advanced Android", "description": "Coroutines, DI, testing.", "skills": [], "weeks": 3, "hours": 25},
        {"title": "Publishing & Growth", "description": "Play Store release, metrics.", "skills": ["Marketing"], "weeks": 1, "hours": 8},
        {"title": "Projects", "description": "2-3 apps shipped to the store.", "skills": ["React Native"], "weeks": 4, "hours": 40},
    ],
    "ui ux designer": [
        {"title": "Design Fundamentals", "description": "Color, typography, layout, hierarchy.", "skills": ["UX/UI Design"], "weeks": 2, "hours": 15},
        {"title": "UX Research", "description": "User interviews, personas, journeys.", "skills": ["Communication"], "weeks": 2, "hours": 15},
        {"title": "Wireframing & Prototyping", "description": "Figma mastery.", "skills": ["Figma"], "weeks": 3, "hours": 25},
        {"title": "Interaction & Motion", "description": "Micro-interactions, states.", "skills": ["Figma"], "weeks": 2, "hours": 15},
        {"title": "Design Systems", "description": "Tokens, components, documentation.", "skills": ["UX/UI Design"], "weeks": 2, "hours": 18},
        {"title": "Portfolio & Case Studies", "description": "3 polished case studies.", "skills": ["Technical Writing"], "weeks": 3, "hours": 25},
    ],
}

DEFAULT_CHAIN = [
    {"title": "Fundamentals", "description": "Learn the core concepts and tools.", "skills": [], "weeks": 2, "hours": 20},
    {"title": "Build Projects", "description": "Apply skills to real mini-projects.", "skills": [], "weeks": 3, "hours": 30},
    {"title": "Advanced Topics", "description": "Deep-dive into advanced areas.", "skills": [], "weeks": 3, "hours": 25},
    {"title": "Portfolio & Networking", "description": "Showcase work and connect with peers.", "skills": ["Communication"], "weeks": 2, "hours": 15},
    {"title": "Interview Preparation", "description": "Practice, mock interviews, apply.", "skills": ["Public Speaking"], "weeks": 2, "hours": 15},
]


def generate_roadmap(goal: str) -> dict:
    goal = (goal or "").strip()
    lower = goal.lower()
    steps = None
    for key in TEMPLATES:
        if key in lower or key.split(" ")[0] in lower:
            steps = TEMPLATES[key]
            break
    if steps is None:
        steps = DEFAULT_CHAIN
    total_hours = sum(s["hours"] for s in steps)
    return {
        "goal": goal,
        "steps": steps,
        "total_estimated_hours": total_hours,
        "estimated_weeks": sum(s["weeks"] for s in steps),
    }
