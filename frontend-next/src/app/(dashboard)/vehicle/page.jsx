"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, RefreshCw, FilePlus, XCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import Spinner from "@/components/ui/Spinner";
import FileTypeIcon from "@/components/ui/FileTypeIcon";
import api, { showError, fileUrl } from "@/lib/api";
import { fmtDate, daysUntil, expiryCountdown } from "@/lib/format";
import VehicleFormModal from "./VehicleFormModal";

// Status of a vehicle's CURRENT policy. Only a manual "closed" counts as Closed;
// everything else is derived from the expiry so a not-yet-reconciled or legacy
// "completed" still reads as Overdue (lapsed) or Running — never wrongly Closed.
// (A vehicle is Closed only when the user explicitly closes it.)
const STATUS_TONE = { Running: "success", Overdue: "danger", Closed: "neutral" };
const currentStatus = (r) => {
  const raw = String(r.rawStatus || "").toLowerCase();
  let label;
  if (raw === "closed") label = "Closed";              // manual close (sticky)
  else if (raw === "running" || raw === "active") label = "Running";
  else if (raw === "overdue") label = "Overdue";
  else {                                                // completed / empty / legacy → derive
    const n = daysUntil(r.expiry_date);
    label = n !== null && n < 0 ? "Overdue" : "Running";
  }
  return { label, tone: STATUS_TONE[label] || "neutral" };
};

const period = (p) => {
  const f = p.PolicyFrom, to = p.PolicyTo || p.ExpiryDate;
  if (!f && !to) return "—";
  return `${f ? fmtDate(f) : "—"} → ${to ? fmtDate(to) : "—"}`;
};
const policyYear = (p) => { const d = p.PolicyFrom || p.PolicyTo || p.ExpiryDate || ""; return d ? String(d).slice(0, 4) : "—"; };
// Friendly status: Running while active, else Closed.
const statusLabel = (s) => {
  const x = String(s || "").toLowerCase();
  if (x === "running" || x === "active") return "Running";
  if (x === "completed" || x === "closed" || x === "expired") return "Closed";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
};
const statusTone = (s) => (statusLabel(s) === "Running" ? "success" : "warning");

const norm = (r) => {
  const u = r.user_pk_vehicle_id || {};
  const rp = r.runningPolicy || {};
  return {
    ...r,
    name: r.Name || r.name || u.username || r.username || "—",
    mobile: r.MobileNumber || u.mobileNumber || r.mobileNumber || "—",
    vehicle_number: r.vehicle_number || r.VehicleNumber || "—",
    makeModel: [r.make, r.model].filter(Boolean).join(" ") || "—",
    ptype: r.vehicle_policy_type || "—",
    company: (rp.CompanyType && rp.CompanyType.company_name) || r.company_name || "—",
    policy_number: rp.PolicyNumber || "—",
    plan: (rp.policyPlan && rp.policyPlan.PolicyPlanType) || r.policy_plan_type || "—",
    rawStatus: rp.status || r.status || "", // raw backend status: running/overdue/completed/closed
    // Friendly label (drives the Status filter) — same rule as the badge so they agree.
    status: currentStatus({ rawStatus: rp.status || r.status || "", expiry_date: rp.od_expiry_date || rp.ExpiryDate || r.expiry_date || "" }).label,
    expiry_date: rp.od_expiry_date || rp.ExpiryDate || r.expiry_date || "",
  };
};

