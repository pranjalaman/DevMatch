ALTER TABLE users ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob date;

DO $$
BEGIN
  ALTER TABLE users
    ADD CONSTRAINT users_gender_check
    CHECK (gender IS NULL OR gender IN ('female', 'male', 'other'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
