const STORE_COLUMNS = `
  id,
  name,
  description,
  address,
  phone,
  social_links AS "socialLinks",
  opening_hours AS "openingHours",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

function createStoreRepository(database) {
  return {
    async get() {
      const result = await database.query(`
        SELECT ${STORE_COLUMNS}
        FROM store_information
        WHERE id = 1
      `);

      return result.rows[0] || null;
    },

    async upsert(values) {
      const result = await database.query(
        `
          INSERT INTO store_information (
            id,
            name,
            description,
            address,
            phone,
            social_links,
            opening_hours
          )
          VALUES (1, $1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            address = EXCLUDED.address,
            phone = EXCLUDED.phone,
            social_links = EXCLUDED.social_links,
            opening_hours = EXCLUDED.opening_hours
          RETURNING ${STORE_COLUMNS}
        `,
        [
          values.name,
          values.description,
          values.address,
          values.phone,
          values.socialLinks,
          values.openingHours,
        ],
      );

      return result.rows[0];
    },
  };
}

module.exports = { createStoreRepository };
