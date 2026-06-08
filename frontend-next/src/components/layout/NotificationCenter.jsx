"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/cn";

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const loadCount = async () => {
    try {
      const res = await api.get("/user/notifications/count");
      setUnread(res.data?.data?.unread || 0);
    } catch {}
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/notifications", { params: { limit: 12 } });
      setItems(res.data?.data?.notifications || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCount();
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  const markRead = async (id) => {
    try {
      await api.put(`/user/notifications/${id}/read`);
      setItems((list) => list.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {}
  };

  const markAll = async () => {
    try {
      await api.put("/user/notifications/read-all");
      setItems((list) => list.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="press relative rounded-md p-2 text-muted hover:bg-subtle">
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 animate-scale-in overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-[14px] font-semibold">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-[12px] text-brand-600 hover:underline">
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-auto">
            {loading ? (
              <div className="space-y-2 p-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}</div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-muted">No notifications</p>
            ) : (
              items.map((n) => (
                <div key={n.id} className={cn("flex items-start gap-2 border-b border-line px-4 py-3 last:border-0", !n.is_read && "bg-brand-50/40")}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-ink">{n.title}</div>
                    {n.message && <div className="truncate text-[12px] text-muted">{n.message}</div>}
                    <div className="mt-0.5 text-[11px] text-muted/70">{(n.created_at || "").slice(0, 16).replace("T", " ")}</div>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)} title="Mark read" className="press rounded p-1 text-muted hover:text-brand-600">
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
