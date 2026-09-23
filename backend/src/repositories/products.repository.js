const PRODUCT_COLUMNS = `
  products.id,
  products.name,
  products.description,
  products.image_url AS "imageUrl",
  products.price::float8 AS price,
  products.availability,
  products.is_active AS "isActive",
  products.created_at AS "createdAt",
  products.updated_at AS "updatedAt",
  json_build_object(
    'id', categories.id,
    'name', categories.name
  ) AS category
`;

const SORT_SQL = {
  newest: "products.created_at DESC, products.id DESC",
  name: "products.name ASC, products.id ASC",
  price_asc: "products.price ASC, products.id ASC",
  price_desc: "products.price DESC, products.id DESC",
};

function createProductsRepository(database) {
  async function findAll(query, { publicOnly }) {
    const parameters = [];
    const conditions = [];

    if (publicOnly) {
      conditions.push("products.is_active = true");
    } else if (query.isActive !== undefined) {
      parameters.push(query.isActive);
      conditions.push(`products.is_active = $${parameters.length}`);
    }

    if (query.q) {
      parameters.push(query.q);
      conditions.push(`
        to_tsvector('simple', products.name || ' ' || products.description)
        @@ websearch_to_tsquery('simple', $${parameters.length})
      `);
    }

    if (query.categoryId) {
      parameters.push(query.categoryId);
      conditions.push(`products.category_id = $${parameters.length}`);
    }

    if (query.availability) {
      parameters.push(query.availability);
      conditions.push(`products.availability = $${parameters.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    parameters.push(query.limit, (query.page - 1) * query.limit);
    const result = await database.query(
      `
        SELECT
          ${PRODUCT_COLUMNS},
          count(*) OVER()::integer AS "totalCount"
        FROM products
        JOIN categories ON categories.id = products.category_id
        ${where}
        ORDER BY ${SORT_SQL[query.sort]}
        LIMIT $${parameters.length - 1}
        OFFSET $${parameters.length}
      `,
      parameters,
    );

    const total = result.rows[0]?.totalCount || 0;
    const items = result.rows.map(({ totalCount: _totalCount, ...row }) => row);
    return { items, total };
  }

  async function findById(id, { publicOnly }) {
    const result = await database.query(
      `
        SELECT ${PRODUCT_COLUMNS}
        FROM products
        JOIN categories ON categories.id = products.category_id
        WHERE products.id = $1
          ${publicOnly ? "AND products.is_active = true" : ""}
      `,
      [id],
    );
    return result.rows[0] || null;
  }

  return {
    findAll,
    findById,

    async create(values) {
      const result = await database.query(
        `
          INSERT INTO products (
            category_id,
            name,
            description,
            image_url,
            price,
            availability,
            is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `,
        [
          values.categoryId,
          values.name,
          values.description,
          values.imageUrl,
          values.price,
          values.availability,
          values.isActive,
        ],
      );
      return findById(result.rows[0].id, { publicOnly: false });
    },

    async update(id, values) {
      const columnByProperty = {
        categoryId: "category_id",
        name: "name",
        description: "description",
        imageUrl: "image_url",
        price: "price",
        availability: "availability",
        isActive: "is_active",
      };
      const fields = [];
      const parameters = [];

      for (const [property, column] of Object.entries(columnByProperty)) {
        if (values[property] !== undefined) {
          parameters.push(values[property]);
          fields.push(`${column} = $${parameters.length}`);
        }
      }

      parameters.push(id);
      const result = await database.query(
        `
          UPDATE products
          SET ${fields.join(", ")}
          WHERE id = $${parameters.length}
          RETURNING id
        `,
        parameters,
      );

      if (!result.rows[0]) {
        return null;
      }

      return findById(result.rows[0].id, { publicOnly: false });
    },

    async remove(id) {
      const result = await database.query("DELETE FROM products WHERE id = $1", [
        id,
      ]);
      return result.rowCount > 0;
    },
  };
}

module.exports = { createProductsRepository };
