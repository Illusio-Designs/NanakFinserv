"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, RefreshCw, FilePlus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import Spinner from "@/components/ui/Spinner";
import api, { showError, BASE_URL } from "@/lib/api";
import { CATEGORY_IDS } from "@/config/ids";
import VehicleFormModal from "./VehicleFormModal";

const fileUrl = (f) => (f ? (String(f).startsWith("http") ? f : `${BASE_URL}/${f}`) : null);
const period = (p) => [p.PolicyFrom, p.PolicyTo || p.ExpiryDate].filter(Boolean).join(" → ") || "—";
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
    status: statusLabel(rp.status || r.status), // friendly: Running / Closed (also drives the filter)
    expiry_date: rp.od_expiry_date || rp.ExpiryDate || r.expiry_date || "",
  };
};

export default function VehiclePage() {
  const [tab, setTab] = useState("policies");
  const [rows, setRows] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [renewRow, setRenewRow] = useState(null);
  const [addPrefill, setAddPrefill] = useState(null); // mobile to prefill a new policy for an assigned consumer
  const [viewId, setViewId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [renewingId, setRenewingId] = useState(null);

  // Load policies + consumers once; every tab + its count derives from this.
  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.post("/user/vehicle/user/list", {}),
        api.get("/user/list/consumer").catch(() => null),
      ]);
      const data = pRes.data?.data || pRes.data || [];
      setRows((Array.isArray(data) ? data : []).map(norm));
      setConsumers(cRes?.data?.data || []);
    } catch (e) { showError(e, "Could not load vehicle policies"); setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadAll(); }, []);

  const in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  // Closed = expired cover.
  const closedRows = useMemo(() => rows.filter((r) => statusLabel(r.status) === "Closed"), [rows]);
  // Renewals = real policies, soonest expiry first.
  const renewals = useMemo(
    () => [...rows].filter((r) => r.vehicle_number && r.vehicle_number !== "—").sort((a, b) => String(a.expiry_date || "9999").localeCompare(String(b.expiry_date || "9999"))),
    [rows]
  );
  // Pending = assigned-but-no-policy consumers (Add record) + due renewals (Renew).
  const pending = useMemo(() => {
    const policyUserIds = new Set(rows.map((r) => r.user_id).filter(Boolean));
    const assigned = consumers
      .filter((c) => (c.category || []).some((m) => m.category_id === CATEGORY_IDS.VEHICLE) && !policyUserIds.has(c.user_id))
      .map((c) => ({ vehicle_user_id: c.user_id, user_id: c.user_id, name: c.username || "—", mobile: c.mobileNumber || "—", vehicle_number: "—", reason: "Assigned — add policy", when: (c.createdAt || "").slice(0, 10) }));
    const due = rows
      .filter((r) => r.expiry_date && r.expiry_date.slice(0, 10) <= in30)
      .map((r) => ({ ...r, reason: "Renewal due", when: r.expiry_date }));
    return [...assigned, ...due];
  }, [rows, consumers, in30]);

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

  const columns = useMemo(() => [
    { key: "name", title: "Owner", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "vehicle_number", title: "Vehicle No." },
    { key: "makeModel", title: "Make / Model", className: "hidden lg:table-cell" },
    { key: "company", title: "Company" },
    { key: "policy_number", title: "Policy No.", className: "hidden xl:table-cell" },
    { key: "expiry_date", title: "Expiry", render: (r) => r.expiry_date || "—" },
    { key: "ptype", title: "Type", className: "hidden xl:table-cell", render: (r) => <Badge tone="brand">{r.ptype}</Badge> },
    { key: "status", title: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge> },
  ], []);

  const pendingColumns = useMemo(() => [
    { key: "name", title: "Owner", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "vehicle_number", title: "Vehicle No." },
    { key: "reason", title: "Reason", render: (r) => <Badge tone={String(r.reason).includes("Renewal") ? "warning" : "success"}>{r.reason}</Badge> },
    { key: "when", title: "Date" },
    {
      key: "act", title: "",
      render: (r) =>
        String(r.reason).includes("Renewal") ? (
          <Button size="sm" variant="secondary" icon={RefreshCw} loading={renewingId === r.vehicle_user_id} onClick={() => renew(r)}>Renew</Button>
        ) : (
          <Button size="sm" icon={FilePlus} onClick={() => setAddPrefill(r.mobile)}>Add record</Button>
        ),
    },
  ], [renewingId]);

  const renewalColumns = useMemo(() => [
    { key: "name", title: "Owner", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "vehicle_number", title: "Vehicle No." },
    { key: "expiry_date", title: "Expiry", render: (r) => r.expiry_date || "—" },
    {
      key: "renew", title: "",
      render: (r) => (
        <Button size="sm" variant="secondary" icon={RefreshCw} loading={renewingId === r.vehicle_user_id} onClick={() => renew(r)}>Renew</Button>
      ),
    },
  ], [renewingId]);

  return (
    <div>
      <PageHeader title="Vehicle Insurance" subtitle="Vehicle policies & renewals" actions={<Button icon={Plus} onClick={() => setAddOpen(true)}>Add Vehicle Policy</Button>} />

      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[
        { value: "policies", label: "Policies" },
        { value: "pending", label: `Pending${pending.length ? ` (${pending.length})` : ""}` },
        { value: "renewals", label: `Renewals${renewals.length ? ` (${renewals.length})` : ""}` },
        { value: "closed", label: `Closed${closedRows.length ? ` (${closedRows.length})` : ""}` },
      ]} />

      {tab === "policies" && (
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

      {tab === "pending" && (
        <DataTable
          columns={pendingColumns}
          data={pending}
          loading={loading}
          rowKey="vehicle_user_id"
          searchKeys={["name", "mobile", "vehicle_number", "reason"]}
          filters={[{ key: "reason", label: "Reason" }]}
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
      <VehicleFormModal open={!!addPrefill} prefillMobile={addPrefill} onClose={() => setAddPrefill(null)} onSaved={() => { setAddPrefill(null); loadAll(); }} />
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
        <Row label="OD / Full expiry" value={rp.od_expiry_date || rp.ExpiryDate || "—"} />
        <Row label="TP expiry" value={rp.tp_expiry_date || "—"} />
        <Row label="Status" value={<Badge tone={statusTone(rp.status)}>{statusLabel(rp.status)}</Badge>} />
        {fileUrl(rp.CurrentPolicyFile) && (
          <Row label="Policy PDF" value={
            <span className="flex gap-3">
              <a className="text-ink hover:underline" href={fileUrl(rp.CurrentPolicyFile)} target="_blank" rel="noopener noreferrer">View</a>
              <a className="text-brand-600 hover:underline" href={fileUrl(rp.CurrentPolicyFile)} download>Download</a>
            </span>
          } />
        )}
      </Section>
      <Section title={`Past journey (${prev.length})`}>
        {prev.length ? (
          <div className="relative space-y-3 pl-4 before:absolute before:left-1 before:top-1 before:bottom-1 before:w-px before:bg-line">
            {[...prev]
              .sort((a, b) => String(b.PolicyTo || b.ExpiryDate || "").localeCompare(String(a.PolicyTo || a.ExpiryDate || "")))
              .map((p, i) => <JourneyItem key={i} p={p} index={i} />)}
          </div>
        ) : <p className="py-1 text-[13px] text-muted">No previous policies.</p>}
      </Section>
    </div>
  );
}

function JourneyItem({ p, index }) {
  const [open, setOpen] = useState(false);
  const url = fileUrl(p.CurrentPolicyFile);
  return (
    <div className="relative">
      <span className="absolute -left-[13px] top-3 h-2.5 w-2.5 rounded-full border-2 border-surface bg-brand-600" />
      <div className="rounded-lg border border-line">
        <div className="flex items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-ink">
              <span className="rounded bg-subtle px-1.5 py-0.5 text-[12px] font-semibold text-muted">{policyYear(p)}</span>
              {p.PolicyNumber || `Policy ${index + 1}`}
              <Badge tone={statusTone(p.status)}>{statusLabel(p.status)}</Badge>
            </div>
            <div className="mt-0.5 text-[12px] text-muted">{period(p)}{p.PremiumAmount ? ` · ₹${p.PremiumAmount}` : ""}</div>
          </div>
          <div className="flex shrink-0 gap-1">
            <button onClick={() => setOpen((o) => !o)} className="press rounded-md border border-line px-2.5 py-1 text-[12px] text-ink hover:bg-subtle">{open ? "Hide" : "View"}</button>
            {url ? (
              <a href={url} download className="press rounded-md border border-line px-2.5 py-1 text-[12px] text-brand-600 hover:bg-subtle">Download</a>
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
