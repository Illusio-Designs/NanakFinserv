"use client";
import EntityListPage from "@/components/EntityListPage";

export default function UsersPage() {
  return (
    <EntityListPage
      title="Users & Roles"
      subtitle="Admin and staff accounts"
      endpoint="/user/list/roleWise"
      searchKeys={["name", "email", "mobile"]}
      columns={[
        { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "email", title: "Email" },
        { key: "mobile", title: "Mobile" },
      ]}
    />
  );
}
