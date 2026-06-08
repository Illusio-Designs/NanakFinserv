"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import api, { showError } from "@/lib/api";
import { firstError, field, checks } from "@/utils/validators";

const norm = (r) => ({
  ...r,
  name: r.username || r.name || "—",
  email: r.email || "—",
  mobile: r.mobileNumber || r.phone_number || "—",
  company: r.company_name || "—",
});
const empty = { username: "", email: "", phone_number: "", company_name: "", referenceName: "" };

export default function BuilderPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/list/builder");
      setRows((res.data?.data || []).map(norm));
    } catch (e) { showError(e, "Could not load builders"); setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const columns = useMemo(() => [
    { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "company", title: "Company" },
    { key: "mobile", title: "Mobile" },
    { key: "email", title: "Email" },
  ], []);

  const openAdd = () => { setForm(empty); setAddOpen(true); };
  const openEdit = (r) => { setEditRow(r); setForm({ username: r.username || "", email: r.email || "", phone_number: r.mobileNumber || "", company_name: r.company_name || "", referenceName: r.referenceName || "" }); };

  const validate = () => {
    const err = firstError([
      field("username", { label: "Name", required: true }),
      field("phone_number", { label: "Mobile number", required: true, checks: [checks.mobile10] }),
    ], form);
    if (err) { toast.error(err); return false; }
    return true;
  };

  const save = async (isEdit) => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) await api.post("/user/data/update/builder", { user_id: editRow.user_id, ...form });
      else await api.post("/user/data/add/builder", { ...form });
      toast.success(isEdit ? "Builder updated" : "Builder added");
      setAddOpen(false); setEditRow(null);
      load();
    } catch (e) { showError(e, "Could not save builder"); }
    finally { setSaving(false); }
  };

  const Fields = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input label="Name" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
      <Input label="Company Name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
      <PhoneInput label="Mobile Number" value={form.phone_number} onChange={(v) => setForm({ ...form, phone_number: v })} />
      <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Input label="Reference" value={form.referenceName} onChange={(e) => setForm({ ...form, referenceName: e.target.value })} />
    </div>
  );

  return (
    <div>
      <PageHeader title="Builder" subtitle="Builder accounts" actions={<Button icon={Plus} onClick={openAdd}>Add Builder</Button>} />
      <DataTable columns={columns} data={rows} loading={loading} rowKey="user_id" searchKeys={["name", "company", "mobile", "email"]} onEdit={openEdit} />
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Builder"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={() => save(false)} loading={saving}>Add</Button></div>}>{Fields}</Modal>
      <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Builder"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={() => save(true)} loading={saving}>Save</Button></div>}>{Fields}</Modal>
    </div>
  );
}
