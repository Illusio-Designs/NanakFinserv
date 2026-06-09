"use client";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import api from "@/lib/api";
import { SearchProvider } from "@/lib/search";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [verticals, setVerticals] = useState(null); // null = unknown (show all)

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
    // Hydrate from cache first so the sidebar renders the correct items instantly
    // (no flash of all-items-then-filtered); then refresh from the API.
    try {
      const cached = localStorage.getItem("verticals");
      if (cached) setVerticals(JSON.parse(cached));
    } catch {}
    api
      .get("/admin/settings/verticals")
      .then((res) => {
        const v = res.data?.verticals || {};
        setVerticals(v);
        try { localStorage.setItem("verticals", JSON.stringify(v)); } catch {}
      })
      .catch(() => setVerticals((prev) => prev || {}));
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
      <SearchProvider>
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header onMenu={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
          <Footer />
        </div>
      </SearchProvider>
    </div>
  );
}
