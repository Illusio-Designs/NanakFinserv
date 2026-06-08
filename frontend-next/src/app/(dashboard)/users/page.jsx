"use client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { UserCog } from "lucide-react";

export default function UsersPage() {
  return (
    <div>
      <PageHeader title="Users & Roles" subtitle="Staff and role management" />
      <EmptyState icon={UserCog} title="Users module" subtitle="Port onto the shared components (see PLAN.md)." />
    </div>
  );
}
