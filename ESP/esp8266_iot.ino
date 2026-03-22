/*
  ESP8266 + DHT11 + LDR + 3 LED devices

  - Publishes sensors to MQTT topic: data_sensor
  - Subscribes to MQTT topic: device_control (JSON commands)
  - Publishes device state to: device_status

  Expected command payload (JSON):
    {"room_id":"401","device":"Fan","status":"ON"}
*/
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ===== THÔNG TIN KẾT NỐI =====
const char* SSID = "P204 36";
const char* PASS = "phong2044@";

// Use the broker IP reachable from the room WiFi.
// Your BE already connected to: 192.168.24.18:1401
const char* MQTT_HOST = "192.168.24.18";
const int   MQTT_PORT = 1401;
const char* MQTT_USER = "leviettuan";
const char* MQTT_PASS = "12345678";

// ===== TOPICS =====
const char* T_SET    = "device_control";
const char* T_STATUS = "device_status";
const char* T_SENSOR = "data_sensor";

const char* ROOM_ID = "401";

// ===== CẤU HÌNH CHÂN CẮM =====
#define DHT_PIN 4       // D2
#define DHTTYPE DHT11
// LDR module is 3-pin (VCC/GND/DO), DO is wired to D1 (GPIO5)
#define LDR_DO_PIN 5    // D1 (GPIO5)
// If your module outputs LOW when bright, set this to 1 to invert
#define LDR_DO_INVERT 0

// 3 LED biểu thị 3 thiết bị (Fan / Light / Projector)
#define LED_FAN 14      // D5
#define LED_LIGHT 12    // D6
#define LED_PROJECTOR 13 // D7

#define LED_ON  HIGH
#define LED_OFF LOW

WiFiClient espClient;
PubSubClient mqtt(espClient);
DHT dht(DHT_PIN, DHTTYPE);

bool stFan = false;
bool stLight = false;
bool stProjector = false;

unsigned long lastSensorMs = 0;
const unsigned long SENSOR_INTERVAL_MS = 2000;

static void setLed(uint8_t pin, bool on) {
  digitalWrite(pin, on ? LED_ON : LED_OFF);
}

static void publishDeviceStatus() {
  StaticJsonDocument<192> doc;
  doc["room_id"] = ROOM_ID;
  doc["fan"] = stFan;
  doc["light"] = stLight;
  doc["projector"] = stProjector;
  doc["ts"] = (unsigned long)millis();

  char out[192];
  const size_t n = serializeJson(doc, out, sizeof(out));
  mqtt.publish(T_STATUS, out, n);
}

static void handleDeviceCommand(const char* device, const char* status) {
  if (!device || !status) return;
  const bool on = (strcmp(status, "ON") == 0);

  if (strcmp(device, "Fan") == 0) {
    stFan = on;
    setLed(LED_FAN, stFan);
  } else if (strcmp(device, "Light") == 0) {
    stLight = on;
    setLed(LED_LIGHT, stLight);
  } else if (strcmp(device, "Projector") == 0) {
    stProjector = on;
    setLed(LED_PROJECTOR, stProjector);
  }

  publishDeviceStatus();
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Debug: show every MQTT message received
  Serial.print("MQTT rx topic=");
  Serial.print(topic);
  Serial.print(" len=");
  Serial.println(length);

  if (strcmp(topic, T_SET) != 0) return;

  // payload is not null-terminated; copy to buffer
  static char buf[256];
  const unsigned int n = (length < (sizeof(buf) - 1)) ? length : (sizeof(buf) - 1);
  memcpy(buf, payload, n);
  buf[n] = '\0';
  Serial.print("MQTT rx payload=");
  Serial.println(buf);

  StaticJsonDocument<256> doc;
  const DeserializationError err = deserializeJson(doc, buf);
  if (err) {
    Serial.print("JSON parse error: ");
    Serial.println(err.c_str());
    return;
  }

  const char* room = doc["room_id"].as<const char*>();
  if (!room) room = "";
  if (strlen(room) && strcmp(room, ROOM_ID) != 0) {
    Serial.println("Ignore cmd: room_id mismatch");
    return;
  }

  const char* device = doc["device"].as<const char*>();
  const char* status = doc["status"].as<const char*>();
  if (!device || !status) {
    Serial.println("Ignore cmd: missing device/status");
    return;
  }

  handleDeviceCommand(device, status);
}

