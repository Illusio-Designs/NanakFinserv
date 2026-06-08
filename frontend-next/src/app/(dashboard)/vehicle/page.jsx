"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import api, { showError } from "@/lib/api";
import VehicleFormModal from "./VehicleFormModal";

const norm = (r) => ({
  ...r,
  name: r.Name || r.name || r.username || "—",
  mobile: r.MobileNumber || r.mobileNumber || r.mobile_number || "—",
  vehicle_number: r.vehicle_number || r.VehicleNumber || "—",
  status: r.status || r.Status || "—",
});

export default function VehiclePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.post("/user/vehicle/user/list", {});
      const data = res.data?.data || res.data || [];
      setRows((Array.isArray(data) ? data : []).map(norm));
    } catch (e) {
      showError(e, "Could not load vehicle policies");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const columns = useMemo(
    () => [
      { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
      { key: "mobile", title: "Mobile" },
      { key: "vehicle_number", title: "Vehicle No." },
      { key: "status", title: "Status", render: (r) => <Badge tone="warning">{r.status}</Badge> },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="Vehicle Insurance"
        subtitle="Vehicle policy holders"
        actions={<Button icon={Plus} onClick={() => setAddOpen(true)}>Add Vehicle Policy</Button>}
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        rowKey="vehicle_user_id"
        searchKeys={["name", "mobile", "vehicle_number"]}
        filters={[{ key: "status", label: "Status" }]}
        onView={(r) => setViewRow(r)}
      />

      <VehicleFormModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} />

      <Modal open={!!viewRow} onClose={() => setViewRow(null)} title="Vehicle policy" subtitle={viewRow?.vehicle_number}>
        {viewRow && (
          <div className="space-y-2 text-[14px]">
            <Row label="Owner" value={viewRow.name} />
            <Row label="Mobile" value={viewRow.mobile} />
            <Row label="Vehicle No." value={viewRow.vehicle_number} />
            <Row label="Make / Model" value={[viewRow.make || viewRow.Make, viewRow.model || viewRow.Model].filter(Boolean).join(" ") || "—"} />
            <Row label="Engine No." value={viewRow.engine_number || viewRow.EngineNumber || "—"} />
            <Row label="Chassis No." value={viewRow.chassis_number || viewRow.ChassisNumber || "—"} />
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
