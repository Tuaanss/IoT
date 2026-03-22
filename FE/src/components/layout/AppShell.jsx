import React from "react";
import { Database, History, LayoutDashboard, User } from "lucide-react";
import NavItem from "../NavItem";

const PAGE_TITLES = {
  dashboard: "Overview",
  sensors: "Sensor Data",
  history: "Action History",
  profile: "Profile",
};

export default function AppShell({ page, setPage, children }) {
  return (
    <div className="appShell">
      <div className="sidebar">
        <div className="brand">SmartHome</div>

        <div className="nav">
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            id="dashboard"
            page={page}
            setPage={setPage}
          />
          <NavItem
            icon={<Database size={18} />}
            label="Sensors Data"
            id="sensors"
            page={page}
            setPage={setPage}
          />
          <NavItem
            icon={<History size={18} />}
            label="Action History"
            id="history"
            page={page}
            setPage={setPage}
          />
          <NavItem
            icon={<User size={18} />}
            label="Profile"
            id="profile"
            page={page}
            setPage={setPage}
          />
        </div>
      </div>

      <div className="content">
        <div className="pageTitle">
          <h2>{PAGE_TITLES[page] ?? ""}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
