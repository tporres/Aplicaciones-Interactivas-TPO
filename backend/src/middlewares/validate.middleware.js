const { ZodError } = require("zod");

const { AppError } = require("../errors/app-error");

function formatIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

function validate(schemas) {
  return function validationMiddleware(request, _response, next) {
    try {
      request.validated = {};

      for (const [property, schema] of Object.entries(schemas)) {
        request.validated[property] = schema.parse(request[property]);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError(
            400,
            "VALIDATION_ERROR",
            "Request validation failed",
            formatIssues(error.issues),
          ),
        );
        return;
      }

      next(error);
    }
  };
}

module.exports = { validate };
