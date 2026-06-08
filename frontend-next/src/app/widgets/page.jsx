"use client";
import { useState } from "react";
import { Plus, Search, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Dropdown from "@/components/ui/Dropdown";
import PhoneInput from "@/components/ui/PhoneInput";
import Badge from "@/components/ui/Badge";
import { Card, StatCard } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import StepperModal from "@/components/ui/StepperModal";
import DataTable from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import Tooltip from "@/components/ui/Tooltip";

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
      <div className="ui-card p-6">{children}</div>
    </section>
  );
}

const SAMPLE = [
  { id: 1, name: "Aarav Shah", mobile: "9925712341", status: "active" },
  { id: 2, name: "Priya Patel", mobile: "9876543210", status: "pending" },
  { id: 3, name: "Rohan Mehta", mobile: "9812345678", status: "active" },
];

export default function WidgetsPage() {
  const [modal, setModal] = useState(false);
  const [stepper, setStepper] = useState(false);
  const [drop, setDrop] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 sm:p-10">
      <header>
        <h1 className="text-[24px] font-bold tracking-tight text-ink">Component Library</h1>
        <p className="mt-1 text-[14px] text-muted">All shared UI components used across the CRM.</p>
      </header>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button icon={Plus}>With icon</Button>
          <Button loading>Loading</Button>
          <Button size="sm">Small</Button>
        </div>
      </Section>

      <Section title="Inputs & selects">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Text input" placeholder="Type here…" />
          <Input label="With icon" icon={Search} placeholder="Search…" />
          <Input label="Error state" error="This field is required" placeholder="…" />
          <Select label="Native select" options={[{ value: "a", label: "Option A" }, { value: "b", label: "Option B" }]} />
          <Dropdown label="Custom dropdown" value={drop} onChange={setDrop} options={[{ value: "loan", label: "Loan" }, { value: "vehicle", label: "Vehicle" }, { value: "life", label: "Life" }]} />
          <PhoneInput label="Phone (flag selector)" value={phone} onChange={setPhone} />
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="brand">Brand</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Danger</Badge>
        </div>
      </Section>

      <Section title="Stat cards">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Consumers" value="1,284" icon={Star} tone="brand" />
          <StatCard title="Active" value="342" icon={Star} tone="success" />
          <StatCard title="Pending" value="58" icon={Star} tone="warning" />
        </div>
      </Section>

      <Section title="Tooltip">
        <div className="flex gap-6">
          <Tooltip label="Tooltip on top"><Button variant="secondary">Hover me (top)</Button></Tooltip>
          <Tooltip label="Tooltip on right" side="right"><Button variant="secondary">Hover me (right)</Button></Tooltip>
        </div>
      </Section>

      <Section title="Feedback">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3"><Spinner /> <span className="text-[14px] text-muted">Spinner</span></div>
          <div className="skeleton h-10 rounded" />
        </div>
        <div className="mt-4">
          <EmptyState title="No data" subtitle="This is the empty state component." />
        </div>
      </Section>

      <Section title="Modals">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setModal(true)}>Open Modal</Button>
          <Button variant="secondary" onClick={() => setStepper(true)}>Open Stepper Modal</Button>
        </div>
      </Section>

      <Section title="Data table (search · filter · pagination · actions)">
        <DataTable
          rowKey="id"
          data={SAMPLE}
          searchKeys={["name", "mobile"]}
          filters={[{ key: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "pending", label: "Pending" }] }]}
          columns={[
            { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "mobile", title: "Mobile" },
            { key: "status", title: "Status", render: (r) => <Badge tone={r.status === "active" ? "success" : "warning"}>{r.status}</Badge> },
          ]}
          onView={() => {}}
          onEdit={() => {}}
        />
      </Section>

      <Modal open={modal} onClose={() => setModal(false)} title="Example Modal" subtitle="A simple animated modal"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button onClick={() => setModal(false)}>Confirm</Button></div>}>
        <p className="text-[14px] text-muted">Modal body content goes here. Press Esc or click the backdrop to close.</p>
      </Modal>

      <StepperModal
        open={stepper}
        onClose={() => setStepper(false)}
        title="Example Stepper"
        onSubmit={() => setStepper(false)}
        steps={[
          { title: "Details", render: () => <Input label="Name" placeholder="Your name" /> },
          { title: "Contact", render: () => <PhoneInput label="Phone" value="" onChange={() => {}} /> },
          { title: "Review", render: () => <p className="text-[14px] text-muted">Review and submit.</p> },
        ]}
      />
    </div>
  );
}
