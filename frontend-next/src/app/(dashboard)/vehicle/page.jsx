"use client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Car } from "lucide-react";

export default function VehiclePage() {
  return (
    <div>
      <PageHeader title="Vehicle Insurance" subtitle="Vehicle policies & renewals" />
      <EmptyState icon={Car} title="Vehicle module" subtitle="Port onto the shared components (see PLAN.md)." />
    </div>
  );
}
