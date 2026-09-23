const { AppError } = require("../errors/app-error");

function productNotFound() {
  return new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
}

function translateProductError(error) {
  if (error.code === "23503") {
    return new AppError(
      400,
      "INVALID_CATEGORY",
      "The selected category does not exist",
    );
  }

  if (error.code === "23505") {
    return new AppError(
      409,
      "PRODUCT_NAME_CONFLICT",
      "A product with that name already exists",
    );
  }

  return error;
}

function createProductsService(repository) {
  return {
    listPublic: (query) => repository.findAll(query, { publicOnly: true }),
    listAdmin: (query) => repository.findAll(query, { publicOnly: false }),

    async getPublic(id) {
      const product = await repository.findById(id, { publicOnly: true });
      if (!product) {
        throw productNotFound();
      }
      return product;
    },

    async getAdmin(id) {
      const product = await repository.findById(id, { publicOnly: false });
      if (!product) {
        throw productNotFound();
      }
      return product;
    },

    async create(values) {
      try {
        return await repository.create(values);
      } catch (error) {
        throw translateProductError(error);
      }
    },

    async update(id, values) {
      try {
        const product = await repository.update(id, values);
        if (!product) {
          throw productNotFound();
        }
        return product;
      } catch (error) {
        throw translateProductError(error);
      }
    },

    async remove(id) {
      if (!(await repository.remove(id))) {
        throw productNotFound();
      }
    },
  };
}

module.exports = { createProductsService };
