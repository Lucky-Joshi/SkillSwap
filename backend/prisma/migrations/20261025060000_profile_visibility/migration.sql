ALTER TABLE "User"
  ADD COLUMN "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'public';

CREATE INDEX "User_profileVisibility_idx" ON "User"("profileVisibility");

UPDATE "User"
SET "profileVisibility" = COALESCE("privacy" ->> 'profileVisibility', "privacy" ->> 'visibility')::"ProfileVisibility"
WHERE COALESCE("privacy" ->> 'profileVisibility', "privacy" ->> 'visibility') IN ('public', 'members', 'private');