export default function VehiclePage() {
  const [tab, setTab] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [renewRow, setRenewRow] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [renewingId, setRenewingId] = useState(null);
  const [closingId, setClosingId] = useState(null);

  // Load policies once; every tab + its count derives from this.
  const loadAll = async () => {
    setLoading(true);
    try {
      const pRes = await api.post("/user/vehicle/user/list", {});
      const data = pRes.data?.data || pRes.data || [];
      setRows((Array.isArray(data) ? data : []).map(norm));
    } catch (e) { showError(e, "Could not load vehicle policies"); setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadAll(); }, []);

  // Status-based tab buckets (all driven by the backend status).
  const runningRows = useMemo(() => rows.filter((r) => currentStatus(r).label === "Running"), [rows]);
  // Overdue = current policy lapsed, not yet renewed/closed (backend status).
  const overdueRows = useMemo(() => rows.filter((r) => currentStatus(r).label === "Overdue"), [rows]);
  // Closed = renewed/expired history or manually-closed policies.
  const closedRows = useMemo(() => rows.filter((r) => currentStatus(r).label === "Closed"), [rows]);
  // Renewals = UPCOMING renewals only: still Running and expiring within 30 days.
  // Overdue policies live in the Overdue tab; closed ones are excluded entirely.
  const renewals = useMemo(
    () => rows
      .filter((r) => {
        if (currentStatus(r).label !== "Running") return false;
        const n = daysUntil(r.expiry_date);
        return n !== null && n >= 0 && n <= 30;
      })
      .sort((a, b) => String(a.expiry_date || "9999").localeCompare(String(b.expiry_date || "9999"))),
    [rows]
  );
  // Load full detail (running + previous policies) for the view modal.
  const openView = async (r) => {
    setViewId(r.vehicle_user_id);
    setViewData(null);
    try {
      const res = await api.get(`/user/vehicle/user/${r.vehicle_user_id}`);
      setViewData(res.data?.data || {});
    } catch (e) { showError(e, "Could not load policy"); setViewData({}); }
  };

  const renew = async (row) => {
    setRenewingId(row.vehicle_user_id);
    try {
      await api.post("/user/renewVehiclePolicy", { vehicle_user_id: row.vehicle_user_id });
      toast.success("Policy renewed");
      loadAll();
    } catch (e) { showError(e, "Could not renew policy"); }
    finally { setRenewingId(null); }
  };

  // Mark an overdue policy as Closed (consumer won't renew).
  const closePolicy = async (row) => {
    setClosingId(row.vehicle_user_id);
    try {
      await api.post("/user/vehicle/policy/close", { vehicle_user_id: row.vehicle_user_id });
      toast.success("Policy closed");
      loadAll();
    } catch (e) { showError(e, "Could not close policy"); }
    finally { setClosingId(null); }
  };

  const columns = useMemo(() => [
    { key: "name", title: "Owner", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "vehicle_number", title: "Vehicle No." },
    { key: "makeModel", title: "Make / Model" },
    { key: "company", title: "Company" },
    { key: "policy_number", title: "Policy No." },
    {
      key: "expiry_date", title: "Expiry",
      render: (r) => r.expiry_date ? (
        <div>
          <div>{fmtDate(r.expiry_date)}</div>
          <div className="text-[11px] text-muted">{expiryCountdown(r.expiry_date)}</div>
        </div>
      ) : "—",
    },
    { key: "ptype", title: "Type", render: (r) => <Badge tone="brand">{r.ptype}</Badge> },
    { key: "status", title: "Status", render: (r) => { const s = currentStatus(r); return <Badge tone={s.tone}>{s.label}</Badge>; } },
  ], []);

  const renewalColumns = useMemo(() => [
    { key: "name", title: "Owner", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "vehicle_number", title: "Vehicle No." },
    {
      key: "expiry_date", title: "Expiry",
      render: (r) => r.expiry_date ? (
        <div>
          <div>{fmtDate(r.expiry_date)}</div>
          <div className={`text-[11px] ${daysUntil(r.expiry_date) < 0 ? "font-medium text-red-600" : "text-muted"}`}>{expiryCountdown(r.expiry_date)}</div>
        </div>
      ) : "—",
    },
    {
      key: "renew", title: "",
      render: (r) => (
        <Button size="sm" variant="secondary" icon={RefreshCw} loading={renewingId === r.vehicle_user_id} onClick={() => renew(r)}>Renew</Button>
      ),
    },
  ], [renewingId]);

  const overdueColumns = useMemo(() => [
    { key: "name", title: "Owner", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "vehicle_number", title: "Vehicle No." },
    { key: "company", title: "Company" },
    {
      key: "expiry_date", title: "Expiry",
      render: (r) => r.expiry_date ? (
        <div>
          <div>{fmtDate(r.expiry_date)}</div>
          <div className="text-[11px] font-medium text-red-600">{expiryCountdown(r.expiry_date)}</div>
        </div>
      ) : "—",
    },
    { key: "status", title: "Status", render: () => <Badge tone="danger">Overdue</Badge> },
    {
      key: "act", title: "",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" icon={RefreshCw} loading={renewingId === r.vehicle_user_id} onClick={() => renew(r)}>Renew</Button>
          <Button size="sm" variant="ghost" icon={XCircle} loading={closingId === r.vehicle_user_id} onClick={() => closePolicy(r)}>Close</Button>
        </div>
      ),
    },
  ], [renewingId, closingId]);

  return (
    <div>
      <PageHeader title="Vehicle Insurance" subtitle="Vehicle policies & renewals" actions={<Button icon={Plus} onClick={() => setAddOpen(true)}>Add Vehicle Policy</Button>} />

      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[
        { value: "all", label: `All${rows.length ? ` (${rows.length})` : ""}` },
        { value: "running", label: `Running${runningRows.length ? ` (${runningRows.length})` : ""}` },
        { value: "overdue", label: `Overdue${overdueRows.length ? ` (${overdueRows.length})` : ""}` },
        { value: "renewals", label: `Renewals${renewals.length ? ` (${renewals.length})` : ""}` },
        { value: "closed", label: `Closed${closedRows.length ? ` (${closedRows.length})` : ""}` },
      ]} />

      {tab === "all" && (
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          rowKey="vehicle_user_id"
          searchKeys={["name", "mobile", "vehicle_number", "makeModel", "company", "policy_number"]}
          filters={[{ key: "status", label: "Status" }, { key: "ptype", label: "Type" }]}
          onView={openView}
          onEdit={(r) => setEditRow(r)}
          rowActions={[{ icon: FilePlus, title: "Add next policy / renew", onClick: (r) => setRenewRow(r) }]}
        />
      )}

      {tab === "running" && (
        <DataTable
          columns={columns}
          data={runningRows}
          loading={loading}
          rowKey="vehicle_user_id"
          searchKeys={["name", "mobile", "vehicle_number", "makeModel", "company", "policy_number"]}
          filters={[{ key: "ptype", label: "Type" }]}
          onView={openView}
          onEdit={(r) => setEditRow(r)}
          rowActions={[{ icon: FilePlus, title: "Add next policy / renew", onClick: (r) => setRenewRow(r) }]}
        />
      )}

      {tab === "overdue" && (
        <DataTable
          columns={overdueColumns}
          data={overdueRows}
          loading={loading}
          rowKey="vehicle_user_id"
          searchKeys={["name", "mobile", "vehicle_number", "company"]}
          onView={openView}
        />
      )}

      {tab === "renewals" && (
        <DataTable
          columns={renewalColumns}
          data={renewals}
          loading={loading}
          rowKey="vehicle_user_id"
          searchKeys={["name", "mobile", "vehicle_number"]}
          filters={[{ key: "expiry_date", label: "Expiry", type: "dateRange" }]}
          onView={openView}
        />
      )}

      {tab === "closed" && (
        <DataTable
          columns={columns}
          data={closedRows}
          loading={loading}
          rowKey="vehicle_user_id"
          searchKeys={["name", "mobile", "vehicle_number", "company"]}
          onView={openView}
          rowActions={[{ icon: FilePlus, title: "Renew / add next policy", onClick: (r) => setRenewRow(r) }]}
        />
      )}

      <VehicleFormModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={loadAll} />
      <VehicleFormModal open={!!editRow} editRow={editRow} onClose={() => setEditRow(null)} onSaved={loadAll} />
      <VehicleFormModal open={!!renewRow} editRow={renewRow} renewMode onClose={() => setRenewRow(null)} onSaved={loadAll} />

      <Modal open={!!viewId} onClose={() => { setViewId(null); setViewData(null); }} title="Vehicle policy" subtitle={viewData?.vehicle_number} size="lg">
        {!viewData ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <VehicleDetail d={viewData} />
        )}
      </Modal>
    </div>
  );
}

