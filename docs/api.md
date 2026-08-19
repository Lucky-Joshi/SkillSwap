# SkillSwap — API Reference

Base URL: `http://localhost:5000/api` (proxied from the frontend via Vite at `/api`).

All endpoints return JSON. Success responses look like `{ success: true, ... }`;
errors use `{ success: false, status: 'fail'|'error', message, stack? }`.

All routes except the public auth ones require:

```
Authorization: Bearer <JWT>
```

---

## Auth (`/api/auth`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | `name, email, password, college?, qualification?, department?, year?` | Create account, returns `{ token, user }` |
| POST | `/auth/login` | `email, password` | Login, returns `{ token, user }` |
| POST | `/auth/logout` | — | Logout |
| GET | `/auth/me` | — | Current user profile |
| POST | `/auth/verify-email` | `email, code` | Verify email with 6-digit code |
| POST | `/auth/resend-verification` | `email` | Resend verification code |
| POST | `/auth/forgot-password` | `email` | Send reset link |
| POST | `/auth/reset-password/:token` | `password` | Set new password |
| PUT | `/auth/update-password` | `currentPassword, newPassword` | Change password |



## Users (`/api/users`)

| Method | Path | Body / Query | Description |
|--------|------|------|-------------|
| GET | `/users` | query `search, department, year, availability, page, limit` | Search/browse users (paginated) |
| GET | `/users/profile` | — | My full profile |
| PUT | `/users/profile` | any of `name, bio, college, qualification, department, year, avatar, github, linkedin, portfolio, availability, projects, achievements, certificates` | Update profile |
| GET | `/users/:id` | — | Public profile by ID (includes relationship context if connected) |
| POST | `/users/avatar` | multipart `avatar` | Upload avatar image |
| POST | `/users/resume` | multipart `resume` | Upload resume (PDF/DOCX/TXT), extract skills |
| POST | `/users/skills` | `skillId` **or** `skillName`, `level?, canTeach?, wantToLearn?` | Add skill |
| PUT | `/users/skills/:userSkillId` | `level?, canTeach?, wantToLearn?` | Update skill |
| DELETE | `/users/skills/:userSkillId` | — | Remove skill |
| GET | `/users/leaderboard` | query `page, limit` | Top users by points/trust |

## Skills (`/api/skills`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/skills` | List skills (query `search, category, difficulty, limit`) |
| GET | `/skills/categories` | Skill categories |
| POST | `/skills` | Create skill (admin) |
| PUT | `/skills/:id` | Update skill (admin) |
| DELETE | `/skills/:id` | Delete skill (admin) |

## Connections (`/api/match`)

The connection API manages mentorship and peer learning relationships.

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/match/request` | `userId, mode?, type?, compatibilityScore?, skills?, skillAteaches?, skillBteaches?` | Send connection request. `type`: `'mentorship'` (default) or `'peer'`. `mode`: `'mentors'` (I need a mentor), `'learners'` (I can teach), or `'peer'`. Unique per pair. |
| POST | `/match/accept` | `matchId` | Accept connection request. Unlocks chat + sessions. |
| POST | `/match/reject` | `matchId` | Reject connection request. |
| POST | `/match/cancel` | `matchId` | Cancel/end an active connection. Locks chat + sessions. |
| GET | `/match/relationships` | — | My active connections: `{ mentors, learners, peers }` |
| GET | `/match/requests` | — | Pending requests (sent or received) |
| GET | `/match/history` | query `status?, type?, page, limit` | All connections (paginated) |

### Connection response DTO

```json
{
  "id": "...",
  "type": "mentorship | peer",
  "status": "pending | accepted | rejected | cancelled",
  "active": true,
  "role": "mentor | learner | peer",
  "acceptedAt": "...",
  "compatibilityScore": 88,
  "requestedBy": "...",
  "skills": [{ "skillId": "...", "name": "React" }],
  "skillAteaches": "React",
  "skillBteaches": "Python",
  "otherUser": { "id", "name", "avatar", "college", "department", "year", "rating", "bio" },
  "stats": {
    "totalSessions": 5,
    "completedSessions": 3,
    "totalHours": 4.5,
    "lastSessionAt": "...",
    "nextSession": { "id", "topic", "date", "startTime", "duration", "meetingMode" }
  }
}
```

## Sessions (`/api/session`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/session` | `otherUserId, topic, description?, date, startTime?, duration?, meetingMode?, meetingType?, meetingLink?, locationType?, location?, notes?` | Schedule session (requires active connection) |
| GET | `/session` | query `status?, page, limit` | My sessions (includes computed `role`, `start`, `end`) |
| GET | `/session/dashboard` | — | Session dashboard: upcoming, pending, in-progress, completed, cancelled + stats |
| GET | `/session/calendar` | query `month?` or `from?&to?` | Calendar view of sessions |
| PUT | `/session/:id` | any session fields | Update session (pending/confirmed only) |
| POST | `/session/:id/confirm` | — | Confirm session → unlocks chat |
| POST | `/session/:id/cancel` | — | Cancel session |
| POST | `/session/:id/complete` | `rating?, feedback?, recommendAnother?` | Complete session → triggers badges, points, certificate, AI next-steps |

