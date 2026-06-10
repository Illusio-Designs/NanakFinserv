"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import api, { showError } from "@/lib/api";
import { fmtDate, daysUntil, expiryCountdown } from "@/lib/format";
import LifeFormModal from "./LifeFormModal";

const dueCol = { key: "due", title: "Due Date", render: (r) => r.due && r.due !== "—" ? (
  <div><div>{fmtDate(r.due)}</div><div className={`text-[11px] ${daysUntil(r.due) < 0 ? "font-medium text-red-600" : "text-muted"}`}>{expiryCountdown(r.due)}</div></div>
) : "—" };

const norm = (r) => ({
  ...r,
  name: r.proposer_name || r.username || r.name || "—",
  mobile: r.proposer_mobile_numbers || r.mobileNumber || "—",
  policy: r.policy_number || r.policy_numbers || "—",
  status: r.status || "—",
});

export default function LifePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [tab, setTab] = useState("policies");
  const [renewals, setRenewals] = useState([]);
  const [renLoading, setRenLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/life-insurance/list");
      const d = res.data?.data || res.data || [];
      setRows((Array.isArray(d) ? d : (d.rows || [])).map(norm));
    } catch (e) { showError(e, "Could not load life policies"); setRows([]); }
    finally { setLoading(false); }
  };
  const loadRenewals = async () => {
    setRenLoading(true);
    try {
      const res = await api.get("/user/life-insurance/renewal/data");
      const d = res.data?.data || res.data || [];
      setRenewals((Array.isArray(d) ? d : (d.rows || [])).map((r) => ({
        ...norm(r),
        due: r.due_date_of_premium || r.date_of_maturity || "—",
      })));
    } catch (e) { showError(e, "Could not load renewals"); setRenewals([]); }
    finally { setRenLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (tab === "renewals" || tab === "pending") loadRenewals(); }, [tab]);

  const columns = useMemo(() => [
    { key: "name", title: "Proposer", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "mobile", title: "Mobile" },
    { key: "policy", title: "Policy No." },
    { key: "status", title: "Status", render: (r) => <Badge tone="brand">{r.status}</Badge> },
  ], []);

  // Pending = renewals due within the next 30 days.
  const todayISO = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const pendingRows = useMemo(
    () => renewals.filter((r) => r.due && String(r.due).slice(0, 10) >= todayISO && String(r.due).slice(0, 10) <= in30),
    [renewals]
  );

  return (
    <div>
      <PageHeader title="Life Insurance" subtitle="Policies & renewals" actions={<Button icon={Plus} onClick={() => setAddOpen(true)}>Add Life Policy</Button>} />

      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: "policies", label: "Policies" }, { value: "pending", label: `Pending${pendingRows.length ? ` (${pendingRows.length})` : ""}` }, { value: "renewals", label: "Renewals" }]} />

      {tab === "policies" && (
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          rowKey="id"
          searchKeys={["name", "mobile", "policy", "status"]}
          filters={[{ key: "status", label: "Status" }]}
          onView={(r) => setViewRow(r)}
          onEdit={(r) => setEditRow(r)}
        />
      )}

      {tab === "pending" && (
        <DataTable
          columns={[...columns.slice(0, 3), dueCol]}
          data={pendingRows}
          loading={renLoading}
          rowKey="id"
          searchKeys={["name", "mobile", "policy"]}
          onView={(r) => setViewRow(r)}
          onEdit={(r) => setEditRow(r)}
        />
      )}

      {tab === "renewals" && (
        <DataTable
          columns={[...columns.slice(0, 3), dueCol]}
          data={renewals}
          loading={renLoading}
          rowKey="id"
          searchKeys={["name", "mobile", "policy"]}
          filters={[{ key: "due", label: "Due", type: "dateRange" }]}
          onView={(r) => setViewRow(r)}
          onEdit={(r) => setEditRow(r)}
        />
      )}

      <LifeFormModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} />
      <LifeFormModal open={!!editRow} editRow={editRow} onClose={() => setEditRow(null)} onSaved={load} />

      <Modal open={!!viewRow} onClose={() => setViewRow(null)} title="Life policy" subtitle={viewRow?.policy} size="lg">
        {viewRow && <LifeDetail d={viewRow} />}
      </Modal>
    </div>
  );
}

function LifeDetail({ d }) {
  const inr = (n) => (n ? "₹" + Number(String(n).replace(/[^\d.]/g, "")).toLocaleString("en-IN") : "—");
  return (
    <div className="space-y-5 text-[14px]">
      <Section title="Proposer">
        <Row label="Name" value={d.proposer_name || d.name || "—"} />
        <Row label="Mobile" value={d.proposer_mobile_numbers || d.mobile || "—"} />
        <Row label="Email" value={d.proposer_email || "—"} />
        <Row label="DOB / Gender" value={[d.proposer_dob ? fmtDate(d.proposer_dob) : null, d.proposer_gender].filter(Boolean).join(" · ") || "—"} />
        <Row label="PAN" value={d.proposer_pan_number || "—"} />
      </Section>
      <Section title="Life assured">
        <Row label="Name" value={d.life_assured_name || "—"} />
        <Row label="Mobile" value={d.life_assured_mobile_numbers || "—"} />
        <Row label="DOB / Gender" value={[d.life_assured_dob ? fmtDate(d.life_assured_dob) : null, d.life_assured_gender].filter(Boolean).join(" · ") || "—"} />
        <Row label="Relationship to proposer" value={d.life_assured_relationship_with_proposer || "—"} />
      </Section>
      <Section title="Nominee">
        <Row label="Name" value={d.nominee_name || "—"} />
        <Row label="Relationship" value={d.nominee_relationship_with_life_assured || "—"} />
        <Row label="Mobile" value={d.nominee_mobile_numbers || "—"} />
      </Section>
      <Section title="Policy">
        <Row label="Policy No." value={d.policy_number || d.policy || "—"} />
        <Row label="Product" value={d.product_name || "—"} />
        <Row label="Sum Assured" value={inr(d.sum_assured)} />
        <Row label="Premium" value={`${inr(d.premium_amount)}${d.premium_payment_mode ? " · " + d.premium_payment_mode : ""}`} />
        <Row label="Premium term / Policy term" value={[d.premium_payment_term, d.policy_term].filter(Boolean).join(" / ") || "—"} />
        <Row label="Maturity" value={d.date_of_maturity ? fmtDate(d.date_of_maturity) : "—"} />
        <Row label="Premium due" value={d.due_date_of_premium ? `${fmtDate(d.due_date_of_premium)} · ${expiryCountdown(d.due_date_of_premium)}` : "—"} />
        <Row label="Agent" value={[d.agent_name, d.agent_code].filter(Boolean).join(" · ") || "—"} />
        <Row label="Status" value={<Badge tone="brand">{d.status || "—"}</Badge>} />
      </Section>
      {(d.bank_name || d.account_number) && (
        <Section title="Bank">
          <Row label="Bank / Branch" value={[d.bank_name, d.branch].filter(Boolean).join(" · ") || "—"} />
          <Row label="Account" value={[d.account_number, d.account_type].filter(Boolean).join(" · ") || "—"} />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">{title}</div>
      <div className="rounded-lg border border-line p-3">{children}</div>
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line py-1.5 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
