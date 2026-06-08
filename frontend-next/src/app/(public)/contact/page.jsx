"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { Phone, Mail, MapPin } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { firstError, field, checks } from "@/utils/validators";

const INFO = [
  { icon: Phone, label: "Phone Number", value: "+91 99257 12341", href: "tel:+919925712341" },
  { icon: Mail, label: "Email Address", value: "info@nanakfinserv.com", href: "mailto:info@nanakfinserv.com" },
  {
    icon: MapPin,
    label: "Office Location",
    value: "RK Prime, Office No. 1013, near Silver Heights, Nana Mava Circle, Rajkot – 360005",
    href: "https://maps.app.goo.gl/a3kaxaHuav5PX5cq7",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "" });

  const submit = (e) => {
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
    toast.success("Thanks! We'll get back to you within 24 hours.");
    setForm({ name: "", email: "", phone: "", service: "" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-[32px] font-bold tracking-tight text-ink">Contact us</h1>
        <p className="mt-2 text-[15px] text-muted">Get in touch with us through any of these channels.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Info */}
        <div className="space-y-4">
          {INFO.map((c) => {
            const Icon = c.icon;
            return (
              <a
                key={c.label}
                href={c.href}
                target={c.label === "Office Location" ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="ui-card flex items-start gap-4 p-5 transition-shadow hover:shadow-pop"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={20} />
                </div>
                <div>
                  <div className="text-[12px] uppercase tracking-wide text-muted">{c.label}</div>
                  <div className="text-[14px] font-medium text-ink">{c.value}</div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={submit} className="ui-card space-y-4 p-6">
          <h2 className="text-[18px] font-semibold text-ink">Send us a Message</h2>
          <p className="-mt-2 text-[13px] text-muted">Fill out the form and we'll get back to you within 24 hours.</p>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone Number" maxLength={10} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} />
          <Button type="submit" className="w-full">Send message</Button>
        </form>
      </div>
    </div>
  );
}
