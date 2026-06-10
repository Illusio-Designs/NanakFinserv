"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PencilLine, FileText, Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import FileUpload from "@/components/ui/FileUpload";
import FileTypeIcon from "@/components/ui/FileTypeIcon";
import api, { showError, fileUrl } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import LoanStageModal from "./LoanStageModal";

const inr = (n) => (n ? "₹" + Number(String(n).replace(/[^\d.]/g, "")).toLocaleString("en-IN") : "—");
const STATUS_LABEL = {
  notAssign: "Pending", interested: "Interested", notInterested: "Not interested",
  documentselected: "Document selected", pickup: "Pickup", query: "Query", login: "Login",
  sanction: "Sanction", disbursement: "Disbursement", partPayment: "Part-payment",
  completed: "Completed", cancel: "Cancelled",
};
const STATUS_TONE = {
  notAssign: "muted", interested: "brand", notInterested: "danger", documentselected: "brand",
  pickup: "warning", query: "warning", login: "brand", sanction: "success",
  disbursement: "success", partPayment: "warning", completed: "success", cancel: "danger",
};
const lbl = (s) => STATUS_LABEL[s] || s || "—";

const norm = (r) => ({
  ...r,
  name: r.name || "—",
  mobile: r.mobile || "—",
  email: r.email || "",
  status: r.status || "notAssign",
  product: r.product || "—",
  bank: r.bankName || "—",
  amount: r.loanAmount || "",
  laon_id: r.laon_id,
  user_consumer_id: r.user_id,
  stages: r.stages || {},
  builder: r.builder || null,
  property: r.property || null,
});

const TAB_ORDER = ["notAssign", "interested", "documentselected", "login", "sanction", "disbursement", "partPayment", "completed", "cancel", "notInterested"];

export default function LoanPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [viewRow, setViewRow] = useState(null);
  const [stageRow, setStageRow] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/loan/list");
      const data = res.data?.data || [];
      setRows((Array.isArray(data) ? data : []).map(norm));
    } catch (e) { showError(e, "Could not load loans"); setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const count = (s) => rows.filter((r) => r.status === s).length;
  const tabs = useMemo(() => [
    { value: "all", label: `All (${rows.length})` },
    ...TAB_ORDER.filter((s) => count(s) > 0).map((s) => ({ value: s, label: `${lbl(s)} (${count(s)})` })),
  ], [rows]);
  const data = tab === "all" ? rows : rows.filter((r) => r.status === tab);

  const columns = useMemo(() => [
    { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "product", title: "Product" },
    { key: "bank", title: "Bank" },
    { key: "amount", title: "Loan amount", render: (r) => inr(r.amount) },
    { key: "status", title: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status] || "muted"}>{lbl(r.status)}</Badge> },
  ], []);

  return (
    <div>
      <PageHeader title="Loan" subtitle="Applications & processing pipeline" actions={<Button variant="secondary" icon={FileText} onClick={() => setConfigOpen(true)}>Document templates</Button>} />
      {!loading && tabs.length > 1 && <Tabs className="mb-4 flex-wrap" value={tab} onChange={setTab} tabs={tabs} />}

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        rowKey="laon_id"
        searchKeys={["name", "mobile", "product", "bank"]}
        filters={[{ key: "status", label: "Status" }]}
        onView={(r) => setViewRow(r)}
        rowActions={[{ icon: PencilLine, title: "Update stage", onClick: (r) => setStageRow(r) }]}
      />

      <LoanStageModal open={!!stageRow} row={stageRow} onClose={() => setStageRow(null)} onSaved={() => { setStageRow(null); load(); }} />

      <Modal open={!!viewRow} onClose={() => setViewRow(null)} title="Loan details" subtitle={viewRow?.name} size="lg">
        {viewRow && <LoanDetail d={viewRow} />}
      </Modal>

      <Modal open={configOpen} onClose={() => setConfigOpen(false)} title="Loan document templates" subtitle="Document categories + their PDFs" size="lg">
        {configOpen && <LoanConfig />}
      </Modal>
    </div>
  );
}

