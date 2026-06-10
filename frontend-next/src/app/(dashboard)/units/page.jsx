"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Building2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import api, { showError } from "@/lib/api";

const LOAN_LABEL = { notAssign: "Pending", interested: "Interested", notInterested: "Not interested", documentselected: "Document selected", pickup: "Pickup", query: "Query", login: "Login", sanction: "Sanction", disbursement: "Disbursement", partPayment: "Part-payment", completed: "Completed", cancel: "Cancelled" };
const LOAN_TONE = { notAssign: "muted", interested: "brand", notInterested: "danger", documentselected: "brand", pickup: "warning", query: "warning", login: "brand", sanction: "success", disbursement: "success", partPayment: "warning", completed: "success", cancel: "danger" };
const loanLbl = (s) => LOAN_LABEL[s] || s || "—";

export default function UnitsPage() {
  const [rows, setRows] = useState([]);
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ builder_id: "", unit_name: "", address: "" });
  const [saving, setSaving] = useState(false);
  // Building detail (consumers + loan status)
  const [detailUnit, setDetailUnit] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/data/builder/unit");
      const d = res.data?.data || res.data || [];
      setRows((Array.isArray(d) ? d : []).map((u) => ({
        ...u,
        name: u.unit_name || "—",
        company: u.builder_name || u["builderuser.company_name"] || u.builderuser?.company_name || u.company_name || "—",
        addr: u.address || "—",
      })));
    } catch (e) { showError(e, "Could not load units"); setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    api.get("/user/list/builder").then((r) => setBuilders((r.data?.data || []).map((b) => ({ value: b.builder_id || b.user_id, label: b.company_name || b.username || b.mobileNumber })))).catch(() => setBuilders([]));
  }, []);

  const openDetail = async (u) => {
    setDetailUnit(u); setDetail(null); setDetailLoading(true);
    try {
      const res = await api.post("/user/data/builder/getunitwithconsumer", { unit_id: u.unit_id });
      setDetail((res.data?.data || [])[0] || { consumerList: [] });
    } catch (e) { showError(e, "Could not load building"); setDetail({ consumerList: [] }); }
    finally { setDetailLoading(false); }
  };

  const columns = useMemo(() => [
    { key: "name", title: "Building / Unit", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "company", title: "Builder" },
    { key: "addr", title: "Address" },
  ], []);

  const save = async () => {
    if (!form.builder_id) return toast.error("Select a builder");
    if (!form.unit_name.trim()) return toast.error("Building name is required");
    setSaving(true);
    try {
      await api.post("/user/data/add/builderUnit", { builder_id: form.builder_id, unit_name: form.unit_name, address: form.address, unit_categories: [] });
      toast.success("Building added");
      setOpen(false); setForm({ builder_id: "", unit_name: "", address: "" });
      load();
    } catch (e) { showError(e, "Could not add building"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Buildings / Units" subtitle="Builder buildings & their consumers" actions={<Button icon={Plus} onClick={() => { setForm({ builder_id: "", unit_name: "", address: "" }); setOpen(true); }}>Add Building</Button>} />
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        rowKey="unit_id"
        searchKeys={["name", "company", "addr"]}
        rowActions={[{ icon: Building2, title: "View consumers & status", onClick: openDetail }]}
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Add Building" size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></div>}>
        <div className="space-y-4">
          <Dropdown label="Builder" placeholder="Select builder" options={builders} value={form.builder_id} onChange={(v) => setForm({ ...form, builder_id: v })} searchable />
          <Input label="Building / Unit Name" value={form.unit_name} onChange={(e) => setForm({ ...form, unit_name: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
      </Modal>

      {/* Building detail: consumers + loan status */}
      <Modal open={!!detailUnit} onClose={() => { setDetailUnit(null); setDetail(null); }} title={`Building — ${detailUnit?.name || ""}`} subtitle={detailUnit?.company} size="lg">
        {detailLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : detail ? (
          <BuildingDetail d={detail} unit={detailUnit} />
        ) : null}
      </Modal>
    </div>
  );
}

function BuildingDetail({ d, unit }) {
  const consumers = (d.consumerList || []).map((c) => ({
    name: c["user.username"] || c.user?.username || c.username || "—",
    mobile: c["user.mobileNumber"] || c.user?.mobileNumber || c.mobileNumber || "—",
    status: c["user.user_pk_id.status"] || c.user?.user_pk_id?.status || c["user_pk_id.status"] || null,
  }));
  const cats = [
    ["Showroom", d.Showroom], ["Office", d.Office], ["Flat", d.Flat], ["House", d.House],
  ].filter(([, v]) => Array.isArray(v) && v.length);

  return (
    <div className="space-y-5 text-[14px]">
      <Section title="Building">
        <Row label="Name" value={unit?.name || d.unit_name} />
        <Row label="Builder" value={unit?.company || "—"} />
        <Row label="Address" value={d.address || unit?.addr || "—"} />
        <Row label="Consumers" value={String(consumers.length)} />
      </Section>

      {cats.length > 0 && (
        <Section title="Categories (wings)">
          {cats.map(([name, wings]) => (
            <Row key={name} label={name} value={wings.map((w) => w.wingName).filter(Boolean).join(", ") || `${wings.length} wing(s)`} />
          ))}
        </Section>
      )}

      <div>
        <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">Consumers &amp; loan status ({consumers.length})</div>
        {consumers.length ? (
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-[13px]">
              <thead className="bg-subtle text-left text-muted">
                <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Mobile</th><th className="px-3 py-2">Loan status</th></tr>
              </thead>
              <tbody>
                {consumers.map((c, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-3 py-2 font-medium text-ink">{c.name}</td>
                    <td className="px-3 py-2">{c.mobile}</td>
                    <td className="px-3 py-2">{c.status ? <Badge tone={LOAN_TONE[c.status] || "muted"}>{loanLbl(c.status)}</Badge> : <span className="text-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="rounded-lg border border-dashed border-line py-6 text-center text-[13px] text-muted">No consumers in this building yet.</p>}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">{title}</div>
      <div className="rounded-lg border border-line p-3">{children}</div>
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line py-1.5 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
