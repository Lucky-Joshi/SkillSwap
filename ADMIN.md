# SkillSwap — Admin Guide

## Admin Account Creation

Admin accounts are created via a CLI script:

```bash
node scripts/createAdmin.js --email admin@example.com --password SecurePass123 --name "Admin Name"
```

This hashes the password with bcrypt (cost factor 12) and inserts the user document with `role: "admin"`.

## Role Hierarchy

```
super-admin (reserved, not user-created)
      │
      ▼
    admin
      │
      ▼
   student (default)
```

- **student** — Standard platform user; can discover, connect, chat, and schedule sessions.
- **admin** — Full access to admin panel; can manage all users, content, and system settings.
- **super-admin** — Reserved for the platform owner; can grant/revoke admin roles and access audit logs.

## Dashboard Overview

The admin dashboard presents 21 stat cards across categories:

| Category         | Cards                                                    |
|------------------|----------------------------------------------------------|
| Users            | Total users, active today, new this week, suspended      |
| Sessions         | Total sessions, scheduled, completed, cancelled          |
| Connections      | Total connections, pending requests, mentor vs peer      |
| Skills           | Total skills, most popular, recently added               |
| Badges           | Total badges, badges awarded, pending reviews            |
| System           | AI service status, DB health, storage used               |
| Engagement       | Avg session rating, endorsement count, leaderboard top   |

## User Management

- **Search & filter** — By name, email, institution, role, status, join date.
- **View profile** — Full profile details, activity history, connections.
- **Suspend user** — Soft-suspend; user can no longer log in but data is preserved.
- **Delete user** — Hard-delete with cascade cleanup of related documents.
- **Change role** — Promote student to admin or demote (super-admin only).
- **Merge accounts** — Combine duplicate accounts under one identity.

## Institution Management

- **CRUD** — Create, update, delete institutions.
- **Merge** — Combine duplicate institutions; reassigns all affiliated users.
- **Stats** — View user count, session count, top skills per institution.

## Skill Management

- **CRUD** — Create, update, delete skills.
- **Merge** — Combine duplicate skills; reassigns all references across users, endorsements, and sessions.
- **Category** — Organize skills by category for filtering.
- **Stats** — View endorsement count, user count, trend data per skill.

## Session Monitoring

- View all sessions across the platform (scheduled, in-progress, completed, cancelled).
- Filter by date range, user, skill, status.
- View session details: participants, duration, rating, feedback.
- Flag or investigate suspicious session activity.

## Badge Management

- **CRUD** — Create badges with name, description, icon, and criteria.
- **Criteria** — Define auto-award rules (hours taught, sessions completed, rating threshold).
- **Manual award** — Grant badges manually for special achievements.
- **Revoke** — Remove badges if criteria are no longer met or for policy violations.

## Certificate Management

- **CRUD** — Create certificate templates.
- **Auto-issue** — Issue certificates when users meet defined milestones.
- **Download** — Users can download PDF certificates from their profile.
- **Revoke** — Revoke issued certificates if necessary.

## Report Moderation

- Users can report other users, sessions, or messages.
- Admin reviews reports with full context.
- Actions: dismiss, warn user, suspend user, delete content.
- Reporter receives notification of outcome.

## AI Service Monitoring

- Health check status (online/offline/degraded).
- Request volume and latency metrics.
- Model version and last-updated timestamp.
- Fallback status — when AI service is down, the backend falls back to TF-IDF-based matching.

## System Health Checks

- MongoDB connection status and response time.
- Disk space and memory usage.
- Active WebSocket connections.
- Queue depth for background jobs.
- Error rate and recent error log summaries (via Winston).

## Analytics

| Analytics Tab  | Metrics                                                    |
|----------------|------------------------------------------------------------|
| Growth         | User signups (daily/weekly/monthly), retention rate        |
| Sessions       | Sessions per period, avg duration, completion rate         |
| Skills         | Most taught skills, emerging skills, skill distribution    |
| Connections    | Request volume, acceptance rate, mentor vs peer breakdown  |

All analytics support date range filtering and CSV export.

## Audit Logging

Every admin action is recorded with:

- **Timestamp** — ISO 8601 timestamp of the action.
- **Actor** — Admin user ID and email.
- **Action** — e.g., `user.suspend`, `badge.create`, `skill.merge`.
- **Target** — The affected resource (user ID, badge ID, etc.).
- **Details** — JSON payload with before/after state for mutations.

Audit logs are queryable by admin, action type, and date range. They cannot be modified or deleted by anyone except the super-admin.
