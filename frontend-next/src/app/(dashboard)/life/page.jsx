"use client";
import EntityListPage from "@/components/EntityListPage";
import Badge from "@/components/ui/Badge";

export default function LifePage() {
  return (
    <EntityListPage
      title="Life Insurance"
      subtitle="Life insurance policies"
      endpoint="/user/life-insurance/list"
      searchKeys={["name", "mobile", "status"]}
      columns={[
        { key: "name", title: "Proposer", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "mobile", title: "Mobile" },
        { key: "status", title: "Status", render: (r) => <Badge tone="brand">{r.status}</Badge> },
      ]}
    />
  );
}
