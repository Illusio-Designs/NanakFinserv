"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import Dropdown from "@/components/ui/Dropdown";
import Button from "@/components/ui/Button";
import { API_URL } from "@/lib/api";
import { firstError, field, checks } from "@/utils/validators";

const SERVICE_OPTS = ["Life Insurance", "Loan", "Vehicle Insurance", "Mediclaim"].map((s) => ({ value: s, label: s }));

export default function PromoPopup() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "" });

  useEffect(() => {
    if (sessionStorage.getItem("promo-seen")) return;
    const t = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem("promo-seen", "1");
    }, 2500);
    return () => clearTimeout(t);
  }, []);

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
        toast.success("Thanks! We'll get back to you within 24 hours.");
        setOpen(false);
      } else toast.error(json.message || "Could not submit");
    } catch {
      toast.error("Could not submit. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Get Connected Instantly" subtitle="Fill the form and we'll get back within 24 hours with your personalized quote." size="sm">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        <PhoneInput label="Phone Number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Dropdown label="Service" placeholder="Select a service" options={SERVICE_OPTS} value={form.service} onChange={(v) => setForm({ ...form, service: v })} />
        <Button type="submit" className="w-full" loading={busy}>Submit</Button>
      </form>
    </Modal>
  );
}
