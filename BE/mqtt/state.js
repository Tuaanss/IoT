/** Shared MQTT state (used by handlers + device-action route) */
module.exports = {
  mqttReady: false,
  lastDeviceReport: new Map(),
  pendingDeviceCmd: new Map(),
};
