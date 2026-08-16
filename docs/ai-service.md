# SkillSwap — AI Service

Python FastAPI microservice on port `8000` that powers semantic matching, roadmaps,
skill relationships, and resume parsing.

## Endpoints

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Liveness probe, returns `{ status: "ok" }` |
| POST | `/recommendations` | `{ user, candidates }` | Rank candidates for the user |
| POST | `/roadmap` | `{ goal }` | Step-by-step learning roadmap |
| POST | `/resume/parse` | `{ text }` | Extract skills from raw text |
| POST | `/resume/text` | multipart file | Extract text from PDF/DOCX/TXT |
| POST | `/skills/graph` | — | Knowledge graph of skills |
| POST | `/skills/related` | `{ skill }` | Related skills for one skill |
| POST | `/skills/similarity` | `{ skill_a, skill_b }` | Similarity 0–1 between two skills |
| POST | `/text/similarity` | `{ a, b }` | Similarity between two texts |

All AI routes are protected server-side by the backend (the backend forwards the
user's JWT-authenticated request); the service itself trusts its network boundary
(i.e. it is **not** exposed publicly).

## Recommendation scoring

The backend's `recommendationService.js` (and the FastAPI `recommendation.py`)
compute a compatibility score:

```
Compatibility = 40% Skill Match
              + 20% Mutual Learning Interest
              + 15% Availability
              + 10% Teaching Rating
              + 10% Experience Level
              +  5% Department Similarity
```

### Skill matching (`similarity.py`)

- Uses the **SBERT** model (`sentence-transformers/all-MiniLM-L6-v2`) to embed
  skill names when available.
- Falls back to **TF-IDF** (scikit-learn) cosine similarity when the heavy
  transformers stack is not installed.
- Handles aliases and near-synonyms: `ReactJS` ≈ `React` ≈ `React.js` (measured
  similarity ≈ 0.89), so a mentor listing `React` is found by a learner searching
  for `ReactJS`.

### `can_cover` (`skill_graph.py`)

A networkx **prerequisite graph** (edge `prerequisite → advanced`). `can_cover(mentorSkill, learnerSkill)`
returns true if the skills are connected within ≤ 2 hops in either direction, letting
a mentor with `Python` cover a learner wanting `Machine Learning` (through intermediate
skills like `NumPy`).

## Roadmap generation (`roadmap.py`)

Named templates for common goals (`Data Scientist`, `Web Developer`, `ML Engineer`,
`Android Developer`, `UI/UX Designer`) plus a default generic chain. Each step has a
`title`, `description`, `skills`, `weeks` and `hours`; the total estimated hours is
computed across steps.

## Resume parsing (`resume_parser.py`)

- Extracts text from **PDF** (PyMuPDF), **DOCX** (python-docx), and **TXT**.
- Optionally runs spaCy NER when installed; otherwise uses a skills lexicon +
  TF-IDF scoring to extract matching skill names.

---

## Run modes

### Lightweight (zero ML deps)

```bash
cd ai-service
pip install fastapi uvicorn python-multipart pymupdf python-docx scikit-learn networkx
uvicorn app:app --reload --port 8000
```

Everything works: similarity and recommendations use TF-IDF, roadmaps/graphs use the
curated templates, resume text extraction works.

### Full semantic mode

```bash
pip install sentence-transformers spacy
python -m spacy download en_core_web_sm
```

`embeddings.py` auto-detects `sentence-transformers` at import time and upgrades the
matcher from TF-IDF to SBERT embeddings. Nothing else changes — `requirements.txt`
lists the heavy packages as **commented-out optional extras** so a plain install
stays fast.

## Integration with the backend

`backend/services/aiClient.js`:

- base URL `AI_SERVICE_URL` (default `http://localhost:8000`)
- timeout `AI_SERVICE_TIMEOUT` (default 4000 ms)
- `tryAi(path, payload, fallback)` — on error/timeout, returns the JS heuristic
  fallback so the app never breaks when the AI service is down.

The `/api/recommendations` and `/api/ai/*` responses include `aiService: true|false`
so the UI can show whether live AI scoring was used.

## Testing

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/roadmap -H "Content-Type: application/json" -d '{"goal":"Become a Data Scientist"}'
curl -X POST http://localhost:8000/skills/similarity -H "Content-Type: application/json" -d '{"skill_a":"React","skill_b":"ReactJS"}'
```
