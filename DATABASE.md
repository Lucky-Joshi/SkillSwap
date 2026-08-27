# SkillSwap — Database Schema

MongoDB database name: `skillswap` (configurable via `MONGO_URI`).

## Collections & relationships (ER)

```
User 1───n UserSkill n───1 Skill
User 1───n UserBadge n───1 Badge
User 1───n Connection (userA or userB)
User 1───n Session (mentorId or learnerId)
User 1───n Message (sender or receiver)
User 1───n Review (as mentor)
User 1───n Notification
User 1───n Report (as reporterId)
Connection 1───n Session (matchId)
Session 1───n Review (sessionId)
Session 1───n Certificate (sessionId)
```

---

## Users

| Field | Type | Notes |
|-------|------|-------|
| name | String (≤80) | required |
| email | String (unique, lowercase) | required, regex-validated, indexed |
| password | String | bcrypt-hashed (12 rounds), `select:false` |
| role | enum `student\|faculty\|alumni\|admin` | default `student`, indexed |
| qualification | String enum | e.g. "B.Tech", "MSc", "BCA" |
| college / department | String | indexed |
| year | enum `1\|2\|3\|4\|5\|Graduate\|''` | |
| graduationYear | String | |
| bio | String (≤500) | |
| introduction | String (≤200) | short intro shown on profile |
| teachingPhilosophy | String (≤500) | |
| learningGoals | String (≤500) | |
| preferredLearningStyle | enum `visual\|auditory\|reading\|kinesthetic\|mixed\|''` | |
| languages | [String] | |
| interests | [String] | |
| timezone | String | |
| location | String | |
| avatar | String | path/URL to uploaded file |
| coverPhoto | String | path/URL to uploaded file |
| github / linkedin / portfolio | String | URL-validated |
| socialLinks | Object | `{ leetcode, codeforces, hackerrank, kaggle, behance, dribbble, youtube, website }` |
| projects | [{title, description, link, image, skills}] | subdocument array with images |
| educationHistory | [{school, university, degree, field, startYear, endYear, isCurrent}] | subdocument array |
| achievements / certificates | [String] | |
| availability | enum `weekdays\|weekends\|evenings\|mornings\|anytime\|''` | |
| availabilitySchedule | Object | `{ monday–sunday: Boolean, morning/afternoon/evening: Boolean }` |
| rating | Number 0–5 | aggregated from reviews |
| reviewCount | Number | |
| trustScore | Number 0–100 | computed by trustService |
| points | Number | badge + activity points, indexed |
| isVerified | Boolean | |
| isSuspended | Boolean | admin can suspend users |
| isTest / isDemo | Boolean | legacy flags (no longer used) |
| lastActiveAt / lastSessionDate | Date | |
| profileViews | Number | |
| sessionsCompleted | Number | |
| hoursLearned / hoursTaught | Number | |
| learnedSkills | [String] | skills learned via sessions |
| learningStreak / teachingStreak | Number | consecutive days |
| verificationToken / resetToken / resetTokenExpiry | String / Date | `select:false` |
| notificationPreferences | {email, push, sessionReminders} | subdocument |
| privacy | Object | `{ profileVisibility, showEmail, showCollege, showContact, showAvailability, showPortfolioLinks }` |

Indexes: `email` (unique), `name` (text), `bio` (text), `college`, `role`, `points`, `rating`, `createdAt`, `isTest`.

Hooks: `pre('save')` hashes password when modified. `comparePassword(candidate)` helper.

---

## Skills

| Field | Type | Notes |
|-------|------|-------|
| name | String (unique, ≤60) | required |
| aliases | [String] | fuzzy lookup (e.g. `ReactJS`) |
| category | enum `programming\|frontend\|backend\|database\|data-science\|ai-ml\|cloud-devops\|design\|soft-skills\|languages\|business\|other` | |
| difficulty | enum `beginner\|intermediate\|advanced` | |
| icon | String | emoji |
| description | String | |

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

## Connections (replaces Match)

The core relationship entity. Supports both directional mentorships and mutual peer learning.

| Field | Type | Notes |
|-------|------|-------|
| userA | ObjectId → User | required, indexed |
| userB | ObjectId → User | required, indexed |
| type | enum `mentorship\|peer` | default `mentorship` |
| compatibilityScore | Number 0–100 | from recommendation engine |
| skills | [{skillId, name}] | matched skill context |
| skillAteaches | String | what userA teaches (peer mode) |
| skillBteaches | String | what userB teaches (peer mode) |
| status | enum `pending\|accepted\|rejected\|cancelled` | |
| requestedBy | ObjectId → User | who initiated the request |
| active | Boolean | true when accepted, indexed |
| createdAt | Date | auto |
| respondedAt | Date | when accepted/rejected |
| acceptedAt | Date | when accepted |

**Unique compound index `{userA, userB}`** — one connection per pair.

### Connection types

