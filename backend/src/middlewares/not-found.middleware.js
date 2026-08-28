function notFoundHandler(request, _response, next) {
  const error = new Error(
    `Route ${request.method} ${request.originalUrl} not found`,
  );

  error.statusCode = 404;
  error.code = "NOT_FOUND";

  next(error);
}

module.exports = { notFoundHandler };
