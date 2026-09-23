function createCategoriesController(service) {
  return {
    async list(_request, response) {
      const categories = await service.list();
      return response.status(200).json({ data: categories });
    },

    async get(request, response) {
      const category = await service.get(request.validated.params.id);
      return response.status(200).json({ data: category });
    },

    async create(request, response) {
      const category = await service.create(request.validated.body);
      response.location(`/api/v1/categories/${category.id}`);
      return response.status(201).json({ data: category });
    },

    async update(request, response) {
      const category = await service.update(
        request.validated.params.id,
        request.validated.body,
      );
      return response.status(200).json({ data: category });
    },

    async remove(request, response) {
      await service.remove(request.validated.params.id);
      return response.status(204).send();
    },
  };
}

module.exports = { createCategoriesController };
