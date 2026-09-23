const express = require("express");

const {
  createGetReadiness,
  getHealth,
} = require("../controllers/health.controller");

function createHealthRouter({ database }) {
  const healthRouter = express.Router();

  healthRouter.get("/", getHealth);
  healthRouter.get("/ready", createGetReadiness(database));

  return healthRouter;
}

module.exports = { createHealthRouter };
