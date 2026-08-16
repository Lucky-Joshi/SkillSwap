# SkillSwap — Database Schema

MongoDB database name: `skillswap` (configurable via `MONGO_URI`).

## Collections & relationships (ER)

```
User 1───n UserSkill n───1 Skill
User 1───n UserBadge n───1 Badge
User 1───n Match
User 1───n Session
User 1───n Message
User 1───n Review
User 1───n Notification
Match 1───n Session (matchId)
Session 1───n Review (sessionId)
```

---

## Users

| Field | Type | Notes |
|-------|------|-------|
| name | String (≤80) | required |
| email | String (unique, lowercase) | required, regex-validated |
| password | String | bcrypt-hashed (12 rounds), `select:false` |
| role | enum `student|faculty|alumni|admin` | default `student` |
| college / department | String | |
| year | enum `1..5|Graduate|''` | |
| bio | String (≤500) | |
| avatar | String | path/URL to uploaded file |
| github / linkedin / portfolio | String | URL-validated |
| projects | [{title, description, link}] | subdocument |
| achievements / certificates | [String] | |
| availability | enum `weekdays|weekends|evenings|mornings|anytime|''` | |
| rating | Number | 0–5, aggregated from reviews |
| reviewCount | Number | |
| points | Number | badge + activity points |
| isVerified | Boolean | |
| verificationToken / resetToken / resetTokenExpiry | String / Date | `select:false` |
| lastActiveAt | Date | |

Hooks: `pre('save')` hashes password when modified. `comparePassword(candidate)` helper.

---

## Skills

| Field | Type | Notes |
|-------|------|-------|
| name | String (unique, ≤60) | required |
| aliases | [String] | used for fuzzy lookup (e.g. `ReactJS`) |
| category | enum `programming|frontend|backend|database|data-science|ai-ml|cloud-devops|design|soft-skills|languages|business|other` | |
| difficulty | enum `beginner|intermediate|advanced` | |
| icon | String | |

Indexed with a **text index** on `name` + `aliases`.

## UserSkills (join: user ⇄ skill)

| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User | required, indexed |
| skillId | ObjectId → Skill | required |
| level | Number 1–5 | default 3 |
| canTeach | Boolean | |
| wantToLearn | Boolean | |
| verified | Boolean | |

Unique index `{userId, skillId}` — a user can have each skill once.

## Matches

| Field | Type | Notes |
|-------|------|-------|
| mentorId | ObjectId → User | required, indexed |
| learnerId | ObjectId → User | required, indexed |
| compatibilityScore | Number 0–100 | from recommendation engine |
| skills | [{skillId, name}] | matched skill context |
| status | enum `pending|accepted|rejected|completed` | |
| requestedBy | enum `mentor|learner` | required |
| respondedAt | Date | |

**Unique compound index `{mentorId, learnerId}`** — duplicate requests are rejected.

## Sessions

| Field | Type | Notes |
|-------|------|-------|
| mentorId / learnerId | ObjectId → User | required, indexed |
| matchId | ObjectId → Match | optional |
| topic | String (≤120) | required |
| notes | String (≤1000) | |
| date | Date | required |
| duration | Number 15–240 min | default 60 |
| link | String | meeting link |
| status | enum `scheduled|completed|cancelled` | |
| completedAt | Date | set when completed |

## Messages

| Field | Type | Notes |
|-------|------|-------|
| sender / receiver | ObjectId → User | required, indexed |
| matchId | ObjectId → Match | optional |
| message | String (≤2000) | required |
| read | Boolean | |
| readAt | Date | |

Indexes: `{sender, receiver, createdAt}` and `{matchId, createdAt}`.

## Reviews

| Field | Type | Notes |
|-------|------|-------|
| mentor / learner | ObjectId → User | required, indexed |
| sessionId | ObjectId → Session | optional |
| rating | Number 1–5 | required |
| feedback | String (≤1000) | |

Unique (sparse) index `{mentor, learner, sessionId}` — one review per session pair.

## Notifications

| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User | required, indexed |
| type | enum `match|message|session|review|badge|system` | |
| title / message | String | |
| read / readAt | Boolean / Date | |
| data | Mixed | arbitrary payload (e.g. senderId, sessionId) |

## Badges & UserBadges

`Badge`: `name` (unique), `description`, `icon`, `points`, `criteria`, `autoGrant`.

`UserBadge`: `userId`, `badgeId`, `earnedAt`, `source` — **unique `{userId, badgeId}`**.

---

## Notes

- All models use `timestamps: true` (`createdAt`, `updatedAt`).
- Passwords and verification/reset tokens are never returned by the API
  (`select:false` + removed by `userService.publicUser`).
- The seed script (`backend/scripts/seed.js`) **clears all collections** and re-seeds
  69 skills, 9 badges, 11 demo users, 5 accepted matches, plus messages, sessions,
  reviews and notifications.
