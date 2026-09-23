CREATE TABLE administrators (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  email varchar(320) NOT NULL,
  phone varchar(50) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role varchar(20) NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT administrators_first_name_not_blank CHECK (btrim(first_name) <> ''),
  CONSTRAINT administrators_last_name_not_blank CHECK (btrim(last_name) <> ''),
  CONSTRAINT administrators_email_not_blank CHECK (btrim(email) <> ''),
  CONSTRAINT administrators_phone_not_blank CHECK (btrim(phone) <> ''),
  CONSTRAINT administrators_role_check CHECK (role = 'admin')
);

CREATE UNIQUE INDEX administrators_email_lower_unique
  ON administrators (lower(email));

CREATE TRIGGER administrators_set_updated_at
BEFORE UPDATE ON administrators
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY,
  administrator_id integer NOT NULL
    REFERENCES administrators(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX auth_sessions_administrator_id_index
  ON auth_sessions (administrator_id);

CREATE INDEX auth_sessions_active_index
  ON auth_sessions (id, administrator_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE password_reset_tokens (
  token_hash char(64) PRIMARY KEY,
  administrator_id integer NOT NULL
    REFERENCES administrators(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX password_reset_tokens_administrator_id_index
  ON password_reset_tokens (administrator_id);
