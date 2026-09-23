const { AppError } = require("../errors/app-error");

function createStoreController(repository) {
  return {
    async get(_request, response) {
      const store = await repository.get();

      if (!store) {
        throw new AppError(
          404,
          "STORE_INFORMATION_NOT_FOUND",
          "Store information has not been configured",
        );
      }

      return response.status(200).json({ data: store });
    },

    async upsert(request, response) {
      const store = await repository.upsert(request.validated.body);
      return response.status(200).json({ data: store });
    },
  };
}

module.exports = { createStoreController };
