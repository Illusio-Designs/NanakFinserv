"use client";
import EntityListPage from "@/components/EntityListPage";

export default function BuilderPage() {
  return (
    <EntityListPage
      title="Builder"
      subtitle="Builder accounts"
      endpoint="/user/list/builder"
      searchKeys={["name", "email", "mobile"]}
      columns={[
        { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "email", title: "Email" },
        { key: "mobile", title: "Mobile" },
      ]}
    />
  );
}
