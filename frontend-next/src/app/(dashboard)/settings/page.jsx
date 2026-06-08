"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import api, { showError } from "@/lib/api";

const TOGGLES = [
  { key: "loan", label: "Loan" },
  { key: "vehicle", label: "Vehicle Insurance" },
  { key: "mediclaim", label: "Mediclaim" },
  { key: "life", label: "Life Insurance" },
  { key: "builder", label: "Builder" },
];

export default function SettingsPage() {
  const [v, setV] = useState(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/settings/verticals");
        setV(res.data?.verticals || {});
      } catch (e) {
        showError(e, "Could not load settings");
        setV({});
      }
    })();
  }, []);

  const toggle = async (key) => {
    const next = { ...v, [key]: !v[key] };
    setV(next);
    setBusy(key);
    try {
      const res = await api.put("/admin/settings/verticals", { [key]: next[key] });
      if (res.data?.verticals) setV(res.data.verticals);
      toast.success(`${key} ${next[key] ? "enabled" : "disabled"}`);
    } catch (e) {
      setV(v); // revert
      showError(e, "Could not update");
    } finally {
      setBusy("");
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Enable or disable verticals" />
      <Card className="max-w-xl">
        <h3 className="mb-4 text-[15px] font-semibold">Vertical visibility</h3>
        {!v ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}</div>
        ) : (
          <div className="space-y-3">
            {TOGGLES.map((t) => (
              <div key={t.key} className="flex items-center justify-between rounded-md border border-line px-4 py-3">
                <span className="text-[14px] font-medium">{t.label}</span>
                <button
                  disabled={busy === t.key}
                  onClick={() => toggle(t.key)}
                  className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-60 ${v[t.key] ? "bg-brand-600" : "bg-line"}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      v[t.key] ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
