"use client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Building2 } from "lucide-react";

export default function BuilderPage() {
  return (
    <div>
      <PageHeader title="Builder" subtitle="Builders, units & buildings" />
      <EmptyState icon={Building2} title="Builder module" subtitle="Port onto the shared components (see PLAN.md)." />
    </div>
  );
}
