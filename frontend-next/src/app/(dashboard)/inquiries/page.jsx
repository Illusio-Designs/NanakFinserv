"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import api, { showError } from "@/lib/api";

const norm = (r) => ({
  ...r,
  name: r.username || r.name || "—",
  email: r.email || "—",
  phone: r.phone_number || r.mobileNumber || "—",
  service: r.service || r.service_type || "—",
  created: (r.createdAt || r.created_at || "").slice(0, 10),
});

export default function InquiriesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/user/data/inquiery");
        const data = res.data?.data || res.data || [];
        setRows((Array.isArray(data) ? data : []).map(norm));
      } catch (e) {
        showError(e, "Could not load inquiries");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns = useMemo(
    () => [
      { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
      { key: "phone", title: "Phone" },
      { key: "email", title: "Email" },
      { key: "service", title: "Service" },
      { key: "created", title: "Date" },
    ],
    []
  );

  return (
    <div>
      <PageHeader title="Inquiries" subtitle="Website & staff inquiries" />
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        rowKey="id"
        searchKeys={["name", "phone", "email", "service"]}
        filters={[{ key: "service", label: "Service" }]}
      />
    </div>
  );
}
