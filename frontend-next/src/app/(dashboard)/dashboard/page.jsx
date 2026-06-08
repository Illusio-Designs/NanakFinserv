"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { Users, HandCoins, Car, HeartPulse, ShieldCheck, Building2, IndianRupee, TrendingUp, RefreshCw, UserCog, ListChecks, ChevronRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { StatCard, Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import api, { showError } from "@/lib/api";
import { ROLE_IDS } from "@/config/ids";

const inr = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function DashboardPage() {
  const [role, setRole] = useState(undefined);
  useEffect(() => {
    try {
      const u = JSON.parse(Cookies.get("user") || "{}");
      setRole(u.Role || u.role_id || null);
    } catch { setRole(null); }
  }, []);
  if (role === undefined) return <div className="space-y-4"><div className="skeleton h-24 rounded-lg" /></div>;
  if (role === ROLE_IDS.CONSUMER || role === ROLE_IDS.BUILDER_CONSUMER) return <ConsumerDashboard />;
  return <AdminDashboard />;
}

function AdminDashboard() {
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState({ renewalsDue: 0, unassigned: 0, unread: 0 });

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

    // Pending tasks (best-effort; each is independent).
    (async () => {
      const next = { renewalsDue: 0, unassigned: 0, unread: 0 };
      try {
        const r = await api.get("/user/vehicle/renewal/stats");
        const d = r.data?.data || r.data || {};
        next.renewalsDue = d.dueSoon ?? d.due ?? d.total ?? Object.values(d).filter((v) => typeof v === "number").reduce((a, b) => a + b, 0);
      } catch {}
      try {
        const n = await api.get("/user/notifications/count");
        next.unread = n.data?.data?.unread || 0;
      } catch {}
      try {
        const c = await api.get("/user/list/consumer");
        next.unassigned = (c.data?.data || []).filter((u) => (u.category || []).some((m) => !m.user_role_id)).length;
      } catch {}
      setTasks(next);
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

      {/* Pending tasks */}
      <Card className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <ListChecks size={18} className="text-brand-600" />
          <h3 className="text-[15px] font-semibold">Pending tasks</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TaskTile href="/vehicle" icon={RefreshCw} label="Renewals due" value={tasks.renewalsDue} tone="warning" />
          <TaskTile href="/consumers" icon={UserCog} label="Consumers to assign" value={tasks.unassigned} tone="brand" />
          <TaskTile href="/dashboard" icon={ListChecks} label="Unread notifications" value={tasks.unread} tone="success" />
        </div>
      </Card>

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

const TILE_TONES = {
  brand: "bg-brand-50 text-brand-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
};

function ConsumerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/user/consumer/dashboard");
        setData(res.data?.data || {});
      } catch (e) {
        showError(e, "Could not load your dashboard");
        setData({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const c = data?.counts || {};
  const stats = [
    { title: "My Vehicle Policies", value: c.totalVehicles, icon: Car, tone: "warning" },
    { title: "My Mediclaim", value: c.totalMediclaim, icon: HeartPulse, tone: "danger" },
    { title: "My Loans", value: c.totalLoans, icon: HandCoins, tone: "success" },
    { title: "My Life Policies", value: c.totalLife ?? c.totalLifeInsurance, icon: ShieldCheck, tone: "brand" },
  ];
  return (
    <div>
      <PageHeader title="My Dashboard" subtitle="Your policies at a glance" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? [...Array(4)].map((_, i) => <div key={i} className="skeleton h-[78px] rounded-lg" />)
          : stats.map((s) => <StatCard key={s.title} {...s} value={s.value ?? 0} />)}
      </div>
      <Card className="mt-6">
        <h3 className="mb-3 text-[15px] font-semibold">My vehicles</h3>
        {loading ? (
          <div className="skeleton h-10 rounded" />
        ) : (data?.vehicles || []).length ? (
          <div className="space-y-2">
            {data.vehicles.map((v, i) => (
              <div key={v.vehicle_user_id || i} className="flex items-center justify-between rounded-lg border border-line p-3 text-[14px]">
                <span className="font-medium">{v.vehicle_number || "—"}</span>
                <span className="text-muted">{v.vehicle_policy_type || ""}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted">No vehicle policies yet.</p>
        )}
      </Card>
    </div>
  );
}

function TaskTile({ href, icon: Icon, label, value, tone = "brand" }) {
  return (
    <Link href={href} className="press flex items-center justify-between rounded-lg border border-line p-4 transition-shadow hover:shadow-pop">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${TILE_TONES[tone]}`}>
          <Icon size={18} />
        </span>
        <div>
          <div className="text-[20px] font-semibold leading-none text-ink">{value ?? 0}</div>
          <div className="mt-1 text-[12px] text-muted">{label}</div>
        </div>
      </div>
      <ChevronRight size={16} className="text-muted" />
    </Link>
  );
}