static void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.mode(WIFI_STA);
  WiFi.setSleepMode(WIFI_NONE_SLEEP);
  WiFi.begin(SSID, PASS);

  Serial.print("WiFi connecting to ");
  Serial.println(SSID);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
    if (millis() - start > 20000) {
      Serial.println();
      Serial.println("WiFi connect timeout (20s).");
      Serial.print("WiFi status: ");
      Serial.println((int)WiFi.status());
      WiFi.disconnect();
      delay(500);
      WiFi.begin(SSID, PASS);
      start = millis();
    }
  }
  Serial.println();
  Serial.print("WiFi connected. IP=");
  Serial.print(WiFi.localIP());
  Serial.print(" RSSI=");
  Serial.println(WiFi.RSSI());
}

static void ensureMqtt() {
  while (!mqtt.connected()) {
    String clientId = String("esp8266-") + ROOM_ID + "-" + String(ESP.getChipId(), HEX);
    bool ok;
    if (String(MQTT_USER).length()) {
      ok = mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS);
    } else {
      ok = mqtt.connect(clientId.c_str());
    }
    if (ok) {
      Serial.print("MQTT connected. Broker=");
      Serial.print(MQTT_HOST);
      Serial.print(":");
      Serial.println(MQTT_PORT);
      const bool subOk = mqtt.subscribe(T_SET);
      Serial.print("MQTT subscribe ");
      Serial.print(T_SET);
      Serial.print(" => ");
      Serial.println(subOk ? "OK" : "FAIL");
      publishDeviceStatus();
    } else {
      Serial.print("MQTT connect failed, state=");
      Serial.println(mqtt.state());
      delay(1000);
    }
  }
}

static void publishSensors() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  // Digital LDR: map to 0/1023 so the web chart still works
  int raw = digitalRead(LDR_DO_PIN); // HIGH/LOW
  if (LDR_DO_INVERT) raw = !raw;
  const int ldr = raw ? 1023 : 0;

  // Always publish LDR analog; temp/hum only if DHT reads OK.
  StaticJsonDocument<224> doc;
  doc["room_id"] = ROOM_ID;
  doc["light"] = ldr;
  doc["ts"] = (unsigned long)millis();

  if (!isnan(t)) doc["temp"] = t;
  if (!isnan(h)) doc["hum"] = h;

  char out[224];
  const size_t n = serializeJson(doc, out, sizeof(out));
  mqtt.publish(T_SENSOR, out, n);

  // Debug to Serial so you can verify ADC is working
  Serial.print("LDR(DO@D1) raw=");
  Serial.print(raw);
  Serial.print(" light=");
  Serial.print(ldr);
  if (!isnan(t)) {
    Serial.print(" temp=");
    Serial.print(t);
  }
  if (!isnan(h)) {
    Serial.print(" hum=");
    Serial.print(h);
  }
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  delay(50);
  Serial.println();
  Serial.println("ESP8266 booting...");
  Serial.print("Room ID: ");
  Serial.println(ROOM_ID);

  pinMode(LED_FAN, OUTPUT);
  pinMode(LED_LIGHT, OUTPUT);
  pinMode(LED_PROJECTOR, OUTPUT);
  pinMode(LDR_DO_PIN, INPUT);
  setLed(LED_FAN, stFan);
  setLed(LED_LIGHT, stLight);
  setLed(LED_PROJECTOR, stProjector);

  dht.begin();

  ensureWiFi();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(mqttCallback);
}

void loop() {
  ensureWiFi();
  ensureMqtt();
  mqtt.loop();

  const unsigned long now = millis();
  if (now - lastSensorMs >= SENSOR_INTERVAL_MS) {
    lastSensorMs = now;
    publishSensors();
  }
}