| Type | userA | userB | Semantics |
|------|-------|-------|-----------|
| `mentorship` | mentor | learner | Directional: one teaches, one learns |
| `peer` | requester | target | Mutual: both teach each other different skills |

Chat and sessions are only unlocked when `status === 'accepted'` AND `active === true`.

## Sessions

| Field | Type | Notes |
|-------|------|-------|
| mentorId / learnerId | ObjectId → User | required, indexed |
| matchId | ObjectId → Connection | links back to the Connection |
| topic | String (≤120) | required |
| description | String (≤1000) | |
| notes | String (≤1000) | |
| date | Date | required |
| startTime | String "HH:MM" | default "10:00" |
| duration | Number 15–240 min | default 60 |
| meetingMode | enum `online\|offline` | |
| meetingType | enum `googleMeet\|zoom\|teams\|custom` | for online sessions |
| meetingLink / link | String | meeting URL |
| locationType | enum `campus\|classroom\|library\|lab\|custom` | for offline sessions |
| location | String | physical location |
| status | enum `pending\|confirmed\|completed\|cancelled` | |
| rating | Number 1–5 | set on completion |
| feedback | String | set on completion |
| recommendAnother | Boolean | |
| confirmedAt / completedAt / cancelledAt | Date | lifecycle timestamps |
| cancelledBy | ObjectId → User | who cancelled |

Indexes: `{mentorId, learnerId}`, `{matchId}`, `{status}`.

## Messages

| Field | Type | Notes |
|-------|------|-------|
| sender / receiver | ObjectId → User | required, indexed |
| conversationId | String | deterministic sorted pair key |
| matchId | ObjectId → Connection | optional, links to connection |
| message | String (≤2000) | required |
| read | Boolean | default false |
| readAt | Date | |

Indexes: `{sender, receiver, createdAt}`, `{matchId, createdAt}`.

## Reviews

| Field | Type | Notes |
|-------|------|-------|
| mentor | ObjectId → User | required, indexed |
| learner | ObjectId → User | required, indexed |
| sessionId | ObjectId → Session | optional |
| rating | Number 1–5 | required |
| feedback | String (≤1000) | |

Unique (sparse) index `{mentor, learner, sessionId}` — one review per session pair.

## Notifications

| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User | required, indexed |
| type | enum `match\|mentorship\|message_received\|session\|reminder\|review\|badge\|system` | |
| title | String | required |
| message | String | |
| read | Boolean | default false |
| readAt | Date | |
| data | Mixed | schemaless payload (e.g. `{matchId}`, `{sessionId}`, `{senderId}`, `{badgeId}`) |

## Badges & UserBadges

`Badge`: `name` (unique), `description`, `icon`, `points`, `criteria`, `autoGrant`.

`UserBadge`: `userId`, `badgeId`, `earnedAt`, `source` — **unique `{userId, badgeId}`**.

## Institutions

| Field | Type | Notes |
|-------|------|-------|
| name | String (unique) | required |
| domain | String | email domain |
| city | String | |
| country | String | |
| logo | String | URL |
| verified | Boolean | |

## Certificates

| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User | required |
| sessionId | ObjectId → Session | required |
| certificateId | String | unique, format `SS-XXXXXX` |
| issuedAt | Date | |

## Reports

| Field | Type | Notes |
|-------|------|-------|
| reporterId | ObjectId → User | required, indexed |
| targetType | enum `user\|message\|session\|skill` | required |
| targetId | ObjectId | required |
| reason | enum `fake_profile\|inappropriate_content\|spam\|harassment\|other` | required |
| description | String (≤1000) | |
| status | enum `pending\|reviewed\|resolved\|dismissed` | default `pending`, indexed |
| reviewedBy | ObjectId → User | admin who resolved |
| reviewedAt | Date | |
| resolution | String (≤500) | |

Indexes: `{status, createdAt}`, `{targetType, targetId}`.

---

## Trust Score Breakdown

Computed by `trustService.js` and stored on the User document.

| Component | Points |
|-----------|--------|
| Verified email | +30 |
| Complete academic details (institution + qualification + department + year) | +10 |
| Bio | +10 |
| Avatar | +5 |
| Linked socials / portfolio | +5 |
| Skills (3 pts each, capped) | +15 |
| Received review | +10 |
| Completed session | +10 |
| Accepted connection | +5 |
| Earned badge | +5 |
| **Total** | **100 max** |

---

## Notes

- All models use `timestamps: true` (`createdAt`, `updatedAt`).
- Passwords and verification/reset tokens are never returned by the API
  (`select:false` + removed by `userService.publicUser`).
- The core seeder (`backend/scripts/seed.js`) upserts skills, badges, and institutions — no demo/test users.
- Admin accounts are created via `backend/scripts/create-admin.js` (promotes existing users or creates new ones).
- Session `mentorId`/`learnerId` are always set (even for peer connections) to
  maintain query compatibility. The Connection `type` field determines semantics.
