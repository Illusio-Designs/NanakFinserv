"use client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { HeartPulse } from "lucide-react";

export default function MediclaimPage() {
  return (
    <div>
      <PageHeader title="Mediclaim" subtitle="Mediclaim policies & companies" />
      <EmptyState icon={HeartPulse} title="Mediclaim module" subtitle="Port onto the shared components (see PLAN.md)." />
    </div>
  );
}
