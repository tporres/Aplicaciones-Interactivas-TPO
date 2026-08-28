function normalizeStatusCode(value) {
  return Number.isInteger(value) && value >= 400 && value <= 599 ? value : 500;
}

function errorHandler(error, _request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  const invalidJson = error.type === "entity.parse.failed";
  const statusCode = invalidJson
    ? 400
    : normalizeStatusCode(error.statusCode || error.status);
  const code = invalidJson
    ? "INVALID_JSON"
    : error.code || (statusCode === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");
  const message = invalidJson
    ? "Request body contains invalid JSON"
    : statusCode === 500
      ? "Internal server error"
      : error.message;

  if (statusCode === 500 && process.env.NODE_ENV !== "test") {
    console.error(error);
  }

  return response.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}

module.exports = { errorHandler };
