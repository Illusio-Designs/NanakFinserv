"use client";
import EntityListPage from "@/components/EntityListPage";
import Badge from "@/components/ui/Badge";

export default function LoanPage() {
  return (
    <EntityListPage
      title="Loan"
      subtitle="Loan applications & pipeline"
      endpoint="/user/list/loan"
      searchKeys={["name", "mobile", "status"]}
      columns={[
        { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "mobile", title: "Mobile" },
        { key: "status", title: "Status", render: (r) => <Badge tone="brand">{r.status}</Badge> },
      ]}
    />
  );
}
