"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, UserCheck, UserPlus } from "lucide-react";
import StepperModal from "@/components/ui/StepperModal";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import Dropdown from "@/components/ui/Dropdown";
import DatePicker from "@/components/ui/DatePicker";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import api, { showError } from "@/lib/api";
import { firstError, field, checks } from "@/utils/validators";

const TYPES = ["Individual", "Family Floater", "Group / Employee"].map((t) => ({ value: t, label: t }));

const empty = {
  username: "", mobile: "", email: "",
  mediclaim_type: "Individual", company_name: "", mediclaim_product_id: "", SumInsured: "",
  PolicyNumber: "", PremiumAmount: "", PolicyIssuedDate: "", ExpiryDate: "", agentName: "", agentCode: "",
};

export default function MediclaimPolicyModal({ open, onClose, onSaved, editRow, renewMode = false, prefillMobile = "" }) {
  const isEdit = !!editRow && !renewMode;
  const [form, setForm] = useState(empty);
  const [userConsumerId, setUserConsumerId] = useState(null);
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [products, setProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setProducts([]);
    api.get("/user/mediclaim/company")
      .then((r) => {
        const list = (r.data?.data || []).map((c) => ({ value: c.mediclaim_company_id, label: c.mediclaim_company_name }));
        setCompanies(list);
        if (editRow) {
          const rp = editRow.rp || {};
          setForm({
            username: editRow.name || "", mobile: editRow.mobile || "", email: editRow.email || "",
            mediclaim_type: editRow.mtype || "Individual", company_name: editRow.company || "",
            mediclaim_product_id: editRow.mediclaim_product_id || "", SumInsured: editRow.sum || "",
            PolicyNumber: renewMode ? "" : (rp.PolicyNumber || ""), PremiumAmount: renewMode ? "" : (rp.PremiumAmount || ""),
            PolicyIssuedDate: renewMode ? "" : (rp.PolicyIssuedDate || ""), ExpiryDate: renewMode ? "" : (rp.ExpiryDate || ""),
            agentName: rp.agentName || "", agentCode: rp.agentCode || "",
          });
          setUserConsumerId(editRow.user_id || null);
          setFound(true);
          const co = list.find((c) => c.label === editRow.company);
          if (co) { setCompanyId(co.value); api.get(`/user/mediclaim/product/${co.value}`).then((pr) => setProducts((pr.data?.data || []).map((p) => ({ value: p.mediclaim_product_id, label: p.mediclaim_product_name })))).catch(() => {}); }
        } else {
          setForm({ ...empty, mobile: prefillMobile || "" });
          setFound(null); setUserConsumerId(null); setCompanyId("");
        }
      })
      .catch(() => setCompanies([]));
  }, [open, editRow, renewMode, prefillMobile]);

  const onCompany = (v) => {
    setCompanyId(v);
    setForm((f) => ({ ...f, company_name: companies.find((c) => c.value === v)?.label || "", mediclaim_product_id: "" }));
    if (v) api.get(`/user/mediclaim/product/${v}`).then((r) => setProducts((r.data?.data || []).map((p) => ({ value: p.mediclaim_product_id, label: p.mediclaim_product_name })))).catch(() => setProducts([]));
    else setProducts([]);
  };

  const findConsumer = async () => {
    if (!/^\d{10}$/.test(form.mobile)) return toast.error("Enter a valid 10-digit mobile");
    setSearching(true);
    try {
      const res = await api.get(`/user/household/${form.mobile}`);
      const members = res.data?.data?.members || [];
      const match = members.find((m) => m.mobileNumber === form.mobile) || members[0];
      if (match) { setForm((f) => ({ ...f, username: match.username || "", email: match.email || "" })); setUserConsumerId(match.user_id); setFound(true); }
      else setFound(false);
    } catch { setFound(false); }
    finally { setSearching(false); }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const data = {
        username: form.username, user_name: form.username, mobile: form.mobile, mobileNumber: form.mobile, email: form.email,
        user_consumer_id: userConsumerId, mediclaim_type: form.mediclaim_type,
        policy_type: renewMode ? "Renewal" : "Fresh", policyRadio: renewMode ? "Renewal" : "Fresh",
        company_name: form.company_name, mediclaim_product_id: form.mediclaim_product_id || null, SumInsured: form.SumInsured,
        runningPolicy: {
          PolicyNumber: form.PolicyNumber, PremiumAmount: form.PremiumAmount,
          PolicyIssuedDate: form.PolicyIssuedDate, ExpiryDate: form.ExpiryDate,
          agentName: form.agentName, agentCode: form.agentCode,
        },
        previousPolicy: {},
      };
      if (editRow && (isEdit || renewMode)) {
        data.id = editRow.id; data.user_id = editRow.user_id;
        await api.put(`/user/mediclaim/user/update/${editRow.id}`, { data });
        toast.success(renewMode ? "Policy renewed" : "Policy updated");
      } else {
        await api.post("/user/mediclaim/user/add", { data });
        toast.success("Mediclaim policy added");
      }
      onClose();
      onSaved?.();
    } catch (e) { showError(e, renewMode ? "Could not renew" : isEdit ? "Could not update" : "Could not add mediclaim policy"); }
    finally { setSubmitting(false); }
  };

  const steps = [
    {
      title: "Consumer",
      validate: () => {
        if (found === null) { toast.error("Find the consumer by mobile first"); return "find"; }
        const err = firstError([field("mobile", { label: "Mobile", required: true, checks: [checks.mobile10] }), field("username", { label: "Name", required: true })], form);
        if (err) { toast.error(err); return err; }
        return true;
      },
      render: () => (
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <PhoneInput label="Consumer Mobile" value={form.mobile} onChange={(v) => { set("mobile")(v); setFound(null); }} />
            <Button icon={searching ? undefined : Search} onClick={findConsumer} disabled={searching}>{searching ? <Spinner size={16} /> : "Find"}</Button>
          </div>
          {found === true && <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-700"><UserCheck size={15} /> Existing consumer — prefilled.</div>}
          {found === false && <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700"><UserPlus size={15} /> New consumer — enter details.</div>}
          {found !== null && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Name" value={form.username} onChange={(e) => set("username")(e.target.value)} />
              <Input label="Email" value={form.email} onChange={(e) => set("email")(e.target.value)} />
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Policy",
      validate: () => {
        if (!(companyId || form.company_name)) { toast.error("Select the company"); return "company"; }
        if (!form.ExpiryDate) { toast.error("Enter the expiry date"); return "expiry"; }
        if (form.PolicyIssuedDate && form.ExpiryDate && String(form.PolicyIssuedDate).slice(0, 10) > String(form.ExpiryDate).slice(0, 10)) { toast.error("Issued date must be before expiry"); return "dates"; }
        return true;
      },
      render: () => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dropdown label="Type" options={TYPES} value={form.mediclaim_type} onChange={set("mediclaim_type")} />
          <Input label="Sum Insured" value={form.SumInsured} onChange={(e) => set("SumInsured")(e.target.value.replace(/[^\d.]/g, ""))} />
          <Dropdown label="Company" placeholder="Select company" options={companies} value={companyId} onChange={onCompany} searchable />
          <Dropdown label="Product" placeholder={companyId ? "Select product" : "Select company first"} options={products} value={form.mediclaim_product_id} onChange={set("mediclaim_product_id")} searchable />
          <Input label="Policy Number" value={form.PolicyNumber} onChange={(e) => set("PolicyNumber")(e.target.value)} />
          <Input label="Premium Amount" value={form.PremiumAmount} onChange={(e) => set("PremiumAmount")(e.target.value.replace(/[^\d.]/g, ""))} />
          <DatePicker label="Issued Date" value={form.PolicyIssuedDate} onChange={set("PolicyIssuedDate")} />
          <DatePicker label="Expiry Date" value={form.ExpiryDate} onChange={set("ExpiryDate")} />
          <Input label="Agent Name" value={form.agentName} onChange={(e) => set("agentName")(e.target.value)} />
          <Input label="Agent Code" value={form.agentCode} onChange={(e) => set("agentCode")(e.target.value)} />
        </div>
      ),
    },
    {
      title: "Review",
      render: () => (
        <div className="space-y-2 text-[14px]">
          <Row label="Consumer" value={`${form.username} · ${form.mobile}`} />
          <Row label="Type" value={form.mediclaim_type} />
          <Row label="Company" value={form.company_name || "—"} />
          <Row label="Sum Insured" value={form.SumInsured || "—"} />
          <Row label="Policy No." value={form.PolicyNumber || "—"} />
        </div>
      ),
    },
  ];

  return <StepperModal open={open} onClose={onClose} title={renewMode ? "Renew / Add Next Mediclaim Policy" : isEdit ? "Edit Mediclaim Policy" : "Add Mediclaim Policy"} steps={steps} onSubmit={submit} submitting={submitting} />;
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-line py-1.5">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
