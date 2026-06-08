"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import api, { showError } from "@/lib/api";

/**
 * Generic list page: fetches from `endpoint` (GET by default) and renders a
 * DataTable. `extract` maps the API response to an array of rows; `columns`,
 * `searchKeys`, `filters` are passed through.
 */
export default function EntityListPage({
  title,
  subtitle,
  endpoint,
  method = "get",
  body,
  extract = (res) => res?.data?.data || res?.data || [],
  columns,
  searchKeys = ["name", "mobile"],
  filters = [],
  rowKey = "id",
  actions,
  onView,
  onEdit,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      try {
        const res = method === "post" ? await api.post(endpoint, body || {}) : await api.get(endpoint);
        const data = extract(res) || [];
        // Add normalized fields (name/mobile/email/status) so columns + search
        // work regardless of the source shape.
        const norm = (Array.isArray(data) ? data : []).map((r) => ({
          ...r,
          name: f.name(r),
          mobile: f.mobile(r),
          email: f.email(r),
          status: f.status(r),
        }));
        if (on) setRows(norm);
      } catch (e) {
        showError(e, `Could not load ${title}`);
        if (on) setRows([]);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, [endpoint, method]);

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        rowKey={rowKey}
        searchKeys={searchKeys}
        filters={filters}
        onView={onView}
        onEdit={onEdit}
      />
    </div>
  );
}

/** Common field accessors that work across the varied API shapes. */
export const f = {
  name: (r) => r.username || r.Name || r.name || r.proposer_name || r.company_name || "—",
  mobile: (r) => r.mobileNumber || r.MobileNumber || r.mobile_number || r.proposer_mobile_numbers || "—",
  email: (r) => r.email || r.Email || "—",
  status: (r) => r.status || r.Status || "—",
};
