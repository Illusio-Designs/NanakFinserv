"use client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { HandCoins } from "lucide-react";

export default function LoanPage() {
  return (
    <div>
      <PageHeader title="Loan" subtitle="Loan applications & disbursement" />
      <EmptyState icon={HandCoins} title="Loan module" subtitle="Port the Loan screens onto DataTable + the shared components (see PLAN.md)." />
    </div>
  );
}
