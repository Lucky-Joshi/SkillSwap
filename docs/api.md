# SkillSwap — API Reference

Base URL: `http://localhost:5000/api` (proxied from the frontend via Vite at `/api`).

All endpoints return JSON. Success responses look like `{ success: true, ... }`;
errors use `{ success: false, status: 'fail'|'error', message, stack? }`.

All routes except the public auth ones require:

```
Authorization: Bearer <JWT>
```

---

## Auth (`/auth`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | `name, email, password, college?, department?, year?` | Create account, returns `{ token, user }` |
| POST | `/auth/login` | `email, password` | Login, returns `{ token, user }` |
| GET | `/auth/me` | — | Current user profile (protected) |
| GET | `/auth/verify-email?token=` | — | Verify email |
| POST | `/auth/resend-verification` | `email` | Resend verification link |
| POST | `/auth/forgot-password` | `email` | Send reset link |
| POST | `/auth/reset-password` | `token, password` | Set new password |

> Demo mode (`DEMO_MODE=true`) auto-verifies on register; the mailer logs to console.

## Users (`/users`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/users` | query `search, department, year, availability` | Search/browse users (paginated, 100 max) |
| GET | `/users/profile` | — | My full profile |
| PUT | `/users/profile` | any of `name, bio, college, department, year, avatar, github, linkedin, portfolio, availability, projects, achievements, certificates` | Update profile |
| GET | `/users/:id` | — | Public profile by id |
| POST | `/users/avatar` | multipart `avatar` | Upload image |
| POST | `/users/resume` | multipart `resume` | Upload resume (PDF/DOCX/TXT) |
| POST | `/users/skills` | `skillId` **or** `skillName`, `level?, canTeach?, wantToLearn?` | Add skill |
| PUT | `/users/skills/:userSkillId` | `level?, canTeach?, wantToLearn?` | Update skill |
| DELETE | `/users/skills/:userSkillId` | — | Remove skill |

## Skills (`/skills`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/skills` | List skills (query `search, category, difficulty, limit`) |
| GET | `/skills/categories` | Skill categories |
| POST | `/skills` | Create skill (`name`, `category?`, `difficulty?`) |
| PUT | `/skills/:id` | Update skill |
| DELETE | `/skills/:id` | Delete skill |

## Recommendations (`/recommendations`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/recommendations?mode=mentors\|learners` | AI-ranked candidate cards; response includes `aiService: bool` and per-card `score` + `breakdown` |

## Matches (`/match`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/match/request` | `userId, mode?` | Send learning request (unique per pair) |
| POST | `/match/accept` | `matchId` | Accept request |
| POST | `/match/reject` | `matchId` | Reject request |
| GET | `/match/history` | query `status?, page, limit` | My matches |
| GET | `/match/requests` | — | Pending requests received by me |

## Messages (`/messages`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/messages/conversations` | — | List conversations with last message |
| POST | `/messages` | `receiver, message, matchId?` | Send a message (REST fallback) |
| GET | `/messages/:userId` | query `page, limit` | Message thread with a user |

> Prefer the Socket.IO channel for realtime; these endpoints keep chat usable as a fallback.

## Sessions (`/session`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/session` | `otherUserId, topic, date, duration?, notes?, link?, matchId?` | Schedule session |
| GET | `/session` | query `status?, page, limit` | My sessions (includes `role`, mentor/learner) |
| PUT | `/session/:id` | `topic?, date?, duration?, notes?, link?, status?` | Update; `status: 'completed'` triggers points, badges, certificate, match completion |

## Reviews (`/review`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/review` | `mentor, rating, feedback?, sessionId?` | Rate a mentor |
| GET | `/review/:userId` | — | Reviews received by a user |

## Notifications (`/notifications`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | query `page, limit` — returns `unreadCount` |
| PUT | `/notifications/:id/read` | Mark one read |
| PUT | `/notifications/read-all` | Mark all read |

## Leaderboard (`/leaderboard`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/leaderboard` | query `page, limit` — ranked by points (rank, name, avatar, points, rating, badgeCount) |

## Badges (`/badges`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/badges` | All badges |
| GET | `/badges/mine` | Badges I earned |

## Certificates (`/certificates`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/certificates` | My certificates |
| POST | `/certificates/:sessionId/grant` | Grant certificate + badge for a completed session |

## Dashboard (`/dashboard`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Aggregated stats: profile completion, teach/learn counts, match count, points, badges, upcoming sessions, AI suggestion |

## AI (`/ai`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/ai/roadmap` | `goal` | Learning roadmap (steps, weeks, hours) |
| GET | `/ai/skill-graph` | — | Skill knowledge graph `{ nodes, edges }` |
| POST | `/ai/related-skills` | `skill` | Semantically related skills |

Every AI route returns `aiService: bool` indicating whether the FastAPI service
handled the request or the heuristic fallback did.

---

## Socket.IO events

Connect: `io('http://localhost:5000', { auth: { token: JWT } })`. Each socket joins the room `user:<id>`.

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `message:send` | client → server | `{ receiver, message, matchId? }` | Persist + deliver message |
| `message:new` | server → client | full message doc | Delivered to recipient's room |
| `message:sent` | server → client | full message doc | Echo to sender (other tabs) |
| `messages:read` | client → server | `{ from }` | Mark thread read |
| `messages:read-confirmed` | server → client | `{ by }` | Notify sender of read |
| `typing` / `typing:stop` | client → server | `{ receiver }` | Typing indicator |
| `typing` / `typing:stop` | server → client | `{ from }` | Delivered to recipient |
| `notification:new` | server → client | notification doc | Real-time notifications |
