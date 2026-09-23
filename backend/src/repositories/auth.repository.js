const ADMIN_PUBLIC_COLUMNS = `
  id,
  first_name AS "firstName",
  last_name AS "lastName",
  email,
  phone,
  role,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

const AUTHENTICATED_ADMIN_COLUMNS = `
  administrators.id,
  administrators.first_name AS "firstName",
  administrators.last_name AS "lastName",
  administrators.email,
  administrators.phone,
  administrators.role,
  administrators.created_at AS "createdAt",
  administrators.updated_at AS "updatedAt"
`;

function createAuthRepository(database) {
  return {
    async createAdministrator(values) {
      const result = await database.query(
        `
          INSERT INTO administrators (
            first_name,
            last_name,
            email,
            phone,
            password_hash
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING ${ADMIN_PUBLIC_COLUMNS}
        `,
        [
          values.firstName,
          values.lastName,
          values.email,
          values.phone,
          values.passwordHash,
        ],
      );

      return result.rows[0];
    },

    async findByEmail(email) {
      const result = await database.query(
        `
          SELECT
            ${ADMIN_PUBLIC_COLUMNS},
            password_hash AS "passwordHash"
          FROM administrators
          WHERE lower(email) = lower($1)
        `,
        [email],
      );

      return result.rows[0] || null;
    },

    async createSession({ id, administratorId, expiresAt }) {
      await database.query(
        `
          INSERT INTO auth_sessions (id, administrator_id, expires_at)
          VALUES ($1, $2, $3)
        `,
        [id, administratorId, expiresAt],
      );
    },

    async findAuthenticatedAdministrator(sessionId, administratorId) {
      const result = await database.query(
        `
          SELECT ${AUTHENTICATED_ADMIN_COLUMNS}
          FROM auth_sessions sessions
          JOIN administrators
            ON administrators.id = sessions.administrator_id
          WHERE sessions.id = $1
            AND administrators.id = $2
            AND sessions.revoked_at IS NULL
            AND sessions.expires_at > NOW()
        `,
        [sessionId, administratorId],
      );

      return result.rows[0] || null;
    },

    async revokeSession(sessionId) {
      await database.query(
        `
          UPDATE auth_sessions
          SET revoked_at = COALESCE(revoked_at, NOW())
          WHERE id = $1
        `,
        [sessionId],
      );
    },

    async updateAdministrator(id, values) {
      const columnByProperty = {
        firstName: "first_name",
        lastName: "last_name",
        email: "email",
        phone: "phone",
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
          UPDATE administrators
          SET ${fields.join(", ")}
          WHERE id = $${parameters.length}
          RETURNING ${ADMIN_PUBLIC_COLUMNS}
        `,
        parameters,
      );

      return result.rows[0] || null;
    },

    async savePasswordResetToken({ tokenHash, administratorId, expiresAt }) {
      await database.query(
        `
          DELETE FROM password_reset_tokens
          WHERE administrator_id = $1 OR expires_at <= NOW() OR used_at IS NOT NULL
        `,
        [administratorId],
      );
      await database.query(
        `
          INSERT INTO password_reset_tokens (
            token_hash,
            administrator_id,
            expires_at
          )
          VALUES ($1, $2, $3)
        `,
        [tokenHash, administratorId, expiresAt],
      );
    },

    async resetPassword(tokenHash, passwordHash) {
      const result = await database.query(
        `
          WITH valid_token AS (
            UPDATE password_reset_tokens
            SET used_at = NOW()
            WHERE token_hash = $1
              AND used_at IS NULL
              AND expires_at > NOW()
            RETURNING administrator_id
          ),
          updated_administrator AS (
            UPDATE administrators
            SET password_hash = $2
            FROM valid_token
            WHERE administrators.id = valid_token.administrator_id
            RETURNING administrators.id
          ),
          revoked_sessions AS (
            UPDATE auth_sessions
            SET revoked_at = COALESCE(revoked_at, NOW())
            WHERE administrator_id IN (
              SELECT id FROM updated_administrator
            )
          )
          SELECT id FROM updated_administrator
        `,
        [tokenHash, passwordHash],
      );

      return result.rowCount > 0;
    },
  };
}

module.exports = { createAuthRepository };
