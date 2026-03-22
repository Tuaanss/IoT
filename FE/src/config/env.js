/**
 * API base:
 * - Dev (empty): use `/api` → Vite proxy to backend (vite.config.js).
 * - Production: set VITE_API_URL=http://your-server:4000 (no trailing /api).
 */
const raw = import.meta.env.VITE_API_URL;

export const API_BASE = raw
  ? `${String(raw).replace(/\/$/, "")}/api`
  : "/api";
