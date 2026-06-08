"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import Dropdown from "@/components/ui/Dropdown";
import PhoneInput from "@/components/ui/PhoneInput";
import { API_URL } from "@/lib/api";
import { firstError, field, checks } from "@/utils/validators";

const SERVICE_OPTS = ["Life Insurance", "Loan", "Vehicle Insurance", "Mediclaim"].map((s) => ({ value: s, label: s }));

export default function LeadForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "" });

  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const err = firstError(
      [
        field("name", { label: "Name", required: true }),
        field("email", { label: "Email", required: true, checks: [checks.email] }),
        field("phone", { label: "Phone number", required: true, checks: [checks.mobile10] }),
      ],
      form
    );
    if (err) return toast.error(err);
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/public/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.name, email: form.email, phone_number: form.phone, service: form.service }),
      });
      const json = await res.json();
      if (json.status) {
        toast.success("Thank you! Our team will reach out shortly.");
        setForm({ name: "", email: "", phone: "", service: "" });
      } else {
        toast.error(json.message || "Could not submit");
      }
    } catch {
      toast.error("Could not submit. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const fieldCls =
    "w-full rounded-md border-0 bg-white/95 px-3 py-2.5 text-[14px] text-ink outline-none focus:ring-2 focus:ring-white/60 placeholder:text-muted/70";

  return (
    <form
      onSubmit={submit}
      className="mx-auto -mt-2 grid max-w-4xl gap-4 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 shadow-pop sm:grid-cols-2 sm:p-8"
    >
      <input className={fieldCls} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className={fieldCls} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <PhoneInput light value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Phone Number" />
      <Dropdown
        variant="light"
        placeholder="Services"
        options={SERVICE_OPTS}
        value={form.service}
        onChange={(v) => setForm({ ...form, service: v })}
      />
      <div className="sm:col-span-2 flex justify-center">
        <button type="submit" disabled={busy} className="press rounded-full bg-white px-10 py-2.5 text-[14px] font-semibold text-brand-700 hover:bg-white/90 disabled:opacity-70">
          {busy ? "SUBMITTING…" : "SUBMIT"}
        </button>
      </div>
    </form>
  );
}
