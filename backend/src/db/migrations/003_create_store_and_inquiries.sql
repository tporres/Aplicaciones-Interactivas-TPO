CREATE TABLE store_information (
  id smallint PRIMARY KEY DEFAULT 1,
  name varchar(150) NOT NULL,
  description text NOT NULL,
  address varchar(300) NOT NULL,
  phone varchar(50) NOT NULL,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  opening_hours text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT store_information_singleton CHECK (id = 1),
  CONSTRAINT store_information_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT store_information_description_not_blank CHECK (btrim(description) <> ''),
  CONSTRAINT store_information_address_not_blank CHECK (btrim(address) <> ''),
  CONSTRAINT store_information_phone_not_blank CHECK (btrim(phone) <> ''),
  CONSTRAINT store_information_opening_hours_not_blank
    CHECK (btrim(opening_hours) <> '')
);

CREATE TRIGGER store_information_set_updated_at
BEFORE UPDATE ON store_information
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE inquiries (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(150) NOT NULL,
  email varchar(320) NOT NULL,
  phone varchar(50),
  subject varchar(200) NOT NULL,
  message text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT inquiries_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT inquiries_email_not_blank CHECK (btrim(email) <> ''),
  CONSTRAINT inquiries_subject_not_blank CHECK (btrim(subject) <> ''),
  CONSTRAINT inquiries_message_not_blank CHECK (btrim(message) <> ''),
  CONSTRAINT inquiries_status_check
    CHECK (status IN ('pending', 'read', 'answered'))
);

CREATE INDEX inquiries_status_created_at_index
  ON inquiries (status, created_at DESC);

CREATE TRIGGER inquiries_set_updated_at
BEFORE UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
