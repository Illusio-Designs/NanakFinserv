"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { Phone, Mail, MapPin } from "lucide-react";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import Button from "@/components/ui/Button";
import { TiltCard, ScrollReveal, StaggerReveal, RevealItem, FloatingOrbs } from "@/components/public/Motion3D";
import { API_URL } from "@/lib/api";
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
        toast.success("Thanks! We'll get back to you within 24 hours.");
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

  return (
    <div className="relative overflow-hidden">
      <FloatingOrbs className="opacity-70" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h1 className="text-[34px] font-bold tracking-tight text-ink">Let's <span className="text-gradient">talk</span></h1>
            <p className="mt-2 text-[15px] text-muted">Get in touch through any of these channels — we reply within 24 hours.</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Info */}
          <StaggerReveal className="space-y-4">
            {INFO.map((c) => {
              const Icon = c.icon;
              return (
                <RevealItem key={c.label}>
                  <a
                    href={c.href}
                    target={c.label === "Office Location" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <TiltCard className="ui-card flex items-start gap-4 p-5" max={6}>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="text-[12px] uppercase tracking-wide text-muted">{c.label}</div>
                        <div className="text-[14px] font-medium text-ink">{c.value}</div>
                      </div>
                    </TiltCard>
                  </a>
                </RevealItem>
              );
            })}
          </StaggerReveal>

          {/* Form */}
          <ScrollReveal delay={0.1}>
            <form onSubmit={submit} className="ui-card space-y-4 p-6 shadow-lift">
              <h2 className="text-[18px] font-semibold text-ink">Send us a message</h2>
              <p className="-mt-2 text-[13px] text-muted">Fill out the form and we'll get back to you within 24 hours.</p>
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <PhoneInput label="Phone Number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Button type="submit" className="w-full" loading={busy}>Send message</Button>
            </form>
          </ScrollReveal>
        </div>

        {/* Map */}
        <ScrollReveal delay={0.05}>
          <div className="mt-10 overflow-hidden rounded-3xl border border-line shadow-lift">
            <iframe
              title="Nanak Finserv location"
              src="https://www.google.com/maps?q=NANAK%20FINSERV%20RK%20PRIME%20Nana%20Mava%20Circle%20Rajkot&output=embed"
              className="h-[360px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