function LoanConfig() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [pdf, setPdf] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/data/loan/configuration");
      setRows(res.data?.data || []);
    } catch (e) { showError(e, "Could not load templates"); setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return toast.error("Category name is required");
    if (!pdf) return toast.error("Attach a PDF");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("categoryname", name);
      fd.append("pdfFile", pdf);
      await api.post("/user/loan/configuration/add", fd);
      toast.success("Template saved");
      setName(""); setPdf(null);
      load();
    } catch (e) { showError(e, "Could not save template"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line p-3">
        <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">Add template</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Category name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Salaried checklist" />
          <FileUpload label="PDF" accept=".pdf,.jpg,.jpeg,.png" onChange={setPdf} />
        </div>
        <div className="mt-3 flex justify-end"><Button size="sm" icon={Plus} loading={saving} onClick={add}>Add</Button></div>
      </div>

      <div>
        <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">Templates ({rows.length})</div>
        {loading ? <p className="text-[13px] text-muted">Loading…</p>
          : rows.length ? (
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full text-[13px]">
                <thead className="bg-subtle text-left text-muted"><tr><th className="px-3 py-2">Category</th><th className="px-3 py-2">Document</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.config_id} className="border-t border-line">
                      <td className="px-3 py-2 font-medium text-ink">{r.categoryname}</td>
                      <td className="px-3 py-2">{r.pdfname ? <a href={fileUrl(r.pdfname)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-600 hover:underline"><FileTypeIcon file={r.pdfname} size={13} />View / Download</a> : <span className="text-muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="rounded-lg border border-dashed border-line py-6 text-center text-[13px] text-muted">No templates yet.</p>}
      </div>
    </div>
  );
}

function LoanDetail({ d }) {
  const g = d.stages || {};
  const b = d.builder;
  const p = d.property;
  return (
    <div className="space-y-5 text-[14px]">
      <Section title="Consumer">
        <Row label="Name" value={d.name} />
        <Row label="Mobile" value={d.mobile} />
        <Row label="Email" value={d.email || "—"} />
        <Row label="Status" value={<Badge tone={STATUS_TONE[d.status] || "muted"}>{lbl(d.status)}</Badge>} />
        {d.assignedTo && <Row label="Assigned to" value={d.assignedTo} />}
      </Section>

      {b ? (
        <Section title="Builder / project">
          <Row label="Builder" value={b.builderuser?.company_name || "—"} />
          <Row label="Project" value={b.builderuser?.unit?.unit_name || "—"} />
          <Row label="Project address" value={b.builderuser?.unit?.address || "—"} />
          <Row label="Wing / Floor" value={[b.wing?.wing_name, b.floor?.floorNumber].filter(Boolean).join(" / ") || "—"} />
          <Row label="Office / Sq ft" value={[b.office_no, b.sqFeet].filter(Boolean).join(" · ") || "—"} />
        </Section>
      ) : (p && (p.address || p.non_builder_name)) ? (
        <Section title="Property (non-builder)">
          <Row label="Builder/Building" value={p.non_builder_name || "—"} />
          <Row label="Sq ft" value={p.sqFeet || "—"} />
          <Row label="Deed amount" value={p.deedAmount ? inr(p.deedAmount) : "—"} />
          <Row label="Address" value={p.address || "—"} />
        </Section>
      ) : null}

      {g.documentSelected && (
        <Section title="Document selected">
          <Row label="Loan type" value={g.documentSelected.loan_type || "—"} />
          <Row label="Employment" value={g.documentSelected.loan_type_name || "—"} />
          <Row label="Remarks" value={g.documentSelected.remarks_docs || "—"} />
        </Section>
      )}
      {g.login && (
        <Section title="Login">
          <Row label="Loan amount" value={inr(g.login.loanAmount)} />
          <Row label="Account no" value={g.login.loanAccountNumber || "—"} />
          <Row label="Bank / Product" value={[g.login.bankName, g.login.product].filter(Boolean).join(" · ") || "—"} />
          <Row label="SM / AM" value={[g.login.smName, g.login.amName].filter(Boolean).join(" / ") || "—"} />
          <Row label="Bank code" value={g.login.bankCode || "—"} />
          <Row label="Login date" value={g.login.loanDate ? fmtDate(g.login.loanDate) : "—"} />
        </Section>
      )}
      {g.sanction && (
        <Section title="Sanction">
          <Row label="Amount" value={inr(g.sanction.amount)} />
          <Row label="Rate / Tenure" value={[g.sanction.rate && g.sanction.rate + "%", g.sanction.tenure].filter(Boolean).join(" · ") || "—"} />
          <Row label="Sanction date" value={g.sanction.sanctionDate ? fmtDate(g.sanction.sanctionDate) : "—"} />
        </Section>
      )}
      {g.disbursement && (
        <Section title="Disbursement">
          <Row label="Amount" value={inr(g.disbursement.disbursementAmount)} />
          <Row label="Rate" value={g.disbursement.disbursementRate ? g.disbursement.disbursementRate + "%" : "—"} />
          <Row label="File no" value={g.disbursement.fileNumber || "—"} />
          <Row label="Date" value={g.disbursement.disbursementDate ? fmtDate(g.disbursement.disbursementDate) : "—"} />
          <Row label="Insurance" value={[g.disbursement.insurance, g.disbursement.insuranceAmount && inr(g.disbursement.insuranceAmount), g.disbursement.insuranceType].filter(Boolean).join(" · ") || "—"} />
        </Section>
      )}
      {g.partPayments?.length > 0 && (
        <Section title={`Part payments (${g.partPayments.length})`}>
          {g.partPayments.map((pp, i) => <Row key={i} label={`#${pp.part_number || i + 1}${pp.part_date ? " · " + fmtDate(pp.part_date) : ""}`} value={inr(pp.part_amount)} />)}
        </Section>
      )}
      {g.query && <Section title="Query"><Row label="Remarks" value={g.query.remarks || "—"} /></Section>}
      {g.cancel && <Section title="Cancelled"><Row label="Remarks" value={g.cancel.remarks_cancel || "—"} /></Section>}
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