function VehicleDetail({ d }) {
  const u = d.user_pk_vehicle_id || {};
  const rp = d.runningPolicy || {};
  const prev = d.previousPolicies || [];
  return (
    <div className="space-y-5 text-[14px]">
      <Section title="Owner & vehicle">
        <Row label="Owner" value={u.username || d.Name || "—"} />
        <Row label="Mobile" value={u.mobileNumber || "—"} />
        <Row label="Vehicle No." value={d.vehicle_number || "—"} />
        <Row label="Make / Model" value={[d.make, d.model].filter(Boolean).join(" ") || "—"} />
        <Row label="Engine / Chassis" value={[d.engine_number, d.chassis_number].filter(Boolean).join(" / ") || "—"} />
        <Row label="Nature" value={d.vehicle_policy_type || "—"} />
      </Section>
      <Section title="Current policy">
        <Row label="Policy No." value={rp.PolicyNumber || "—"} />
        <Row label="Premium" value={rp.PremiumAmount || "—"} />
        <Row label="Period" value={period(rp)} />
        <Row label="OD / Full expiry" value={(rp.od_expiry_date || rp.ExpiryDate) ? `${fmtDate(rp.od_expiry_date || rp.ExpiryDate)} · ${expiryCountdown(rp.od_expiry_date || rp.ExpiryDate)}` : "—"} />
        <Row label="TP expiry" value={rp.tp_expiry_date ? fmtDate(rp.tp_expiry_date) : "—"} />
        <Row label="Status" value={(() => { const s = currentStatus({ expiry_date: rp.od_expiry_date || rp.ExpiryDate, rawStatus: rp.status }); return <Badge tone={s.tone}>{s.label}</Badge>; })()} />
        {fileUrl(rp.CurrentPolicyFile) && (
          <Row label="Policy PDF" value={
            <span className="flex items-center gap-3">
              <FileTypeIcon file={rp.CurrentPolicyFile} size={14} />
              <a className="text-ink hover:underline" href={fileUrl(rp.CurrentPolicyFile)} target="_blank" rel="noopener noreferrer">View</a>
              <a className="text-brand-600 hover:underline" href={fileUrl(rp.CurrentPolicyFile)} download>Download</a>
            </span>
          } />
        )}
      </Section>
      <div>
        <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">Past journey ({prev.length})</div>
        {prev.length ? (
          (() => {
            const sorted = [...prev].sort((a, b) => String(b.PolicyTo || b.ExpiryDate || "").localeCompare(String(a.PolicyTo || a.ExpiryDate || "")));
            return <div>{sorted.map((p, i) => <JourneyItem key={i} p={p} index={i} isLast={i === sorted.length - 1} />)}</div>;
          })()
        ) : <p className="rounded-lg border border-line p-3 text-[13px] text-muted">No previous policies.</p>}
      </div>
    </div>
  );
}

