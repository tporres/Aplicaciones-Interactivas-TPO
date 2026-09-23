const { createHash, randomBytes, randomUUID } = require("node:crypto");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { AppError } = require("../errors/app-error");

function publicAdministrator(administrator) {
  const { passwordHash: _passwordHash, ...publicValues } = administrator;
  return publicValues;
}

function createAuthService(repository, authConfig, nodeEnv) {
  async function issueSession(administrator) {
    const sessionId = randomUUID();
    const expiresAt = new Date(
      Date.now() + authConfig.jwtExpiresSeconds * 1000,
    );
    const token = jwt.sign(
      { role: administrator.role },
      authConfig.jwtSecret,
      {
        audience: "gamer-store-admin",
        expiresIn: authConfig.jwtExpiresSeconds,
        issuer: "gamer-store-api",
        jwtid: sessionId,
        subject: String(administrator.id),
      },
    );

    await repository.createSession({
      id: sessionId,
      administratorId: administrator.id,
      expiresAt,
    });

    return {
      token,
      tokenType: "Bearer",
      expiresIn: authConfig.jwtExpiresSeconds,
      user: publicAdministrator(administrator),
    };
  }

  return {
    async register(values) {
      const passwordHash = await bcrypt.hash(
        values.password,
        authConfig.bcryptRounds,
      );

      try {
        const administrator = await repository.createAdministrator({
          ...values,
          passwordHash,
        });
        return issueSession(administrator);
      } catch (error) {
        if (error.code === "23505") {
          throw new AppError(
            409,
            "EMAIL_CONFLICT",
            "An administrator with that email already exists",
          );
        }

        throw error;
      }
    },

    async login({ email, password }) {
      const administrator = await repository.findByEmail(email);
      const validPassword = administrator
        ? await bcrypt.compare(password, administrator.passwordHash)
        : false;

      if (!administrator || !validPassword) {
        throw new AppError(
          401,
          "INVALID_CREDENTIALS",
          "Email or password is incorrect",
        );
      }

      return issueSession(administrator);
    },

    logout(sessionId) {
      return repository.revokeSession(sessionId);
    },

    async updateProfile(administratorId, values) {
      try {
        const administrator = await repository.updateAdministrator(
          administratorId,
          values,
        );

        if (!administrator) {
          throw new AppError(404, "ADMIN_NOT_FOUND", "Administrator not found");
        }

        return administrator;
      } catch (error) {
        if (error.code === "23505") {
          throw new AppError(
            409,
            "EMAIL_CONFLICT",
            "An administrator with that email already exists",
          );
        }

        throw error;
      }
    },

    async forgotPassword(email) {
      const administrator = await repository.findByEmail(email);
      const response = {
        message:
          "If the email exists, a password reset token has been generated",
      };

      if (!administrator) {
        return response;
      }

      const resetToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(resetToken).digest("hex");
      const expiresAt = new Date(
        Date.now() + authConfig.passwordResetExpiresMinutes * 60 * 1000,
      );

      await repository.savePasswordResetToken({
        tokenHash,
        administratorId: administrator.id,
        expiresAt,
      });

      if (nodeEnv !== "production") {
        response.resetToken = resetToken;
      }

      return response;
    },

    async resetPassword({ token, password }) {
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const passwordHash = await bcrypt.hash(password, authConfig.bcryptRounds);
      const reset = await repository.resetPassword(tokenHash, passwordHash);

      if (!reset) {
        throw new AppError(
          400,
          "INVALID_RESET_TOKEN",
          "Password reset token is invalid or expired",
        );
      }
    },
  };
}

module.exports = { createAuthService };
