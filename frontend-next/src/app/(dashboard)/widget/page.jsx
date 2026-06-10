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
  const [wing, setWing] = useState("A");
  const [openFloor, setOpenFloor] = useState("Flat-1"); // category-floor key that's expanded
  const [picked, setPicked] = useState(null);
  const [status, setStatus] = useState("interested");

  // Building → wing → category → floors (with unit-number ranges) — like old Unit.js.
  const wings = {
    A: {
      Showroom: [{ n: "G", start: 1, end: 6 }],
      Flat: [{ n: "1", start: 101, end: 110 }, { n: "2", start: 201, end: 210 }, { n: "3", start: 301, end: 310 }],
    },
    B: {
      Flat: [{ n: "1", start: 101, end: 108 }, { n: "2", start: 201, end: 208 }],
    },
  };
  // Occupied units keyed by "wing-category-unit".
  const occupied = {
    "A-Flat-103": { name: "Sita Sharma", mobile: "9000000012", status: "Login" },
    "A-Flat-105": { name: "Ramesh Patel", mobile: "9000000011", status: "Disbursement" },
    "A-Flat-208": { name: "Vikram Shah", mobile: "9000000014", status: "Sanction" },
    "A-Showroom-3": { name: "Metro Traders", mobile: "9000000019", status: "Sanction" },
    "B-Flat-102": { name: "Karan Joshi", mobile: "9000000016", status: "Not interested" },
    "B-Flat-205": { name: "Anil Kumar", mobile: "9000000017", status: "Completed" },
  };
  const w = wings[wing];
  const total = Object.values(wings).reduce((a, cats) => a + Object.values(cats).reduce((b, fls) => b + fls.reduce((c, f) => c + (f.end - f.start + 1), 0), 0), 0);
  const filled = Object.keys(occupied).length;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
      <Card className="p-4">
        <div className="mb-1 text-[15px] font-semibold">Building Skyline Towers</div>
        <div className="mb-3 text-[13px] text-muted">Nanak Builders · {filled}/{total} units occupied · click a unit to add / view a consumer</div>

        {/* Wing selector */}
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.keys(wings).map((wn) => (
            <button key={wn} onClick={() => { setWing(wn); setPicked(null); }}
              className={`press rounded-md border px-4 py-1.5 text-[13px] font-medium ${wing === wn ? "border-brand-600 bg-brand-600 text-white" : "border-line text-ink hover:bg-subtle"}`}>
              Wing {wn}
            </button>
          ))}
        </div>

        {/* Category → floors (expandable) → unit grid */}
        <div className="space-y-5">
          {Object.entries(w).map(([cat, floors]) => (
            <div key={cat}>
              <div className="mb-2 text-[13px] font-semibold text-ink">{cat}</div>
              <div className="space-y-2">
                {floors.map((f) => {
                  const key = `${cat}-${f.n}`;
                  const open = openFloor === key;
                  return (
                    <div key={key} className="rounded-lg border border-line">
                      <button onClick={() => setOpenFloor(open ? null : key)}
                        className="flex w-full items-center justify-between px-3 py-2 text-[13px] font-medium hover:bg-subtle">
                        <span>Floor {f.n} <span className="text-muted">· units {f.start}–{f.end}</span></span>
                        <ChevronRight size={15} className={`text-muted transition-transform ${open ? "rotate-90" : ""}`} />
                      </button>
                      {open && (
                        <div className="flex flex-wrap gap-2 border-t border-line p-3">
                          {Array.from({ length: f.end - f.start + 1 }, (_, i) => {
                            const unit = f.start + i;
                            const uk = `${wing}-${cat}-${unit}`;
                            const c = occupied[uk];
                            const on = picked?.unit === uk;
                            return (
                              <button key={unit} onClick={() => { setPicked({ unit: uk, number: unit, cat, consumer: c }); setStatus(c ? "interested" : "interested"); }}
                                title={c ? `${c.name} · ${c.status}` : "Vacant — click to add"}
                                className={`press flex h-12 w-14 flex-col items-center justify-center rounded-md border text-[12px] font-medium ${on ? "ring-2 ring-brand-600 " : ""}${c ? "border-brand-200 bg-brand-50 text-brand-700" : "border-dashed border-line text-muted hover:bg-subtle"}`}>
                                <span>{unit}</span>
                                {c && <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-current" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-4 text-[12px] text-muted">
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded border border-brand-200 bg-brand-50" /> Occupied</span>
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded border border-dashed border-line" /> Vacant</span>
        </div>
      </Card>

      {/* Add/Edit Unit Consumer — matches old Unit.js modal */}
      <Card className="p-4">
        {!picked ? (
          <div className="flex h-full min-h-[220px] items-center justify-center text-center text-[13px] text-muted">Select a unit to add / edit its consumer.</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-[15px] font-semibold">{picked.consumer ? "Edit" : "Add"} Unit Consumer</div>
              <div className="text-[12px] text-muted">Wing {wing} · {picked.cat} · Unit {picked.number}</div>
            </div>

            {/* Status radio (Interested / Not Interested) */}
            <div>
              <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted">Status</div>
              <div className="flex gap-4 text-[13px]">
                <label className="flex items-center gap-2"><input type="radio" name="ustatus" checked={status === "interested"} onChange={() => setStatus("interested")} /> Interested</label>
                <label className="flex items-center gap-2"><input type="radio" name="ustatus" checked={status === "notInterested"} onChange={() => setStatus("notInterested")} /> Not Interested</label>
              </div>
            </div>

            {status === "interested" ? (
              <>
                <Input label="Name *" value={picked.consumer?.name || ""} onChange={() => {}} placeholder="Enter name" />
                <div>
                  <div className="ui-label mb-1">Mobile Number *</div>
                  <div className="flex">
                    <span className="flex items-center gap-1 rounded-l-md border border-r-0 border-line bg-subtle px-2 text-[13px] text-muted"><img src="https://flagcdn.com/w320/in.png" alt="IN" className="h-3.5 w-5 rounded-sm" />+91</span>
                    <input className="ui-control rounded-l-none" maxLength={10} value={picked.consumer?.mobile || ""} onChange={() => {}} placeholder="Enter mobile number" />
                  </div>
                </div>
                <Input label="Email" value="" onChange={() => {}} placeholder="Enter email address" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Sq. Ft." value="" onChange={() => {}} placeholder="Enter square feet" />
                  <Input label="Deed Amount" value="" onChange={() => {}} placeholder="Enter deed amount" />
                </div>
              </>
            ) : (
              <p className="rounded-lg border border-dashed border-line p-3 text-[13px] text-muted">Marked Not Interested — no consumer details needed.</p>
            )}

            {picked.consumer && status === "interested" && <div><Badge tone={LOAN_TONE[picked.consumer.status] || "muted"}>{picked.consumer.status}</Badge></div>}
            <Button size="sm" icon={picked.consumer ? undefined : Plus}>{picked.consumer ? "Update" : "Add"}</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
