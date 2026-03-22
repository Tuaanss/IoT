import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { splitDateTimeForDisplay } from "../utils/splitDateTime";

/**
 * Normalize display (including legacy rows).
 * Status: WAITING | ACK | TIMEOUT (legacy "OK" → ACK)
 */
function normalizeHistoryDisplay(h) {
  const rawA = String(h.action ?? "").toUpperCase();
  const rawS = String(h.status ?? "").toUpperCase();

  if (rawA === "WAITING" && (rawS === "ON" || rawS === "OFF")) {
    return { action: rawS, status: "WAITING" };
  }
  if (rawA === "TIMEOUT") {
    const cmd = rawS === "ON" || rawS === "OFF" ? rawS : "OFF";
    return { action: cmd, status: "TIMEOUT" };
  }
  if (rawA === "REPORT" && (rawS === "ON" || rawS === "OFF")) {
    return { action: rawS, status: "ACK" };
  }
  if (rawS === "REPORT" && (rawA === "ON" || rawA === "OFF")) {
    return { action: rawA, status: "ACK" };
  }
  if ((rawA === "ON" || rawA === "OFF") && rawA === rawS) {
    return { action: rawA, status: "ACK" };
  }
  if (rawS === "ACK") {
    return { action: rawA === "ON" || rawA === "OFF" ? rawA : "-", status: "ACK" };
  }
  if (rawS === "OK") {
    return { action: rawA === "ON" || rawA === "OFF" ? rawA : "-", status: "ACK" };
  }
  return {
    action: rawA || "-",
    status:
      rawS === "SUPERSEDED"
        ? "TIMEOUT"
        : rawS === "ACK" || rawS === "OK"
          ? "ACK"
          : rawS || "-",
  };
}

function actionCellClass(action) {
  if (action === "ON") return "tagOn";
  if (action === "OFF") return "tagOff";
  return "tagState";
}

function statusCellClass(status) {
  switch (status) {
    case "WAITING":
      return "tagWait";
    case "ACK":
      return "tagAck";
    case "TIMEOUT":
      return "tagTimeout";
    default:
      return "tagState";
  }
}

export default function HistoryPage({ history }) {
  const [q, setQ] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [date, setDate] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let r = history.map((h) => {
      const name = h.device || h.device_name || h.name || "Unknown device";
      const time = h.time || h.created_at || h.updated_at || "";
      const { action, status: st } = normalizeHistoryDisplay(h);

      return {
        ...h,
        name,
        action,
        status: st,
        time,
      };
    });

    if (qq) r = r.filter((x) => `${x.name}`.toLowerCase().includes(qq));
    if (filterAction !== "all") {
      r = r.filter((x) => `${x.action}`.toLowerCase() === filterAction);
    }
    if (filterStatus !== "all") {
      r = r.filter((x) => `${x.status}`.toLowerCase() === filterStatus);
    }
    if (date) {
      r = r.filter((x) => `${x.time}`.includes(date));
    }
    if (timeFrom || timeTo) {
      r = r.filter((x) => {
        const dt = new Date(x.time);
        if (Number.isNaN(dt.getTime())) return true;
        const hhmmss = dt.toTimeString().slice(0, 8);
        if (timeFrom && hhmmss < `${timeFrom}:00`) return false;
        if (timeTo && hhmmss > `${timeTo}:59`) return false;
        return true;
      });
    }
    if (sort === "oldest") r = [...r].reverse();
    return r;
  }, [history, q, filterAction, filterStatus, date, timeFrom, timeTo, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const hasActiveFilters =
    Boolean(q.trim()) ||
    filterAction !== "all" ||
    filterStatus !== "all" ||
    Boolean(date) ||
    Boolean(timeFrom) ||
    Boolean(timeTo) ||
    sort !== "newest";

  const clearFilters = () => {
    setQ("");
    setFilterAction("all");
    setFilterStatus("all");
    setDate("");
    setTimeFrom("");
    setTimeTo("");
    setSort("newest");
    setPage(1);
  };

  return (
    <div className="panel sensorsPanel">
      <div className="panelInner">
        <div className="sensorsToolbar">
          <div className="sensorsFilterRow">
            <div className="sensorsFilterField sensorsFilterFieldGrow">
              <label htmlFor="hist-device">Device</label>
              <div className="sensorsInputRow">
                <input
                  id="hist-device"
                  className="input sensorsInput"
                  placeholder="Search device name…"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                />
                <button
                  className="sensorsSquareBtn"
                  title="Clear search"
                  type="button"
                  onClick={() => {
                    setQ("");
                    setPage(1);
                  }}
                  disabled={!q}
                >
                  <X size={16} aria-hidden />
                </button>
              </div>
            </div>

            <div className="sensorsFilterField">
              <label htmlFor="hist-action">Action</label>
              <select
                id="hist-action"
                className="select sensorsSelect"
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value);
                  setPage(1);
                }}
                title="Action (ON/OFF)"
              >
                <option value="all">All actions</option>
                <option value="on">ON</option>
                <option value="off">OFF</option>
              </select>
            </div>

            <div className="sensorsFilterField">
              <label htmlFor="hist-status">Status</label>
              <select
                id="hist-status"
                className="select sensorsSelect"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                title="Status"
              >
                <option value="all">All statuses</option>
                <option value="waiting">WAITING</option>
                <option value="ack">ACK</option>
                <option value="timeout">TIMEOUT</option>
              </select>
            </div>

            <div className="sensorsFilterField">
              <label htmlFor="hist-date">Date</label>
              <input
                id="hist-date"
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
              <span className="sensorsFilterFieldLabel" id="hist-time-range-label">
                Time of day
              </span>
              <div className="sensorsTimeRange" role="group" aria-labelledby="hist-time-range-label">
                <div className="sensorsTimePair">
                  <label htmlFor="hist-time-from">From</label>
                  <input
                    id="hist-time-from"
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
                  <label htmlFor="hist-time-to">To</label>
                  <input
                    id="hist-time-to"
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

            <div className="sensorsFilterField">
              <label htmlFor="hist-sort">Sort</label>
              <select
                id="hist-sort"
                className="select sensorsSelect"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
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
              <th style={{ width: 90 }}>ID</th>
              <th>Name / device</th>
              <th style={{ width: 120 }}>Action</th>
              <th style={{ width: 120 }}>Status</th>
              <th style={{ width: 120 }}>Date</th>
              <th style={{ width: 110 }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((h) => {
              const { date, time } = splitDateTimeForDisplay(h.time);
              return (
              <tr key={`${h.id}-${h.time}`}>
                <td className="rowMuted">{h.id}</td>
                <td>{h.name}</td>
                <td className={actionCellClass(h.action)}>{h.action}</td>
                <td className={statusCellClass(h.status)}>{h.status}</td>
                <td className="rowMuted sensorsTimeCell">{date}</td>
                <td className="rowMuted sensorsTimeCell">{time}</td>
              </tr>
              );
            })}
            {!pageRows.length && (
              <tr>
                <td colSpan={6} className="sensorsEmpty">
                  No actions
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
