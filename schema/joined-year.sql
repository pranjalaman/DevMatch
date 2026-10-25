-- Backfill. Run this before the process that reads joined_year starts.
-- The session year follows the database clock: August or later uses the
-- calendar year, and every earlier month uses the previous calendar year.

ALTER TABLE users ADD COLUMN joined_year smallint;

UPDATE users
SET joined_year = (
  CASE
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8
      THEN EXTRACT(YEAR FROM CURRENT_DATE)
    ELSE EXTRACT(YEAR FROM CURRENT_DATE) - 1
  END
) - year + 1;

ALTER TABLE users ALTER COLUMN joined_year SET NOT NULL;

-- Run this only after that process is serving. It is not part of the backfill.
ALTER TABLE users DROP COLUMN year;