### Session lifecycle

```
pending → confirmed → completed
pending → cancelled
confirmed → cancelled
```

### Session response DTO

Includes computed fields:
- `role`: `'mentor'` or `'learner'` (based on viewer)
- `status`: derived lifecycle status (`upcoming`, `in_progress`, `completed`, `cancelled`)
- `start` / `end`: ISO timestamps computed from `date` + `startTime` + `duration`

### Completion response

```json
{
  "success": true,
  "session": { ... },
  "progress": {
    "sessionsCompleted": 5,
    "hoursLearned": 12.5,
    "hoursTaught": 8.0,
    "learningStreak": 3,
    "teachingStreak": 2
  },
  "nextSteps": [
    { "topic": "Advanced React Hooks", "description": "..." }
  ]
}
```

## Messages (`/api/messages`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/messages/conversations` | — | List conversations with last message + unread count |
| GET | `/messages/unread-count` | — | Total unread messages |
| POST | `/messages` | `receiver, message` | Send a message (requires active connection) |
| GET | `/messages/:userId` | query `page, limit` | Message thread with a user |
| PUT | `/messages/:userId/read` | — | Mark thread as read |

> Prefer the Socket.IO channel for realtime; these endpoints keep chat usable as a fallback.

### Chat access control

Chat is gated by `assertCanInteract()` — both users must share an active connection
(`status: 'accepted'` + `active: true`). Without this, returns 403.

## Notifications (`/api/notifications`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | query `page, limit` — returns paginated notifications |
| GET | `/notifications/unread-count` | Unread notification count |
| PUT | `/notifications/:id/read` | Mark one read |
| PUT | `/notifications/read-all` | Mark all read |
| DELETE | `/notifications/:id` | Delete one |
| DELETE | `/notifications` | Delete all |

### Notification types

| Type | Trigger | Data payload |
|------|---------|--------------|
| `mentorship` | Connection requested/accepted/cancelled | `{ matchId }` |
| `session` | Session scheduled/confirmed/completed/cancelled | `{ sessionId }` |
| `message` | New chat message | `{ senderId }` |
| `review` | New review received | `{ reviewId }` |
| `badge` | Badge earned | `{ badgeId }` |
| `reminder` | Session upcoming (24h) | `{ sessionId }` |
| `system` | Platform announcements | — |

## Reviews (`/api/reviews`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/reviews` | `mentor, rating, feedback?, sessionId?` | Rate a mentor |
| GET | `/reviews/user/:userId` | — | Reviews received by a user |
| GET | `/reviews/session/:sessionId` | — | Reviews for a session |
| DELETE | `/reviews/:id` | — | Delete own review |

## Badges (`/api/badges`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/badges` | All badges with earned status |
| GET | `/badges/user` | Current user's badges |
| GET | `/badges/user/:userId` | Another user's badges |

## Leaderboard (`/api/users/leaderboard`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/leaderboard` | query `page, limit` — ranked by points (rank, name, avatar, points, rating, badgeCount) |

## Certificates (`/api/certificates`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/certificates` | My certificates |
| GET | `/certificates/:id` | Get specific certificate |
| POST | `/certificates/:sessionId/grant` | Grant certificate for a completed session |

## Recommendations (`/api/recommendations`)

