"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, RefreshCw, FilePlus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import Tabs from "@/components/ui/Tabs";
import Badge from "@/components/ui/Badge";
import FileTypeIcon from "@/components/ui/FileTypeIcon";
import FileUpload from "@/components/ui/FileUpload";
import Cookies from "js-cookie";
import api, { showError, fileUrl, BASE_URL } from "@/lib/api";
import { fmtDate, daysUntil, expiryCountdown } from "@/lib/format";
import { CATEGORY_IDS } from "@/config/ids";
import MediclaimPolicyModal from "./MediclaimPolicyModal";

const statusLabel = (s) => { const x = String(s || "").toLowerCase(); if (x === "running" || x === "active") return "Running"; if (["completed", "closed", "expired"].includes(x)) return "Closed"; return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—"; };
const currentStatus = (r) => {
  const n = daysUntil(r.expiry);
  if (n !== null && n < 0) return { label: "Overdue", tone: "danger" };
  if (n !== null) return { label: "Running", tone: "success" };
  return { label: statusLabel(r.runningPolicy?.status), tone: "warning" };
};
const period = (p) => { const f = p?.PolicyFrom, t = p?.PolicyTo || p?.ExpiryDate; if (!f && !t) return "—"; return `${f ? fmtDate(f) : "—"} → ${t ? fmtDate(t) : "—"}`; };

const norm = (r) => {
  const rp = r.runningPolicy || {};
  const co = r.mediclaimcompany || r.MediclaimCompany || r.mediclaim_company || {};
  const u = r.user || r.User || {};
  return {
    ...r,
    name: u.username || r.username || r.Name || r.name || "—",
    mobile: u.mobileNumber || r.mobileNumber || r.MobileNumber || "—",
    email: u.email || r.email || "—",
    company: co.mediclaim_company_name || r.company_name || "—",
    policy_number: rp.PolicyNumber || "—",
    sum: r.sumInsured || rp.SumInsured || rp.AdditionalSumInsured || "—",
    premium: rp.PremiumAmount || "—",
    mtype: r.medicliam_type || r.mediclaim_type || "—",
    expiry: rp.ExpiryDate || rp.PolicyTo || "",
    rp,
    prev: r.previousPolicies || [],
  };
};

export default function MediclaimPage() {
  const [tab, setTab] = useState("policies");
  const [rows, setRows] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [renewRow, setRenewRow] = useState(null);
  const [addPrefill, setAddPrefill] = useState(null);
  const [viewRow, setViewRow] = useState(null);

  const policyTab = ["policies", "pending", "renewals", "closed"].includes(tab);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.get("/user/mediclaim/user/list"),
        api.get("/user/list/consumer").catch(() => null),
      ]);
      const data = pRes.data?.data || pRes.data || [];
      setRows((Array.isArray(data) ? data : []).map(norm));
      setConsumers(cRes?.data?.data || []);
    } catch (e) { showError(e, "Could not load mediclaim policies"); setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (policyTab) loadAll(); }, [policyTab]);

  const in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const closedRows = useMemo(() => rows.filter((r) => daysUntil(r.expiry) !== null && daysUntil(r.expiry) < 0), [rows]);
  // Renewals = policies still valid (not overdue) — overdue ones live in Closed.
  const renewals = useMemo(() => [...rows].filter((r) => r.expiry && daysUntil(r.expiry) !== null && daysUntil(r.expiry) >= 0).sort((a, b) => String(a.expiry).localeCompare(String(b.expiry))), [rows]);
  const pending = useMemo(() => {
    const policyUserIds = new Set(rows.map((r) => r.user_id).filter(Boolean));
    const assigned = consumers
      .filter((c) => (c.category || []).some((m) => m.category_id === CATEGORY_IDS.MEDICLAIM) && !policyUserIds.has(c.user_id))
      .map((c) => ({ id: c.user_id, user_id: c.user_id, name: c.username || "—", mobile: c.mobileNumber || "—", reason: "Assigned — add policy", expiry: "" }));
    const due = rows.filter((r) => r.expiry && r.expiry.slice(0, 10) <= in30).map((r) => ({ ...r, reason: "Renewal due" }));
    return [...due, ...assigned];
  }, [rows, consumers, in30]);

  // Columns mirror the old app (Name · Mobile · Company · Sum Insured · Premium ·
  // Expiry) plus Policy No., Type and a live Status/countdown.
  const columns = useMemo(() => [
    { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "company", title: "Company" },
    { key: "policy_number", title: "Policy No." },
    { key: "mtype", title: "Type" },
    { key: "sum", title: "Sum Insured", render: (r) => r.sum && r.sum !== "—" ? `₹${r.sum}` : "—" },
    { key: "premium", title: "Premium", render: (r) => r.premium && r.premium !== "—" ? `₹${r.premium}` : "—" },
    { key: "expiry", title: "Expiry", render: (r) => r.expiry ? (<div><div>{fmtDate(r.expiry)}</div><div className="text-[11px] text-muted">{expiryCountdown(r.expiry)}</div></div>) : "—" },
    { key: "status", title: "Status", render: (r) => { const s = currentStatus(r); return <Badge tone={s.tone}>{s.label}</Badge>; } },
  ], []);

  const pendingColumns = useMemo(() => [
    { key: "name", title: "Member", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "reason", title: "Reason", render: (r) => <Badge tone={String(r.reason).includes("Renewal") ? "warning" : "success"}>{r.reason}</Badge> },
    { key: "when", title: "When", render: (r) => String(r.reason).includes("Renewal") ? <span className={daysUntil(r.expiry) < 0 ? "font-medium text-red-600" : "text-ink"}>{expiryCountdown(r.expiry)}</span> : "—" },
    { key: "act", title: "", render: (r) => String(r.reason).includes("Renewal") ? <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => setRenewRow(r)}>Renew</Button> : <Button size="sm" icon={FilePlus} onClick={() => setAddPrefill(r.mobile)}>Add record</Button> },
  ], []);

  return (
    <div>
      <PageHeader title="Mediclaim" subtitle="Policies, renewals, companies & products" actions={policyTab ? <Button icon={Plus} onClick={() => setAddOpen(true)}>Add Policy</Button> : null} />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[
        { value: "policies", label: "Policies" },
        { value: "pending", label: `Pending${pending.length ? ` (${pending.length})` : ""}` },
        { value: "renewals", label: `Renewals${renewals.length ? ` (${renewals.length})` : ""}` },
        { value: "closed", label: `Closed${closedRows.length ? ` (${closedRows.length})` : ""}` },
        { value: "companies", label: "Companies" },
        { value: "products", label: "Products" },
      ]} />

      {tab === "policies" && (
        <DataTable columns={columns} data={rows} loading={loading} rowKey="id"
          searchKeys={["name", "mobile", "company", "policy_number"]}
          filters={[{ key: "status", label: "Status" }, { key: "mtype", label: "Type" }]}
          onView={(r) => setViewRow(r)} onEdit={(r) => setEditRow(r)}
          rowActions={[{ icon: FilePlus, title: "Add next / renew", onClick: (r) => setRenewRow(r) }]} />
      )}
      {tab === "pending" && <DataTable columns={pendingColumns} data={pending} loading={loading} rowKey="id" searchKeys={["name", "mobile", "reason"]} filters={[{ key: "reason", label: "Reason" }]} onView={(r) => r.rp && setViewRow(r)} />}
      {tab === "renewals" && (
        <DataTable columns={columns} data={renewals} loading={loading} rowKey="id"
          searchKeys={["name", "mobile", "company"]} filters={[{ key: "expiry", label: "Expiry", type: "dateRange" }]}
          onView={(r) => setViewRow(r)} rowActions={[{ icon: FilePlus, title: "Add next / renew", onClick: (r) => setRenewRow(r) }]} />
      )}
      {tab === "closed" && <DataTable columns={columns} data={closedRows} loading={loading} rowKey="id" searchKeys={["name", "mobile", "company"]} onView={(r) => setViewRow(r)} rowActions={[{ icon: FilePlus, title: "Renew", onClick: (r) => setRenewRow(r) }]} />}
      {tab === "companies" && <Companies />}
      {tab === "products" && <Products />}

      <MediclaimPolicyModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={loadAll} />
      <MediclaimPolicyModal open={!!addPrefill} prefillMobile={addPrefill} onClose={() => setAddPrefill(null)} onSaved={() => { setAddPrefill(null); loadAll(); }} />
      <MediclaimPolicyModal open={!!editRow} editRow={editRow} onClose={() => setEditRow(null)} onSaved={loadAll} />
      <MediclaimPolicyModal open={!!renewRow} editRow={renewRow} renewMode onClose={() => setRenewRow(null)} onSaved={loadAll} />

      <Modal open={!!viewRow} onClose={() => setViewRow(null)} title="Mediclaim policy" subtitle={viewRow?.name} size="lg">
        {viewRow && <MediclaimDetail d={viewRow} />}
      </Modal>
    </div>
  );
}

