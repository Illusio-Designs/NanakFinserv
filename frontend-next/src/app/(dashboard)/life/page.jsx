"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import api, { showError } from "@/lib/api";
import LifeFormModal from "./LifeFormModal";

const norm = (r) => ({
  ...r,
  name: r.proposer_name || r.username || r.name || "—",
  mobile: r.proposer_mobile_numbers || r.mobileNumber || "—",
  policy: r.policy_number || r.policy_numbers || "—",
  status: r.status || "—",
});

export default function LifePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [tab, setTab] = useState("policies");
  const [renewals, setRenewals] = useState([]);
  const [renLoading, setRenLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/life-insurance/list");
      const d = res.data?.data || res.data || [];
      setRows((Array.isArray(d) ? d : (d.rows || [])).map(norm));
    } catch (e) { showError(e, "Could not load life policies"); setRows([]); }
    finally { setLoading(false); }
  };
  const loadRenewals = async () => {
    setRenLoading(true);
    try {
      const res = await api.get("/user/life-insurance/renewal/data");
      const d = res.data?.data || res.data || [];
      setRenewals((Array.isArray(d) ? d : (d.rows || [])).map((r) => ({
        ...norm(r),
        due: r.due_date_of_premium || r.date_of_maturity || "—",
      })));
    } catch (e) { showError(e, "Could not load renewals"); setRenewals([]); }
    finally { setRenLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (tab === "renewals" || tab === "pending") loadRenewals(); }, [tab]);

  const columns = useMemo(() => [
    { key: "name", title: "Proposer", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "policy", title: "Policy No." },
    { key: "status", title: "Status", render: (r) => <Badge tone="brand">{r.status}</Badge> },
  ], []);

  // Pending = renewals due within the next 30 days.
  const todayISO = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const pendingRows = useMemo(
    () => renewals.filter((r) => r.due && String(r.due).slice(0, 10) >= todayISO && String(r.due).slice(0, 10) <= in30),
    [renewals]
  );

  return (
    <div>
      <PageHeader title="Life Insurance" subtitle="Policies & renewals" actions={<Button icon={Plus} onClick={() => setAddOpen(true)}>Add Life Policy</Button>} />

      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: "policies", label: "Policies" }, { value: "pending", label: `Pending${pendingRows.length ? ` (${pendingRows.length})` : ""}` }, { value: "renewals", label: "Renewals" }]} />

      {tab === "policies" && (
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          rowKey="id"
          searchKeys={["name", "mobile", "policy", "status"]}
          filters={[{ key: "status", label: "Status" }]}
          onView={(r) => setViewRow(r)}
          onEdit={(r) => setEditRow(r)}
        />
      )}

      {tab === "pending" && (
        <DataTable
          columns={[...columns.slice(0, 3), { key: "due", title: "Due Date" }]}
          data={pendingRows}
          loading={renLoading}
          rowKey="id"
          searchKeys={["name", "mobile", "policy"]}
          onView={(r) => setViewRow(r)}
          onEdit={(r) => setEditRow(r)}
        />
      )}

      {tab === "renewals" && (
        <DataTable
          columns={[...columns.slice(0, 3), { key: "due", title: "Due Date" }]}
          data={renewals}
          loading={renLoading}
          rowKey="id"
          searchKeys={["name", "mobile", "policy"]}
          filters={[{ key: "due", label: "Due", type: "dateRange" }]}
          onView={(r) => setViewRow(r)}
          onEdit={(r) => setEditRow(r)}
        />
      )}

      <LifeFormModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} />
      <LifeFormModal open={!!editRow} editRow={editRow} onClose={() => setEditRow(null)} onSaved={load} />

      <Modal open={!!viewRow} onClose={() => setViewRow(null)} title="Life policy" subtitle={viewRow?.policy}>
        {viewRow && (
          <div className="space-y-2 text-[14px]">
            <Row label="Proposer" value={viewRow.name} />
            <Row label="Mobile" value={viewRow.mobile} />
            <Row label="Life Assured" value={viewRow.life_assured_name || "—"} />
            <Row label="Nominee" value={viewRow.nominee_name || "—"} />
            <Row label="Policy No." value={viewRow.policy} />
            <Row label="Sum Assured" value={viewRow.sum_assured || "—"} />
            <Row label="Premium" value={viewRow.premium_amount || "—"} />
            <Row label="Status" value={viewRow.status} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-line py-1.5">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
