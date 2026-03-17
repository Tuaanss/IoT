import React from "react";

export default function NavItem({ icon, label, id, page, setPage }) {
  return (
    <div
      onClick={() => setPage(id)}
      className={`navItem ${page === id ? "navItemActive" : ""}`}
    >
      {icon}
      {label}
    </div>
  );
}


