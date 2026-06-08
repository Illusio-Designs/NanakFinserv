"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
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

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/life-insurance/list");
      const d = res.data?.data || res.data || [];
      setRows((Array.isArray(d) ? d : (d.rows || [])).map(norm));
    } catch (e) { showError(e, "Could not load life policies"); setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const columns = useMemo(() => [
    { key: "name", title: "Proposer", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "policy", title: "Policy No." },
    { key: "status", title: "Status", render: (r) => <Badge tone="brand">{r.status}</Badge> },
  ], []);

  return (
    <div>
      <PageHeader title="Life Insurance" subtitle="Life insurance policies" actions={<Button icon={Plus} onClick={() => setAddOpen(true)}>Add Life Policy</Button>} />
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
