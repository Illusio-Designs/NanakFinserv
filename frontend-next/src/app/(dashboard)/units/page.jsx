"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Building2, ChevronRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import api, { showError } from "@/lib/api";
import { ROLE_IDS, UNIT_CATEGORY_IDS } from "@/config/ids";

const CAT_NAMES = ["Showroom", "Office", "Flat", "House"];
const CAT_ID = { Showroom: UNIT_CATEGORY_IDS.SHOWROOM, Office: UNIT_CATEGORY_IDS.OFFICE, Flat: UNIT_CATEGORY_IDS.FLAT, House: UNIT_CATEGORY_IDS.HOUSE };
const LOAN_LABEL = { notAssign: "Pending", interested: "Interested", notInterested: "Not interested", documentselected: "Document selected", pickup: "Pickup", query: "Query", login: "Login", sanction: "Sanction", disbursement: "Disbursement", partPayment: "Part-payment", completed: "Completed", cancel: "Cancelled" };
const LOAN_TONE = { notAssign: "muted", interested: "brand", notInterested: "danger", documentselected: "brand", pickup: "warning", query: "warning", login: "brand", sanction: "success", disbursement: "success", partPayment: "warning", completed: "success", cancel: "danger" };
const loanLbl = (s) => LOAN_LABEL[s] || s || "—";

