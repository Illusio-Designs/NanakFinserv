"use client";
import EntityListPage from "@/components/EntityListPage";

export default function MediclaimPage() {
  return (
    <EntityListPage
      title="Mediclaim"
      subtitle="Mediclaim policy holders"
      endpoint="/user/mediclaim/user/list"
      searchKeys={["name", "mobile", "email"]}
      columns={[
        { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "mobile", title: "Mobile" },
        { key: "email", title: "Email" },
      ]}
    />
  );
}
