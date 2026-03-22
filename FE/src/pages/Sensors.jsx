import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function Sensors({ rows }) {
  const [type, setType] = useState("all");
  const [valueQuery, setValueQuery] = useState("");
  const [date, setDate] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const q = valueQuery.trim().toLowerCase();
    return rows
      .filter((r) => (type === "all" ? true : r.type === type))
      .filter((r) => (!q ? true : `${r.value}`.toLowerCase().includes(q)))
      .filter((r) => {
        if (!date) return true;
        return `${r.time}`.includes(date);
      })
      .filter((r) => {
        if (!timeFrom && !timeTo) return true;
        const dt = new Date(r.time);
        if (Number.isNaN(dt.getTime())) return true;
        const hhmmss = dt.toTimeString().slice(0, 8);
        if (timeFrom && hhmmss < `${timeFrom}:00`) return false;
        if (timeTo && hhmmss > `${timeTo}:59`) return false;
        return true;
      });
  }, [rows, type, valueQuery, date, timeFrom, timeTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const clearFilters = () => {
    setType("all");
    setValueQuery("");
    setDate("");
    setTimeFrom("");
    setTimeTo("");
    setPage(1);
  };

  return (
    <div className="panel">
      <div className="panelInner">
        <div className="toolbarColumn">
          <div className="toolbarHeader">
            <div className="toolbarTitle">Sensors list</div>
          </div>

          <div className="toolbarFilters">
            <select
              className="select"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All sensors</option>
              <option value="temp">Temperature</option>
              <option value="humidity">Humidity</option>
              <option value="light">Light</option>
            </select>

            <input
              className="input inputCompact"
              value={valueQuery}
              placeholder="Search value (e.g 27.5 °C)"
              onChange={(e) => {
                setValueQuery(e.target.value);
                setPage(1);
              }}
            />

            <input
              className="input inputCompact"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
            />

            <input
              className="input inputCompact"
              type="time"
              value={timeFrom}
              onChange={(e) => {
                setTimeFrom(e.target.value);
                setPage(1);
              }}
            />

            <input
              className="input inputCompact"
              type="time"
              value={timeTo}
              onChange={(e) => {
                setTimeTo(e.target.value);
                setPage(1);
              }}
            />

            <button className="pageBtn" title="Clear filters" type="button" onClick={clearFilters}>
              <X size={14} />
            </button>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Sensor Name</th>
              <th style={{ width: 160 }}>Value</th>
              <th style={{ width: 220 }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id}>
                <td className="rowMuted">{r.id}</td>
                <td
                  style={{
                    color:
                      r.type === "humidity"
                        ? "var(--blue)"
                        : r.type === "light"
                          ? "var(--yellow)"
                          : "var(--red)",
                    fontWeight: 800,
                  }}
                >
                  {r.name}
                </td>
                <td>{r.value}</td>
                <td className="rowMuted">{r.time}</td>
              </tr>
            ))}
            {!pageRows.length && (
              <tr>
                <td colSpan={4} className="rowMuted" style={{ padding: 16 }}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="pagination">
          <button
            className="pageBtn"
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} />
          </button>
          <div>
            Page {safePage} of {totalPages}
          </div>
          <button
            className="pageBtn"
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
