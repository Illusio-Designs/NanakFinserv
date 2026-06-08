"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, UserPlus, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import StepperModal from "@/components/ui/StepperModal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import Checkbox from "@/components/ui/Checkbox";
import Badge from "@/components/ui/Badge";
import api, { showError } from "@/lib/api";
import { CATEGORY_IDS } from "@/config/ids";
import { firstError, field, checks } from "@/utils/validators";
import ConsumerManageModal from "./ConsumerManageModal";

const VERTICALS = [
  { key: "loan", label: "Loan", id: CATEGORY_IDS.LOAN },
  { key: "mediclaim", label: "Mediclaim", id: CATEGORY_IDS.MEDICLAIM },
  { key: "life", label: "Life Insurance", id: CATEGORY_IDS.LIFE_INSURANCE },
  { key: "vehicle", label: "Vehicle", id: CATEGORY_IDS.VEHICLE },
];

const emptyForm = { username: "", email: "", phone_number: "", referenceName: "" };

export default function ConsumersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [picked, setPicked] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [manageRow, setManageRow] = useState(null);
  const [familyList, setFamilyList] = useState([]);
  const [famDraft, setFamDraft] = useState({ username: "", phone_number: "", email: "", picked: {} });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/list/consumer");
      const data = (res.data?.data || []).map((u) => ({
        ...u,
        services: (u.category || []).length,
        family: u.family_member_count || 0,
      }));
      setRows(data);
    } catch (e) {
      showError(e, "Could not load consumers");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { key: "username", title: "Name", render: (r) => <span className="font-medium">{r.username || "—"}</span> },
      { key: "email", title: "Email" },
      { key: "mobileNumber", title: "Mobile" },
      {
        key: "services",
        title: "Services",
        render: (r) => (r.services ? <Badge tone="brand">{r.services}</Badge> : "—"),
      },
      {
        key: "family",
        title: "Family",
        render: (r) => (r.family ? <Badge tone="success">👨‍👩‍👧 {r.family}</Badge> : "—"),
      },
    ],
    []
  );

  const openAdd = () => {
    setForm(emptyForm);
    setPicked({});
    setFamilyList([]);
    setFamDraft({ username: "", phone_number: "", email: "", picked: {} });
    setAddOpen(true);
  };

  const addFamilyToList = () => {
    if (!famDraft.username.trim()) return toast.error("Family member name is required");
    if (!/^\d{10}$/.test(famDraft.phone_number)) return toast.error("Valid 10-digit mobile is required");
    setFamilyList((list) => [...list, famDraft]);
    setFamDraft({ username: "", phone_number: "", email: "", picked: {} });
  };

  const submitAdd = async () => {
    setSubmitting(true);
    try {
      const category = VERTICALS.filter((v) => picked[v.key]).map((v) => ({ category_id: v.id }));
      const res = await api.post("/user/data/add/consumer", { ...form, category });
      const headId = res.data?.userData?.user_id;

      // Create any family members entered in the flow.
      if (headId && familyList.length) {
        for (const fam of familyList) {
          const famCategory = VERTICALS.filter((v) => fam.picked[v.key]).map((v) => ({ category_id: v.id }));
          try {
            await api.post("/user/data/consumer/family/add", {
              head_user_id: headId,
              username: fam.username,
              phone_number: fam.phone_number,
              email: fam.email,
              category: famCategory,
            });
          } catch (e) {
            showError(e, `Could not add family member ${fam.username}`);
          }
        }
      }

      toast.success(`Consumer added${familyList.length ? ` with ${familyList.length} family member(s)` : ""}`);
      setAddOpen(false);
      load();
    } catch (e) {
      showError(e, "Could not add consumer");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async () => {
    setSubmitting(true);
    try {
      await api.put("/user/data/update/consumer", { user_id: editRow.user_id, ...form });
      toast.success("Consumer updated");
      setEditRow(null);
      load();
    } catch (e) {
      showError(e, "Could not update consumer");
    } finally {
      setSubmitting(false);
    }
  };

  // Stepper steps for the Add flow
  const steps = [
    {
      title: "Details",
      validate: () => {
        const err = firstError(
          [
            field("username", { label: "Name", required: true }),
            field("email", { label: "Email", required: true, checks: [checks.email] }),
            field("phone_number", { label: "Mobile number", required: true, checks: [checks.mobile10] }),
          ],
          form
        );
        if (err) {
          toast.error(err);
          return err;
        }
        return true;
      },
      render: () => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Name" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <PhoneInput label="Mobile Number" value={form.phone_number} onChange={(v) => setForm({ ...form, phone_number: v })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Reference" value={form.referenceName} onChange={(e) => setForm({ ...form, referenceName: e.target.value })} />
        </div>
      ),
    },
    {
      title: "Services",
      render: () => (
        <div className="grid grid-cols-2 gap-3">
          {VERTICALS.map((v) => (
            <label
              key={v.key}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                picked[v.key] ? "border-brand-600 bg-brand-50" : "border-line hover:bg-subtle"
              }`}
            >
              <input
                type="checkbox"
                checked={!!picked[v.key]}
                onChange={(e) => setPicked({ ...picked, [v.key]: e.target.checked })}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="text-[14px] font-medium">{v.label}</span>
            </label>
          ))}
        </div>
      ),
    },
    {
      title: "Family",
      render: () => (
        <div className="space-y-4">
          <p className="text-[13px] text-muted">Optionally add family members — they're created as linked consumers (mapped by mobile).</p>

          {familyList.length > 0 && (
            <div className="space-y-2">
              {familyList.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-line p-3">
                  <div>
                    <div className="text-[14px] font-medium text-ink">{f.username}</div>
                    <div className="text-[12px] text-muted">
                      {f.phone_number}
                      {VERTICALS.filter((v) => f.picked[v.key]).length ? ` · ${VERTICALS.filter((v) => f.picked[v.key]).map((v) => v.label).join(", ")}` : ""}
                    </div>
                  </div>
                  <button type="button" onClick={() => setFamilyList((list) => list.filter((_, j) => j !== i))} className="press rounded p-1.5 text-muted hover:text-danger">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-dashed border-line bg-subtle/40 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Name" value={famDraft.username} onChange={(e) => setFamDraft({ ...famDraft, username: e.target.value })} />
              <PhoneInput label="Mobile Number" value={famDraft.phone_number} onChange={(v) => setFamDraft({ ...famDraft, phone_number: v })} />
              <Input label="Email" value={famDraft.email} onChange={(e) => setFamDraft({ ...famDraft, email: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-4">
              {VERTICALS.map((v) => (
                <Checkbox key={v.key} label={v.label} checked={!!famDraft.picked[v.key]} onChange={(c) => setFamDraft({ ...famDraft, picked: { ...famDraft.picked, [v.key]: c } })} />
              ))}
            </div>
            <div className="flex justify-end">
              <Button size="sm" icon={UserPlus} onClick={addFamilyToList}>Add to list</Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Review",
      render: () => (
        <div className="space-y-2 text-[14px]">
          <Row label="Name" value={form.username} />
          <Row label="Mobile" value={form.phone_number} />
          <Row label="Email" value={form.email} />
          <Row label="Reference" value={form.referenceName || "—"} />
          <Row label="Services" value={VERTICALS.filter((v) => picked[v.key]).map((v) => v.label).join(", ") || "None"} />
          <Row label="Family members" value={familyList.length ? familyList.map((f) => f.username).join(", ") : "None"} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Consumers"
        subtitle="Manage consumers and their services"
        actions={<Button icon={Plus} onClick={openAdd}>Add Consumer</Button>}
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        rowKey="user_id"
        searchKeys={["username", "email", "mobileNumber"]}
        filters={[
          { key: "services", label: "Services", options: [
            { value: "0", label: "None" }, { value: "1", label: "1" }, { value: "2", label: "2" },
            { value: "3", label: "3" }, { value: "4", label: "4" },
          ] },
        ]}
        onEdit={(r) => {
          setEditRow(r);
          setForm({ username: r.username || "", email: r.email || "", phone_number: r.mobileNumber || "", referenceName: r.referenceName || "" });
        }}
        onView={(r) => setManageRow(r)}
      />

      {/* Add — stepper modal */}
      <StepperModal open={addOpen} onClose={() => setAddOpen(false)} title="Add Consumer" steps={steps} onSubmit={submitAdd} submitting={submitting} />

      {/* Edit — simple modal */}
      <Modal
        open={!!editRow}
        onClose={() => setEditRow(null)}
        title="Edit Consumer"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditRow(null)}>Cancel</Button>
            <Button onClick={submitEdit} loading={submitting}>Save</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Name" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <PhoneInput label="Mobile Number" value={form.phone_number} onChange={(v) => setForm({ ...form, phone_number: v })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Reference" value={form.referenceName} onChange={(e) => setForm({ ...form, referenceName: e.target.value })} />
        </div>
      </Modal>

      {/* Manage — family + documents (tabbed) */}
      <ConsumerManageModal
        consumer={manageRow}
        open={!!manageRow}
        onClose={() => setManageRow(null)}
        onChanged={load}
      />
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
