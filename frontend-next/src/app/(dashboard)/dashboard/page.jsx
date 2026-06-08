"use client";
import { useEffect, useState } from "react";
import { Users, HandCoins, Car, HeartPulse, ShieldCheck, Building2, IndianRupee, TrendingUp } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { StatCard, Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import api, { showError } from "@/lib/api";

const inr = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function DashboardPage() {
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/user/data/counts");
        setCounts(res.data?.data || {});
      } catch (e) {
        showError(e, "Could not load dashboard");
        setCounts({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const c = counts || {};
  const stats = [
    { title: "Consumers", value: c.consumerCount, icon: Users, tone: "brand" },
    { title: "Loan", value: c.loanUserCount, icon: HandCoins, tone: "success" },
    { title: "Vehicle", value: c.vehicleUserCount, icon: Car, tone: "warning" },
    { title: "Mediclaim", value: c.mediclaimUserCount, icon: HeartPulse, tone: "danger" },
    { title: "Life Insurance", value: c.lifeUserCount, icon: ShieldCheck, tone: "brand" },
    { title: "Builder Consumers", value: c.builderUserCount, icon: Building2, tone: "success" },
  ];

  const loanPipeline = [
    ["Interested", c.loanInterstedUserCount],
    ["Not interested", c.loanNotInterstedUserCount],
    ["Not assigned", c.loanNotAssignUserCount],
    ["Login", c.loanLoginUserCount],
    ["Sanction", c.loanSensonUserCount],
    ["Disbursement", c.loanDisburseUserCount],
    ["Part payment", c.loanPartUserCount],
    ["Completed", c.loanCompletedUserCount],
  ];

  const amounts = [
    ["Loaned (today)", c.totalLoandAmount],
    ["Disbursed (today)", c.totalDisbursedAmount],
    ["Part payment (today)", c.totalPartPaymentAmount],
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live overview of your CRM" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? [...Array(6)].map((_, i) => <div key={i} className="skeleton h-[78px] rounded-lg" />)
          : stats.map((s) => <StatCard key={s.title} {...s} value={s.value ?? 0} />)}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Loan pipeline */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold">Loan pipeline</h3>
            <Badge tone="brand">{loading ? "…" : `${c.loanUserCount ?? 0} total`}</Badge>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-9 rounded" />)}</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {loanPipeline.map(([label, val]) => (
                <div key={label} className="rounded-lg border border-line p-3">
                  <div className="text-[20px] font-semibold text-ink">{val ?? 0}</div>
                  <div className="mt-0.5 text-[12px] text-muted">{label}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Amounts (today) */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <IndianRupee size={18} className="text-brand-600" />
            <h3 className="text-[15px] font-semibold">Today’s amounts</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-8 rounded" />)}</div>
          ) : (
            <div className="space-y-4">
              {amounts.map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-muted">
                    <TrendingUp size={15} /> {label}
                  </span>
                  <span className="text-[16px] font-semibold">{inr(val)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
