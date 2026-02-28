ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "accepted_terms_at" timestamp,
  ADD COLUMN IF NOT EXISTS "accepted_privacy_at" timestamp,
  ADD COLUMN IF NOT EXISTS "terms_version" text DEFAULT '2026-02';
