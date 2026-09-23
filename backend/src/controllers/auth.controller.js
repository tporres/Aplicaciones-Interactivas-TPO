function createAuthController(service) {
  return {
    async register(request, response) {
      const session = await service.register(request.validated.body);
      response.location("/api/v1/profile");
      return response.status(201).json({ data: session });
    },

    async login(request, response) {
      const session = await service.login(request.validated.body);
      return response.status(200).json({ data: session });
    },

    async logout(request, response) {
      await service.logout(request.auth.sessionId);
      return response.status(204).send();
    },

    async forgotPassword(request, response) {
      const result = await service.forgotPassword(
        request.validated.body.email,
      );
      return response.status(202).json({ data: result });
    },

    async resetPassword(request, response) {
      await service.resetPassword(request.validated.body);
      return response.status(204).send();
    },

    getProfile(request, response) {
      return response.status(200).json({
        data: request.auth.administrator,
      });
    },

    async updateProfile(request, response) {
      const administrator = await service.updateProfile(
        request.auth.administrator.id,
        request.validated.body,
      );
      return response.status(200).json({ data: administrator });
    },
  };
}

module.exports = { createAuthController };
