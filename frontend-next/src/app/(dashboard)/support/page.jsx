"use client";
import { Phone, Mail, MapPin, LifeBuoy, BookOpen } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

const CONTACTS = [
  { icon: Phone, label: "Phone", value: "+91 99257 12341", href: "tel:+919925712341" },
  { icon: Mail, label: "Email", value: "info@nanakfinserv.com", href: "mailto:info@nanakfinserv.com" },
  { icon: MapPin, label: "Office", value: "RK Prime, Office No. 1013, Nana Mava Circle, Rajkot – 360005" },
];

const GUIDES = [
  ["Consumers", "Add consumers (standalone or join a household), assign a working person, and store KYC documents reused across policies."],
  ["Vehicle", "Add/renew policies with TP & OD timelines, manage past records, and upload RC / policy documents."],
  ["Settings", "Enable/disable verticals; the data-wipe clears business data + consumers (back-office users are kept)."],
];

export default function SupportPage() {
  return (
    <div>
      <PageHeader title="Support" subtitle="Help & contact" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-3 flex items-center gap-2"><LifeBuoy size={18} className="text-brand-600" /><h3 className="text-[15px] font-semibold">Contact</h3></div>
          <div className="space-y-4">
            {CONTACTS.map((c) => {
              const Icon = c.icon;
              const inner = (
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon size={16} /></span>
                  <div>
                    <div className="text-[12px] uppercase tracking-wide text-muted">{c.label}</div>
                    <div className="text-[14px] font-medium text-ink">{c.value}</div>
                  </div>
                </div>
              );
              return c.href ? <a key={c.label} href={c.href} className="block hover:opacity-80">{inner}</a> : <div key={c.label}>{inner}</div>;
            })}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2"><BookOpen size={18} className="text-brand-600" /><h3 className="text-[15px] font-semibold">Quick guides</h3></div>
          <div className="space-y-3">
            {GUIDES.map(([t, d]) => (
              <div key={t} className="rounded-lg border border-line p-4">
                <div className="text-[14px] font-semibold text-ink">{t}</div>
                <p className="mt-1 text-[13px] text-muted">{d}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
