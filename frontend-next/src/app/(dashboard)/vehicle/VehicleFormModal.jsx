"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Search, UserCheck, UserPlus } from "lucide-react";
import StepperModal from "@/components/ui/StepperModal";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import Dropdown from "@/components/ui/Dropdown";
import DatePicker from "@/components/ui/DatePicker";
import Checkbox from "@/components/ui/Checkbox";
import Switch from "@/components/ui/Switch";
import FileUpload from "@/components/ui/FileUpload";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import api, { showError } from "@/lib/api";
import { firstError, field, checks } from "@/utils/validators";

const NATURES = [
  { value: "Fresh", label: "Fresh" },
  { value: "Renewal", label: "Renewal" },
  { value: "Portability", label: "Portability" },
];

const emptyPolicy = () => ({
  PolicyNumber: "", PolicyTypeId: "", PolicyPlanTypeId: "", CompanyId: "",
  PolicyTenure: "", PremiumAmount: "", PolicyFrom: "", PolicyTo: "",
  PolicyIssuedDate: "", ExpiryDate: "", tp_expiry_date: "", od_expiry_date: "",
  tp_tenure: "", od_tenure: "", NCB: "", IDV: "", Vendor: "", NomineeName: "",
});

const empty = {
  Name: "", MobileNumber: "", Email: "",
  VehicleNumber: "", Make: "", Model: "", ManufacturingYear: "", EngineNumber: "", ChassisNumber: "", vehicle_type: "",
  policyRadio: "Fresh",
  AgentName: "", AgentCode: "", AgentContactNumber: "",
  isNomineeFlag: false, NomineeName: "", NomineeRelation: "", NomineeDob: "",
  rp: emptyPolicy(),
  pp: emptyPolicy(),
};

function ageFromDob(dob) {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a >= 0 ? String(a) : "";
}
function statusFromExpiry(p) {
  const end = p.od_expiry_date || p.ExpiryDate || p.PolicyTo;
  if (!end) return "running";
  const d = new Date(end);
  if (isNaN(d.getTime())) return "running";
  return d >= new Date() ? "running" : "completed";
}

