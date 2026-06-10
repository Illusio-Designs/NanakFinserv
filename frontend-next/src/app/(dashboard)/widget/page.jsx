"use client";
import { useState } from "react";
import { Plus, Trash2, Building2, ChevronRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import Badge from "@/components/ui/Badge";
import Switch from "@/components/ui/Switch";
import Tabs from "@/components/ui/Tabs";

/**
 * UI PREVIEW ONLY — the complete Builder flow (no backend wiring). Lets us review
 * the look of: builders → buildings → category/wing/floor builder → per-building
 * consumers with loan status. Sample data is local state.
 */

const CATS = ["Showroom", "Office", "Flat", "House"];
const LOAN_TONE = { Pending: "muted", Login: "brand", Sanction: "success", Disbursement: "success", "Not interested": "danger", Completed: "success" };

const sampleWing = () => ({ wingName: "A", floors: [{ floorNumber: "1", start: "101", end: "110" }] });

export default function BuilderFlowPreview() {
  const [tab, setTab] = useState("buildings");
  const [cats, setCats] = useState({
    Showroom: { on: false, total: "", wings: [] },
    Office: { on: false, total: "", wings: [] },
    Flat: { on: true, total: "120", wings: [sampleWing()] },
    House: { on: false, total: "", wings: [] },
  });

  const setCat = (c, patch) => setCats((s) => ({ ...s, [c]: { ...s[c], ...patch } }));
  const addWing = (c) => setCat(c, { wings: [...cats[c].wings, sampleWing()] });
  const delWing = (c, i) => setCat(c, { wings: cats[c].wings.filter((_, idx) => idx !== i) });
  const setWing = (c, i, patch) => setCat(c, { wings: cats[c].wings.map((w, idx) => idx === i ? { ...w, ...patch } : w) });
  const addFloor = (c, wi) => setWing(c, wi, { floors: [...cats[c].wings[wi].floors, { floorNumber: "", start: "", end: "" }] });
  const setFloor = (c, wi, fi, patch) => setWing(c, wi, { floors: cats[c].wings[wi].floors.map((f, idx) => idx === fi ? { ...f, ...patch } : f) });
  const delFloor = (c, wi, fi) => setWing(c, wi, { floors: cats[c].wings[wi].floors.filter((_, idx) => idx !== fi) });

  return (
    <div>
      <PageHeader title="Builder flow — UI preview" subtitle="Design review only — not wired to the backend yet" />
      <div className="mb-4 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-[13px] text-amber-700 dark:bg-amber-500/10">
        Preview of the complete builder flow so we can check the look. Sample data, no saving.
      </div>

      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[
        { value: "buildings", label: "1 · Buildings" },
        { value: "categories", label: "2 · Categories & wings" },
        { value: "consumers", label: "3 · Building consumers" },
      ]} />

      {tab === "buildings" && <BuildingsList />}
      {tab === "categories" && (
        <CategoryBuilder cats={cats} setCat={setCat} addWing={addWing} delWing={delWing} setWing={setWing} addFloor={addFloor} setFloor={setFloor} delFloor={delFloor} />
      )}
      {tab === "consumers" && <BuildingConsumers />}
    </div>
  );
}

function BuildingsList() {
  const sample = [
    { name: "Skyline Towers", builder: "Nanak Builders", address: "MG Road, Surat", cats: "Flat · Showroom", consumers: 24 },
    { name: "Green Residency", builder: "Shree Developers", address: "Ring Road, Surat", cats: "Flat · House", consumers: 11 },
    { name: "Trade Hub", builder: "Metro Infra", address: "Adajan, Surat", cats: "Office · Showroom", consumers: 7 },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sample.map((b) => (
        <Card key={b.name} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Building2 size={18} /></div>
            <Badge tone="brand">{b.consumers} consumers</Badge>
          </div>
          <div className="mt-3 text-[15px] font-semibold">{b.name}</div>
          <div className="text-[13px] text-muted">{b.builder}</div>
          <div className="mt-1 text-[12px] text-muted">{b.address}</div>
          <div className="mt-2 flex flex-wrap gap-1">{b.cats.split(" · ").map((c) => <span key={c} className="rounded-md bg-subtle px-2 py-0.5 text-[11px] text-ink">{c}</span>)}</div>
          <button className="press mt-3 flex w-full items-center justify-center gap-1 rounded-md border border-line py-1.5 text-[13px] text-brand-600 hover:bg-subtle">View building <ChevronRight size={14} /></button>
        </Card>
      ))}
    </div>
  );
}

