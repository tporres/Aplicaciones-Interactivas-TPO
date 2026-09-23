function createInquiriesController(service) {
  return {
    async create(request, response) {
      const inquiry = await service.create(request.validated.body);
      return response.status(201).json({ data: inquiry });
    },

    async list(request, response) {
      const { page, limit } = request.validated.query;
      const result = await service.list(request.validated.query);
      return response.status(200).json({
        data: result.items,
        meta: { page, limit, total: result.total },
      });
    },

    async get(request, response) {
      const inquiry = await service.get(request.validated.params.id);
      return response.status(200).json({ data: inquiry });
    },

    async updateStatus(request, response) {
      const inquiry = await service.updateStatus(
        request.validated.params.id,
        request.validated.body.status,
      );
      return response.status(200).json({ data: inquiry });
    },

    async remove(request, response) {
      await service.remove(request.validated.params.id);
      return response.status(204).send();
    },
  };
}

module.exports = { createInquiriesController };
