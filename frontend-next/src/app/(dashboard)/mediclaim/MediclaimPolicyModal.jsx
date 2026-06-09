"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, UserCheck, UserPlus, Plus, Trash2 } from "lucide-react";
import StepperModal from "@/components/ui/StepperModal";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import Dropdown from "@/components/ui/Dropdown";
import DatePicker from "@/components/ui/DatePicker";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import FileUpload from "@/components/ui/FileUpload";
import api, { showError } from "@/lib/api";
import { firstError, field, checks } from "@/utils/validators";

const TYPES = ["Individual", "Family Floater", "Group / Employee"].map((t) => ({ value: t, label: t }));
const GENDERS = ["Male", "Female", "Other"].map((g) => ({ value: g, label: g }));

const empty = {
  username: "", mobile: "", email: "", DateOfBirth: "", Gender: "",
  mediclaim_type: "Individual", company_name: "", mediclaim_product_id: "", SumInsured: "",
  PolicyNumber: "", PremiumAmount: "", PolicyIssuedDate: "", PolicyFrom: "", PolicyTo: "", ExpiryDate: "",
  Zone: "", AddOnCover: "", PolicyTenure: "",
  NomineeName: "", NomineeRelation: "", NomineeDob: "", NomineeAge: "",
  agentName: "", agentCode: "",
  members: [], employees: [],
  hasPrevious: false,
  prev: { PolicyNumber: "", CompanyName: "", SumInsured: "", NoClaimBonus: "", PreviousAgentName: "", PreviousAgentCode: "", PreviousAgentContactNumber: "" },
};

const emptyMember = () => ({ FamilyName: "", RelationshipWithPolicyHolder: "", DateOfBirth: "", Gender: "" });
const emptyEmployee = () => ({ EmployeeName: "", RelationshipWithPolicyHolder: "", DateOfBirth: "", Gender: "", DateOfJoining: "" });

