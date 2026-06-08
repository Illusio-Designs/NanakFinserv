"use client";
import EntityListPage from "@/components/EntityListPage";
import Badge from "@/components/ui/Badge";

export default function VehiclePage() {
  return (
    <EntityListPage
      title="Vehicle Insurance"
      subtitle="Vehicle policy holders"
      endpoint="/user/vehicle/user/list"
      method="post"
      body={{}}
      searchKeys={["name", "mobile", "status"]}
      columns={[
        { key: "name", title: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "mobile", title: "Mobile" },
        { key: "vehicle_number", title: "Vehicle No.", render: (r) => r.vehicle_number || "—" },
        { key: "status", title: "Status", render: (r) => <Badge tone="warning">{r.status}</Badge> },
      ]}
    />
  );
}
