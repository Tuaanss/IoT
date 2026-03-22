# ESP8266 firmware

Sketch Arduino (DHT11, LDR, LED/Fan/Light/Projector, MQTT).

- **`LDR_USE_ANALOG`**: `1` = quang trở (mạch phân áp) nối **A0** (ADC 0–1023); `0` = chân **DO** module 3 dây nối **D1** (digital → 0/1023).
- Mở thư mục này trong **Arduino IDE** (hoặc PlatformIO nếu bạn chuyển đổi).
- Cấu hình WiFi, MQTT broker (cùng LAN với backend), topic khớp `BE/.env` / `config.js`.
