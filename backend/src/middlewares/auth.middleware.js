const jwt = require("jsonwebtoken");

const { AppError } = require("../errors/app-error");
const { createAuthRepository } = require("../repositories/auth.repository");

function unauthorized() {
  return new AppError(
    401,
    "AUTHENTICATION_REQUIRED",
    "A valid Bearer token is required",
  );
}

function createAuthenticate({ database, authConfig }) {
  const repository = createAuthRepository(database);

  return async function authenticate(request, _response, next) {
    const authorization = request.get("authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      next(unauthorized());
      return;
    }

    const token = authorization.slice("Bearer ".length).trim();

    try {
      const payload = jwt.verify(token, authConfig.jwtSecret, {
        audience: "gamer-store-admin",
        issuer: "gamer-store-api",
      });
      const administratorId = Number(payload.sub);

      if (!payload.jti || !Number.isInteger(administratorId)) {
        next(unauthorized());
        return;
      }

      const administrator = await repository.findAuthenticatedAdministrator(
        payload.jti,
        administratorId,
      );

      if (!administrator) {
        next(unauthorized());
        return;
      }

      request.auth = {
        administrator,
        sessionId: payload.jti,
      };
      next();
    } catch {
      next(unauthorized());
    }
  };
}

module.exports = { createAuthenticate };
