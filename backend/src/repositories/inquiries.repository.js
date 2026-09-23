const INQUIRY_COLUMNS = `
  id,
  name,
  email,
  phone,
  subject,
  message,
  status,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

function createInquiriesRepository(database) {
  return {
    async create(values) {
      const result = await database.query(
        `
          INSERT INTO inquiries (name, email, phone, subject, message)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING ${INQUIRY_COLUMNS}
        `,
        [
          values.name,
          values.email,
          values.phone,
          values.subject,
          values.message,
        ],
      );

      return result.rows[0];
    },

    async findAll({ status, page, limit }) {
      const parameters = [];
      const conditions = [];

      if (status) {
        parameters.push(status);
        conditions.push(`status = $${parameters.length}`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      parameters.push(limit, (page - 1) * limit);
      const result = await database.query(
        `
          SELECT ${INQUIRY_COLUMNS}, count(*) OVER()::integer AS "totalCount"
          FROM inquiries
          ${where}
          ORDER BY created_at DESC, id DESC
          LIMIT $${parameters.length - 1}
          OFFSET $${parameters.length}
        `,
        parameters,
      );

      const total = result.rows[0]?.totalCount || 0;
      const items = result.rows.map(({ totalCount: _totalCount, ...row }) => row);
      return { items, total };
    },

    async findById(id) {
      const result = await database.query(
        `SELECT ${INQUIRY_COLUMNS} FROM inquiries WHERE id = $1`,
        [id],
      );
      return result.rows[0] || null;
    },

    async updateStatus(id, status) {
      const result = await database.query(
        `
          UPDATE inquiries
          SET status = $2
          WHERE id = $1
          RETURNING ${INQUIRY_COLUMNS}
        `,
        [id, status],
      );
      return result.rows[0] || null;
    },

    async remove(id) {
      const result = await database.query(
        "DELETE FROM inquiries WHERE id = $1",
        [id],
      );
      return result.rowCount > 0;
    },
  };
}

module.exports = { createInquiriesRepository };
