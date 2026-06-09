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
    status: rp.status || r.status || "—",
    expiry_date: rp.od_expiry_date || rp.ExpiryDate || r.expiry_date || "",
  };
};

export default function VehiclePage() {
  const [tab, setTab] = useState("policies");
  const [rows, setRows] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [renewRow, setRenewRow] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [renewingId, setRenewingId] = useState(null);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const res = await api.post("/user/vehicle/user/list", {});
      const data = res.data?.data || res.data || [];
      setRows((Array.isArray(data) ? data : []).map(norm));
    } catch (e) { showError(e, "Could not load vehicle policies"); setRows([]); }
    finally { setLoading(false); }
  };

  const loadRenewals = async () => {
    setLoading(true);
    try {
      const res = await api.post("/user/vehicle/user/renewal/list", { startDate: "2000-01-01", endDate: "2100-01-01" });
      const data = res.data?.data || res.data || [];
      setRenewals((Array.isArray(data) ? data : []).map(norm));
    } catch (e) { showError(e, "Could not load renewals"); setRenewals([]); }
    finally { setLoading(false); }
  };

  // Pending = renewals due in the next 30 days + new this week — a manager's action list.
  const loadPending = async () => {
    setLoading(true);
    const now = new Date();
    const todayISO = now.toISOString().slice(0, 10);
    const in30 = new Date(now.getTime() + 30 * 864e5).toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 864e5).toISOString().slice(0, 10);
    try {
      const res = await api.post("/user/vehicle/user/list", {});
      const all = (res?.data?.data || []).map(norm);
      const due = all
        .filter((r) => r.expiry_date && r.expiry_date.slice(0, 10) >= todayISO && r.expiry_date.slice(0, 10) <= in30)
        .map((r) => ({ ...r, reason: "Renewal due (30d)", when: r.expiry_date }));
      const fresh = all
        .filter((r) => (r.createdAt || "").slice(0, 10) >= weekAgo)
        .map((r) => ({ ...r, reason: "New (this week)", when: (r.createdAt || "").slice(0, 10) }));
      // de-dupe by vehicle (a renewal-due row wins over new)
      const map = new Map();
      [...due, ...fresh].forEach((r) => { if (!map.has(r.vehicle_user_id)) map.set(r.vehicle_user_id, r); });
      setPending([...map.values()]);
    } catch (e) { showError(e, "Could not load pending"); setPending([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === "policies") loadPolicies();
    else if (tab === "renewals") loadRenewals();
    else loadPending();
  }, [tab]);

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
      loadRenewals();
    } catch (e) { showError(e, "Could not renew policy"); }
    finally { setRenewingId(null); }
  };

  const columns = useMemo(() => [
    { key: "name", title: "Owner", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "vehicle_number", title: "Vehicle No." },
    { key: "makeModel", title: "Make / Model" },
    { key: "company", title: "Company" },
    { key: "policy_number", title: "Policy No." },
    { key: "expiry_date", title: "Expiry", render: (r) => r.expiry_date || "—" },
    { key: "ptype", title: "Type", render: (r) => <Badge tone="brand">{r.ptype}</Badge> },
    { key: "status", title: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge> },
  ], []);

  const pendingColumns = useMemo(() => [
    { key: "name", title: "Owner", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "vehicle_number", title: "Vehicle No." },
    { key: "reason", title: "Reason", render: (r) => <Badge tone={r.reason === "Renewal due today" ? "warning" : "success"}>{r.reason}</Badge> },
    { key: "when", title: "Date" },
  ], []);

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

      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: "policies", label: "Policies" }, { value: "pending", label: `Pending${pending.length ? ` (${pending.length})` : ""}` }, { value: "renewals", label: "Renewals" }]} />

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
          onEdit={(r) => setEditRow(r)}
          rowActions={[{ icon: FilePlus, title: "Add next policy / renew", onClick: (r) => setRenewRow(r) }]}
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
          onEdit={(r) => setEditRow(r)}
          rowActions={[{ icon: FilePlus, title: "Add next policy / renew", onClick: (r) => setRenewRow(r) }]}
        />
      )}

      <VehicleFormModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={loadPolicies} />
      <VehicleFormModal open={!!editRow} editRow={editRow} onClose={() => setEditRow(null)} onSaved={loadPolicies} />
      <VehicleFormModal open={!!renewRow} editRow={renewRow} renewMode onClose={() => setRenewRow(null)} onSaved={() => { loadPolicies(); if (tab === "renewals") loadRenewals(); }} />

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
        {fileUrl(rp.CurrentPolicyFile) && <Row label="Policy PDF" value={<a className="text-brand-600 hover:underline" href={fileUrl(rp.CurrentPolicyFile)} target="_blank" rel="noopener noreferrer">Download</a>} />}
      </Section>
      <Section title={`Past journey (${prev.length})`}>
        {prev.length ? (
          <div className="relative space-y-3 pl-4 before:absolute before:left-1 before:top-1 before:bottom-1 before:w-px before:bg-line">
            {[...prev].sort((a, b) => String(b.PolicyTo || b.ExpiryDate || "").localeCompare(String(a.PolicyTo || a.ExpiryDate || ""))).map((p, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[13px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-brand-600" />
                <div className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
                  <div>
                    <div className="flex items-center gap-2 text-[14px] font-medium text-ink">
                      <span className="rounded bg-subtle px-1.5 py-0.5 text-[12px] font-semibold text-muted">{policyYear(p)}</span>
                      {p.PolicyNumber || `Policy ${i + 1}`}
                      <Badge tone={statusTone(p.status)}>{statusLabel(p.status)}</Badge>
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted">{period(p)}{p.PremiumAmount ? ` · ₹${p.PremiumAmount}` : ""}</div>
                  </div>
                  {fileUrl(p.CurrentPolicyFile) && <a className="press shrink-0 rounded-md border border-line px-2.5 py-1 text-[12px] text-brand-600 hover:bg-subtle" href={fileUrl(p.CurrentPolicyFile)} target="_blank" rel="noopener noreferrer">Download PDF</a>}
                </div>
              </div>
            ))}
          </div>
        ) : <p className="py-1 text-[13px] text-muted">No previous policies.</p>}
      </Section>
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
