# Supabase Postgres

Create a Supabase project and configure these server-side values in `backend/.env`
or the hosting provider's secret store:

| Variable | Use |
|---|---|
| `DATABASE_URL` | Runtime Postgres connection; use the Supabase pooler where direct IPv6 is unavailable |
| `DIRECT_URL` | Direct connection for Prisma migrations |

URL-encode special characters in database passwords and require TLS with
`sslmode=require`. This backend uses Prisma over Postgres; it does not need the
Supabase browser client or a service-role API key.

From `backend/`, run:

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run seed
```

Migrations are checked into `backend/prisma/migrations/`. The migration enables RLS
on application tables without adding browser policies. Application data access must
go through the backend's server-side database connection.
