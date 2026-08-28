function getHealth(_request, response) {
  return response.status(200).json({ status: "ok" });
}

module.exports = { getHealth };
