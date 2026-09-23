function createProductsController(service) {
  function listWith(serviceMethod) {
    return async function list(request, response) {
      const { page, limit } = request.validated.query;
      const result = await serviceMethod(request.validated.query);
      return response.status(200).json({
        data: result.items,
        meta: { page, limit, total: result.total },
      });
    };
  }

  return {
    listPublic: listWith(service.listPublic),
    listAdmin: listWith(service.listAdmin),

    async getPublic(request, response) {
      const product = await service.getPublic(request.validated.params.id);
      return response.status(200).json({ data: product });
    },

    async getAdmin(request, response) {
      const product = await service.getAdmin(request.validated.params.id);
      return response.status(200).json({ data: product });
    },

    async create(request, response) {
      const product = await service.create(request.validated.body);
      response.location(`/api/v1/products/${product.id}`);
      return response.status(201).json({ data: product });
    },

    async update(request, response) {
      const product = await service.update(
        request.validated.params.id,
        request.validated.body,
      );
      return response.status(200).json({ data: product });
    },

    async remove(request, response) {
      await service.remove(request.validated.params.id);
      return response.status(204).send();
    },
  };
}

module.exports = { createProductsController };
