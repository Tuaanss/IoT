import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { splitDateTimeForDisplay } from "../utils/splitDateTime";

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

  const hasActiveFilters =
    type !== "all" || valueQuery.trim() || date || timeFrom || timeTo;

  return (
    <div className="panel sensorsPanel">
      <div className="panelInner">
        <div className="sensorsToolbar">
          <div className="sensorsToolbarTitle">
            <Filter size={18} className="sensorsToolbarIcon" aria-hidden />
            <div className="toolbarTitle">Sensors list</div>
          </div>

          <div className="sensorsFilterRow">
            <div className="sensorsFilterField">
              <label htmlFor="sensor-type">Sensor</label>
              <select
                id="sensor-type"
                className="select sensorsSelect"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="temp">Temperature</option>
                <option value="humidity">Humidity</option>
                <option value="light">Light</option>
              </select>
            </div>

            <div className="sensorsFilterField sensorsFilterFieldGrow">
              <label htmlFor="sensor-search">Value</label>
              <input
                id="sensor-search"
                className="input sensorsInput"
                value={valueQuery}
                placeholder="Search in value column…"
                onChange={(e) => {
                  setValueQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="sensorsFilterField">
              <label htmlFor="sensor-date">Date</label>
              <input
                id="sensor-date"
                className="input sensorsInput"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="sensorsFilterField sensorsFilterTimeBlock">
              <span className="sensorsFilterFieldLabel" id="time-range-label">
                Time of day
              </span>
              <div className="sensorsTimeRange" role="group" aria-labelledby="time-range-label">
                <div className="sensorsTimePair">
                  <label htmlFor="time-from">From</label>
                  <input
                    id="time-from"
                    className="input sensorsInput sensorsInputTime"
                    type="time"
                    value={timeFrom}
                    onChange={(e) => {
                      setTimeFrom(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <span className="sensorsTimeSep" aria-hidden>
                  —
                </span>
                <div className="sensorsTimePair">
                  <label htmlFor="time-to">To</label>
                  <input
                    id="time-to"
                    className="input sensorsInput sensorsInputTime"
                    type="time"
                    value={timeTo}
                    onChange={(e) => {
                      setTimeTo(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="sensorsFilterActions">
              <button
                className="sensorsClearBtn"
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                title="Clear filters"
              >
                <X size={16} />
                Clear filters
              </button>
            </div>
          </div>
        </div>

        <div className="sensorsTableWrap">
          <table className="table sensorsTable">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Sensor name</th>
                <th style={{ width: 160 }}>Value</th>
                <th style={{ width: 120 }}>Date</th>
                <th style={{ width: 110 }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => {
                const { date, time } = splitDateTimeForDisplay(r.time);
                return (
                <tr key={r.id}>
                  <td className="rowMuted">{r.id}</td>
                  <td
                    className="sensorsNameCell"
                    data-type={r.type}
                    style={{
                      color:
                        r.type === "humidity"
                          ? "var(--blue)"
                          : r.type === "light"
                            ? "var(--yellow)"
                            : "var(--red)",
                    }}
                  >
                    {r.name}
                  </td>
                  <td className="sensorsValueCell">{r.value}</td>
                  <td className="rowMuted sensorsTimeCell">{date}</td>
                  <td className="rowMuted sensorsTimeCell">{time}</td>
                </tr>
                );
              })}
              {!pageRows.length && (
                <tr>
                  <td colSpan={5} className="sensorsEmpty">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
