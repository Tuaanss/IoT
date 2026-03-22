require("./config"); // load dotenv before db pool
const express = require("express");
const cors = require("cors");
const pool = require("./db/pool");
const { initMqttClient } = require("./mqtt/client");
const createApiRouter = require("./routes");

const app = express();
app.use(cors());
app.use(express.json());

initMqttClient(pool);
app.use("/api", createApiRouter(pool));

module.exports = app;
