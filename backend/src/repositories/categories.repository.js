const CATEGORY_COLUMNS = `
  id,
  name,
  description,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

function createCategoriesRepository(database) {
  return {
    async findAll() {
      const result = await database.query(`
        SELECT ${CATEGORY_COLUMNS}
        FROM categories
        ORDER BY name ASC, id ASC
      `);

      return result.rows;
    },

    async findById(id) {
      const result = await database.query(
        `
          SELECT ${CATEGORY_COLUMNS}
          FROM categories
          WHERE id = $1
        `,
        [id],
      );

      return result.rows[0] || null;
    },

    async create({ name, description }) {
      const result = await database.query(
        `
          INSERT INTO categories (name, description)
          VALUES ($1, $2)
          RETURNING ${CATEGORY_COLUMNS}
        `,
        [name, description],
      );

      return result.rows[0];
    },

    async update(id, values) {
      const fields = [];
      const parameters = [];

      if (values.name !== undefined) {
        parameters.push(values.name);
        fields.push(`name = $${parameters.length}`);
      }

      if (values.description !== undefined) {
        parameters.push(values.description);
        fields.push(`description = $${parameters.length}`);
      }

      parameters.push(id);
      const result = await database.query(
        `
          UPDATE categories
          SET ${fields.join(", ")}
          WHERE id = $${parameters.length}
          RETURNING ${CATEGORY_COLUMNS}
        `,
        parameters,
      );

      return result.rows[0] || null;
    },

    async remove(id) {
      const result = await database.query(
        "DELETE FROM categories WHERE id = $1",
        [id],
      );

      return result.rowCount > 0;
    },
  };
}

module.exports = { createCategoriesRepository };
