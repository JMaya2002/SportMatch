-- Sportivo v2 migration — safe to run on existing Neon DB (idempotent)
-- Run this in the Neon SQL editor or via psql

-- Expand level CHECK constraint on users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_level_check;
ALTER TABLE users ADD CONSTRAINT users_level_check
  CHECK (level IN ('principiante','intermedio','avanzado','experto'));

-- Expand level CHECK constraint on meetups
ALTER TABLE meetups DROP CONSTRAINT IF EXISTS meetups_level_check;
ALTER TABLE meetups ADD CONSTRAINT meetups_level_check
  CHECK (level IN ('principiante','intermedio','avanzado','experto'));

-- New columns on users (IF NOT EXISTS = idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS province     TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sports       TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS position     TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS objectives   TEXT[] DEFAULT '{}';

-- New column on meetups
ALTER TABLE meetups ADD COLUMN IF NOT EXISTS province TEXT;
