# SkillSwap — AI-Powered Peer Learning & Skill Exchange Platform

SkillSwap is a full-stack, AI-powered peer learning and skill exchange platform for
colleges. Students create verified profiles, list skills they know and want to learn,
get AI-generated mentor/learner/peer recommendations, exchange learning requests, chat in
real time, schedule sessions, and earn badges & certificates.

> LinkedIn for college skills · GitHub for student expertise · AI-powered peer mentoring.

---

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React, Vite, Tailwind CSS, React Router, Axios, Framer Motion, React Hook Form, React Hot Toast, Socket.IO Client |
| Backend    | Node.js, Express, Mongoose, JWT, Bcrypt, Multer, Socket.IO, express-validator, Helmet |
| Database   | MongoDB (MongoDB Atlas in production) |
| AI Service | Python, FastAPI, sentence-transformers, scikit-learn, spaCy, networkx, FAISS |

---

## System Architecture

```
                       React + Vite Frontend
                               │
                     Axios / Socket.IO
                               │
                     Node + Express Backend
                               │
        ┌───────────────┬───────────────┬──────────────┐
        │               │               │
     MongoDB       Authentication    Notification
        │
        │
   Recommendation API (HTTP)
        │
     FastAPI AI Service
        │
 Skill Matching Engine
 Resume Skill Extraction
 Roadmap Generator
 Semantic Recommendation
```

Full architecture, schema, API and deployment docs live in [`docs/`](docs/):

| Document | Contents |
|----------|----------|
| [Architecture](docs/architecture.md) | System architecture, diagrams, component hierarchy, user journeys, AI workflow |
| [Database Schema](docs/database-schema.md) | ER diagram + MongoDB schema definitions |
| [API Reference](docs/api.md) | Complete REST API + Socket.IO events |
| [AI Service](docs/ai-service.md) | FastAPI endpoints & ML workflow |
| [Security](docs/security.md) | Auth, hardening, error handling |
| [Deployment](docs/deployment.md) | Docker, Atlas, Vercel, Railway/Render |

---

## Folder Structure

```
skillswap/
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── components/  # reusable UI + feature components
│       ├── pages/       # route pages
│       ├── layouts/     # authenticated / auth layouts
│       ├── hooks/       # useDebounce, useSocket ...
│       ├── context/     # AuthContext, ThemeContext, SocketContext
│       ├── services/    # axios API + socket clients
│       ├── utils/       # constants, helpers
│       └── routes/      # route config
├── backend/           # Node + Express API
│   ├── config/        # db, env
│   ├── controllers/   # request handlers
│   ├── middleware/    # auth, validation, errors, upload
│   ├── models/        # Mongoose schemas
│   ├── routes/        # REST routes
│   ├── services/      # AI client, recommendation, seeder
│   ├── socket/        # Socket.IO realtime layer
│   └── utils/
├── ai-service/        # FastAPI ML service
│   ├── app.py
│   ├── recommendation.py
│   ├── similarity.py
│   ├── embeddings.py
│   ├── skill_graph.py
│   ├── roadmap.py
│   └── resume_parser.py
├── docs/
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # edit values
npm run seed                  # seed skills, badges, demo users
npm run dev                   # http://localhost:5000
```

### 2. AI Service

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate        # (Windows)  |  source .venv/bin/activate (macOS/Linux)
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

> The AI service runs with zero ML dependencies out of the box (heuristic + TF-IDF
> fallbacks). Install `sentence-transformers` and `spacy` for full semantic matching.
> See [docs/ai-service.md](docs/ai-service.md#run-modes).

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL / VITE_SOCKET_URL
npm run dev                   # http://localhost:5173
```

### 4. Everything at once

```bash
docker compose up --build
```

Open http://localhost:5173. A demo account is seeded automatically
(`demo@skillswap.io` / `demo1234`).

---

## Connection Model

SkillSwap supports two types of connections between students:

| Type | Description |
|------|-------------|
| **Mentorship** | Directional: one student mentors another (e.g., React expert teaches a beginner) |
| **Peer Learning** | Mutual: two students teach each other different skills (e.g., React ↔ Python) |

Both types unlock private chat and session scheduling.

---

## Recommendation Formula

```
Compatibility Score = 40% Skill Match
                    + 20% Mutual Learning Interest
                    + 15% Availability
                    + 10% Teaching Rating
                    + 10% Experience Level
                    +  5% Department Similarity
```

Semantic skill matching understands that `ReactJS`, `React`, `React.js`,
`Frontend Development` and `JavaScript Framework` are closely related.

---

## Core User Flow

```
Landing → Sign Up → Verify College Email → Complete Profile → Select Skills
→ AI Recommendations → Browse → Send Learning/Mentorship/Peer Request
→ Accepted → Chat → Schedule Session → Complete Session → Rate Each Other
→ Earn Badge → Leaderboard
```

---

## Security Highlights

- JWT auth with httpOnly-refreshable tokens, bcrypt password hashing
- Input validation (express-validator) + rate limiting
- Helmet, CORS allowlist, express-mongo-sanitize, XSS cleaning
- Protected routes on both API and frontend

---

## Future Scope

Multi-college networking · Alumni mentorship · Internship referrals · AI interview
coach & mock interviews · AI skill-gap analysis · Hackathon team builder · Faculty
recommendations · Placement readiness dashboard · Mobile app · Video calling ·
Calendar integration · QR attendance for sessions.