function MediclaimDetail({ d }) {
  const rp = d.rp || {};
  const prev = [...(d.prev || [])].sort((a, b) => String(b.PolicyTo || b.ExpiryDate || "").localeCompare(String(a.PolicyTo || a.ExpiryDate || "")));
  const s = currentStatus(d);
  return (
    <div className="space-y-5 text-[14px]">
      <Section title="Member & policy">
        <Row label="Member" value={d.name} />
        <Row label="Mobile" value={d.mobile} />
        <Row label="Email" value={d.email} />
        <Row label="Type" value={d.mtype} />
        <Row label="Company" value={d.company} />
        <Row label="Sum Insured" value={d.sum} />
      </Section>
      <Section title="Current policy">
        <Row label="Policy No." value={rp.PolicyNumber || "—"} />
        <Row label="Premium" value={rp.PremiumAmount ? `₹${rp.PremiumAmount}` : "—"} />
        <Row label="Period" value={period(rp)} />
        <Row label="Expiry" value={d.expiry ? `${fmtDate(d.expiry)} · ${expiryCountdown(d.expiry)}` : "—"} />
        <Row label="Zone" value={rp.Zone || "—"} />
        <Row label="Add-on cover" value={rp.AddOnCover || "—"} />
        <Row label="Policy tenure" value={rp.PolicyTenure ? `${rp.PolicyTenure} yr` : "—"} />
        <Row label="Nominee" value={rp.NomineeName ? `${rp.NomineeName}${rp.NomineeRelation ? ` (${rp.NomineeRelation})` : ""}${rp.NomineeAge ? ` · ${rp.NomineeAge}y` : ""}` : "—"} />
        <Row label="Status" value={<Badge tone={s.tone}>{s.label}</Badge>} />
        {fileUrl(rp.CurrentPolicyFile || rp.PdfFile) && (
          <Row label="Policy PDF" value={<span className="flex items-center gap-3"><FileTypeIcon file={rp.CurrentPolicyFile || rp.PdfFile} size={14} /><a className="text-ink hover:underline" href={fileUrl(rp.CurrentPolicyFile || rp.PdfFile)} target="_blank" rel="noopener noreferrer">View</a><a className="text-brand-600 hover:underline" href={fileUrl(rp.CurrentPolicyFile || rp.PdfFile)} download>Download</a></span>} />
        )}
      </Section>
      <div>
        <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">Past journey ({prev.length})</div>
        {prev.length ? (
          <div className="space-y-2">
            {prev.map((p, i) => {
              const url = fileUrl(p.CurrentPolicyFile || p.PdfFile);
              return (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
                  <div className="min-w-0">
                    <div className="font-medium text-ink">{p.PolicyNumber || `Policy ${i + 1}`}{p.CompanyName ? ` · ${p.CompanyName}` : ""}</div>
                    <div className="text-[12px] text-muted">{period(p)}{p.PremiumAmount ? ` · ₹${p.PremiumAmount}` : ""}{p.SumInsured ? ` · SI ₹${p.SumInsured}` : ""}</div>
                  </div>
                  {url ? (
                    <a href={url} download className="press flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-[12px] text-brand-600 hover:bg-subtle"><FileTypeIcon file={p.CurrentPolicyFile || p.PdfFile} size={12} />Download</a>
                  ) : <span className="rounded-md border border-dashed border-line px-2.5 py-1 text-[12px] text-muted/60">No PDF</span>}
                </div>
              );
            })}
          </div>
        ) : <p className="rounded-lg border border-line p-3 text-[13px] text-muted">No previous policies.</p>}
      </div>
      {(d.familymembers?.length > 0) && (
        <Section title={`Members (${d.familymembers.length})`}>
          {d.familymembers.map((m, i) => (
            <Row key={i} label={m.FamilyName || `Member ${i + 1}`} value={[m.RelationshipWithPolicyHolder, m.Gender, m.DateOfBirth ? fmtDate(m.DateOfBirth) : null].filter(Boolean).join(" · ") || "—"} />
          ))}
        </Section>
      )}
      {(d.employees?.length > 0) && (
        <Section title={`Employees (${d.employees.length})`}>
          {d.employees.map((e, i) => (
            <Row key={i} label={e.EmployeeName || `Employee ${i + 1}`} value={[e.RelationshipWithPolicyHolder, e.Gender, e.DateOfBirth ? fmtDate(e.DateOfBirth) : null].filter(Boolean).join(" · ") || "—"} />
          ))}
        </Section>
      )}
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

function Companies() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/mediclaim/company");
      setRows((res.data?.data || []).map((r) => ({ ...r, name: r.mediclaim_company_name })));
    } catch (e) { showError(e, "Could not load companies"); setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      if (editRow) await api.put("/user/mediclaim/company/update", { mediclaim_company_id: editRow.mediclaim_company_id, mediclaim_company_name: name });
      else await api.post("/user/mediclaim/company/add", { mediclaim_company_name: name });
      toast.success(editRow ? "Company updated" : "Company added");
      setOpen(false); setEditRow(null); setName("");
      load();
    } catch (e) { showError(e, "Could not save company"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button icon={Plus} onClick={() => { setEditRow(null); setName(""); setOpen(true); }}>Add Company</Button>
      </div>
      <DataTable columns={[{ key: "name", title: "Company", render: (r) => <span className="font-medium">{r.name}</span> }]} data={rows} loading={loading} rowKey="mediclaim_company_id" searchKeys={["name"]} onEdit={(r) => { setEditRow(r); setName(r.mediclaim_company_name || ""); setOpen(true); }} />
      <Modal open={open} onClose={() => setOpen(false)} title={editRow ? "Edit Company" : "Add Company"} size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></div>}>
        <Input label="Company Name" value={name} onChange={(e) => setName(e.target.value)} />
      </Modal>
    </div>
  );
}

