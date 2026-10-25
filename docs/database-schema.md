# Database Schema

Supabase Postgres is accessed through Prisma ORM 7. The complete schema lives in
[`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma), with ordered SQL
migrations in `backend/prisma/migrations/`.

The main domain models are `User`, `Skill`, `UserSkill`, `Endorsement`, `Connection`,
`Session`, `Message`, `Review`, `Notification`, `Badge`, `UserBadge`, `Institution`,
`Report`, and `AdminAuditLog`. Relations and indexes are declared in the Prisma schema.

For a new or upgraded database, from `backend/` run:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
```

Run `npm run seed` once to add the reference skills, badges, and institutions.
