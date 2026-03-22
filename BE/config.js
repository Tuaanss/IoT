require("dotenv").config();

const MQTT_URL =
  process.env.MQTT_URL ||
  `mqtt://${encodeURIComponent(process.env.MQTT_USER || "")}:${encodeURIComponent(
    process.env.MQTT_PASSWORD || ""
  )}@${process.env.MQTT_HOST || "localhost"}:${process.env.MQTT_PORT || "1883"}`;

module.exports = {
  PORT: process.env.PORT || 4000,
  MQTT_URL,
  ROOM_ID: String(process.env.ROOM_ID || ""),
  MQTT_TOPIC_SENSOR: process.env.MQTT_TOPIC_SENSOR || "data_sensor",
  MQTT_TOPIC_DEVICE_CONTROL: process.env.MQTT_TOPIC_DEVICE_CONTROL || "device_control",
  MQTT_TOPIC_DEVICE_STATUS: process.env.MQTT_TOPIC_DEVICE_STATUS || "device_status",
};
