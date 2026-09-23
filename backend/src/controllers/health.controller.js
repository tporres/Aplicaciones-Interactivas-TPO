function getHealth(_request, response) {
  return response.status(200).json({ status: "ok" });
}

function createGetReadiness(database) {
  return async function getReadiness(_request, response) {
    try {
      await database.checkConnection();
      return response.status(200).json({
        status: "ready",
        database: "connected",
      });
    } catch {
      return response.status(503).json({
        status: "unavailable",
        database: "disconnected",
      });
    }
  };
}

module.exports = { createGetReadiness, getHealth };
