"use client";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import api from "@/lib/api";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [verticals, setVerticals] = useState(null); // null = unknown (show all)

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
    api
      .get("/admin/settings/verticals")
      .then((res) => setVerticals(res.data?.verticals || {}))
      .catch(() => setVerticals({}));
  }, []);

  const toggleCollapse = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-subtle">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        verticals={verticals}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
