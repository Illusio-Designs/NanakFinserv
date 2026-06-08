"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import api, { showError } from "@/lib/api";

const norm = (r) => ({
  ...r,
  name: r.username || r.Name || r.name || "—",
  mobile: r.mobileNumber || r.MobileNumber || r.mobile_number || "—",
  status: r.status || r.Status || "—",
  amount: r.loan_amount || r.amount || r.loanAmount || "",
  user_consumer_id: r.user_consumer_id || r.user_id || r.userId,
  loan_id: r.loan_id || r.loan_user_id || r.id,
});

const inr = (n) => (n ? "₹" + Number(n).toLocaleString("en-IN") : "—");

export default function LoanPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [viewRow, setViewRow] = useState(null);
  const [statusRow, setStatusRow] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/list/loan");
      const data = res.data?.data || res.data || [];
      setRows((Array.isArray(data) ? data : []).map(norm));
    } catch (e) {
      showError(e, "Could not load loans");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const statuses = useMemo(() => Array.from(new Set(rows.map((r) => r.status).filter((s) => s && s !== "—"))).sort(), [rows]);

  const tabs = useMemo(() => [
    { value: "all", label: `All (${rows.length})` },
    ...statuses.map((s) => ({ value: s, label: `${s} (${rows.filter((r) => r.status === s).length})` })),
  ], [rows, statuses]);

  const data = tab === "all" ? rows : rows.filter((r) => r.status === tab);

  const openStatus = (r) => { setStatusRow(r); setNewStatus(r.status !== "—" ? r.status : ""); setRemarks(""); };

  const saveStatus = async () => {
    if (!newStatus) return toast.error("Select a status");
    if (!statusRow.user_consumer_id) return toast.error("Missing consumer id for this loan");
    setSaving(true);
    try {
      await api.put("/user/list/loanUpdateStatus", {
        status: newStatus,
        user_consumer_id: statusRow.user_consumer_id,
        laon_id: statusRow.loan_id,
        remarks,
      });
      toast.success("Loan status updated");
      setStatusRow(null);
      load();
    } catch (e) { showError(e, "Could not update status"); }
    finally { setSaving(false); }
  };

  const columns = useMemo(
    () => [
      { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
      { key: "mobile", title: "Mobile" },
      { key: "amount", title: "Amount", render: (r) => inr(r.amount) },
      { key: "status", title: "Status", render: (r) => <Badge tone="brand">{r.status}</Badge> },
    ],
    []
  );

  return (
    <div>
      <PageHeader title="Loan" subtitle="Loan applications & pipeline" />

      {!loading && tabs.length > 1 && (
        <Tabs className="mb-4 flex-wrap" value={tab} onChange={setTab} tabs={tabs} />
      )}

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        rowKey="loan_user_id"
        searchKeys={["name", "mobile", "status"]}
        onView={(r) => setViewRow(r)}
        onEdit={openStatus}
      />

      {/* Status update */}
      <Modal open={!!statusRow} onClose={() => setStatusRow(null)} title="Update loan status" subtitle={statusRow?.name} size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setStatusRow(null)}>Cancel</Button><Button onClick={saveStatus} loading={saving}>Save</Button></div>}>
        <div className="space-y-4">
          <Dropdown
            label="Status"
            placeholder="Select status"
            options={statuses.map((s) => ({ value: s, label: s }))}
            value={newStatus}
            onChange={setNewStatus}
            searchable
            onCreate={(s) => { setNewStatus(s); return s; }}
          />
          <Input label="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
      </Modal>

      <Modal open={!!viewRow} onClose={() => setViewRow(null)} title="Loan details" subtitle={viewRow?.mobile}>
        {viewRow && (
          <div className="space-y-2 text-[14px]">
            <Row label="Name" value={viewRow.name} />
            <Row label="Mobile" value={viewRow.mobile} />
            <Row label="Amount" value={inr(viewRow.amount)} />
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
