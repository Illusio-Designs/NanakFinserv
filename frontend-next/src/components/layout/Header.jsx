"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Menu, Search, Bell, LogOut, ChevronDown } from "lucide-react";

export default function Header({ onMenu }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  let user = {};
  try {
    user = JSON.parse(Cookies.get("user") || "{}");
  } catch {
    user = {};
  }

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-[var(--header-h)] items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur">
      <button className="press rounded-md p-2 text-muted hover:bg-subtle lg:hidden" onClick={onMenu}>
        <Menu size={20} />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input placeholder="Search anything…" className="ui-control pl-9" />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button className="press relative rounded-md p-2 text-muted hover:bg-subtle">
          <Bell size={19} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="press flex items-center gap-2 rounded-md p-1.5 pr-2 hover:bg-subtle"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-[13px] font-semibold text-white">
              {(user.name || user.username || "U").charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-[13px] font-medium sm:block">{user.name || user.username || "User"}</span>
            <ChevronDown size={15} className="text-muted" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 animate-scale-in rounded-lg border border-line bg-surface p-1 shadow-pop">
              <div className="px-3 py-2 text-[12px] text-muted">{user.mobileNumber || ""}</div>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-danger hover:bg-red-50"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
