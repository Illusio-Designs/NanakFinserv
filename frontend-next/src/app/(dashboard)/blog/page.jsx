"use client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";

export default function BlogPage() {
  return (
    <div>
      <PageHeader title="Blog" subtitle="Manage blog posts" />
      <EmptyState icon={FileText} title="Blog module" subtitle="Port onto the shared components (see PLAN.md)." />
    </div>
  );
}