export default function MediclaimPolicyModal({ open, onClose, onSaved, editRow, renewMode = false, prefillMobile = "" }) {
  const isEdit = !!editRow && !renewMode;
  const [form, setForm] = useState(empty);
  const [userConsumerId, setUserConsumerId] = useState(null);
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [products, setProducts] = useState([]);
  const [policyFile, setPolicyFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setPrev = (k) => (v) => setForm((f) => ({ ...f, prev: { ...f.prev, [k]: v } }));

  useEffect(() => {
    if (!open) return;
    setProducts([]); setPolicyFile(null);
    api.get("/user/mediclaim/company")
      .then((r) => {
        const list = (r.data?.data || []).map((c) => ({ value: c.mediclaim_company_id, label: c.mediclaim_company_name }));
        setCompanies(list);
        if (editRow) {
          const rp = editRow.rp || {};
          setForm({
            ...empty,
            username: editRow.name || "", mobile: editRow.mobile || "", email: editRow.email || "",
            mediclaim_type: editRow.mtype || "Individual", company_name: editRow.company || "",
            mediclaim_product_id: editRow.mediclaim_product_id || "", SumInsured: editRow.sum || "",
            PolicyNumber: renewMode ? "" : (rp.PolicyNumber || ""), PremiumAmount: renewMode ? "" : (rp.PremiumAmount || ""),
            PolicyIssuedDate: renewMode ? "" : (rp.PolicyIssuedDate || ""), PolicyFrom: renewMode ? "" : (rp.PolicyFrom || ""),
            PolicyTo: renewMode ? "" : (rp.PolicyTo || ""), ExpiryDate: renewMode ? "" : (rp.ExpiryDate || ""),
            Zone: rp.Zone || "", AddOnCover: rp.AddOnCover || "", PolicyTenure: rp.PolicyTenure || "",
            NomineeName: rp.NomineeName || "", NomineeRelation: rp.NomineeRelation || "", NomineeDob: rp.NomineeDob || "", NomineeAge: rp.NomineeAge || "",
            members: (editRow.familymembers || []).map((m) => ({ FamilyName: m.FamilyName || "", RelationshipWithPolicyHolder: m.RelationshipWithPolicyHolder || "", DateOfBirth: m.DateOfBirth || "", Gender: m.Gender || "" })),
            employees: (editRow.employees || []).map((e) => ({ EmployeeName: e.EmployeeName || "", RelationshipWithPolicyHolder: e.RelationshipWithPolicyHolder || "", DateOfBirth: e.DateOfBirth || "", Gender: e.Gender || "", DateOfJoining: e.DateOfJoining || "" })),
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

  // member/employee list helpers
  const addMember = () => setForm((f) => ({ ...f, members: [...f.members, emptyMember()] }));
  const setMember = (i, k, v) => setForm((f) => ({ ...f, members: f.members.map((m, idx) => idx === i ? { ...m, [k]: v } : m) }));
  const delMember = (i) => setForm((f) => ({ ...f, members: f.members.filter((_, idx) => idx !== i) }));
  const addEmployee = () => setForm((f) => ({ ...f, employees: [...f.employees, emptyEmployee()] }));
  const setEmployee = (i, k, v) => setForm((f) => ({ ...f, employees: f.employees.map((e, idx) => idx === i ? { ...e, [k]: v } : e) }));
  const delEmployee = (i) => setForm((f) => ({ ...f, employees: f.employees.filter((_, idx) => idx !== i) }));

  const isFamily = form.mediclaim_type === "Family Floater";
  const isGroup = form.mediclaim_type === "Group / Employee";

  const submit = async () => {
    setSubmitting(true);
    try {
      const data = {
        username: form.username, user_name: form.username, mobile: form.mobile, mobileNumber: form.mobile, email: form.email,
        DateOfBirth: form.DateOfBirth || null, Gender: form.Gender || null,
        user_consumer_id: userConsumerId, mediclaim_type: form.mediclaim_type, RadioButton: form.mediclaim_type,
        policy_type: renewMode ? "Renew" : "Fresh", policyRadio: renewMode ? "Renew" : "Fresh",
        company_name: form.company_name, mediclaim_product_id: form.mediclaim_product_id || null,
        ProductName: form.mediclaim_product_id || null, CompanyName: form.company_name, SumInsured: form.SumInsured,
        runningPolicy: {
          PolicyNumber: form.PolicyNumber, PremiumAmount: form.PremiumAmount,
          PolicyIssuedDate: form.PolicyIssuedDate, PolicyFrom: form.PolicyFrom, PolicyTo: form.PolicyTo, ExpiryDate: form.ExpiryDate,
          Zone: form.Zone, AddOnCover: form.AddOnCover, PolicyTenure: form.PolicyTenure,
          NomineeName: form.NomineeName, NomineeRelation: form.NomineeRelation, NomineeDob: form.NomineeDob, NomineeAge: form.NomineeAge,
          agentName: form.agentName, agentCode: form.agentCode,
        },
        familyMembers: isFamily ? form.members : [],
        employees: isGroup ? form.employees : [],
        previousPolicy: form.hasPrevious ? form.prev : {},
      };
      if (editRow && (isEdit || renewMode)) { data.id = editRow.id; data.user_id = editRow.user_id; }
      // Multipart when a policy PDF is attached; plain JSON otherwise.
      let payload;
      if (policyFile) {
        const fd = new FormData();
        fd.append("data", JSON.stringify(data));
        fd.append("CurrentPolicyFile", policyFile);
        payload = fd;
      } else {
        payload = { data };
      }
      if (editRow && (isEdit || renewMode)) {
        await api.put(`/user/mediclaim/user/update/${editRow.id}`, payload);
        toast.success(renewMode ? "Policy renewed" : "Policy updated");
      } else {
        await api.post("/user/mediclaim/user/add", payload);
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
            <PhoneInput label="Consumer Mobile" value={form.mobile} onChange={(v) => { set("mobile")(v); setFound(null); }} disabled={isEdit || renewMode} />
            {!(isEdit || renewMode) && <Button icon={searching ? undefined : Search} onClick={findConsumer} disabled={searching}>{searching ? <Spinner size={16} /> : "Find"}</Button>}
          </div>
          {found === true && !isEdit && !renewMode && <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-700"><UserCheck size={15} /> Existing consumer — prefilled.</div>}
          {found === false && <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700"><UserPlus size={15} /> New consumer — enter details.</div>}
          {found !== null && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Name" value={form.username} onChange={(e) => set("username")(e.target.value)} />
              <Input label="Email" value={form.email} onChange={(e) => set("email")(e.target.value)} />
              <DatePicker label="Date of Birth" value={form.DateOfBirth} onChange={set("DateOfBirth")} />
              <Dropdown label="Gender" placeholder="Select" options={GENDERS} value={form.Gender} onChange={set("Gender")} />
              {/* Type drives which later steps appear (Members for Family Floater,
                  Employees for Group) — chosen up-front like the old form. */}
              <Dropdown label="Policy Type" options={TYPES} value={form.mediclaim_type} onChange={set("mediclaim_type")} />
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
        if (form.PolicyFrom && form.PolicyTo && String(form.PolicyFrom).slice(0, 10) > String(form.PolicyTo).slice(0, 10)) { toast.error("Policy 'from' must be before 'to'"); return "dates"; }
        return true;
      },
      render: () => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 rounded-md bg-subtle px-3 py-2 text-[12px] text-muted">Type: <span className="font-medium text-ink">{form.mediclaim_type}</span> {isFamily ? "— add family members next" : isGroup ? "— add employees next" : "— individual cover"}</div>
          <Input label="Sum Insured" value={form.SumInsured} onChange={(e) => set("SumInsured")(e.target.value.replace(/[^\d.]/g, ""))} />
          <Dropdown label="Company" placeholder="Select company" options={companies} value={companyId} onChange={onCompany} searchable />
          <Dropdown label="Product" placeholder={companyId ? "Select product" : "Select company first"} options={products} value={form.mediclaim_product_id} onChange={set("mediclaim_product_id")} searchable />
          <Input label="Policy Number" value={form.PolicyNumber} onChange={(e) => set("PolicyNumber")(e.target.value)} />
          <Input label="Premium Amount" value={form.PremiumAmount} onChange={(e) => set("PremiumAmount")(e.target.value.replace(/[^\d.]/g, ""))} />
          <Input label="Zone" value={form.Zone} onChange={(e) => set("Zone")(e.target.value)} />
          <Input label="Add-on Cover" value={form.AddOnCover} onChange={(e) => set("AddOnCover")(e.target.value)} />
          <Input label="Policy Tenure (yrs)" value={form.PolicyTenure} onChange={(e) => set("PolicyTenure")(e.target.value.replace(/[^\d]/g, ""))} />
          <DatePicker label="Issued Date" value={form.PolicyIssuedDate} onChange={set("PolicyIssuedDate")} />
          <DatePicker label="Policy From" value={form.PolicyFrom} onChange={set("PolicyFrom")} />
          <DatePicker label="Policy To" value={form.PolicyTo} onChange={set("PolicyTo")} />
          <DatePicker label="Expiry Date" value={form.ExpiryDate} onChange={set("ExpiryDate")} />
          <Input label="Agent Name" value={form.agentName} onChange={(e) => set("agentName")(e.target.value)} />
          <Input label="Agent Code" value={form.agentCode} onChange={(e) => set("agentCode")(e.target.value)} />
        </div>
      ),
    },
    {
      title: "Nominee",
      render: () => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nominee Name" value={form.NomineeName} onChange={(e) => set("NomineeName")(e.target.value)} />
          <Input label="Relation" value={form.NomineeRelation} onChange={(e) => set("NomineeRelation")(e.target.value)} />
          <DatePicker label="Nominee DOB" value={form.NomineeDob} onChange={set("NomineeDob")} />
          <Input label="Nominee Age" value={form.NomineeAge} onChange={(e) => set("NomineeAge")(e.target.value.replace(/[^\d]/g, ""))} />
        </div>
      ),
    },
    ...(isFamily ? [{
      title: "Members",
      render: () => (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted">Family members covered under this floater.</p>
            <Button size="sm" icon={Plus} onClick={addMember}>Add member</Button>
          </div>
          {form.members.length === 0 && <p className="rounded-lg border border-dashed border-line py-6 text-center text-[13px] text-muted">No members added yet.</p>}
          {form.members.map((m, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 rounded-lg border border-line p-3 sm:grid-cols-2">
              <Input label="Name" value={m.FamilyName} onChange={(e) => setMember(i, "FamilyName", e.target.value)} />
              <Input label="Relationship" value={m.RelationshipWithPolicyHolder} onChange={(e) => setMember(i, "RelationshipWithPolicyHolder", e.target.value)} />
              <DatePicker label="Date of Birth" value={m.DateOfBirth} onChange={(v) => setMember(i, "DateOfBirth", v)} />
              <Dropdown label="Gender" placeholder="Select" options={GENDERS} value={m.Gender} onChange={(v) => setMember(i, "Gender", v)} />
              <div className="flex justify-end sm:col-span-2"><Button size="sm" variant="ghost" icon={Trash2} onClick={() => delMember(i)}>Remove</Button></div>
            </div>
          ))}
        </div>
      ),
    }] : []),
    ...(isGroup ? [{
      title: "Employees",
      render: () => (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted">Employees covered under this group policy.</p>
            <Button size="sm" icon={Plus} onClick={addEmployee}>Add employee</Button>
          </div>
          {form.employees.length === 0 && <p className="rounded-lg border border-dashed border-line py-6 text-center text-[13px] text-muted">No employees added yet.</p>}
          {form.employees.map((e, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 rounded-lg border border-line p-3 sm:grid-cols-2">
              <Input label="Name" value={e.EmployeeName} onChange={(ev) => setEmployee(i, "EmployeeName", ev.target.value)} />
              <Input label="Relationship" value={e.RelationshipWithPolicyHolder} onChange={(ev) => setEmployee(i, "RelationshipWithPolicyHolder", ev.target.value)} />
              <DatePicker label="Date of Birth" value={e.DateOfBirth} onChange={(v) => setEmployee(i, "DateOfBirth", v)} />
              <Dropdown label="Gender" placeholder="Select" options={GENDERS} value={e.Gender} onChange={(v) => setEmployee(i, "Gender", v)} />
              <DatePicker label="Date of Joining" value={e.DateOfJoining} onChange={(v) => setEmployee(i, "DateOfJoining", v)} />
              <div className="flex items-end justify-end"><Button size="sm" variant="ghost" icon={Trash2} onClick={() => delEmployee(i)}>Remove</Button></div>
            </div>
          ))}
        </div>
      ),
    }] : []),
    // Previous-policy step only for new/edit (portability). On renew the current
    // policy is auto-archived into the journey, so manual entry isn't needed.
    ...(renewMode ? [] : [{
      title: "Previous policy",
      render: () => (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input type="checkbox" checked={form.hasPrevious} onChange={(e) => set("hasPrevious")(e.target.checked)} />
            This is a portability / has a previous insurer policy
          </label>
          {form.hasPrevious && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Previous Policy No." value={form.prev.PolicyNumber} onChange={(e) => setPrev("PolicyNumber")(e.target.value)} />
              <Input label="Previous Company" value={form.prev.CompanyName} onChange={(e) => setPrev("CompanyName")(e.target.value)} />
              <Input label="Sum Insured" value={form.prev.SumInsured} onChange={(e) => setPrev("SumInsured")(e.target.value.replace(/[^\d.]/g, ""))} />
              <Input label="No Claim Bonus" value={form.prev.NoClaimBonus} onChange={(e) => setPrev("NoClaimBonus")(e.target.value)} />
              <Input label="Previous Agent Name" value={form.prev.PreviousAgentName} onChange={(e) => setPrev("PreviousAgentName")(e.target.value)} />
              <Input label="Previous Agent Code" value={form.prev.PreviousAgentCode} onChange={(e) => setPrev("PreviousAgentCode")(e.target.value)} />
              <Input label="Previous Agent Contact" value={form.prev.PreviousAgentContactNumber} onChange={(e) => setPrev("PreviousAgentContactNumber")(e.target.value)} />
            </div>
          )}
        </div>
      ),
    }]),
    {
      title: "Documents",
      render: () => (
        <div className="space-y-4">
          <FileUpload label="Policy PDF" accept=".pdf,.jpg,.jpeg,.png" onChange={setPolicyFile} />
          {renewMode && <p className="text-[12px] text-muted">On renewal the previous policy + its PDF move to history automatically.</p>}
          {(isEdit && (editRow?.rp?.CurrentPolicyFile || editRow?.rp?.PdfFile)) && !policyFile && (
            <p className="text-[12px] text-muted">A policy PDF is already on file — upload a new one only to replace it.</p>
          )}
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
          <Row label="Expiry" value={form.ExpiryDate || "—"} />
          {isFamily && <Row label="Members" value={String(form.members.length)} />}
          {isGroup && <Row label="Employees" value={String(form.employees.length)} />}
          {form.hasPrevious && <Row label="Previous policy" value={form.prev.PolicyNumber || "yes"} />}
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
