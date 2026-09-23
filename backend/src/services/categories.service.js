const { AppError } = require("../errors/app-error");

function categoryNotFound() {
  return new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
}

function translateDatabaseError(error) {
  if (error.code === "23505") {
    return new AppError(
      409,
      "CATEGORY_NAME_CONFLICT",
      "A category with that name already exists",
    );
  }

  return error;
}

function createCategoriesService(repository) {
  return {
    list() {
      return repository.findAll();
    },

    async get(id) {
      const category = await repository.findById(id);

      if (!category) {
        throw categoryNotFound();
      }

      return category;
    },

    async create(values) {
      try {
        return await repository.create(values);
      } catch (error) {
        throw translateDatabaseError(error);
      }
    },

    async update(id, values) {
      try {
        const category = await repository.update(id, values);

        if (!category) {
          throw categoryNotFound();
        }

        return category;
      } catch (error) {
        throw translateDatabaseError(error);
      }
    },

    async remove(id) {
      let removed;

      try {
        removed = await repository.remove(id);
      } catch (error) {
        if (error.code === "23503") {
          throw new AppError(
            409,
            "CATEGORY_IN_USE",
            "Category cannot be deleted while it has products",
          );
        }

        throw error;
      }

      if (!removed) {
        throw categoryNotFound();
      }
    },
  };
}

module.exports = { createCategoriesService };
