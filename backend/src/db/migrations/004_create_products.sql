CREATE TABLE products (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id integer NOT NULL
    REFERENCES categories(id) ON DELETE RESTRICT,
  name varchar(200) NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  price numeric(12, 2) NOT NULL,
  availability varchar(30) NOT NULL DEFAULT 'in_stock',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT products_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT products_description_not_blank CHECK (btrim(description) <> ''),
  CONSTRAINT products_image_url_not_blank CHECK (btrim(image_url) <> ''),
  CONSTRAINT products_price_non_negative CHECK (price >= 0),
  CONSTRAINT products_availability_check
    CHECK (availability IN ('in_stock', 'out_of_stock', 'preorder'))
);

CREATE UNIQUE INDEX products_name_lower_unique
  ON products (lower(name));

CREATE INDEX products_public_listing_index
  ON products (is_active, category_id, availability, created_at DESC);

CREATE INDEX products_search_index
  ON products USING gin (
    to_tsvector('simple', name || ' ' || description)
  );

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
