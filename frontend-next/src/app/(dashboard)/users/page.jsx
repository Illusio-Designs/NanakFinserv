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
import Dropdown from "@/components/ui/Dropdown";
import api, { showError } from "@/lib/api";
import { firstError, field, checks } from "@/utils/validators";

const norm = (r) => ({
  ...r,
  name: r.username || r.name || "—",
  email: r.email || "—",
  mobile: r.mobileNumber || r.phone_number || "—",
  roleName: r.role_name || r.roleName || (r.role && r.role.role_name) || "—",
});

const empty = { username: "", email: "", phone_number: "", role: "" };

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/list/roleWise");
      setRows((res.data?.data || []).map(norm));
    } catch (e) {
      showError(e, "Could not load users");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.get("/user/role/list").then((r) => setRoles((r.data?.data || []).map((x) => ({ value: x.role_id, label: x.role_name })))).catch(() => setRoles([]));
  }, []);

  const columns = useMemo(
    () => [
      { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
      { key: "email", title: "Email" },
      { key: "mobile", title: "Mobile" },
      { key: "roleName", title: "Role" },
    ],
    []
  );

  const openAdd = () => { setForm(empty); setAddOpen(true); };
  const openEdit = (r) => { setEditRow(r); setForm({ username: r.username || "", email: r.email || "", phone_number: r.mobileNumber || r.phone_number || "", role: r.role_id || r.role || "" }); };

  const validate = () => {
    const err = firstError(
      [
        field("username", { label: "Name", required: true }),
        field("phone_number", { label: "Mobile number", required: true, checks: [checks.mobile10] }),
        field("role", { label: "Role", required: true }),
      ],
      form
    );
    if (err) { toast.error(err); return false; }
    return true;
  };

  const submitAdd = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post("/user/data/role/add", { ...form });
      toast.success("User added");
      setAddOpen(false);
      load();
    } catch (e) { showError(e, "Could not add user"); }
    finally { setSaving(false); }
  };

  const submitEdit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.put("/user/data/role/update", { user_id: editRow.user_id, ...form });
      toast.success("User updated");
      setEditRow(null);
      load();
    } catch (e) { showError(e, "Could not update user"); }
    finally { setSaving(false); }
  };

  const Fields = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input label="Name" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
      <PhoneInput label="Mobile Number" value={form.phone_number} onChange={(v) => setForm({ ...form, phone_number: v })} />
      <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Dropdown label="Role" placeholder="Select role" options={roles} value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
    </div>
  );

  return (
    <div>
      <PageHeader title="Users & Roles" subtitle="Admin & staff accounts" actions={<Button icon={Plus} onClick={openAdd}>Add User</Button>} />
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        rowKey="user_id"
        searchKeys={["name", "email", "mobile", "roleName"]}
        filters={[{ key: "roleName", label: "Role" }]}
        onEdit={openEdit}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add User"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={submitAdd} loading={saving}>Add</Button></div>}>
        {Fields}
      </Modal>

      <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit User"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={submitEdit} loading={saving}>Save</Button></div>}>
        {Fields}
      </Modal>
    </div>
  );
}
