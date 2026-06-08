"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, UserCheck, UserPlus } from "lucide-react";
import StepperModal from "@/components/ui/StepperModal";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import Dropdown from "@/components/ui/Dropdown";
import DatePicker from "@/components/ui/DatePicker";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import api, { showError } from "@/lib/api";
import { firstError, field, checks } from "@/utils/validators";

const GENDER = ["Male", "Female", "Other"].map((g) => ({ value: g, label: g }));
const MODE = ["Monthly", "Quarterly", "Half-Yearly", "Yearly", "Single"].map((m) => ({ value: m, label: m }));

const empty = {
  proposer_name: "", proposer_mobile_numbers: "", proposer_email: "", proposer_dob: "", proposer_pan_number: "", proposer_gender: "",
  life_assured_name: "", life_assured_mobile_numbers: "", life_assured_dob: "", life_assured_relationship_with_proposer: "",
  nominee_name: "", nominee_relationship_with_life_assured: "", nominee_mobile_numbers: "", nominee_dob: "",
  policy_number: "", sum_assured: "", premium_amount: "", premium_payment_mode: "", premium_payment_term: "", policy_term: "",
  date_of_maturity: "", due_date_of_premium: "", agent_name: "", agent_code: "",
};

export default function LifeFormModal({ open, onClose, onSaved, editRow }) {
  const isEdit = !!editRow;
  const [form, setForm] = useState(empty);
  const [userConsumerId, setUserConsumerId] = useState(null);
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const [sameAsProposer, setSameAsProposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setForm({ ...empty, ...editRow });
      setFound(true);
      setUserConsumerId(editRow.user_consumer_id || null);
    } else {
      setForm(empty); setFound(null); setUserConsumerId(null); setSameAsProposer(false);
    }
  }, [open, isEdit, editRow]);

  const findConsumer = async () => {
    const mobile = form.proposer_mobile_numbers;
    if (!/^\d{10}$/.test(mobile)) return toast.error("Enter a valid 10-digit mobile");
    setSearching(true);
    try {
      const res = await api.get(`/user/household/${mobile}`);
      const members = res.data?.data?.members || [];
      const match = members.find((m) => m.mobileNumber === mobile) || members[0];
      if (match) { setForm((f) => ({ ...f, proposer_name: match.username || f.proposer_name, proposer_email: match.email || f.proposer_email })); setUserConsumerId(match.user_id); setFound(true); }
      else setFound(false);
    } catch { setFound(false); }
    finally { setSearching(false); }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = { ...form, user_consumer_id: userConsumerId };
      if (sameAsProposer) {
        payload.life_assured_name = form.proposer_name;
        payload.life_assured_mobile_numbers = form.proposer_mobile_numbers;
        payload.life_assured_dob = form.proposer_dob;
        payload.life_assured_relationship_with_proposer = "Self";
      }
      if (isEdit) {
        await api.put(`/user/life-insurance/update/${editRow.id}`, payload);
        toast.success("Life policy updated");
      } else {
        await api.post("/user/life-insurance/create", payload);
        toast.success("Life policy created");
      }
      onClose();
      onSaved?.();
    } catch (e) { showError(e, "Could not save life policy"); }
    finally { setSubmitting(false); }
  };

  const steps = [
    {
      title: "Proposer",
      validate: () => {
        if (!isEdit && found === null) { toast.error("Find the consumer by mobile first"); return "find"; }
        const err = firstError([
          field("proposer_mobile_numbers", { label: "Proposer mobile", required: true, checks: [checks.mobile10] }),
          field("proposer_name", { label: "Proposer name", required: true }),
        ], form);
        if (err) { toast.error(err); return err; }
        return true;
      },
      render: () => (
        <div className="space-y-4">
          {!isEdit && (
            <div className="flex items-end gap-2">
              <PhoneInput label="Proposer Mobile" value={form.proposer_mobile_numbers} onChange={(v) => { set("proposer_mobile_numbers")(v); setFound(null); }} />
              <Button icon={searching ? undefined : Search} onClick={findConsumer} disabled={searching}>{searching ? <Spinner size={16} /> : "Find"}</Button>
            </div>
          )}
          {!isEdit && found === true && <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-700"><UserCheck size={15} /> Existing consumer — prefilled.</div>}
          {!isEdit && found === false && <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700"><UserPlus size={15} /> New consumer — enter details.</div>}
          {(isEdit || found !== null) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Proposer Name" value={form.proposer_name} onChange={(e) => set("proposer_name")(e.target.value)} />
              {isEdit && <PhoneInput label="Proposer Mobile" value={form.proposer_mobile_numbers} onChange={set("proposer_mobile_numbers")} />}
              <Input label="Email" value={form.proposer_email} onChange={(e) => set("proposer_email")(e.target.value)} />
              <DatePicker label="Date of Birth" value={form.proposer_dob} onChange={set("proposer_dob")} />
              <Input label="PAN" value={form.proposer_pan_number} onChange={(e) => set("proposer_pan_number")(e.target.value.toUpperCase())} />
              <Dropdown label="Gender" placeholder="Select" options={GENDER} value={form.proposer_gender} onChange={set("proposer_gender")} />
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Life Assured",
      render: () => (
        <div className="space-y-4">
          <Checkbox label="Same as proposer" checked={sameAsProposer} onChange={setSameAsProposer} />
          {!sameAsProposer && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Name" value={form.life_assured_name} onChange={(e) => set("life_assured_name")(e.target.value)} />
              <PhoneInput label="Mobile" value={form.life_assured_mobile_numbers} onChange={set("life_assured_mobile_numbers")} />
              <DatePicker label="Date of Birth" value={form.life_assured_dob} onChange={set("life_assured_dob")} />
              <Input label="Relationship with Proposer" value={form.life_assured_relationship_with_proposer} onChange={(e) => set("life_assured_relationship_with_proposer")(e.target.value)} />
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Nominee",
      render: () => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nominee Name" value={form.nominee_name} onChange={(e) => set("nominee_name")(e.target.value)} />
          <Input label="Relationship" value={form.nominee_relationship_with_life_assured} onChange={(e) => set("nominee_relationship_with_life_assured")(e.target.value)} />
          <PhoneInput label="Mobile" value={form.nominee_mobile_numbers} onChange={set("nominee_mobile_numbers")} />
          <DatePicker label="Date of Birth" value={form.nominee_dob} onChange={set("nominee_dob")} />
        </div>
      ),
    },
    {
      title: "Policy",
      render: () => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Policy Number" value={form.policy_number} onChange={(e) => set("policy_number")(e.target.value)} />
          <Input label="Sum Assured" value={form.sum_assured} onChange={(e) => set("sum_assured")(e.target.value.replace(/[^\d.]/g, ""))} />
          <Input label="Premium Amount" value={form.premium_amount} onChange={(e) => set("premium_amount")(e.target.value.replace(/[^\d.]/g, ""))} />
          <Dropdown label="Premium Mode" placeholder="Select" options={MODE} value={form.premium_payment_mode} onChange={set("premium_payment_mode")} />
          <Input label="Premium Payment Term (yrs)" value={form.premium_payment_term} onChange={(e) => set("premium_payment_term")(e.target.value.replace(/\D/g, ""))} />
          <Input label="Policy Term (yrs)" value={form.policy_term} onChange={(e) => set("policy_term")(e.target.value.replace(/\D/g, ""))} />
          <DatePicker label="Maturity Date" value={form.date_of_maturity} onChange={set("date_of_maturity")} />
          <DatePicker label="Premium Due Date" value={form.due_date_of_premium} onChange={set("due_date_of_premium")} />
          <Input label="Agent Name" value={form.agent_name} onChange={(e) => set("agent_name")(e.target.value)} />
          <Input label="Agent Code" value={form.agent_code} onChange={(e) => set("agent_code")(e.target.value)} />
        </div>
      ),
    },
    {
      title: "Review",
      render: () => (
        <div className="space-y-2 text-[14px]">
          <Row label="Proposer" value={`${form.proposer_name} · ${form.proposer_mobile_numbers}`} />
          <Row label="Life Assured" value={sameAsProposer ? "Same as proposer" : (form.life_assured_name || "—")} />
          <Row label="Nominee" value={form.nominee_name || "—"} />
          <Row label="Policy No." value={form.policy_number || "—"} />
          <Row label="Sum Assured" value={form.sum_assured || "—"} />
          <Row label="Premium" value={form.premium_amount ? `${form.premium_amount} (${form.premium_payment_mode || "—"})` : "—"} />
        </div>
      ),
    },
  ];

  return <StepperModal open={open} onClose={onClose} title={isEdit ? "Edit Life Policy" : "Add Life Policy"} steps={steps} onSubmit={submit} submitting={submitting} />;
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-line py-1.5">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
