# IoT Smart Home

Ứng dụng fullstack: **React (Vite)** + **Node (Express)** + **MySQL** + **MQTT** + firmware **ESP8266**.

## Cấu trúc thư mục

| Thư mục | Nội dung |
|---------|----------|
| **`FE/`** | Giao diện web (Vite + React) |
| **`BE/`** | API REST, kết nối MySQL & MQTT |
| **`DB/`** | Script SQL (`schema.sql`) |
| **`ESP/`** | Sketch Arduino / firmware |

### Frontend (`FE/src`)

- `config/` — biến môi trường (base URL API)
- `services/` — gọi HTTP tới backend
- `pages/` — các màn hình (Dashboard, Sensors, History, Profile)
- `components/` — UI tái sử dụng (Toggle, Nav, layout)
- `constants/` — theme / màu dùng chung

### Backend (`BE/`)

- `server.js` — entry, `listen`
- `app.js` — Express + middleware
- `config.js` — `.env`
- `routes/` — REST theo tài nguyên
- `mqtt/` — client MQTT + state
- `db/` — pool MySQL
- `lib/` — helper (device, sensor map)

## Chạy nhanh

Cài dependency (lần đầu):

```bash
npm run install:all
```

**Terminal 1 — Backend** (cần XAMPP MySQL + broker MQTT, `.env` trong `BE/`):

```bash
npm run dev:be
```

**Terminal 2 — Frontend:**

```bash
npm run dev:fe
```

Mở trình duyệt theo URL Vite (thường `http://localhost:5173`). API được proxy `/api` → `http://localhost:4000`.

## Biến môi trường

- **`BE/.env`** — xem `BE/.env.example` (DB, MQTT, `ROOM_ID`, topic).
- **`FE/.env`** — copy từ `FE/.env.example`; `VITE_API_URL` chỉ cần khi build production trỏ tới server thật.

## Database

Import `DB/schema.sql` trong phpMyAdmin (đã có `CREATE DATABASE` + `USE`).
