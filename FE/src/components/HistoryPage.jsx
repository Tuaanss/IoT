import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function HistoryPage({ history }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let r = history.map((h) => {
      const name = h.device || h.device_name || h.name || "Unknown device";
      const action = h.action || h.status || "";
      const statusVal = h.status || h.action || "";
      const time = h.time || h.created_at || h.updated_at || "";

      return {
        ...h,
        name,
        action,
        status: statusVal,
        time,
      };
    });

    if (qq) r = r.filter((x) => `${x.name}`.toLowerCase().includes(qq));
    if (status !== "all") r = r.filter((x) => `${x.status}`.toLowerCase() === status);
    if (sort === "oldest") r = [...r].reverse();
    return r;
  }, [history, q, status, sort]);

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
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All</option>
              <option value="on">ON</option>
              <option value="off">OFF</option>
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
          <span className="pill pillActive">All actions</span>
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
                <td className={h.action === "ON" ? "tagOn" : "tagOff"}>{h.action}</td>
                <td className={h.status === "ON" ? "tagOn" : "tagOff"}>{h.status}</td>
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


