"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, RefreshCw } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import api, { showError } from "@/lib/api";
import VehicleFormModal from "./VehicleFormModal";

const norm = (r) => ({
  ...r,
  name: r.Name || r.name || r.username || "—",
  mobile: r.MobileNumber || r.mobileNumber || r.mobile_number || "—",
  vehicle_number: r.vehicle_number || r.VehicleNumber || "—",
  status: r.status || r.Status || "—",
  expiry_date: r.expiry_date || r.policy_expiry_date || r.running_policy_expiry_date || "",
});

export default function VehiclePage() {
  const [tab, setTab] = useState("policies");
  const [rows, setRows] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [renewingId, setRenewingId] = useState(null);

  const loadPolicies = async () => {
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

  const loadRenewals = async () => {
    setLoading(true);
    try {
      const res = await api.post("/user/vehicle/user/renewal/list", {});
      const data = res.data?.data || res.data || [];
      setRenewals((Array.isArray(data) ? data : []).map(norm));
    } catch (e) {
      showError(e, "Could not load renewals");
      setRenewals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "policies") loadPolicies();
    else loadRenewals();
  }, [tab]);

  const renew = async (row) => {
    setRenewingId(row.vehicle_user_id);
    try {
      await api.post("/user/renewVehiclePolicy", { vehicle_user_id: row.vehicle_user_id });
      toast.success("Policy renewed");
      loadRenewals();
    } catch (e) {
      showError(e, "Could not renew policy");
    } finally {
      setRenewingId(null);
    }
  };

  const columns = useMemo(
    () => [
      { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
      { key: "mobile", title: "Mobile" },
      { key: "vehicle_number", title: "Vehicle No." },
      { key: "status", title: "Status", render: (r) => <Badge tone="warning">{r.status}</Badge> },
    ],
    []
  );

  const renewalColumns = useMemo(
    () => [
      { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
      { key: "mobile", title: "Mobile" },
      { key: "vehicle_number", title: "Vehicle No." },
      { key: "expiry_date", title: "Expiry", render: (r) => r.expiry_date || "—" },
      {
        key: "renew",
        title: "",
        render: (r) => (
          <Button size="sm" variant="secondary" icon={RefreshCw} loading={renewingId === r.vehicle_user_id} onClick={() => renew(r)}>
            Renew
          </Button>
        ),
      },
    ],
    [renewingId]
  );

  return (
    <div>
      <PageHeader
        title="Vehicle Insurance"
        subtitle="Vehicle policies & renewals"
        actions={<Button icon={Plus} onClick={() => setAddOpen(true)}>Add Vehicle Policy</Button>}
      />

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[{ value: "policies", label: "Policies" }, { value: "renewals", label: "Renewals" }]}
      />

      {tab === "policies" ? (
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          rowKey="vehicle_user_id"
          searchKeys={["name", "mobile", "vehicle_number"]}
          filters={[{ key: "status", label: "Status" }]}
          onView={(r) => setViewRow(r)}
          onEdit={(r) => setEditRow(r)}
        />
      ) : (
        <DataTable
          columns={renewalColumns}
          data={renewals}
          loading={loading}
          rowKey="vehicle_user_id"
          searchKeys={["name", "mobile", "vehicle_number"]}
          filters={[{ key: "expiry_date", label: "Expiry", type: "dateRange" }]}
          onView={(r) => setViewRow(r)}
        />
      )}

      <VehicleFormModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={loadPolicies} />
      <VehicleFormModal open={!!editRow} editRow={editRow} onClose={() => setEditRow(null)} onSaved={loadPolicies} />

      <Modal open={!!viewRow} onClose={() => setViewRow(null)} title="Vehicle policy" subtitle={viewRow?.vehicle_number}>
        {viewRow && (
          <div className="space-y-2 text-[14px]">
            <Row label="Owner" value={viewRow.name} />
            <Row label="Mobile" value={viewRow.mobile} />
            <Row label="Vehicle No." value={viewRow.vehicle_number} />
            <Row label="Make / Model" value={[viewRow.make || viewRow.Make, viewRow.model || viewRow.Model].filter(Boolean).join(" ") || "—"} />
            <Row label="Engine No." value={viewRow.engine_number || viewRow.EngineNumber || "—"} />
            <Row label="Chassis No." value={viewRow.chassis_number || viewRow.ChassisNumber || "—"} />
            <Row label="Expiry" value={viewRow.expiry_date || "—"} />
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
