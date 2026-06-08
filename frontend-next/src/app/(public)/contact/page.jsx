"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { Phone, Mail, MapPin } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { firstError, field, checks } from "@/utils/validators";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", mobile: "", message: "" });

  const submit = (e) => {
    e.preventDefault();
    const err = firstError(
      [
        field("name", { label: "Name", required: true }),
        field("mobile", { label: "Mobile number", required: true, checks: [checks.mobile10] }),
      ],
      form
    );
    if (err) return toast.error(err);
    toast.success("Thanks! We'll get back to you shortly.");
    setForm({ name: "", mobile: "", message: "" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-[32px] font-bold tracking-tight text-ink">Contact us</h1>
        <p className="mt-2 text-[15px] text-muted">We'd love to help you find the right plan.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          {[
            [Phone, "Phone", "+91 76000 46416"],
            [Mail, "Email", "info@nanakfinserv.com"],
            [MapPin, "Address", "India"],
          ].map(([Icon, label, val]) => (
            <div key={label} className="ui-card flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon size={20} />
              </div>
              <div>
                <div className="text-[12px] uppercase tracking-wide text-muted">{label}</div>
                <div className="text-[15px] font-medium text-ink">{val}</div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="ui-card space-y-4 p-6">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Mobile Number" maxLength={10} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })} />
          <div>
            <label className="ui-label">Message</label>
            <textarea
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="ui-control py-2"
              style={{ height: "auto" }}
              placeholder="How can we help?"
            />
          </div>
          <Button type="submit" className="w-full">Send message</Button>
        </form>
      </div>
    </div>
  );
}
