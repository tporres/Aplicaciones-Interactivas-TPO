\set ON_ERROR_STOP on

-- Run from backend/ against an existing empty PostgreSQL database:
-- psql "$DATABASE_URL" -f database/create_database.sql

BEGIN;

CREATE TABLE schema_migrations (
  version varchar(255) PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT NOW()
);

\ir ../src/db/migrations/001_create_categories.sql
\ir ../src/db/migrations/002_create_authentication.sql
\ir ../src/db/migrations/003_create_store_and_inquiries.sql
\ir ../src/db/migrations/004_create_products.sql

INSERT INTO schema_migrations (version)
VALUES
  ('001_create_categories.sql'),
  ('002_create_authentication.sql'),
  ('003_create_store_and_inquiries.sql'),
  ('004_create_products.sql');

COMMIT;
