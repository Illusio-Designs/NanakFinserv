"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";
import StepperModal from "@/components/ui/StepperModal";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import DatePicker from "@/components/ui/DatePicker";
import api, { showError } from "@/lib/api";
import { firstError, field, checks } from "@/utils/validators";

const empty = {
  // owner
  Name: "", MobileNumber: "", Email: "",
  // vehicle
  VehicleNumber: "", Make: "", Model: "", ManufacturingYear: "", EngineNumber: "", ChassisNumber: "",
  // policy (running)
  CompanyName: "", PolicyNumber: "", PolicyType: "", issue_date: "", expiry_date: "",
  // agent
  AgentName: "", AgentCode: "", AgentContactNumber: "",
  remark: "",
};

export default function VehicleFormModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(empty);
  const [kyc, setKyc] = useState(null); // existing consumer KYC (reuse)
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const lookupKyc = async (mobile) => {
    if (!/^\d{10}$/.test(mobile)) { setKyc(null); return; }
    try {
      const res = await api.get(`/user/consumer/documents/by-mobile/${mobile}`);
      setKyc(res.data?.data || []);
    } catch { setKyc(null); }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const data = {
        ...form,
        runningPolicy: {
          CompanyName: form.CompanyName,
          PolicyNumber: form.PolicyNumber,
          PolicyType: form.PolicyType,
          issue_date: form.issue_date,
          expiry_date: form.expiry_date,
          agentName: form.AgentName,
          agentCode: form.AgentCode,
          agentContactNumber: form.AgentContactNumber,
        },
        previousPolicy: {},
        documentsData: [],
      };
      await api.post("/user/vehicle/user/add", { data });
      toast.success("Vehicle policy added");
      setForm(empty);
      setKyc(null);
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
      title: "Owner",
      validate: () => {
        const err = firstError(
          [
            field("Name", { label: "Name", required: true }),
            field("MobileNumber", { label: "Mobile number", required: true, checks: [checks.mobile10] }),
          ],
          form
        );
        if (err) { toast.error(err); return err; }
        return true;
      },
      render: () => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Name" value={form.Name} onChange={(e) => set("Name")(e.target.value)} />
          <PhoneInput label="Mobile Number" value={form.MobileNumber} onChange={(v) => { set("MobileNumber")(v); lookupKyc(v); }} />
          <Input label="Email" value={form.Email} onChange={(e) => set("Email")(e.target.value)} />
          {kyc && (
            <div className="sm:col-span-2 rounded-lg border border-line bg-subtle/40 p-3 text-[13px]">
              {kyc.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted">KYC on file (reused):</span>
                  {kyc.map((d) => (
                    <span key={d.id} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[12px] text-brand-700">
                      <CheckCircle2 size={12} /> {d.documents?.doc_name || "Document"}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted">No KYC on file for this mobile — add it from the consumer's “Upload document”.</span>
              )}
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
          <Input label="Insurance Company" value={form.CompanyName} onChange={(e) => set("CompanyName")(e.target.value)} />
          <Input label="Policy Number" value={form.PolicyNumber} onChange={(e) => set("PolicyNumber")(e.target.value)} />
          <Input label="Policy Type" value={form.PolicyType} onChange={(e) => set("PolicyType")(e.target.value)} />
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
          <Row label="Owner" value={`${form.Name} · ${form.MobileNumber}`} />
          <Row label="Vehicle" value={`${form.VehicleNumber}${form.Make ? ` · ${form.Make} ${form.Model}` : ""}`} />
          <Row label="Company" value={form.CompanyName || "—"} />
          <Row label="Policy No." value={form.PolicyNumber || "—"} />
          <Row label="Validity" value={form.issue_date || form.expiry_date ? `${form.issue_date || "—"} → ${form.expiry_date || "—"}` : "—"} />
          <Row label="KYC on file" value={kyc ? `${kyc.length} document(s)` : "—"} />
        </div>
      ),
    },
  ];

  return <StepperModal open={open} onClose={onClose} title="Add Vehicle Policy" steps={steps} onSubmit={submit} submitting={submitting} />;
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-line py-1.5">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
