"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import api, { showError } from "@/lib/api";

// Friendly labels for the activity "kind".
const TYPE_TONE = { vehicle: "brand", loan: "warning", life_insurance: "success", mediclaim: "brand", system: "muted" };
const CAT_LABEL = {
  user_added: "Added", assigned: "Assigned", renewal: "Renewed",
  renewal_due: "Renewal due", status_update: "Status changed",
};

export default function LogsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/notifications", { params: { limit: 1000 } });
      const list = res.data?.data?.notifications || [];
      setRows(
        list.map((n) => ({
          ...n,
          when: (n.created_at || n.createdAt || "").replace("T", " ").slice(0, 16),
          action: n.title || "—",
          detail: n.message || "—",
          kind: n.type || "system",
          event: CAT_LABEL[n.category] || n.category || "—",
        }))
      );
    } catch (e) { showError(e, "Could not load activity log"); setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const columns = useMemo(() => [
    { key: "when", title: "When" },
    { key: "kind", title: "Module", render: (r) => <Badge tone={TYPE_TONE[r.kind] || "muted"}>{r.kind}</Badge> },
    { key: "event", title: "Event", render: (r) => <Badge tone="brand">{r.event}</Badge> },
    { key: "action", title: "Action", render: (r) => <span className="font-medium">{r.action}</span> },
    { key: "detail", title: "Detail" },
  ], []);

  return (
    <div>
      <PageHeader title="Activity Log" subtitle="Who did what across the CRM — by module, event and time" />
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        rowKey="id"
        searchKeys={["action", "detail", "kind", "event"]}
        filters={[
          { key: "kind", label: "Module" },
          { key: "event", label: "Event" },
          { key: "when", label: "Date", type: "dateRange" },
        ]}
        exportName="activity-log"
      />
    </div>
  );
}
