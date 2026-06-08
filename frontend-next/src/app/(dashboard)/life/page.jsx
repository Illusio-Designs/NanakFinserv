"use client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { ShieldCheck } from "lucide-react";

export default function LifePage() {
  return (
    <div>
      <PageHeader title="Life Insurance" subtitle="Life policies & renewals" />
      <EmptyState icon={ShieldCheck} title="Life Insurance module" subtitle="Port onto the shared components (see PLAN.md)." />
    </div>
  );
}