function CategoryBuilder({ cats, setCat, addWing, delWing, setWing, addFloor, setFloor, delFloor }) {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Builder" value="Nanak Builders" onChange={() => {}} />
        <Input label="Building / Unit name" value="Skyline Towers" onChange={() => {}} />
        <Input label="Address" value="MG Road, Surat" onChange={() => {}} />
      </div>

      <div className="mt-5 mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">Categories</div>
      <div className="space-y-3">
        {CATS.map((c) => {
          const cat = cats[c];
          return (
            <div key={c} className="rounded-lg border border-line p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{c}</span>
                <Switch checked={cat.on} onChange={() => setCat(c, { on: !cat.on })} />
              </div>
              {cat.on && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Input label="Total units" value={cat.total} onChange={(e) => setCat(c, { total: e.target.value })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold uppercase tracking-wide text-muted">Wings</span>
                    <Button size="sm" icon={Plus} onClick={() => addWing(c)}>Add wing</Button>
                  </div>
                  {cat.wings.map((w, wi) => (
                    <div key={wi} className="rounded-md border border-line bg-subtle/50 p-3">
                      <div className="flex items-end gap-2">
                        <Input label="Wing name" value={w.wingName} onChange={(e) => setWing(c, wi, { wingName: e.target.value })} />
                        <Button size="sm" variant="ghost" icon={Trash2} onClick={() => delWing(c, wi)}>Remove</Button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wide text-muted">Floors</span>
                        <Button size="sm" variant="secondary" icon={Plus} onClick={() => addFloor(c, wi)}>Floor</Button>
                      </div>
                      {w.floors.map((f, fi) => (
                        <div key={fi} className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                          <Input label="Floor" value={f.floorNumber} onChange={(e) => setFloor(c, wi, fi, { floorNumber: e.target.value })} />
                          <Input label="From" value={f.start} onChange={(e) => setFloor(c, wi, fi, { start: e.target.value })} />
                          <Input label="To" value={f.end} onChange={(e) => setFloor(c, wi, fi, { end: e.target.value })} />
                          <div className="flex items-end"><Button size="sm" variant="ghost" icon={Trash2} onClick={() => delFloor(c, wi, fi)} /></div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button>Save building</Button>
      </div>
    </Card>
  );
}

function BuildingConsumers() {
  const rows = [
    { name: "Ramesh Patel", mobile: "9000000011", wing: "A", floor: "3 (301)", status: "Disbursement" },
    { name: "Sita Sharma", mobile: "9000000012", wing: "A", floor: "5 (505)", status: "Login" },
    { name: "Vikram Shah", mobile: "9000000014", wing: "B", floor: "2 (210)", status: "Sanction" },
    { name: "Neha Verma", mobile: "9000000015", wing: "B", floor: "7 (702)", status: "Pending" },
    { name: "Karan Joshi", mobile: "9000000016", wing: "A", floor: "1 (108)", status: "Not interested" },
  ];
  return (
    <Card className="p-0">
      <div className="border-b border-line p-4">
        <div className="text-[15px] font-semibold">Skyline Towers — consumers</div>
        <div className="text-[13px] text-muted">Nanak Builders · MG Road, Surat · {rows.length} consumers</div>
      </div>
      <table className="w-full text-[13px]">
        <thead className="bg-subtle text-left text-muted">
          <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Mobile</th><th className="px-4 py-2">Wing / Floor</th><th className="px-4 py-2">Loan status</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.mobile} className="border-t border-line">
              <td className="px-4 py-2 font-medium text-ink">{r.name}</td>
              <td className="px-4 py-2">{r.mobile}</td>
              <td className="px-4 py-2">{r.wing} · {r.floor}</td>
              <td className="px-4 py-2"><Badge tone={LOAN_TONE[r.status] || "muted"}>{r.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
