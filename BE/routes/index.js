const express = require("express");
const createHealthRouter = require("./health");
const createDevicesRouter = require("./devices");
const createActionHistoryRouter = require("./actionHistory");
const createSensorsRouter = require("./sensors");
const createSensorDataRouter = require("./sensorData");
const createLatestSensorsRouter = require("./latestSensors");
const createDeviceActionRouter = require("./deviceAction");

function createApiRouter(pool) {
  const router = express.Router();

  router.use("/health", createHealthRouter(pool));
  router.use("/devices", createDevicesRouter(pool));
  router.use("/action-history", createActionHistoryRouter(pool));
  router.use("/sensors", createSensorsRouter(pool));
  router.use("/sensor-data", createSensorDataRouter(pool));
  router.use("/latest-sensors", createLatestSensorsRouter(pool));
  router.use("/device-action", createDeviceActionRouter(pool));

  return router;
}

module.exports = createApiRouter;
