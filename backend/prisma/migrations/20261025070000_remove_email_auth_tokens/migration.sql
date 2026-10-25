DROP INDEX IF EXISTS "User_verificationToken_verificationTokenExpiry_idx";
DROP INDEX IF EXISTS "User_resetToken_resetTokenExpiry_idx";

ALTER TABLE "User"
  DROP COLUMN IF EXISTS "verificationToken",
  DROP COLUMN IF EXISTS "verificationTokenExpiry",
  DROP COLUMN IF EXISTS "resetToken",
  DROP COLUMN IF EXISTS "resetTokenExpiry";
