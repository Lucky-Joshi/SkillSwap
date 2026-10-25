-- Add the Mongoose Endorsement collection to the relational model.
CREATE TABLE "Endorsement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "endorserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Endorsement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Endorsement_userId_skillId_endorserId_key"
    ON "Endorsement"("userId", "skillId", "endorserId");
CREATE INDEX "Endorsement_userId_idx" ON "Endorsement"("userId");
CREATE INDEX "Endorsement_skillId_idx" ON "Endorsement"("skillId");

ALTER TABLE "Endorsement"
    ADD CONSTRAINT "Endorsement_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Endorsement"
    ADD CONSTRAINT "Endorsement_skillId_fkey"
    FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Endorsement"
    ADD CONSTRAINT "Endorsement_endorserId_fkey"
    FOREIGN KEY ("endorserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Browser clients use the anon key and should have no direct table access.
-- The backend connects with its server-side Postgres credentials.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Skill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSkill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Endorsement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Connection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConnectionSkill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Badge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserBadge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Institution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminAuditLog" ENABLE ROW LEVEL SECURITY;
