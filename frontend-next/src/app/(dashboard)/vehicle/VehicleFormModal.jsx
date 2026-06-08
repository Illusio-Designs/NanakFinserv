"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Search, UserCheck, UserPlus } from "lucide-react";
import StepperModal from "@/components/ui/StepperModal";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import Dropdown from "@/components/ui/Dropdown";
import DatePicker from "@/components/ui/DatePicker";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import api, { showError } from "@/lib/api";
import { firstError, field, checks } from "@/utils/validators";

const empty = {
  Name: "", MobileNumber: "", Email: "",
  VehicleNumber: "", Make: "", Model: "", ManufacturingYear: "", EngineNumber: "", ChassisNumber: "",
  CompanyId: "", CompanyName: "", PolicyTypeId: "", PolicyType: "", PolicyNumber: "", issue_date: "", expiry_date: "",
  AgentName: "", AgentCode: "", AgentContactNumber: "",
};

export default function VehicleFormModal({ open, onClose, onSaved, editRow }) {
  const isEdit = !!editRow;
  const [form, setForm] = useState(empty);
  const [headUserId, setHeadUserId] = useState(null);
  const [found, setFound] = useState(null); // null = not searched, true/false after
  const [searching, setSearching] = useState(false);
  const [kyc, setKyc] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [policyTypes, setPolicyTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  // Load master lists + prefill (edit) when opened.
  useEffect(() => {
    if (!open) return;
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
      });
      setFound(true);
      setHeadUserId(r.user_id || r.head_user_id || null);
      if (/^\d{10}$/.test(r.mobile || r.MobileNumber || "")) {
        api.get(`/user/consumer/documents/by-mobile/${r.mobile || r.MobileNumber}`).then((d) => setKyc(d.data?.data || [])).catch(() => setKyc(null));
      }
    } else {
      setForm(empty); setFound(null); setKyc(null); setHeadUserId(null);
    }
    Promise.all([
      api.get("/user/data/company-type").catch(() => null),
      api.get("/user/data/policytype").catch(() => null),
    ]).then(([c, p]) => {
      setCompanies((c?.data?.data || []).map((r) => ({ value: r.company_id, label: r.company_name })));
      setPolicyTypes((p?.data?.data || []).map((r) => ({ value: r.policy_type_id, label: r.policy_type_name })));
    });
  }, [open, isEdit, editRow]);

  const findConsumer = async () => {
    const mobile = form.MobileNumber;
    if (!/^\d{10}$/.test(mobile)) return toast.error("Enter a valid 10-digit mobile");
    setSearching(true);
    try {
      const res = await api.get(`/user/household/${mobile}`);
      const members = res.data?.data?.members || [];
      const match = members.find((m) => m.mobileNumber === mobile) || members[0];
      if (match) {
        setForm((f) => ({ ...f, Name: match.username || "", Email: match.email || "" }));
        setHeadUserId(match.user_id);
        setFound(true);
      } else {
        setFound(false);
      }
    } catch {
      setFound(false); // 404 → no consumer
    } finally {
      setSearching(false);
    }
    // KYC reuse lookup
    try {
      const d = await api.get(`/user/consumer/documents/by-mobile/${mobile}`);
      setKyc(d.data?.data || []);
    } catch { setKyc(null); }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const data = {
        ...form,
        runningPolicy: {
          CompanyId: form.CompanyId || null,
          CompanyName: form.CompanyName,
          PolicyTypeId: form.PolicyTypeId || null,
          PolicyType: form.PolicyType,
          PolicyNumber: form.PolicyNumber,
          issue_date: form.issue_date,
          expiry_date: form.expiry_date,
          agentName: form.AgentName,
          agentCode: form.AgentCode,
          agentContactNumber: form.AgentContactNumber,
        },
        previousPolicy: {},
        documentsData: [],
      };
      if (isEdit) {
        await api.put(`/user/vehicle/user/update/${editRow.vehicle_user_id}`, { data });
        toast.success("Vehicle policy updated");
      } else {
        await api.post("/user/vehicle/user/add", { data, head_user_id: headUserId });
        toast.success("Vehicle policy added");
      }
      onClose();
      onSaved?.();
    } catch (e) {
      showError(e, "Could not add vehicle policy");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      title: "Consumer",
      validate: () => {
        if (found === null) { toast.error("Find the consumer by mobile first"); return "find"; }
        const err = firstError(
          [
            field("MobileNumber", { label: "Mobile number", required: true, checks: [checks.mobile10] }),
            field("Name", { label: "Name", required: true }),
          ],
          form
        );
        if (err) { toast.error(err); return err; }
        return true;
      },
      render: () => (
        <div className="space-y-4">
          {!isEdit && (
            <div className="flex items-end gap-2">
              <PhoneInput label="Consumer Mobile" value={form.MobileNumber} onChange={(v) => { set("MobileNumber")(v); setFound(null); setKyc(null); }} />
              <Button icon={searching ? undefined : Search} onClick={findConsumer} disabled={searching}>
                {searching ? <Spinner size={16} /> : "Find"}
              </Button>
            </div>
          )}

          {!isEdit && found === true && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-700">
              <UserCheck size={15} /> Existing consumer found — details prefilled. You can edit if needed.
            </div>
          )}
          {found === false && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
              <UserPlus size={15} /> No consumer found — enter the details; a new consumer will be created.
            </div>
          )}

          {found !== null && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Name" value={form.Name} onChange={(e) => set("Name")(e.target.value)} />
              <Input label="Email" value={form.Email} onChange={(e) => set("Email")(e.target.value)} />
            </div>
          )}

          {kyc && kyc.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-subtle/40 p-3 text-[13px]">
              <span className="text-muted">KYC on file (reused):</span>
              {kyc.map((d) => (
                <span key={d.id} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[12px] text-brand-700">
                  <CheckCircle2 size={12} /> {d.documents?.doc_name || "Document"}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Vehicle",
      validate: () => {
        const err = firstError([field("VehicleNumber", { label: "Vehicle number", required: true })], form);
        if (err) { toast.error(err); return err; }
        return true;
      },
      render: () => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Vehicle Number" value={form.VehicleNumber} onChange={(e) => set("VehicleNumber")(e.target.value.toUpperCase())} />
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
      render: () => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dropdown
            label="Insurance Company"
            placeholder="Select company"
            options={companies}
            value={form.CompanyId}
            onChange={(v) => setForm((f) => ({ ...f, CompanyId: v, CompanyName: companies.find((c) => c.value === v)?.label || "" }))}
          />
          <Dropdown
            label="Policy Type"
            placeholder="Select policy type"
            options={policyTypes}
            value={form.PolicyTypeId}
            onChange={(v) => setForm((f) => ({ ...f, PolicyTypeId: v, PolicyType: policyTypes.find((p) => p.value === v)?.label || "" }))}
          />
          <Input label="Policy Number" value={form.PolicyNumber} onChange={(e) => set("PolicyNumber")(e.target.value)} />
          <div />
          <DatePicker label="Issue Date" value={form.issue_date} onChange={set("issue_date")} />
          <DatePicker label="Expiry Date" value={form.expiry_date} onChange={set("expiry_date")} />
          <Input label="Agent Name" value={form.AgentName} onChange={(e) => set("AgentName")(e.target.value)} />
          <Input label="Agent Code" value={form.AgentCode} onChange={(e) => set("AgentCode")(e.target.value)} />
          <PhoneInput label="Agent Contact" value={form.AgentContactNumber} onChange={set("AgentContactNumber")} />
        </div>
      ),
    },
    {
      title: "Review",
      render: () => (
        <div className="space-y-2 text-[14px]">
          <Row label="Consumer" value={`${form.Name} · ${form.MobileNumber}${found ? " (existing)" : " (new)"}`} />
          <Row label="Vehicle" value={`${form.VehicleNumber}${form.Make ? ` · ${form.Make} ${form.Model}` : ""}`} />
          <Row label="Company" value={form.CompanyName || "—"} />
          <Row label="Policy" value={[form.PolicyType, form.PolicyNumber].filter(Boolean).join(" · ") || "—"} />
          <Row label="Validity" value={form.issue_date || form.expiry_date ? `${form.issue_date || "—"} → ${form.expiry_date || "—"}` : "—"} />
          <Row label="KYC on file" value={kyc ? `${kyc.length} document(s)` : "—"} />
        </div>
      ),
    },
  ];

  return <StepperModal open={open} onClose={onClose} title={isEdit ? "Edit Vehicle Policy" : "Add Vehicle Policy"} steps={steps} onSubmit={submit} submitting={submitting} />;
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-line py-1.5">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
