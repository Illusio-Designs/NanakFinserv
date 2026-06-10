"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import DatePicker from "@/components/ui/DatePicker";
import api, { showError } from "@/lib/api";

const STATUS_OPTS = [
  "interested", "notInterested", "documentselected", "pickup", "query",
  "login", "sanction", "disbursement", "partPayment", "completed", "cancel",
].map((v) => ({ value: v, label: ({ notInterested: "Not interested", documentselected: "Document selected", partPayment: "Part-payment" }[v] || v.charAt(0).toUpperCase() + v.slice(1)) }));

const LOAN_TYPES = ["Home", "Car", "Personal", "Business", "NRP", "CC && OD", "TOP UP"].map((v) => ({ value: v, label: v }));
const EMPLOYMENT = ["SALARIED", "PARTNERSHIP", "PROPRIETORSHIP"].map((v) => ({ value: v, label: v }));

export default function LoanStageModal({ open, row, onClose, onSaved }) {
  const [status, setStatus] = useState("");
  const [f, setF] = useState({});
  const [parts, setParts] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const setE = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    if (!open || !row) return;
    const g = row.stages || {};
    setStatus(row.status && row.status !== "notAssign" ? row.status : "interested");
    setF({
      // login
      loanAmount: g.login?.loanAmount || "", loanAccountNumber: g.login?.loanAccountNumber || "", bankName: g.login?.bankName || "",
      product: g.login?.product || "", smName: g.login?.smName || "", amName: g.login?.amName || "", bankCode: g.login?.bankCode || "",
      dateOfBirth: g.login?.dateOfBirth || "", loanDate: g.login?.loanDate || "", remarks_loan: g.login?.remarks_loan || "",
      // property
      address: row.property?.address || "", sqFeet: row.property?.sqFeet || "", deedAmount: row.property?.deedAmount || "",
      // sanction
      amount: g.sanction?.amount || "", rate: g.sanction?.rate || "", tenure: g.sanction?.tenure || "", sanctionDate: g.sanction?.sanctionDate || "",
      // disbursement
      disbursementAmount: g.disbursement?.disbursementAmount || "", disbursementRate: g.disbursement?.disbursementRate || "", insurance: g.disbursement?.insurance || "",
      fileNumber: g.disbursement?.fileNumber || "", disbursementDate: g.disbursement?.disbursementDate || "", insuranceAmount: g.disbursement?.insuranceAmount || "",
      insuranceBankName: g.disbursement?.insuranceBankName || "", insuranceType: g.disbursement?.insuranceType || "", remark_dis: g.disbursement?.remark_dis || "",
      // document
      loan_type: g.documentSelected?.loan_type || "", loan_type_name: g.documentSelected?.loan_type_name || "", remarks_docs: g.documentSelected?.remarks_docs || "",
      // query/cancel/remarks
      remarks: g.query?.remarks || "", remarks_cancel: g.cancel?.remarks_cancel || "",
      pickupDate: "", pickupRemarks: "", completionDate: "", completionRemarks: "",
    });
    setParts((g.partPayments || []).map((p) => ({ part_amount: p.part_amount || "", part_date: p.part_date || "" })));
  }, [open, row]);

  const base = () => ({ user_consumer_id: row.user_consumer_id, laon_id: row.laon_id, phone_number: row.mobile, username: row.name, email: row.email, status });

  const save = async () => {
    if (!status) return toast.error("Select a status");
    if (status === "notInterested" && !f.remarks_cancel && !f.remarks) { /* allow */ }
    setSaving(true);
    try {
      if (status === "interested" || status === "notInterested") {
        await api.put("/user/list/loanUpdateStatus", { status, user_consumer_id: row.user_consumer_id, laon_id: row.laon_id, remarks: f.remarks || f.remarks_cancel || "" });
      } else {
        const payload = base();
        if (status === "documentselected") payload.document_details = { loan_type: f.loan_type, loan_type_name: f.loan_type_name, remarks_docs: f.remarks_docs };
        else if (status === "query") payload.query_details = { remarks: f.remarks };
        else if (status === "cancel") payload.cancel_details = { remarks_cancel: f.remarks_cancel };
        else if (status === "sanction") payload.sanction_details = { amount: f.amount, rate: f.rate, tenure: f.tenure, sanctionDate: f.sanctionDate };
        else if (status === "login") {
          payload.login_details = { loanAmount: f.loanAmount, loanAccountNumber: f.loanAccountNumber, bankName: f.bankName, product: f.product, smName: f.smName, amName: f.amName, bankCode: f.bankCode, dateOfBirth: f.dateOfBirth, loanDate: f.loanDate, remarks_loan: f.remarks_loan };
          if (f.address || f.sqFeet || f.deedAmount) payload.property_details = { address: f.address, sqFeet: f.sqFeet, deedAmount: f.deedAmount };
        }
        else if (status === "disbursement") payload.disbursement_details = { disbursementAmount: f.disbursementAmount, disbursementRate: f.disbursementRate, insurance: f.insurance, fileNumber: f.fileNumber, disbursementDate: f.disbursementDate, insuranceAmount: f.insuranceAmount, insuranceBankName: f.insuranceBankName, insuranceType: f.insuranceType, remark_dis: f.remark_dis };
        else if (status === "partPayment") payload.part_details = { parts: parts.filter((p) => p.part_amount).map((p, i) => ({ part_number: i + 1, part_amount: p.part_amount, part_date: p.part_date })) };
        else if (status === "pickup") payload.pickup_details = { pickupDate: f.pickupDate, pickupRemarks: f.pickupRemarks };
        else if (status === "completed") payload.completed_details = { completionDate: f.completionDate, completionRemarks: f.completionRemarks };
        await api.put("/user/data/add/consumer/loan", payload);
      }
      toast.success("Loan updated");
      onSaved?.();
    } catch (e) { showError(e, "Could not update loan"); }
    finally { setSaving(false); }
  };

  if (!row) return null;
  const grid = "grid grid-cols-1 gap-4 sm:grid-cols-2";
  return (
    <Modal open={open} onClose={onClose} title="Update loan stage" subtitle={row.name} size="lg"
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></div>}>
      <div className="space-y-4">
        <Dropdown label="Stage / Status" options={STATUS_OPTS} value={status} onChange={setStatus} searchable />

        {status === "documentselected" && (
          <div className={grid}>
            <Dropdown label="Loan type" options={LOAN_TYPES} value={f.loan_type} onChange={set("loan_type")} searchable />
            <Dropdown label="Employment" options={EMPLOYMENT} value={f.loan_type_name} onChange={set("loan_type_name")} />
            <Input label="Remarks" value={f.remarks_docs} onChange={setE("remarks_docs")} />
          </div>
        )}
        {status === "login" && (
          <div className={grid}>
            <Input label="Loan amount" value={f.loanAmount} onChange={setE("loanAmount")} />
            <Input label="Loan account no" value={f.loanAccountNumber} onChange={setE("loanAccountNumber")} />
            <Input label="Bank name" value={f.bankName} onChange={setE("bankName")} />
            <Input label="Product" value={f.product} onChange={setE("product")} />
            <Input label="SM name" value={f.smName} onChange={setE("smName")} />
            <Input label="AM name" value={f.amName} onChange={setE("amName")} />
            <Input label="Bank code" value={f.bankCode} onChange={setE("bankCode")} />
            <DatePicker label="Date of birth" value={f.dateOfBirth} onChange={set("dateOfBirth")} />
            <DatePicker label="Login date" value={f.loanDate} onChange={set("loanDate")} />
            <Input label="Remarks" value={f.remarks_loan} onChange={setE("remarks_loan")} />
            <div className="sm:col-span-2 text-[12px] font-semibold uppercase tracking-wide text-muted">Property (non-builder, optional)</div>
            <Input label="Address" value={f.address} onChange={setE("address")} />
            <Input label="Sq ft" value={f.sqFeet} onChange={setE("sqFeet")} />
            <Input label="Deed amount" value={f.deedAmount} onChange={setE("deedAmount")} />
          </div>
        )}
        {status === "sanction" && (
          <div className={grid}>
            <Input label="Amount" value={f.amount} onChange={setE("amount")} />
            <Input label="Rate (%)" value={f.rate} onChange={setE("rate")} />
            <Input label="Tenure" value={f.tenure} onChange={setE("tenure")} />
            <DatePicker label="Sanction date" value={f.sanctionDate} onChange={set("sanctionDate")} />
          </div>
        )}
        {status === "disbursement" && (
          <div className={grid}>
            <Input label="Disbursement amount" value={f.disbursementAmount} onChange={setE("disbursementAmount")} />
            <Input label="Rate (%)" value={f.disbursementRate} onChange={setE("disbursementRate")} />
            <Input label="File number" value={f.fileNumber} onChange={setE("fileNumber")} />
            <DatePicker label="Disbursement date" value={f.disbursementDate} onChange={set("disbursementDate")} />
            <Input label="Insurance" value={f.insurance} onChange={setE("insurance")} />
            <Input label="Insurance amount" value={f.insuranceAmount} onChange={setE("insuranceAmount")} />
            <Input label="Insurance bank" value={f.insuranceBankName} onChange={setE("insuranceBankName")} />
            <Input label="Insurance type" value={f.insuranceType} onChange={setE("insuranceType")} />
            <Input label="Remark" value={f.remark_dis} onChange={setE("remark_dis")} />
          </div>
        )}
        {status === "partPayment" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-[13px] text-muted">Part payments</span><Button size="sm" icon={Plus} onClick={() => setParts((p) => [...p, { part_amount: "", part_date: "" }])}>Add</Button></div>
            {parts.length === 0 && <p className="rounded-lg border border-dashed border-line py-4 text-center text-[13px] text-muted">No part payments yet.</p>}
            {parts.map((p, i) => (
              <div key={i} className="grid grid-cols-1 gap-3 rounded-lg border border-line p-3 sm:grid-cols-[1fr_1fr_auto]">
                <Input label={`Amount #${i + 1}`} value={p.part_amount} onChange={(e) => setParts((arr) => arr.map((x, idx) => idx === i ? { ...x, part_amount: e.target.value } : x))} />
                <DatePicker label="Date" value={p.part_date} onChange={(v) => setParts((arr) => arr.map((x, idx) => idx === i ? { ...x, part_date: v } : x))} />
                <div className="flex items-end"><Button size="sm" variant="ghost" icon={Trash2} onClick={() => setParts((arr) => arr.filter((_, idx) => idx !== i))}>Remove</Button></div>
              </div>
            ))}
          </div>
        )}
        {status === "query" && <Input label="Query remarks" value={f.remarks} onChange={setE("remarks")} />}
        {status === "cancel" && <Input label="Cancellation remarks" value={f.remarks_cancel} onChange={setE("remarks_cancel")} />}
        {status === "notInterested" && <Input label="Reason / remarks" value={f.remarks_cancel} onChange={setE("remarks_cancel")} />}
        {status === "pickup" && (
          <div className={grid}>
            <DatePicker label="Pickup date" value={f.pickupDate} onChange={set("pickupDate")} />
            <Input label="Pickup remarks" value={f.pickupRemarks} onChange={setE("pickupRemarks")} />
          </div>
        )}
        {status === "completed" && (
          <div className={grid}>
            <DatePicker label="Completion date" value={f.completionDate} onChange={set("completionDate")} />
            <Input label="Completion remarks" value={f.completionRemarks} onChange={setE("completionRemarks")} />
          </div>
        )}
        {status === "interested" && <p className="text-[13px] text-muted">Marks this loan as interested — fill the stages above as it progresses.</p>}
      </div>
    </Modal>
  );
}
