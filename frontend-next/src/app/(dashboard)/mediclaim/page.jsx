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
import Tabs from "@/components/ui/Tabs";
import { Plus as PlusIcon } from "lucide-react";
import api, { showError } from "@/lib/api";
import MediclaimPolicyModal from "./MediclaimPolicyModal";

export default function MediclaimPage() {
  const [tab, setTab] = useState("policies");
  return (
    <div>
      <PageHeader title="Mediclaim" subtitle="Policies, companies & products" />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "policies", label: "Policies" },
          { value: "pending", label: "Pending" },
          { value: "renewals", label: "Renewals" },
          { value: "companies", label: "Companies" },
          { value: "products", label: "Products" },
        ]}
      />
      {tab === "policies" && <Policies />}
      {tab === "pending" && <Renewals dueWithinDays={30} title="Renewals due in 30 days" />}
      {tab === "renewals" && <Renewals />}
      {tab === "companies" && <Companies />}
      {tab === "products" && <Products />}
    </div>
  );
}

function Policies() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/mediclaim/user/list");
      const d = res.data?.data || res.data || [];
      setRows((Array.isArray(d) ? d : []).map((r) => ({ ...r, name: r.username || r.Name || r.name || "—", mobile: r.mobileNumber || r.MobileNumber || "—", email: r.email || "—" })));
    } catch (e) { showError(e, "Could not load policies"); setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button icon={PlusIcon} onClick={() => setAddOpen(true)}>Add Policy</Button>
      </div>
      <DataTable
        columns={[
          { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
          { key: "mobile", title: "Mobile" },
          { key: "email", title: "Email" },
        ]}
        data={rows}
        loading={loading}
        rowKey="user_id"
        searchKeys={["name", "mobile", "email"]}
      />
      <MediclaimPolicyModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} />
    </div>
  );
}

function Renewals({ dueWithinDays, title } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        // Wide window so all upcoming/expiring policies surface.
        const res = await api.post("/user/mediclaim/user/renewal/list", { startDate: "2000-01-01", endDate: "2100-01-01" });
        const d = res.data?.data || [];
        let mapped = (Array.isArray(d) ? d : []).map((r) => ({
          ...r,
          name: r.username || r.user_name || r.name || "—",
          mobile: r.mobileNumber || r.mobile || "—",
          expiry: r.runningPolicy?.ExpiryDate || r.ExpiryDate || "—",
        }));
        if (dueWithinDays) {
          const todayISO = new Date().toISOString().slice(0, 10);
          const limit = new Date(Date.now() + dueWithinDays * 864e5).toISOString().slice(0, 10);
          mapped = mapped.filter((r) => r.expiry && r.expiry !== "—" && String(r.expiry).slice(0, 10) >= todayISO && String(r.expiry).slice(0, 10) <= limit);
        }
        setRows(mapped);
      } catch (e) { showError(e, "Could not load renewals"); setRows([]); }
      finally { setLoading(false); }
    })();
  }, [dueWithinDays]);
  return (
    <>
      {title && <p className="mb-2 text-[13px] text-muted">{title}</p>}
    <DataTable
      columns={[
        { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "mobile", title: "Mobile" },
        { key: "expiry", title: "Expiry" },
      ]}
      data={rows}
      loading={loading}
      rowKey="id"
      searchKeys={["name", "mobile"]}
      filters={[{ key: "expiry", label: "Expiry", type: "dateRange" }]}
    />
    </>
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
      <DataTable
        columns={[{ key: "name", title: "Company", render: (r) => <span className="font-medium">{r.name}</span> }]}
        data={rows}
        loading={loading}
        rowKey="mediclaim_company_id"
        searchKeys={["name"]}
        onEdit={(r) => { setEditRow(r); setName(r.mediclaim_company_name || ""); setOpen(true); }}
      />
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
      await api.post(`/user/mediclaim/product/add/${companyId}`, { mediclaim_product_name: name });
      toast.success("Product added");
      setOpen(false); setName("");
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
        <DataTable
          columns={[{ key: "name", title: "Product", render: (r) => <span className="font-medium">{r.name}</span> }]}
          data={rows}
          loading={loading}
          rowKey="mediclaim_product_id"
          searchKeys={["name"]}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-line py-10 text-center text-[13px] text-muted">Select a company to view its products.</p>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Product" size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></div>}>
        <Input label="Product Name" value={name} onChange={(e) => setName(e.target.value)} />
      </Modal>
    </div>
  );
}
