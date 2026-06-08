"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Dropdown from "@/components/ui/Dropdown";
import FileUpload from "@/components/ui/FileUpload";
import Badge from "@/components/ui/Badge";
import api, { showError } from "@/lib/api";

const STATUS = ["draft", "published"].map((s) => ({ value: s, label: s }));
const empty = { title: "", content: "", author: "", category: "", tags: "", status: "draft" };

export default function BlogAdminPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState(empty);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/blog/list");
      const d = res.data?.data || res.data || [];
      setRows((Array.isArray(d) ? d : d.blogs || []).map((b) => ({ ...b, t: b.title || b.heading || "—", st: b.status || "—" })));
    } catch (e) { showError(e, "Could not load blogs"); setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const columns = useMemo(() => [
    { key: "t", title: "Title", render: (r) => <span className="font-medium">{r.t}</span> },
    { key: "author", title: "Author", render: (r) => r.author || "—" },
    { key: "st", title: "Status", render: (r) => <Badge tone={r.st === "published" ? "success" : "warning"}>{r.st}</Badge> },
  ], []);

  const openAdd = () => { setEditRow(null); setForm(empty); setImage(null); setOpen(true); };
  const openEdit = (r) => { setEditRow(r); setForm({ title: r.title || "", content: r.content || "", author: r.author || "", category: r.category || "", tags: Array.isArray(r.tags) ? r.tags.join(",") : (r.tags || ""), status: r.status || "draft" }); setImage(null); setOpen(true); };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append("image", image);
      if (editRow) await api.put(`/user/blog/update/${editRow.id || editRow.blog_id}`, fd);
      else await api.post("/user/blog/add", fd);
      toast.success(editRow ? "Blog updated" : "Blog created");
      setOpen(false);
      load();
    } catch (e) { showError(e, "Could not save blog"); }
    finally { setSaving(false); }
  };

  const remove = async (r) => {
    if (!confirm(`Delete "${r.t}"?`)) return;
    try {
      await api.delete(`/user/blog/delete/${r.id || r.blog_id}`);
      toast.success("Blog deleted");
      load();
    } catch (e) { showError(e, "Could not delete blog"); }
  };

  return (
    <div>
      <PageHeader title="Blog" subtitle="Manage blog posts" actions={<Button icon={Plus} onClick={openAdd}>Add Post</Button>} />
      <DataTable columns={columns} data={rows} loading={loading} rowKey="id" searchKeys={["t", "author", "st"]} filters={[{ key: "st", label: "Status" }]} onEdit={openEdit} onDelete={remove} />

      <Modal open={open} onClose={() => setOpen(false)} title={editRow ? "Edit Post" : "Add Post"} size="lg"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></div>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            <Dropdown label="Status" options={STATUS} value={form.status} onChange={(v) => setForm({ ...form, status: v })} />
          </div>
          <Textarea label="Content" rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <FileUpload label="Cover image" accept=".jpg,.jpeg,.png,.webp" existingName={editRow?.image} onChange={setImage} />
        </div>
      </Modal>
    </div>
  );
}
