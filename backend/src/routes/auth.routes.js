const express = require("express");

const { createAuthController } = require("../controllers/auth.controller");
const { validate } = require("../middlewares/validate.middleware");
const { createAuthRepository } = require("../repositories/auth.repository");
const { createAuthService } = require("../services/auth.service");
const {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} = require("../validators/auth.schemas");

function createAuthRouters({ database, authenticate, authConfig, nodeEnv }) {
  const repository = createAuthRepository(database);
  const service = createAuthService(repository, authConfig, nodeEnv);
  const controller = createAuthController(service);
  const authRouter = express.Router();
  const profileRouter = express.Router();

  authRouter.post(
    "/register",
    validate({ body: registerSchema }),
    controller.register,
  );
  authRouter.post(
    "/login",
    validate({ body: loginSchema }),
    controller.login,
  );
  authRouter.post("/logout", authenticate, controller.logout);
  authRouter.post(
    "/forgot-password",
    validate({ body: forgotPasswordSchema }),
    controller.forgotPassword,
  );
  authRouter.post(
    "/reset-password",
    validate({ body: resetPasswordSchema }),
    controller.resetPassword,
  );

  profileRouter.use(authenticate);
  profileRouter.get("/", controller.getProfile);
  profileRouter.patch(
    "/",
    validate({ body: updateProfileSchema }),
    controller.updateProfile,
  );

  return { authRouter, profileRouter };
}

module.exports = { createAuthRouters };
