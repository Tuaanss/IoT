CREATE DATABASE IF NOT EXISTS iot_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE iot_db;

-- devices
CREATE TABLE IF NOT EXISTS devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_name VARCHAR(100) NOT NULL,
  mac_address VARCHAR(50) NOT NULL,
  status BOOLEAN NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- sensors
CREATE TABLE IF NOT EXISTS sensors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sensor_name VARCHAR(100) NOT NULL,
  sensor_type VARCHAR(50) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  mqtt_topic VARCHAR(255) NOT NULL
);

-- sensor_data
CREATE TABLE IF NOT EXISTS sensor_data (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sensor_id INT NOT NULL,
  value FLOAT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sensor_data_sensor
    FOREIGN KEY (sensor_id) REFERENCES sensors(id)
    ON DELETE CASCADE
);

-- action_history
CREATE TABLE IF NOT EXISTS action_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  command_value VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_action_history_device
    FOREIGN KEY (device_id) REFERENCES devices(id)
    ON DELETE CASCADE
);

-- Seed sample data
INSERT INTO devices (device_name, mac_address, status)
VALUES
  ('Fan', 'AA:BB:CC:DD:EE:01', 1),
  ('Light', 'AA:BB:CC:DD:EE:02', 1),
  ('Projector', 'AA:BB:CC:DD:EE:03', 0);

INSERT INTO sensors (sensor_name, sensor_type, unit, mqtt_topic)
VALUES
  ('Temperature', 'temp', '°C', 'home/sensors/temp'),
  ('Humidity', 'humidity', '%', 'home/sensors/humidity'),
  ('Light', 'light', 'Lux', 'home/sensors/light');

INSERT INTO sensor_data (sensor_id, value)
VALUES
  (1, 27.5),
  (2, 65.0),
  (3, 450);

INSERT INTO action_history (device_id, action, command_value, status)
VALUES
  (1, 'toggle', 'ON', 'success'),
  (2, 'toggle', 'OFF', 'success');

