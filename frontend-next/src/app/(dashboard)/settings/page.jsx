"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import Switch from "@/components/ui/Switch";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
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

  // Data-wipe
  const [wipeOpen, setWipeOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [wiping, setWiping] = useState(false);

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
    const prev = v;
    const next = { ...v, [key]: !v[key] };
    setV(next);
    setBusy(key);
    try {
      const res = await api.put("/admin/settings/verticals", { [key]: next[key] });
      if (res.data?.verticals) setV(res.data.verticals);
      toast.success(`${key} ${next[key] ? "enabled" : "disabled"}`);
    } catch (e) {
      setV(prev);
      showError(e, "Could not update");
    } finally {
      setBusy("");
    }
  };

  const doWipe = async () => {
    if (confirm !== "WIPE") return;
    setWiping(true);
    try {
      const res = await api.post("/admin/data/wipe", { confirm: "WIPE" });
      if (res.data?.status) {
        toast.success("Data wiped successfully");
        setWipeOpen(false);
        setConfirm("");
      } else {
        toast.error(res.data?.message || "Could not wipe data");
      }
    } catch (e) {
      showError(e, "Could not wipe data");
    } finally {
      setWiping(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Module availability & maintenance" />

      <div className="max-w-xl space-y-6">
        {/* Vertical availability */}
        <Card>
          <h3 className="text-[15px] font-semibold">Vertical availability</h3>
          <p className="mb-4 mt-1 text-[13px] text-muted">
            Turn a module on or off. When a module is off it's hidden across the app.
          </p>
          {!v ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}</div>
          ) : (
            <div className="space-y-1">
              {TOGGLES.map((t) => (
                <div key={t.key} className="flex items-center justify-between border-b border-line py-3 last:border-0">
                  <span className="text-[14px] font-medium">{t.label}</span>
                  <Switch checked={!!v[t.key]} disabled={busy === t.key} onChange={() => toggle(t.key)} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Danger zone */}
        <Card className="border-danger/40">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-danger">
            <AlertTriangle size={17} /> Danger zone — Data wipe-out
          </h3>
          <p className="mb-4 mt-1 text-[13px] text-muted">
            Permanently deletes <strong>all business data and all consumers</strong> — loans, policies,
            companies, products, documents, and every consumer account. <strong>Back-office users are kept</strong>
            (Super Admin, vertical managers, builder, building manager), along with seeded reference data
            (roles, categories, KYC document types). This cannot be undone.
          </p>
          <Button variant="danger" onClick={() => setWipeOpen(true)}>Wipe all data</Button>
        </Card>
      </div>

      <Modal
        open={wipeOpen}
        onClose={() => setWipeOpen(false)}
        title="Confirm data wipe"
        subtitle="Deletes all business data + all consumers. Back-office users are kept."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setWipeOpen(false)}>Cancel</Button>
            <Button variant="danger" disabled={confirm !== "WIPE"} loading={wiping} onClick={doWipe}>Permanently wipe</Button>
          </div>
        }
      >
        <p className="mb-3 text-[14px] text-muted">
          Type <strong className="text-ink">WIPE</strong> to confirm.
        </p>
        <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type WIPE" />
      </Modal>
    </div>
  );
}
