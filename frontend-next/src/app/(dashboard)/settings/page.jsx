"use client";
import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

const TOGGLES = [
  { key: "loan", label: "Loan" },
  { key: "vehicle", label: "Vehicle Insurance" },
  { key: "mediclaim", label: "Mediclaim" },
  { key: "life", label: "Life Insurance" },
  { key: "builder", label: "Builder" },
];

export default function SettingsPage() {
  const [v, setV] = useState({ loan: true, vehicle: true, mediclaim: true, life: true, builder: true });
  return (
    <div>
      <PageHeader title="Settings" subtitle="Enable or disable verticals" />
      <Card className="max-w-xl">
        <h3 className="mb-4 text-[15px] font-semibold">Vertical visibility</h3>
        <div className="space-y-3">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center justify-between rounded-md border border-line px-4 py-3">
              <span className="text-[14px] font-medium">{t.label}</span>
              <button
                onClick={() => setV((s) => ({ ...s, [t.key]: !s[t.key] }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${v[t.key] ? "bg-brand-600" : "bg-line"}`}
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
        <p className="mt-4 text-[12px] text-muted">Wire these to GET/PUT /admin/settings/verticals (see PLAN.md).</p>
      </Card>
    </div>
  );
}
