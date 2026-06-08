"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, FileText, ExternalLink, UserPlus, Crown } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Tabs from "@/components/ui/Tabs";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import Dropdown from "@/components/ui/Dropdown";
import Checkbox from "@/components/ui/Checkbox";
import FileUpload from "@/components/ui/FileUpload";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import api, { showError, BASE_URL } from "@/lib/api";
import { CATEGORY_IDS, DOCUMENT_IDS } from "@/config/ids";

const VERTICALS = [
  { key: "loan", label: "Loan", id: CATEGORY_IDS.LOAN },
  { key: "mediclaim", label: "Mediclaim", id: CATEGORY_IDS.MEDICLAIM },
  { key: "life", label: "Life Insurance", id: CATEGORY_IDS.LIFE_INSURANCE },
  { key: "vehicle", label: "Vehicle", id: CATEGORY_IDS.VEHICLE },
];

const DOC_OPTS = [
  { value: DOCUMENT_IDS.AADHAR, label: "Aadhar Card" },
  { value: DOCUMENT_IDS.PAN, label: "PAN Card" },
  { value: DOCUMENT_IDS.GST, label: "GST Certificate" },
  { value: DOCUMENT_IDS.RC_BOOK, label: "RC Book" },
];

export default function ConsumerManageModal({ consumer, open, onClose, onChanged }) {
  const [tab, setTab] = useState("family");

  return (
    <Modal open={open} onClose={onClose} title={consumer ? `Manage — ${consumer.username || consumer.mobileNumber}` : "Manage"} subtitle="Family members & KYC documents" size="lg">
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[{ value: "family", label: "Family" }, { value: "documents", label: "Documents" }]}
      />
      {consumer && tab === "family" && <FamilyTab consumer={consumer} onChanged={onChanged} />}
      {consumer && tab === "documents" && <DocumentsTab consumer={consumer} />}
    </Modal>
  );
}

/* ---------------- Family ---------------- */
function FamilyTab({ consumer, onChanged }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ username: "", phone_number: "", email: "" });
  const [picked, setPicked] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/user/household/${consumer.mobileNumber}`);
      setMembers(res.data?.data?.members || []);
    } catch (e) {
      showError(e, "Could not load family");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [consumer?.mobileNumber]);

  const add = async () => {
    if (!form.username.trim()) return toast.error("Name is required");
    if (!/^\d{10}$/.test(form.phone_number)) return toast.error("Valid 10-digit mobile is required");
    setSaving(true);
    try {
      const category = VERTICALS.filter((v) => picked[v.key]).map((v) => ({ category_id: v.id }));
      await api.post("/user/data/consumer/family/add", { head_user_id: consumer.user_id, ...form, category });
      toast.success("Family member added");
      setForm({ username: "", phone_number: "", email: "" });
      setPicked({});
      setShowAdd(false);
      load();
      onChanged?.();
    } catch (e) {
      showError(e, "Could not add family member");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-muted">{members.length} member(s) in this household</span>
        <Button size="sm" icon={UserPlus} onClick={() => setShowAdd((s) => !s)}>Add Family Member</Button>
      </div>

      {showAdd && (
        <div className="space-y-3 rounded-lg border border-line bg-subtle/40 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Name" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <PhoneInput label="Mobile Number" value={form.phone_number} onChange={(v) => setForm({ ...form, phone_number: v })} />
            <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="flex flex-wrap gap-4">
            {VERTICALS.map((v) => (
              <Checkbox key={v.key} label={v.label} checked={!!picked[v.key]} onChange={(c) => setPicked({ ...picked, [v.key]: c })} />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={add} loading={saving}>Save member</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {members.map((m) => {
          const p = m.policies || {};
          const counts = [
            ["Vehicle", p.vehicle?.length], ["Loan", p.loan?.length],
            ["Mediclaim", p.mediclaim?.length], ["Life", p.life?.length],
          ].filter(([, n]) => n);
          return (
            <div key={m.user_id} className="flex items-center justify-between rounded-lg border border-line p-3">
              <div>
                <div className="flex items-center gap-2 text-[14px] font-medium text-ink">
                  {m.username || "—"}
                  {m.isHead && <Badge tone="brand"><Crown size={11} className="mr-1 inline" />Head</Badge>}
                </div>
                <div className="text-[12px] text-muted">{m.mobileNumber}{m.email ? ` · ${m.email}` : ""}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {counts.length ? counts.map(([l, n]) => <Badge key={l} tone="success">{l}: {n}</Badge>) : <span className="text-[12px] text-muted">No policies</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Documents ---------------- */
function DocumentsTab({ consumer }) {
  const [docs, setDocs] = useState([]);
  const [userId, setUserId] = useState(consumer.user_id);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/user/consumer/documents/by-mobile/${consumer.mobileNumber}`);
      setDocs(res.data?.data || []);
      if (res.data?.user_id) setUserId(res.data.user_id);
    } catch (e) {
      showError(e, "Could not load documents");
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [consumer?.mobileNumber]);

  const upload = async () => {
    if (!docType) return toast.error("Select a document type");
    if (!file) return toast.error("Choose a file");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("user_id", userId);
      fd.append("categoryId", docType);
      fd.append("file", file);
      await api.post("/user/consumer/documents/upload", fd);
      toast.success("Document uploaded");
      setDocType("");
      setFile(null);
      load();
    } catch (e) {
      showError(e, "Could not upload document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted">KYC documents are stored on the consumer and reused across all policies.</p>

      {loading ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : docs.length ? (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.id || d.categoryId} className="flex items-center justify-between rounded-lg border border-line p-3">
              <span className="flex items-center gap-2 text-[14px] text-ink"><FileText size={15} className="text-brand-600" />{d.documents?.doc_name || "Document"}</span>
              {d.file && (
                <a href={`${BASE_URL}/${d.file}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[13px] text-brand-600 hover:underline">
                  View <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-line py-6 text-center text-[13px] text-muted">No documents uploaded yet.</p>
      )}

      <div className="space-y-3 rounded-lg border border-line bg-subtle/40 p-4">
        <div className="text-[13px] font-medium text-ink">Upload a document</div>
        <Dropdown placeholder="Document type" options={DOC_OPTS} value={docType} onChange={setDocType} />
        <FileUpload accept=".pdf,.jpg,.jpeg,.png" onChange={setFile} />
        <div className="flex justify-end">
          <Button size="sm" icon={Plus} onClick={upload} loading={saving}>Upload</Button>
        </div>
      </div>
    </div>
  );
}
