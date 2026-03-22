-- Schema matching the diagram you provided
-- Chọn DB trước khi import (tránh lỗi #1046 No database selected)

CREATE DATABASE IF NOT EXISTS iot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iot_db;

CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  device_state VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS action_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(50) NOT NULL,
  device_id VARCHAR(50) NOT NULL,
  action VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action_history_device_id (device_id),
  INDEX idx_action_history_created_at (created_at),
  CONSTRAINT fk_action_history_device
    FOREIGN KEY (device_id) REFERENCES devices(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS sensors (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensor_data (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sensor_id VARCHAR(50) NOT NULL,
  value FLOAT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sensor_data_sensor_id (sensor_id),
  INDEX idx_sensor_data_created_at (created_at),
  CONSTRAINT fk_sensor_data_sensor
    FOREIGN KEY (sensor_id) REFERENCES sensors(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Example seed (optional)
-- INSERT INTO sensors (id, name, topic) VALUES
-- ('temp', 'Temperature', 'data_sensor'),
-- ('humidity', 'Humidity', 'data_sensor'),
-- ('light', 'Light', 'data_sensor');