function JourneyItem({ p, index, isLast }) {
  const [open, setOpen] = useState(false);
  const url = fileUrl(p.CurrentPolicyFile);
  return (
    <div className="flex gap-3">
      {/* timeline rail: dot + connecting line */}
      <div className="flex flex-col items-center pt-3.5">
        <span className="h-3 w-3 shrink-0 rounded-full border-2 border-surface bg-brand-600 ring-2 ring-brand-100" />
        {!isLast && <span className="mt-1 w-px flex-1 bg-line" />}
      </div>
      <div className={`mb-3 min-w-0 flex-1 rounded-lg border border-line ${open ? "bg-subtle/40" : "bg-surface"}`}>
        <div className="flex items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-ink">
              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[12px] font-semibold text-brand-700">{policyYear(p)}</span>
              <span className="truncate">{p.PolicyNumber || `Policy ${index + 1}`}</span>
              <Badge tone={statusTone(p.status)}>{statusLabel(p.status)}</Badge>
            </div>
            <div className="mt-0.5 text-[12px] text-muted">{period(p)}{p.PremiumAmount ? ` · ₹${p.PremiumAmount}` : ""}</div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button onClick={() => setOpen((o) => !o)} className="press rounded-md border border-line px-2.5 py-1 text-[12px] font-medium text-ink hover:bg-subtle">{open ? "Hide" : "View"}</button>
            {url ? (
              <a href={url} download className="press flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-[12px] font-medium text-brand-600 hover:bg-subtle"><FileTypeIcon file={p.CurrentPolicyFile} size={12} />Download</a>
            ) : (
              <span className="rounded-md border border-dashed border-line px-2.5 py-1 text-[12px] text-muted/60">No PDF</span>
            )}
          </div>
        </div>
        {open && (
          <div className="grid grid-cols-1 gap-x-6 border-t border-line p-3 sm:grid-cols-2">
            <Row label="Policy No." value={p.PolicyNumber || "—"} />
            <Row label="Premium" value={p.PremiumAmount ? `₹${p.PremiumAmount}` : "—"} />
            <Row label="NCB" value={p.NCB || "—"} />
            <Row label="IDV" value={p.IDV || "—"} />
            <Row label="Period" value={period(p)} />
            <Row label="OD / Full expiry" value={p.od_expiry_date || p.ExpiryDate || "—"} />
            <Row label="TP expiry" value={p.tp_expiry_date || "—"} />
            <Row label="Nominee" value={p.NomineeName || "—"} />
            {url && <Row label="Policy PDF" value={<a className="text-brand-600 hover:underline" href={url} target="_blank" rel="noopener noreferrer">View PDF</a>} />}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">{title}</div>
      <div className="rounded-lg border border-line p-3">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line py-1.5 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
