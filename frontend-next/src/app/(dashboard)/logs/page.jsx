"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import api, { showError } from "@/lib/api";
import { fmtDate } from "@/lib/format";

const ACTION_TONE = { created: "success", updated: "brand", renewed: "warning", deleted: "danger", wiped: "danger" };
const ENTITY_TONE = { consumer: "brand", vehicle: "warning", user: "muted", policy: "success", settings: "danger" };

export default function LogsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/audit-logs", { params: { limit: 500 } });
      const list = res.data?.data?.logs || [];
      setRows(
        list.map((a) => ({
          ...a,
          when: (a.createdAt || "").replace("T", " ").slice(0, 16),
          whenDate: a.createdAt,
          who: a.actor_name || "System",
          action: a.action || "—",
          entity: a.entity || "—",
          detail: a.summary || "—",
        }))
      );
    } catch (e) { showError(e, "Could not load activity log"); setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const columns = useMemo(() => [
    { key: "when", title: "When", render: (r) => <span className="whitespace-nowrap">{r.when || "—"}</span> },
    { key: "who", title: "Who", render: (r) => <span className="font-medium">{r.who}</span> },
    { key: "action", title: "Action", render: (r) => <Badge tone={ACTION_TONE[r.action] || "muted"}>{r.action}</Badge> },
    { key: "entity", title: "Module", render: (r) => <Badge tone={ENTITY_TONE[r.entity] || "muted"}>{r.entity}</Badge> },
    { key: "detail", title: "Detail" },
  ], []);

  return (
    <div>
      <PageHeader title="Activity Log" subtitle="Audit trail — who did what across the CRM, with time" />
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        rowKey="id"
        searchKeys={["who", "action", "entity", "detail"]}
        filters={[
          { key: "action", label: "Action" },
          { key: "entity", label: "Module" },
          { key: "whenDate", label: "Date", type: "dateRange" },
        ]}
        exportName="activity-log"
      />
    </div>
  );
}
