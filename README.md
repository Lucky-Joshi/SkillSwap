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
| Frontend   | React 18, Vite, Tailwind CSS v3.4, React Router v6, Axios, Framer Motion, React Hook Form, React Hot Toast, react-window, Socket.IO Client |
| Backend    | Node.js, Express, Mongoose, JWT, Bcryptjs, Multer, Socket.IO, express-validator, Helmet, Winston, compression |
| Database   | MongoDB 7 (MongoDB Atlas in production) |
| AI Service | Python, FastAPI, sentence-transformers, scikit-learn, spaCy, NetworkX |

---

## System Architecture

```
┌──────────────────────────────────────────────┐
│          React 18 + Vite Frontend            │   Port 5173
│  Tailwind v3 · Framer Motion · RHF           │
│  React Router v6 · Socket.IO Client          │
│  Public Website + Protected App + Admin Portal│
└──────────────────┬───────────────────────────┘
                   │ Axios (REST) / Socket.IO (realtime)
┌──────────────────▼───────────────────────────┐
│        Node.js + Express Backend             │   Port 5000
│  JWT auth · Socket.IO · Multer uploads       │
│  Express-validator · Helmet · XSS-clean      │
│  Winston logging · Rate limiting             │
│  Role-based access (student / admin)         │
└────────┬─────────────────────┬───────────────┘
         │                     │
┌────────▼────────┐  ┌────────▼────────────┐
│    MongoDB 7    │  │  FastAPI AI Service  │   Port 8000
│   (Mongoose)    │  │  SBERT · TF-IDF     │
└─────────────────┘  │  NetworkX · spaCy    │
                     └─────────────────────┘
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
├── frontend/              # React + Vite SPA
│   └── src/
│       ├── components/
│       │   ├── ui/        # Avatar, Card, Button, Input, Modal, Spinner, etc.
│       │   ├── feature/   # SkillPicker, SectionDivider, etc.
│       │   ├── app/       # Sidebar, TopNavbar, MobileNav
│       │   ├── admin/     # AdminSidebar, AdminTopbar
│       │   └── public/    # PublicNavbar, HeroSection, CTASection, FeatureGrid
│       ├── pages/
│       │   ├── public/    # Home, Features, HowItWorks, AI, About, FAQ, Contact, Privacy, Terms
│       │   ├── auth/      # Login, Register, ForgotPassword, ResetPassword, VerifyEmail
│       │   └── app/       # Dashboard, Discover, Recommendations, Sessions, Chat, Profile,
│       │                  # Settings, Calendar, Notifications, Leaderboard, Roadmap,
│       │                  # Certificates, Mentorships, and 12 Admin* pages
│       ├── layouts/       # PublicLayout, MainLayout, AuthLayout, AdminLayout
│       ├── routes/        # ProtectedRoute, PublicOnlyRoute
│       ├── hooks/         # useDebounce, useDocumentTitle, useSocket
│       ├── context/       # AuthContext, ThemeContext, SocketContext
│       ├── services/      # axios API + socket clients (auth, admin, chat, sessions, etc.)
│       └── utils/         # constants, helpers, routes
├── backend/               # Node + Express API
│   ├── config/            # env.js, db.js
│   ├── controllers/       # auth, user, admin, match, session, chat, dashboard,
│   │                      # recommendation, notification, review, badge, certificate,
│   │                      # skill, institution, leaderboard, ai
│   ├── middleware/        # auth (JWT + restrictTo), validate, upload, errorHandler, notFound
│   ├── models/            # User, Skill, UserSkill, Connection, Session, Message,
│   │                      # Review, Notification, Badge, UserBadge, Certificate,
│   │                      # Institution, Report
│   ├── routes/            # REST routes (auth, users, match, session, messages, etc.)
│   ├── services/          # AI client, recommendation, badge, notification, trust,
│   │                      # mentorship, cleanup, reminder, seeder
│   ├── socket/            # Socket.IO realtime layer
│   ├── scripts/           # seed.js (core data), create-admin.js
│   ├── events/            # Event bus + handlers
│   └── utils/             # asyncHandler, AppError, paginate, logger, constants, metrics
├── ai-service/            # FastAPI ML service
│   ├── app.py
│   ├── config.py
│   ├── cache.py           # TTL in-memory cache
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
npm run seed                  # seed core data (skills, badges, institutions)
npm run dev                   # http://localhost:5000
```

### 2. Create an admin account

```bash
cd backend
node scripts/create-admin.js --name "Admin User" --email admin@skillswap.io --password Admin@2005
```

### 3. AI Service

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

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL / VITE_SOCKET_URL
npm run dev                   # http://localhost:5173
```

### 5. Everything at once

```bash
docker compose up --build
```

Open http://localhost:5173 and register a new account.

---

## Frontend Structure

The frontend has three distinct sections:

### Public Website (`/`)
Marketing pages accessible to everyone: Home, Features, How It Works, AI, About, FAQ, Contact, Privacy, Terms.

### Protected App (`/app/*`)
Student dashboard behind authentication: Dashboard, Discover, Recommendations, Connections, Chat, Sessions, Calendar, Roadmap, Leaderboard, Notifications, Profile, Settings, Certificates.

### Admin Portal (`/admin/*`)
Separate layout with its own sidebar and topbar (purple accent theme): Dashboard, Users, Institutions, Skills, Sessions, Badges, Certificates, Reports, AI Monitor, System Health, Analytics, Settings.

**Role-based routing**: Single login page automatically redirects admins to `/admin` and students to `/app/dashboard`.

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

> Admin users are automatically excluded from student-facing discovery, recommendations,
> and leaderboard.

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

- JWT auth with bcrypt password hashing (cost 12), httpOnly tokens
- Input validation (express-validator) + rate limiting
- Helmet, CORS allowlist, express-mongo-sanitize, XSS cleaning
- Protected routes on both API and frontend (PublicOnlyRoute, ProtectedRoute, AdminGuard)
- Role-based access control (student/admin) with `restrictTo()` middleware
- Admin account creation via CLI script (`create-admin.js`)
- Suspended user blocking (`isSuspended` field)
- Admin users hidden from student discovery, recommendations, and leaderboard

---

## Future Scope

Multi-college networking · Alumni mentorship · Internship referrals · AI interview
coach · AI skill-gap analysis · Hackathon team builder · Faculty
recommendations · Placement readiness dashboard · Mobile app · Video calling ·
Calendar integration · QR attendance for sessions.
