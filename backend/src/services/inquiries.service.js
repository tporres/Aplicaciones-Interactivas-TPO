const { AppError } = require("../errors/app-error");

function inquiryNotFound() {
  return new AppError(404, "INQUIRY_NOT_FOUND", "Inquiry not found");
}

function createInquiriesService(repository) {
  return {
    create: (values) => repository.create(values),
    list: (query) => repository.findAll(query),

    async get(id) {
      const inquiry = await repository.findById(id);
      if (!inquiry) {
        throw inquiryNotFound();
      }
      return inquiry;
    },

    async updateStatus(id, status) {
      const inquiry = await repository.updateStatus(id, status);
      if (!inquiry) {
        throw inquiryNotFound();
      }
      return inquiry;
    },

    async remove(id) {
      if (!(await repository.remove(id))) {
        throw inquiryNotFound();
      }
    },
  };
}

module.exports = { createInquiriesService };
