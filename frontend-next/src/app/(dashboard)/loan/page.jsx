"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import api, { showError } from "@/lib/api";

const norm = (r) => ({
  ...r,
  name: r.username || r.Name || r.name || "—",
  mobile: r.mobileNumber || r.MobileNumber || r.mobile_number || "—",
  status: r.status || r.Status || "—",
  amount: r.loan_amount || r.amount || r.loanAmount || "",
});

const inr = (n) => (n ? "₹" + Number(n).toLocaleString("en-IN") : "—");

export default function LoanPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [viewRow, setViewRow] = useState(null);

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

  // Pipeline tabs derived from the real statuses present.
  const tabs = useMemo(() => {
    const statuses = Array.from(new Set(rows.map((r) => r.status).filter((s) => s && s !== "—"))).sort();
    return [{ value: "all", label: `All (${rows.length})` }, ...statuses.map((s) => ({
      value: s,
      label: `${s} (${rows.filter((r) => r.status === s).length})`,
    }))];
  }, [rows]);

  const data = tab === "all" ? rows : rows.filter((r) => r.status === tab);

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
      />

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