function Products() {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pdfs, setPdfs] = useState([]); // product brochure/policy PDFs
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/user/mediclaim/company").then((r) => setCompanies((r.data?.data || []).map((c) => ({ value: c.mediclaim_company_id, label: c.mediclaim_company_name })))).catch(() => setCompanies([]));
  }, []);

  const loadProducts = async (cid) => {
    if (!cid) { setRows([]); return; }
    setLoading(true);
    try {
      const res = await api.get(`/user/mediclaim/product/${cid}`);
      setRows((res.data?.data || []).map((r) => ({ ...r, name: r.mediclaim_product_name })));
    } catch (e) { showError(e, "Could not load products"); setRows([]); }
    finally { setLoading(false); }
  };
  const onCompany = (v) => { setCompanyId(v); loadProducts(v); };

  const save = async () => {
    if (!companyId) return toast.error("Select a company first");
    if (!name.trim()) return toast.error("Product name is required");
    setSaving(true);
    try {
      let payload;
      if (pdfs.length) {
        const fd = new FormData();
        fd.append("mediclaim_product_name", name);
        pdfs.forEach((f, i) => fd.append(`pdf${i}`, f)); // backend reads keys starting with "pdf"
        payload = fd;
      } else {
        payload = { mediclaim_product_name: name };
      }
      await api.post(`/user/mediclaim/product/add/${companyId}`, payload);
      toast.success("Product added");
      setOpen(false); setName(""); setPdfs([]);
      loadProducts(companyId);
    } catch (e) { showError(e, "Could not add product"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:w-72"><Dropdown searchable label="Company" placeholder="Select a company" options={companies} value={companyId} onChange={onCompany} /></div>
        <Button icon={Plus} disabled={!companyId} onClick={() => { setName(""); setOpen(true); }}>Add Product</Button>
      </div>
      {companyId ? (
        <DataTable columns={[
          { key: "name", title: "Product", render: (r) => <span className="font-medium">{r.name}</span> },
          { key: "pdfs", title: "Brochure / PDF", render: (r) => {
            const list = r.mediclaimproductpdfs || r.mediclaimProductPdfs || [];
            if (!list.length) return <span className="text-muted">—</span>;
            return <span className="flex flex-wrap items-center gap-2">{list.map((p, i) => {
              const url = `${BASE_URL}${String(p.pdf_path || "").startsWith("/") ? "" : "/"}${p.pdf_path}?token=${encodeURIComponent(Cookies.get("token") || "")}`;
              return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[12px] text-brand-600 hover:underline"><FileTypeIcon file={p.pdf_name} size={12} />{p.pdf_name}</a>;
            })}</span>;
          } },
        ]} data={rows} loading={loading} rowKey="mediclaim_product_id" searchKeys={["name"]} />
      ) : (
        <p className="rounded-lg border border-dashed border-line py-10 text-center text-[13px] text-muted">Select a company to view its products.</p>
      )}
      <Modal open={open} onClose={() => { setOpen(false); setPdfs([]); }} title="Add Product" size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => { setOpen(false); setPdfs([]); }}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></div>}>
        <div className="space-y-4">
          <Input label="Product Name" value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <FileUpload label="Product brochure / PDF (optional)" accept=".pdf,.jpg,.jpeg,.png" onChange={(f) => f && setPdfs((p) => [...p, f])} />
            {pdfs.length > 0 && (
              <ul className="mt-2 space-y-1">
                {pdfs.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border border-line px-2.5 py-1.5 text-[12px]">
                    <span className="flex items-center gap-2 truncate"><FileTypeIcon file={f.name} size={13} />{f.name}</span>
                    <button type="button" className="text-muted hover:text-danger" onClick={() => setPdfs((p) => p.filter((_, idx) => idx !== i))}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
