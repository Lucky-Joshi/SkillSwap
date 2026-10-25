ALTER TABLE "User"
  ADD COLUMN "verificationTokenExpiry" TIMESTAMP(3);

CREATE INDEX "User_verificationToken_verificationTokenExpiry_idx"
  ON "User"("verificationToken", "verificationTokenExpiry");

CREATE INDEX "User_resetToken_resetTokenExpiry_idx"
  ON "User"("resetToken", "resetTokenExpiry");
