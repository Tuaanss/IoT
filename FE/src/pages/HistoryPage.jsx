import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * Chuẩn hóa hiển thị (kể cả bản ghi cũ).
 * Status: WAITING | ACK | TIMEOUT (bản ghi cũ có "OK" → hiển thị ACK)
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
    status: rawS === "ACK" || rawS === "OK" ? "ACK" : rawS || "-",
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
  const [filterCmd, setFilterCmd] = useState("all");
  const [filterState, setFilterState] = useState("all");
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
    if (filterCmd !== "all") {
      r = r.filter((x) => `${x.action}`.toLowerCase() === filterCmd);
    }
    if (filterState !== "all") {
      r = r.filter((x) => `${x.status}`.toLowerCase() === filterState);
    }
    if (sort === "oldest") r = [...r].reverse();
    return r;
  }, [history, q, filterCmd, filterState, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="panel">
      <div className="panelInner">
        <div className="toolbar">
          <div className="toolbarLeft">
            <input
              className="input inputCompact"
              placeholder="Search device name"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
            <button
              className="pageBtn"
              title="Clear search"
              type="button"
              onClick={() => {
                setQ("");
                setPage(1);
              }}
              disabled={!q}
            >
              <X size={14} />
            </button>
          </div>

          <div className="toolbarRight">
            <select
              className="select"
              value={filterCmd}
              onChange={(e) => {
                setFilterCmd(e.target.value);
                setPage(1);
              }}
              title="Lệnh (ON/OFF)"
            >
              <option value="all">All commands</option>
              <option value="on">ON</option>
              <option value="off">OFF</option>
            </select>

            <select
              className="select"
              value={filterState}
              onChange={(e) => {
                setFilterState(e.target.value);
                setPage(1);
              }}
              title="Trạng thái xử lý"
            >
              <option value="all">All states</option>
              <option value="waiting">WAITING</option>
              <option value="ack">ACK</option>
              <option value="timeout">TIMEOUT</option>
            </select>

            <select
              className="select"
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
        </div>

        <div style={{ marginBottom: 10 }}>
          <span className="pill pillActive">Action = ON/OFF · Status = WAITING → ACK / TIMEOUT</span>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>ID</th>
              <th>Name / Device</th>
              <th style={{ width: 120 }}>Action</th>
              <th style={{ width: 120 }}>Status</th>
              <th style={{ width: 220 }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((h) => (
              <tr key={`${h.id}-${h.time}`}>
                <td className="rowMuted">{h.id}</td>
                <td>{h.name}</td>
                <td className={actionCellClass(h.action)}>{h.action}</td>
                <td className={statusCellClass(h.status)}>{h.status}</td>
                <td className="rowMuted">{h.time}</td>
              </tr>
            ))}
            {!pageRows.length && (
              <tr>
                <td colSpan={5} className="rowMuted" style={{ padding: 16 }}>
                  No actions
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