export default function VehicleFormModal({ open, onClose, onSaved, editRow, renewMode = false, prefillMobile = "" }) {
  const isEdit = !!editRow;
  const [form, setForm] = useState(empty);
  const [headUserId, setHeadUserId] = useState(null);
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const [kyc, setKyc] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [policyTypes, setPolicyTypes] = useState([]);
  const [policyPlans, setPolicyPlans] = useState([]);
  const [heads, setHeads] = useState([]);
  const [files, setFiles] = useState({ rcbook: null, CurrentPolicyFile: null, PreviousCurrentPolicyFile: null });
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setFile = (k) => (f) => setFiles((s) => ({ ...s, [k]: f }));

  // Create-from-dropdown handlers (return the new option's value to auto-select).
  const createCompany = async (name) => {
    try {
      await api.post("/user/data/company-type", { company_name: name });
      const res = await api.get("/user/data/company-type");
      const opts = (res.data?.data || []).map((r) => ({ value: r.company_id, label: r.company_name }));
      setCompanies(opts);
      toast.success("Company added");
      return opts.find((o) => o.label === name)?.value;
    } catch (e) { showError(e, "Could not add company"); }
  };
  const createPolicyType = async (name) => {
    try {
      await api.post("/user/data/policytype", { policy_type_name: name });
      const res = await api.get("/user/data/policytype");
      const opts = (res.data?.data || []).map((r) => ({ value: r.policy_type_id, label: r.policy_type_name }));
      setPolicyTypes(opts);
      toast.success("Policy type added");
      return opts.find((o) => o.label === name)?.value;
    } catch (e) { showError(e, "Could not add policy type"); }
  };
  const createPolicyPlan = async (name) => {
    try {
      await api.post("/user/data/policyplan", { policy_name: name });
      const res = await api.get("/user/data/policyplan");
      const opts = (res.data?.data || []).map((r) => ({ value: r.policy_plan_id, label: r.policy_name }));
      setPolicyPlans(opts);
      toast.success("Plan added");
      return opts.find((o) => o.label === name)?.value;
    } catch (e) { showError(e, "Could not add plan"); }
  };
  const setRp = (k) => (v) => setForm((f) => ({ ...f, rp: { ...f.rp, [k]: v } }));
  const setPp = (k) => (v) => setForm((f) => ({ ...f, pp: { ...f.pp, [k]: v } }));

  useEffect(() => {
    if (!open) return;
    setFiles({ rcbook: null, CurrentPolicyFile: null, PreviousCurrentPolicyFile: null });
    if (isEdit) {
      const r = editRow;
      setForm({
        ...empty,
        Name: r.name || r.Name || "",
        MobileNumber: r.mobile || r.MobileNumber || "",
        Email: r.email || r.Email || "",
        VehicleNumber: r.vehicle_number || r.VehicleNumber || "",
        Make: r.make || r.Make || "",
        Model: r.model || r.Model || "",
        ManufacturingYear: r.manufacturing_year || r.ManufacturingYear || "",
        EngineNumber: r.engine_number || r.EngineNumber || "",
        ChassisNumber: r.chassis_number || r.ChassisNumber || "",
        // Renew/add-next: keep consumer + vehicle, start a blank new policy
        // (the backend archives the current running policy automatically).
        policyRadio: renewMode ? "Renewal" : (r.vehicle_policy_type || "Fresh"),
        rp: renewMode ? emptyPolicy() : { ...emptyPolicy(), ...(r.runningPolicy || {}) },
        pp: renewMode ? emptyPolicy() : { ...emptyPolicy(), ...(r.previousPolicy || {}) },
      });
      setFound(true);
      setHeadUserId(r.user_id || r.head_user_id || null);
      const mob = r.mobile || r.MobileNumber || "";
      if (/^\d{10}$/.test(mob)) api.get(`/user/consumer/documents/by-mobile/${mob}`).then((d) => setKyc(d.data?.data || [])).catch(() => setKyc(null));
    } else {
      setForm({ ...empty, MobileNumber: prefillMobile || "" });
      setFound(null); setKyc(null); setHeadUserId(null);
    }
    Promise.all([
      api.get("/user/data/company-type").catch(() => null),
      api.get("/user/data/policytype").catch(() => null),
      api.get("/user/data/policyplan").catch(() => null),
      api.get("/user/list/consumer").catch(() => null),
    ]).then(([c, p, pl, cons]) => {
      setCompanies((c?.data?.data || []).map((r) => ({ value: r.company_id, label: r.company_name })));
      setPolicyTypes((p?.data?.data || []).map((r) => ({ value: r.policy_type_id, label: r.policy_type_name })));
      setPolicyPlans((pl?.data?.data || []).map((r) => ({ value: r.policy_plan_id, label: r.policy_name })));
      setHeads((cons?.data?.data || []).map((r) => ({ value: r.user_id, label: `${r.username || "—"} · ${r.mobileNumber || ""}` })));
    });
  }, [open, isEdit, editRow, prefillMobile]);

  const findConsumer = async () => {
    const mobile = form.MobileNumber;
    if (!/^\d{10}$/.test(mobile)) return toast.error("Enter a valid 10-digit mobile");
    setSearching(true);
    try {
      const res = await api.get(`/user/household/${mobile}`);
      const members = res.data?.data?.members || [];
      const match = members.find((m) => m.mobileNumber === mobile) || members[0];
      if (match) { setForm((f) => ({ ...f, Name: match.username || "", Email: match.email || "" })); setHeadUserId(match.user_id); setFound(true); }
      else setFound(false);
    } catch { setFound(false); }
    finally { setSearching(false); }
    try { const d = await api.get(`/user/consumer/documents/by-mobile/${mobile}`); setKyc(d.data?.data || []); } catch { setKyc(null); }
  };

  const companyName = (id) => companies.find((c) => c.value === id)?.label || "";

  const buildPolicy = (p) => ({
    ...p,
    PolicyTypeId: p.PolicyTypeId || null,
    PolicyPlanTypeId: p.PolicyPlanTypeId || null,
    CompanyId: p.CompanyId || null,
    CompanyName: companyName(p.CompanyId),
  });

  const submit = async () => {
    setSubmitting(true);
    try {
      const nomineeAge = ageFromDob(form.NomineeDob);
      const runningPolicy = {
        ...buildPolicy(form.rp),
        isNomineeFlag: form.isNomineeFlag ? "1" : "0",
        NomineeName: form.isNomineeFlag ? form.NomineeName : "",
        NomineeRelation: form.isNomineeFlag ? form.NomineeRelation : "",
        NomineeDob: form.isNomineeFlag ? form.NomineeDob : "",
        NomineeAge: form.isNomineeFlag ? nomineeAge : "",
        agentName: form.AgentName, agentCode: form.AgentCode, agentContactNumber: form.AgentContactNumber,
      };
      const previousPolicy = form.policyRadio !== "Fresh" ? buildPolicy(form.pp) : {};
      const data = {
        Name: form.Name, MobileNumber: form.MobileNumber, Email: form.Email,
        VehicleNumber: form.VehicleNumber, Make: form.Make, Model: form.Model,
        ManufacturingYear: form.ManufacturingYear, EngineNumber: form.EngineNumber, ChassisNumber: form.ChassisNumber,
        vehicle_type: form.vehicle_type,
        policyRadio: form.policyRadio, policy_type: form.policyRadio,
        AgentName: form.AgentName, AgentCode: form.AgentCode, AgentContactNumber: form.AgentContactNumber,
        isNomineeFlag: form.isNomineeFlag ? "1" : "0",
        runningPolicy, previousPolicy, documentsData: [],
      };
      const hasFiles = files.rcbook || files.CurrentPolicyFile || files.PreviousCurrentPolicyFile;
      let payload;
      if (hasFiles) {
        const fd = new FormData();
        fd.append("data", JSON.stringify(data));
        if (!isEdit && headUserId) fd.append("head_user_id", headUserId);
        if (files.rcbook) fd.append("rcbook", files.rcbook);
        if (files.CurrentPolicyFile) fd.append("CurrentPolicyFile", files.CurrentPolicyFile);
        if (files.PreviousCurrentPolicyFile) fd.append("PreviousCurrentPolicyFile", files.PreviousCurrentPolicyFile);
        payload = fd;
      } else {
        payload = isEdit ? { data } : { data, head_user_id: headUserId };
      }
      if (isEdit) {
        await api.put(`/user/vehicle/user/update/${editRow.vehicle_user_id}`, payload);
        toast.success("Vehicle policy updated");
      } else {
        await api.post("/user/vehicle/user/add", payload);
        toast.success("Vehicle policy added");
      }
      onClose();
      onSaved?.();
    } catch (e) {
      showError(e, "Could not save vehicle policy");
    } finally {
      setSubmitting(false);
    }
  };

  // Reusable policy fieldset (running or previous). Plain function (not a
  // component) so inputs don't remount/lose focus on each keystroke.
  const policyFields = (p, setP) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input label="Policy Number" value={p.PolicyNumber} onChange={(e) => setP("PolicyNumber")(e.target.value)} />
      <Dropdown label="Policy Type" placeholder="Select type" options={policyTypes} value={p.PolicyTypeId} onChange={setP("PolicyTypeId")} onCreate={createPolicyType} />
      <Dropdown label="Plan (TP / Comprehensive / Full)" placeholder="Select plan" options={policyPlans} value={p.PolicyPlanTypeId} onChange={setP("PolicyPlanTypeId")} onCreate={createPolicyPlan} />
      <Dropdown label="Company" placeholder="Select company" options={companies} value={p.CompanyId} onChange={setP("CompanyId")} onCreate={createCompany} />
      <Input label="Premium Amount" value={p.PremiumAmount} onChange={(e) => setP("PremiumAmount")(e.target.value.replace(/[^\d.]/g, ""))} />
      <Input label="Vendor" value={p.Vendor} onChange={(e) => setP("Vendor")(e.target.value)} />
      <DatePicker label="Policy From" value={p.PolicyFrom} onChange={setP("PolicyFrom")} />
      <DatePicker label="Policy To" value={p.PolicyTo} onChange={setP("PolicyTo")} />
      <DatePicker label="Issued Date" value={p.PolicyIssuedDate} onChange={setP("PolicyIssuedDate")} />
      <Input label="NCB (%)" value={p.NCB} onChange={(e) => setP("NCB")(e.target.value)} />
      <Input label="IDV" value={p.IDV} onChange={(e) => setP("IDV")(e.target.value)} />
      <div />
      {/* TP / OD split timelines */}
      <div className="sm:col-span-2 rounded-lg border border-line bg-subtle/40 p-3">
        <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-muted">TP &amp; OD / Full timelines</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="TP Tenure (yrs)" maxLength={2} value={p.tp_tenure} onChange={(e) => setP("tp_tenure")(e.target.value.replace(/\D/g, ""))} />
          <DatePicker label="TP Expiry" value={p.tp_expiry_date} onChange={setP("tp_expiry_date")} />
          <Input label="OD / Full Tenure (yrs)" maxLength={2} value={p.od_tenure} onChange={(e) => setP("od_tenure")(e.target.value.replace(/\D/g, ""))} />
          <DatePicker label="OD / Full Expiry" value={p.od_expiry_date} onChange={setP("od_expiry_date")} />
        </div>
      </div>
    </div>
  );

  const steps = [
    {
      title: "Consumer",
      validate: () => {
        if (!isEdit && found === null) { toast.error("Find the consumer by mobile first"); return "find"; }
        const err = firstError([field("MobileNumber", { label: "Mobile number", required: true, checks: [checks.mobile10] }), field("Name", { label: "Name", required: true })], form);
        if (err) { toast.error(err); return err; }
        return true;
      },
      render: () => (
        <div className="space-y-4">
          {!isEdit && (
            <div className="flex items-end gap-2">
              <PhoneInput label="Consumer Mobile" value={form.MobileNumber} onChange={(v) => { set("MobileNumber")(v); setFound(null); setKyc(null); }} />
              <Button icon={searching ? undefined : Search} onClick={findConsumer} disabled={searching || !/^\d{10}$/.test(form.MobileNumber)}>{searching ? <Spinner size={16} /> : "Find"}</Button>
            </div>
          )}
          {!isEdit && found === true && <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-700"><UserCheck size={15} /> Existing consumer — details prefilled.</div>}
          {!isEdit && found === false && <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700"><UserPlus size={15} /> New consumer — enter details.</div>}
          {(isEdit || found !== null) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Name" value={form.Name} onChange={(e) => set("Name")(e.target.value)} />
              <Input label="Email" value={form.Email} onChange={(e) => set("Email")(e.target.value)} />
            </div>
          )}
          {!isEdit && found === false && heads.length > 0 && (
            <Dropdown
              searchable
              label="Join an existing consumer (optional)"
              placeholder="Standalone — not joining anyone"
              options={heads}
              value={headUserId || ""}
              onChange={(v) => setHeadUserId(v || null)}
            />
          )}
          {kyc?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-subtle/40 p-3 text-[13px]">
              <span className="text-muted">KYC on file (reused):</span>
              {kyc.map((d) => <span key={d.id} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[12px] text-brand-700"><CheckCircle2 size={12} /> {d.documents?.doc_name || "Document"}</span>)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Vehicle",
      validate: () => { const err = firstError([field("VehicleNumber", { label: "Vehicle number", required: true })], form); if (err) { toast.error(err); return err; } return true; },
      render: () => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Vehicle Number" value={form.VehicleNumber} onChange={(e) => set("VehicleNumber")(e.target.value.toUpperCase())} />
          <Input label="Vehicle Type" value={form.vehicle_type} onChange={(e) => set("vehicle_type")(e.target.value)} placeholder="Car / Bike / …" />
          <Input label="Make" value={form.Make} onChange={(e) => set("Make")(e.target.value)} />
          <Input label="Model" value={form.Model} onChange={(e) => set("Model")(e.target.value)} />
          <Input label="Manufacturing Year" maxLength={4} value={form.ManufacturingYear} onChange={(e) => set("ManufacturingYear")(e.target.value.replace(/\D/g, ""))} />
          <Input label="Engine Number" value={form.EngineNumber} onChange={(e) => set("EngineNumber")(e.target.value)} />
          <Input label="Chassis Number" value={form.ChassisNumber} onChange={(e) => set("ChassisNumber")(e.target.value)} />
        </div>
      ),
    },
    {
      title: "Policy",
      validate: () => {
        const p = form.rp || {};
        if (!(p.CompanyId || p.company_id || p.CompanyName)) { toast.error("Select the policy company"); return "company"; }
        if (!(p.PolicyFrom && (p.PolicyTo || p.ExpiryDate || p.od_expiry_date))) { toast.error("Enter the policy period (from → to / expiry)"); return "period"; }
        const to = p.PolicyTo || p.ExpiryDate || p.od_expiry_date;
        if (p.PolicyFrom && to && String(p.PolicyFrom).slice(0, 10) > String(to).slice(0, 10)) { toast.error("Policy 'from' date must be before the 'to' / expiry date"); return "dates"; }
        return true;
      },
      render: () => (
        <div className="space-y-4">
          {renewMode && (
            <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[13px] text-brand-700">
              Adding the next policy for this vehicle — the current policy will be moved to history automatically.
            </div>
          )}
          <div>
            <div className="ui-label mb-1">Policy nature</div>
            <div className="flex gap-2">
              {NATURES.map((n) => (
                <button key={n.value} type="button" onClick={() => set("policyRadio")(n.value)}
                  className={`press rounded-md border px-4 py-2 text-[13px] font-medium ${form.policyRadio === n.value ? "border-brand-600 bg-brand-600 text-white" : "border-line text-ink hover:bg-subtle"}`}>
                  {n.label}
                </button>
              ))}
            </div>
          </div>
          {policyFields(form.rp, setRp)}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Agent Name" value={form.AgentName} onChange={(e) => set("AgentName")(e.target.value)} />
            <Input label="Agent Code" value={form.AgentCode} onChange={(e) => set("AgentCode")(e.target.value)} />
            <PhoneInput label="Agent Contact" value={form.AgentContactNumber} onChange={set("AgentContactNumber")} />
          </div>
          <div className="text-[12px] text-muted">Derived status: <Badge tone={statusFromExpiry(form.rp) === "running" ? "success" : "warning"}>{statusFromExpiry(form.rp)}</Badge></div>
        </div>
      ),
    },
    {
      title: "Nominee",
      render: () => (
        <div className="space-y-4">
          <Switch label="This policy has a nominee" checked={form.isNomineeFlag} onChange={set("isNomineeFlag")} />
          {form.isNomineeFlag && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Nominee Name" value={form.NomineeName} onChange={(e) => set("NomineeName")(e.target.value)} />
              <Input label="Nominee Relation" value={form.NomineeRelation} onChange={(e) => set("NomineeRelation")(e.target.value)} />
              <DatePicker label="Nominee DOB" value={form.NomineeDob} onChange={set("NomineeDob")} />
              <Input label="Nominee Age" value={ageFromDob(form.NomineeDob)} disabled placeholder="Auto-calculated" />
            </div>
          )}
        </div>
      ),
    },
    ...(form.policyRadio !== "Fresh" && !renewMode
      ? [{
          title: "Previous Policy",
          render: () => (
            <div className="space-y-3">
              <p className="text-[13px] text-muted">Older policy details (required for {form.policyRadio}). Status is auto-set from the expiry date.</p>
              {policyFields(form.pp, setPp)}
              <div className="text-[12px] text-muted">Past policy status: <Badge tone={statusFromExpiry(form.pp) === "running" ? "success" : "warning"}>{statusFromExpiry(form.pp)}</Badge></div>
            </div>
          ),
        }]
      : []),
    {
      title: "Documents",
      render: () => (
        <div className="space-y-4">
          <p className="text-[13px] text-muted">Upload policy documents (optional). KYC (Aadhar/PAN/GST) is managed on the consumer and reused across policies.</p>
          <FileUpload label="RC Book" accept=".pdf,.jpg,.jpeg,.png" onChange={setFile("rcbook")} />
          <FileUpload label="Running Policy PDF" accept=".pdf,.jpg,.jpeg,.png" onChange={setFile("CurrentPolicyFile")} />
          {form.policyRadio !== "Fresh" && (
            <FileUpload label="Previous Policy PDF" accept=".pdf,.jpg,.jpeg,.png" onChange={setFile("PreviousCurrentPolicyFile")} />
          )}
        </div>
      ),
    },
    {
      title: "Review",
      render: () => (
        <div className="space-y-2 text-[14px]">
          <Row label="Consumer" value={`${form.Name} · ${form.MobileNumber}${found || isEdit ? "" : " (new)"}`} />
          <Row label="Vehicle" value={`${form.VehicleNumber}${form.Make ? ` · ${form.Make} ${form.Model}` : ""}`} />
          <Row label="Nature" value={form.policyRadio} />
          <Row label="Plan" value={policyPlans.find((p) => p.value === form.rp.PolicyPlanTypeId)?.label || "—"} />
          <Row label="Company" value={companyName(form.rp.CompanyId) || "—"} />
          <Row label="TP expiry" value={form.rp.tp_expiry_date || "—"} />
          <Row label="OD/Full expiry" value={form.rp.od_expiry_date || "—"} />
          <Row label="Status" value={statusFromExpiry(form.rp)} />
          {form.policyRadio !== "Fresh" && <Row label="Previous policy" value={`${form.pp.PolicyNumber || "—"} (${statusFromExpiry(form.pp)})`} />}
          <Row label="KYC on file" value={kyc ? `${kyc.length} document(s)` : "—"} />
        </div>
      ),
    },
  ];

  return <StepperModal open={open} onClose={onClose} title={renewMode ? "Add Next Policy / Renew" : isEdit ? "Edit Vehicle Policy" : "Add Vehicle Policy"} steps={steps} onSubmit={submit} submitting={submitting} />;
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-line py-1.5">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
