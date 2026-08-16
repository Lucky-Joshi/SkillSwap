"""Resume skill extraction.

Accepts a PDF/DOCX/TXT path, extracts text, then finds known skills using a
skills dictionary (mirrors backend seed) plus keyword matching. If spaCy is
installed, noun chunks are also scanned.
"""
from __future__ import annotations

import os
import re
from typing import Dict, List

SKILL_LEXICON: List[Dict[str, str]] = [
    {"name": "Python", "aliases": ["python3", "py"]},
    {"name": "JavaScript", "aliases": ["js", "es6"]},
    {"name": "TypeScript", "aliases": ["ts"]},
    {"name": "Java", "aliases": []},
    {"name": "C / C++", "aliases": ["c++", "cpp", "c language"]},
    {"name": "C#", "aliases": ["csharp"]},
    {"name": "Go", "aliases": ["golang"]},
    {"name": "Rust", "aliases": []},
    {"name": "SQL", "aliases": ["mysql", "postgresql", "sqlite", "postgres"]},
    {"name": "MongoDB", "aliases": ["mongo"]},
    {"name": "Redis", "aliases": []},
    {"name": "React", "aliases": ["reactjs", "react.js"]},
    {"name": "React Native", "aliases": []},
    {"name": "Vue.js", "aliases": ["vue"]},
    {"name": "Angular", "aliases": ["angularjs"]},
    {"name": "Next.js", "aliases": ["nextjs"]},
    {"name": "Node.js", "aliases": ["node", "nodejs"]},
    {"name": "Express.js", "aliases": ["express"]},
    {"name": "Django", "aliases": []},
    {"name": "Flask", "aliases": []},
    {"name": "FastAPI", "aliases": []},
    {"name": "GraphQL", "aliases": []},
    {"name": "REST APIs", "aliases": ["rest", "restful"]},
    {"name": "Firebase", "aliases": []},
    {"name": "HTML & CSS", "aliases": ["html", "css", "html5"]},
    {"name": "Tailwind CSS", "aliases": ["tailwind"]},
    {"name": "Bootstrap", "aliases": []},
    {"name": "Figma", "aliases": []},
    {"name": "UX/UI Design", "aliases": ["ui ux", "ui/ux", "user experience"]},
    {"name": "Git & GitHub", "aliases": ["git", "github", "version control"]},
    {"name": "Docker", "aliases": ["containerization", "containers"]},
    {"name": "Kubernetes", "aliases": ["k8s"]},
    {"name": "AWS", "aliases": ["amazon web services", "ec2", "s3"]},
    {"name": "Azure", "aliases": []},
    {"name": "Google Cloud", "aliases": ["gcp"]},
    {"name": "Linux", "aliases": ["ubuntu", "bash"]},
    {"name": "CI/CD", "aliases": ["jenkins", "github actions", "devops", "deployment pipeline"]},
    {"name": "Machine Learning", "aliases": ["ml"]},
    {"name": "Deep Learning", "aliases": ["dl", "neural networks"]},
    {"name": "Data Science", "aliases": []},
    {"name": "Data Analysis", "aliases": ["data analytics", "analytics"]},
    {"name": "NumPy", "aliases": ["numpy"]},
    {"name": "Pandas", "aliases": []},
    {"name": "Statistics", "aliases": ["statistical analysis"]},
    {"name": "TensorFlow", "aliases": ["tensorflow"]},
    {"name": "PyTorch", "aliases": ["pytorch"]},
    {"name": "Natural Language Processing", "aliases": ["nlp"]},
    {"name": "Computer Vision", "aliases": ["open cv", "opencv"]},
    {"name": "Power BI", "aliases": ["powerbi"]},
    {"name": "Tableau", "aliases": []},
    {"name": "Excel", "aliases": ["spreadsheets", "ms excel"]},
    {"name": "Public Speaking", "aliases": ["presentation skills"]},
    {"name": "Leadership", "aliases": ["team lead", "leadership skills"]},
    {"name": "Communication", "aliases": ["communication skills", "soft skills"]},
    {"name": "Technical Writing", "aliases": ["documentation"]},
    {"name": "Data Structures & Algorithms", "aliases": ["dsa", "algorithms", "data structures"]},
    {"name": "Cybersecurity", "aliases": ["security", "ethical hacking"]},
    {"name": "Blockchain", "aliases": ["web3", "smart contracts"]},
    {"name": "Finance", "aliases": ["financial analysis"]},
    {"name": "Marketing", "aliases": ["digital marketing", "seo"]},
    {"name": "Entrepreneurship", "aliases": ["startup"]},
    {"name": "Project Management", "aliases": ["agile", "scrum", "kanban"]},
]

# Multi-word skills must be checked before single-word substrings.
_SORTED = sorted(SKILL_LEXICON, key=lambda s: -len(s["name"]))


def extract_text(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        from pypdf import PdfReader

        reader = PdfReader(file_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if ext == ".docx":
        import docx

        doc = docx.Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs)
    if ext == ".txt" or ext == "":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as fh:
            return fh.read()
    raise ValueError(f"Unsupported file type: {ext}")


def extract_skills(text: str) -> Dict[str, list]:
    lower = text.lower()
    found_names = []

    for entry in _SORTED:
        name = entry["name"]
        patterns = [name.lower()] + [a.lower() for a in entry.get("aliases", [])]
        for pat in patterns:
            if pat and pat in lower:
                found_names.append(name)
                break

    # Optional spaCy enhancement: pick up skill-like noun phrases.
    chunks = _spacy_chunks(lower)

    return {
        "skills": list(dict.fromkeys(found_names)),
        "matched_chunks": chunks,
        "text_length": len(text),
    }


def _spacy_chunks(text: str) -> List[str]:
    try:
        import spacy

        nlp = spacy.load("en_core_web_sm", disable=["parser", "ner"])
        doc = nlp(text[:20000])
        known = {entry["name"].lower() for entry in SKILL_LEXICON}
        out = []
        for chunk in doc.noun_chunks:
            label = chunk.lemma_.strip()
            if len(label.split()) <= 3 and label.lower() in known and label not in out:
                out.append(label)
        return out
    except Exception:
        return []


def extract_from_file(file_path: str) -> Dict[str, list]:
    text = extract_text(file_path)
    return extract_skills(text)