| Method | Path | Body / Query | Description |
|--------|------|------|-------------|
| GET | `/recommendations` | query `mode=mentors\|learners` | AI-ranked candidate cards |
| POST | `/recommendations` | — | Refresh recommendations |

Response includes `aiService: bool` indicating live AI vs heuristic fallback.

## Dashboard (`/api/dashboard`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Aggregated stats: profile completion, teach/learn counts, connection count, points, badges, upcoming sessions, skill hours breakdown, active connections, activity feed, recent reviews |

### Dashboard response

```json
{
  "stats": {
    "teachCount": 5, "learnCount": 3, "totalSkills": 8,
    "matchCount": 4, "pendingRequests": 1, "completedSessions": 12,
    "messageCount": 28, "unreadNotifications": 3, "badgeCount": 4,
    "points": 250, "rating": 4.5, "reviewCount": 3,
    "sessionsCompleted": 12, "hoursLearned": 15.5, "hoursTaught": 8.0,
    "learningStreak": 3, "teachingStreak": 2,
    "activeConnections": 4, "profileCompletion": 85
  },
  "upcomingSessions": [...],
  "recentSessions": [...],
  "skillHours": [{ "skill": "React", "taught": 4, "learned": 0, "total": 4 }],
  "connectionsSummary": [{ "id", "userId", "name", "avatar", "type", "role", "acceptedAt" }],
  "activityFeed": [{ "type", "text", "date", "hours" }],
  "recentReviews": [{ "id", "rating", "feedback", "date", "from" }]
}
```

## AI (`/api/ai`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/ai/roadmap` | `goal` | Learning roadmap (steps, weeks, hours) |
| GET | `/ai/skill-graph` | — | Skill knowledge graph `{ nodes, edges }` |
| POST | `/ai/related-skills` | `skill` | Semantically related skills |
| POST | `/ai/similarity` | `skill_a, skill_b` | Similarity 0–1 between two skills |
| POST | `/ai/next-steps` | `topic, goal?` | AI-suggested next topics after a session |

Every AI route returns `aiService: bool` indicating whether the FastAPI service
handled the request or the heuristic fallback did.

## Admin (`/api/admin`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Platform-wide statistics |
| GET | `/admin/users` | Admin user search |
| PUT | `/admin/users/:id/role` | Change user role |
| DELETE | `/admin/users/:id` | Delete user |
| DELETE | `/admin/users/test` | Delete all test accounts |
| DELETE | `/admin/data` | Purge all user data |

## Institutions (`/api/institutions`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/institutions` | List institutions |
| GET | `/institutions/:id` | Get institution |
| POST | `/institutions` | Create institution (admin) |
| PUT | `/institutions/:id` | Update institution (admin) |
| DELETE | `/institutions/:id` | Delete institution (admin) |

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Returns `{ status: "ok" }` |

---

## Socket.IO events

Connect: `io('http://localhost:5000', { auth: { token: JWT } })`. Each socket joins the room `user:<id>`. The connection handler lives in `backend/socket/index.js`; the client lives in `context/SocketContext.jsx` (connection lifecycle) and `pages/Chat.jsx` (chat events).

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `connection` | client → server | JWT via handshake auth | Joins user room, emits `user:online` broadcast |
| `user:online` | server → client (broadcast) | — | Notifies all other connected clients the user is online |
| `user:offline` | server → client (broadcast) | — | Notifies all other connected clients the user went offline |
| `message:send` | client → server | `{ receiver, message }` | Persist + deliver message |
| `message:new` | server → client | full message doc | Delivered to recipient's room |
| `message:sent` | server → client | full message doc | Echo to sender's own room (other tabs) |
| `messages:read` | client → server | `{ from }` | Mark all messages from that sender as read |
| `messages:read-confirmed` | server → client | `{ by }` | Notify sender their messages were read |
| `typing` | client → server | `{ receiverId }` | Typing indicator (server relays to receiver) |
| `typing` | server → client | `{ userId }` | Relayed typing indicator from the sender |
| `typing:stop` | client → server | `{ receiverId }` | Stop typing indicator (server relays) |
| `typing:stop` | server → client | `{ userId }` | Relayed stop typing indicator |
| `notification:new` | server → client | notification doc | Real-time notification push |
| `disconnect` | client → server | — | Emits `user:offline` broadcast, marks user offline |
