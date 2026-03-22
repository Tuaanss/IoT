/**
 * Split a timestamp into date + clock time for table display (local timezone).
 * Matches date filter (YYYY-MM-DD) and time-of-day filter behavior in the app.
 */
export function splitDateTimeForDisplay(value) {
  const raw = value == null ? "" : String(value).trim();
  if (!raw) return { date: "—", time: "—" };
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) {
    return { date: "—", time: raw };
  }
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  const date = `${y}-${m}-${d}`;
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  const ss = String(dt.getSeconds()).padStart(2, "0");
  const time = `${hh}:${mm}:${ss}`;
  return { date, time };
}
