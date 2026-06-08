"use client";
import { Users, HandCoins, Car, HeartPulse, ShieldCheck, TrendingUp } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { StatCard, Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const STATS = [
  { title: "Consumers", value: "1,284", icon: Users, tone: "brand" },
  { title: "Active Loans", value: "342", icon: HandCoins, tone: "success" },
  { title: "Vehicle Policies", value: "517", icon: Car, tone: "warning" },
  { title: "Mediclaim", value: "208", icon: HeartPulse, tone: "danger" },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your CRM activity" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold">Recent activity</h3>
            <Badge tone="brand">Live</Badge>
          </div>
          <ul className="space-y-3 text-[14px]">
            {[
              ["New consumer onboarded", "Vehicle", "2m ago"],
              ["Loan marked disbursed", "Loan", "18m ago"],
              ["Mediclaim policy renewed", "Mediclaim", "1h ago"],
              ["Life policy created", "Life", "3h ago"],
            ].map(([t, tag, time], i) => (
              <li key={i} className="flex items-center justify-between rounded-md border border-line px-3 py-2.5">
                <span className="text-ink">{t}</span>
                <span className="flex items-center gap-3">
                  <Badge>{tag}</Badge>
                  <span className="text-[12px] text-muted">{time}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-600" />
            <h3 className="text-[15px] font-semibold">This month</h3>
          </div>
          <div className="space-y-4">
            {[
              ["New consumers", "126", ShieldCheck],
              ["Policies issued", "89", Car],
              ["Renewals", "54", HeartPulse],
            ].map(([label, val, Icon], i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[14px] text-muted">
                  <Icon size={16} /> {label}
                </span>
                <span className="text-[16px] font-semibold">{val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
