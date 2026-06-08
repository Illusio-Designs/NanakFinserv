"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import api, { showError } from "@/lib/api";

export default function UnitsPage() {
  const [rows, setRows] = useState([]);
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ builder_id: "", unit_name: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/data/builder/unit");
      const d = res.data?.data || res.data || [];
      setRows((Array.isArray(d) ? d : []).map((u) => ({ ...u, name: u.unit_name || "—", builder: u.builder_name || u.builder_id || "—" })));
    } catch (e) { showError(e, "Could not load units"); setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    api.get("/user/list/builder").then((r) => setBuilders((r.data?.data || []).map((b) => ({ value: b.builder_id || b.user_id, label: b.username || b.company_name || b.mobileNumber })))).catch(() => setBuilders([]));
  }, []);

  const columns = useMemo(() => [
    { key: "name", title: "Unit", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "builder", title: "Builder" },
  ], []);

  const save = async () => {
    if (!form.builder_id) return toast.error("Select a builder");
    if (!form.unit_name.trim()) return toast.error("Unit name is required");
    setSaving(true);
    try {
      await api.post("/user/data/add/builderUnit", { ...form });
      toast.success("Unit added");
      setOpen(false); setForm({ builder_id: "", unit_name: "" });
      load();
    } catch (e) { showError(e, "Could not add unit"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Units" subtitle="Builder buildings / units" actions={<Button icon={Plus} onClick={() => { setForm({ builder_id: "", unit_name: "" }); setOpen(true); }}>Add Unit</Button>} />
      <DataTable columns={columns} data={rows} loading={loading} rowKey="unit_id" searchKeys={["name", "builder"]} />
      <Modal open={open} onClose={() => setOpen(false)} title="Add Unit" size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></div>}>
        <div className="space-y-4">
          <Dropdown label="Builder" placeholder="Select builder" options={builders} value={form.builder_id} onChange={(v) => setForm({ ...form, builder_id: v })} searchable />
          <Input label="Unit / Building Name" value={form.unit_name} onChange={(e) => setForm({ ...form, unit_name: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