export default function UnitsPage() {
  const [rows, setRows] = useState([]);
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ builder_id: "", unit_name: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [detailUnit, setDetailUnit] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/data/builder/unit");
      const d = res.data?.data || res.data || [];
      setRows((Array.isArray(d) ? d : []).map((u) => ({
        ...u,
        name: u.unit_name || "—",
        company: u.builder_name || u["builderuser.company_name"] || u.builderuser?.company_name || u.company_name || "—",
        addr: u.address || "—",
      })));
    } catch (e) { showError(e, "Could not load units"); setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    api.get("/user/list/builder").then((r) => setBuilders((r.data?.data || []).map((b) => ({ value: b.builder_id || b.user_id, label: b.company_name || b.username || b.mobileNumber })))).catch(() => setBuilders([]));
  }, []);

  const fetchDetail = async (u) => {
    setDetailLoading(true);
    try {
      const res = await api.post("/user/data/builder/getunitwithconsumer", { unit_id: u.unit_id });
      setDetail((res.data?.data || [])[0] || { consumerList: [] });
    } catch (e) { showError(e, "Could not load building"); setDetail({ consumerList: [] }); }
    finally { setDetailLoading(false); }
  };
  const openDetail = (u) => { setDetailUnit(u); setDetail(null); fetchDetail(u); };

  const columns = useMemo(() => [
    { key: "name", title: "Building / Unit", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "company", title: "Builder" },
    { key: "addr", title: "Address" },
  ], []);

  const save = async () => {
    if (!form.builder_id) return toast.error("Select a builder");
    if (!form.unit_name.trim()) return toast.error("Building name is required");
    setSaving(true);
    try {
      await api.post("/user/data/add/builderUnit", { builder_id: form.builder_id, unit_name: form.unit_name, address: form.address, unit_categories: [] });
      toast.success("Building added");
      setOpen(false); setForm({ builder_id: "", unit_name: "", address: "" });
      load();
    } catch (e) { showError(e, "Could not add building"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Buildings / Units" subtitle="Builder buildings, wings & their consumers" actions={<Button icon={Plus} onClick={() => { setForm({ builder_id: "", unit_name: "", address: "" }); setOpen(true); }}>Add Building</Button>} />
      <DataTable columns={columns} data={rows} loading={loading} rowKey="unit_id" searchKeys={["name", "company", "addr"]}
        rowActions={[{ icon: Building2, title: "View units & consumers", onClick: openDetail }]} />

      <Modal open={open} onClose={() => setOpen(false)} title="Add Building" size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></div>}>
        <div className="space-y-4">
          <Dropdown label="Builder" placeholder="Select builder" options={builders} value={form.builder_id} onChange={(v) => setForm({ ...form, builder_id: v })} searchable />
          <Input label="Building / Unit Name" value={form.unit_name} onChange={(e) => setForm({ ...form, unit_name: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
      </Modal>

      <Modal open={!!detailUnit} onClose={() => { setDetailUnit(null); setDetail(null); }} title={`Building — ${detailUnit?.name || ""}`} subtitle={detailUnit?.company} size="lg">
        {detailLoading ? <div className="flex justify-center py-8"><Spinner /></div>
          : detail ? <BuildingGrid d={detail} unit={detailUnit} reload={() => fetchDetail(detailUnit)} /> : null}
      </Modal>
    </div>
  );
}

function BuildingGrid({ d, unit, reload }) {
  const [wing, setWing] = useState(null);
  const [openFloor, setOpenFloor] = useState(null);
  const [picked, setPicked] = useState(null); // { number, wingId, floorId, categoryId, consumer }

  // Reorganise category → wings into wing → categories[{name, categoryId, floors}] (like old Unit.js).
  const wingMap = {};
  for (const cat of CAT_NAMES) {
    for (const w of (d[cat] || [])) {
      const wn = w.wingName || w.wing_name || "—";
      if (!wingMap[wn]) wingMap[wn] = { wingName: wn, categories: [] };
      wingMap[wn].categories.push({ name: cat, categoryId: CAT_ID[cat], wingId: w.wingId || w.wing_id, floors: (w.floors || []) });
    }
  }
  const wings = Object.values(wingMap);
  const curWing = wings.find((x) => x.wingName === wing) || wings[0];
  const consumers = d.consumerList || [];
  const findConsumer = (office, wingId, floorId, catId) => consumers.find((c) =>
    String(c.office_no) === String(office) && c.wing_id === wingId && c.floor_id === floorId && c.category_id === catId);

  if (!wings.length) {
    return <p className="rounded-lg border border-dashed border-line py-8 text-center text-[13px] text-muted">This building has no wings/units configured yet. Add categories &amp; wings to start placing consumers.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_330px]">
      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          {wings.map((w) => (
            <button key={w.wingName} onClick={() => { setWing(w.wingName); setOpenFloor(null); setPicked(null); }}
              className={`press rounded-md border px-4 py-1.5 text-[13px] font-medium ${curWing?.wingName === w.wingName ? "border-brand-600 bg-brand-600 text-white" : "border-line text-ink hover:bg-subtle"}`}>
              Wing {w.wingName}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {curWing?.categories.map((cat) => (
            <div key={cat.name + cat.wingId}>
              <div className="mb-2 text-[13px] font-semibold text-ink">{cat.name}</div>
              <div className="space-y-2">
                {cat.floors.map((f) => {
                  const start = Number(f.startRange ?? f.floor_start), end = Number(f.endRange ?? f.floor_end);
                  const key = `${cat.name}-${f.floor_id}`;
                  const isOpen = openFloor === key;
                  return (
                    <div key={key} className="rounded-lg border border-line">
                      <button onClick={() => setOpenFloor(isOpen ? null : key)} className="flex w-full items-center justify-between px-3 py-2 text-[13px] font-medium hover:bg-subtle">
                        <span>Floor {f.floorNumber} <span className="text-muted">· units {start}–{end}</span></span>
                        <ChevronRight size={15} className={`text-muted transition-transform ${isOpen ? "rotate-90" : ""}`} />
                      </button>
                      {isOpen && Number.isFinite(start) && Number.isFinite(end) && (
                        <div className="flex flex-wrap gap-2 border-t border-line p-3">
                          {Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => {
                            const unitNo = start + i;
                            const c = findConsumer(unitNo, cat.wingId, f.floor_id, cat.categoryId);
                            const sel = picked && picked.number === unitNo && picked.floorId === f.floor_id && picked.categoryId === cat.categoryId;
                            return (
                              <button key={unitNo}
                                onClick={() => setPicked({ number: unitNo, wingId: cat.wingId, floorId: f.floor_id, categoryId: cat.categoryId, catName: cat.name, consumer: c })}
                                title={c ? `${c["user.username"] || ""} · ${loanLbl(c["user.user_pk_id.status"] || c.status)}` : "Vacant — click to add"}
                                className={`press flex h-12 w-14 flex-col items-center justify-center rounded-md border text-[12px] font-medium ${sel ? "ring-2 ring-brand-600 " : ""}${c ? "border-brand-200 bg-brand-50 text-brand-700" : "border-dashed border-line text-muted hover:bg-subtle"}`}>
                                <span>{unitNo}</span>
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
      </div>

      <div className="rounded-lg border border-line p-4">
        {!picked ? <div className="flex h-full min-h-[220px] items-center justify-center text-center text-[13px] text-muted">Select a unit to add / edit its consumer.</div>
          : <UnitConsumerForm key={`${picked.categoryId}-${picked.floorId}-${picked.number}`} d={d} unit={unit} picked={picked} wing={curWing?.wingName} onSaved={() => { setPicked(null); reload(); }} />}
      </div>
    </div>
  );
}

function UnitConsumerForm({ d, unit, picked, wing, onSaved }) {
  const c = picked.consumer;
  const [status, setStatus] = useState(c ? (c["user.user_pk_id.status"] || c.status || "interested") : "interested");
  const [f, setF] = useState({
    Name: c?.["user.username"] || c?.username || "",
    MobileNumber: c?.["user.mobileNumber"] || c?.mobileNumber || "",
    Email: c?.["user.email"] || c?.email || "",
    Sqfeet: c?.sqFeet || "",
    Deed: c?.srNo || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async () => {
    if (status === "interested") {
      if (!f.Name.trim()) return toast.error("Name is required");
      if (!/^\d{10}$/.test(f.MobileNumber)) return toast.error("Mobile must be 10 digits");
    }
    setSaving(true);
    try {
      const payload = {
        username: status === "interested" ? f.Name.trim() : "",
        mobileNumber: status === "interested" ? f.MobileNumber : "",
        email: status === "interested" ? f.Email : "",
        sqFeet: status === "interested" ? f.Sqfeet : "",
        srNo: status === "interested" ? f.Deed : "",
        status,
        role_id: ROLE_IDS.BUILDER_CONSUMER,
        unit_id: d.unit_id || unit.unit_id,
        builder_id: d.builder_id,
        office_no: String(picked.number),
        floor_id: picked.floorId,
        wing_id: picked.wingId,
        category_id: picked.categoryId,
        builder_user_id: d["builderuser.user_id"] || d.builderuser?.user_id,
      };
      const bcId = c?.builderConsumerId || c?.builder_consumer_id;
      if (bcId) {
        payload.user_id = c["user.user_id"] || c.user_id;
        await api.put(`/user/data/consumer/update/${bcId}`, payload);
        toast.success("Consumer updated");
      } else {
        await api.post("/user/data/consumer/add", payload);
        toast.success("Consumer added");
      }
      onSaved();
    } catch (e) { showError(e, "Could not save consumer"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[15px] font-semibold">{c ? "Edit" : "Add"} Unit Consumer</div>
        <div className="text-[12px] text-muted">Wing {wing} · {picked.catName} · Unit {picked.number}</div>
      </div>
      <div>
        <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted">Status</div>
        <div className="flex gap-4 text-[13px]">
          <label className="flex items-center gap-2"><input type="radio" name="ustatus" checked={status === "interested"} onChange={() => setStatus("interested")} /> Interested</label>
          <label className="flex items-center gap-2"><input type="radio" name="ustatus" checked={status === "notInterested"} onChange={() => setStatus("notInterested")} /> Not Interested</label>
        </div>
      </div>
      {status === "interested" ? (
        <>
          <Input label="Name *" value={f.Name} onChange={set("Name")} placeholder="Enter name" />
          <div>
            <div className="ui-label mb-1">Mobile Number *</div>
            <div className="flex">
              <span className="flex items-center gap-1 rounded-l-md border border-r-0 border-line bg-subtle px-2 text-[13px] text-muted"><img src="https://flagcdn.com/w320/in.png" alt="IN" className="h-3.5 w-5 rounded-sm" />+91</span>
              <input className="ui-control rounded-l-none" maxLength={10} value={f.MobileNumber} onChange={set("MobileNumber")} placeholder="Enter mobile number" />
            </div>
          </div>
          <Input label="Email" value={f.Email} onChange={set("Email")} placeholder="Enter email address" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sq. Ft." value={f.Sqfeet} onChange={set("Sqfeet")} placeholder="Enter square feet" />
            <Input label="Deed Amount" value={f.Deed} onChange={set("Deed")} placeholder="Enter deed amount" />
          </div>
        </>
      ) : <p className="rounded-lg border border-dashed border-line p-3 text-[13px] text-muted">Marked Not Interested — no consumer details needed.</p>}
      {c && status === "interested" && <div><Badge tone={LOAN_TONE[c["user.user_pk_id.status"] || c.status] || "muted"}>{loanLbl(c["user.user_pk_id.status"] || c.status)}</Badge></div>}
      <Button size="sm" icon={c ? undefined : Plus} loading={saving} onClick={submit}>{c ? "Update" : "Add"}</Button>
    </div>
  );
}
