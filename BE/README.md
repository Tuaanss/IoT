# Backend API

Express + `mysql2` + `mqtt`.

## Chạy

```bash
npm install
cp .env.example .env   # chỉnh DB + MQTT
npm run dev              # nodemon
# hoặc
npm start
```

Mặc định `PORT=4000`.

## Cấu trúc

| File / thư mục | Vai trò |
|----------------|---------|
| `server.js` | Khởi động HTTP |
| `app.js` | Express, CORS, mount `/api`, init MQTT |
| `config.js` | Đọc `.env` |
| `routes/` | REST: devices, sensors, sensor-data, action-history, device-action, … |
| `mqtt/client.js` | Subscribe/publish topic |
| `mqtt/state.js` | Trạng thái chung (pending ACK, …) |
| `db/pool.js` | Pool MySQL |
| `lib/` | `deviceHelpers`, `sensorMap` |

API prefix: **`/api`** (ví dụ `/api/health`, `/api/devices`).
