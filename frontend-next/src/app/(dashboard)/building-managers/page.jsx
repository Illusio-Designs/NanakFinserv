"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import Dropdown from "@/components/ui/Dropdown";
import Badge from "@/components/ui/Badge";
import api, { showError } from "@/lib/api";

const norm = (b) => ({
  ...b,
  id: b.id || b.building_manager_id,
  name: b.user?.username || b["user.username"] || b.username || "—",
  mobile: b.user?.mobileNumber || b["user.mobileNumber"] || "—",
  email: b.user?.email || b["user.email"] || "—",
  building: b.unit?.unit_name || b["unit.unit_name"] || "—",
  status: b.status || "active",
});

export default function BuildingManagersPage() {
  const [rows, setRows] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", mobileNumber: "", unit_id: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/building-manager/list");
      const d = res.data?.data || res.data || [];
      setRows((Array.isArray(d) ? d : []).map(norm));
    } catch (e) { showError(e, "Could not load building managers"); setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    api.get("/user/data/builder/unit").then((r) => setUnits((r.data?.data || []).map((u) => ({ value: u.unit_id, label: u.unit_name })))).catch(() => setUnits([]));
  }, []);

  const columns = useMemo(() => [
    { key: "name", title: "Manager", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "email", title: "Email" },
    { key: "building", title: "Building" },
    { key: "status", title: "Status", render: (r) => <Badge tone={r.status === "active" ? "success" : "muted"}>{r.status}</Badge> },
  ], []);

  const save = async () => {
    if (!form.username.trim()) return toast.error("Name is required");
    if (!/^\d{10}$/.test(form.mobileNumber)) return toast.error("Mobile must be 10 digits");
    if (!form.unit_id) return toast.error("Select a building");
    setSaving(true);
    try {
      await api.post("/user/building-manager/create", form);
      toast.success("Building manager added");
      setOpen(false); setForm({ username: "", email: "", mobileNumber: "", unit_id: "" });
      load();
    } catch (e) { showError(e, "Could not add building manager"); }
    finally { setSaving(false); }
  };

  const remove = async (r) => {
    if (!confirm(`Remove ${r.name} from ${r.building}?`)) return;
    try {
      await api.put(`/user/building-manager/remove/${r.id}`, {});
      toast.success("Building manager removed");
      load();
    } catch (e) { showError(e, "Could not remove"); }
  };

  return (
    <div>
      <PageHeader title="Building Managers" subtitle="Assign managers to buildings" actions={<Button icon={Plus} onClick={() => { setForm({ username: "", email: "", mobileNumber: "", unit_id: "" }); setOpen(true); }}>Add Manager</Button>} />
      <DataTable columns={columns} data={rows} loading={loading} rowKey="id" searchKeys={["name", "mobile", "email", "building"]}
        rowActions={[{ icon: Trash2, title: "Remove", onClick: remove }]} />

      <Modal open={open} onClose={() => setOpen(false)} title="Add Building Manager" size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></div>}>
        <div className="space-y-4">
          <Input label="Name" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <PhoneInput label="Mobile" value={form.mobileNumber} onChange={(v) => setForm({ ...form, mobileNumber: v })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Dropdown label="Building" placeholder="Select a building" options={units} value={form.unit_id} onChange={(v) => setForm({ ...form, unit_id: v })} searchable />
        </div>
      </Modal>
    </div>
  );
}
