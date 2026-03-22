/**
 * API gốc:
 * - Dev (trống): dùng `/api` → Vite proxy tới BE (vite.config.js).
 * - Production: đặt VITE_API_URL=http://your-server:4000 (không có /api ở cuối).
 */
const raw = import.meta.env.VITE_API_URL;

export const API_BASE = raw
  ? `${String(raw).replace(/\/$/, "")}/api`
  : "/api";
