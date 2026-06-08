"use client";
import { useMemo, useState } from "react";
import { Search, Pencil, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Select from "./Select";
import EmptyState from "./EmptyState";
import { cn } from "@/lib/cn";

/**
 * columns: [{ key, title, render?: (row) => JSX, className? }]
 * filters: [{ key, label, options:[{value,label}] }]  (dropdown filters)
 * searchKeys: [string]  (fields searched by the search box)
 * onEdit/onView/onDelete: (row) => void   (render row actions when provided)
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  searchKeys = [],
  filters = [],
  onEdit,
  onView,
  onDelete,
  pageSize = 10,
  rowKey = "id",
}) {
  const [q, setQ] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [page, setPage] = useState(1);

  const hasActions = onEdit || onView || onDelete;

  const filtered = useMemo(() => {
    let rows = data || [];
    if (q && searchKeys.length) {
      const needle = q.toLowerCase();
      rows = rows.filter((r) =>
        searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(needle))
      );
    }
    for (const [k, v] of Object.entries(activeFilters)) {
      if (v) rows = rows.filter((r) => String(r[k] ?? "") === String(v));
    }
    return rows;
  }, [data, q, searchKeys, activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="ui-card overflow-hidden">
      {/* Toolbar: search + filters */}
      {(searchKeys.length > 0 || filters.length > 0) && (
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center">
          {searchKeys.length > 0 && (
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search…"
                className="ui-control pl-9"
              />
            </div>
          )}
          {filters.map((f) => (
            <div key={f.key} className="sm:w-48">
              <Select
                placeholder={f.label}
                options={f.options}
                value={activeFilters[f.key] || ""}
                onChange={(e) => {
                  setActiveFilters((s) => ({ ...s, [f.key]: e.target.value }));
                  setPage(1);
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-line bg-subtle/60 text-[12px] uppercase tracking-wide text-muted">
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-3 font-medium", c.className)}>
                  {c.title}
                </th>
              ))}
              {hasActions && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(pageSize)].map((_, i) => (
                <tr key={i} className="border-b border-line">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      <div className="skeleton h-4 w-3/4 rounded" />
                    </td>
                  ))}
                  {hasActions && <td className="px-4 py-3" />}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="p-6">
                  <EmptyState title="No records found" subtitle="Try adjusting your search or filters." />
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => (
                <motion.tr
                  key={row[rowKey] ?? idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.015 }}
                  className="border-b border-line transition-colors hover:bg-subtle/60"
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3 text-ink", c.className)}>
                      {c.render ? c.render(row) : row[c.key] ?? "—"}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {onView && <RowBtn icon={Eye} onClick={() => onView(row)} title="View" />}
                        {onEdit && <RowBtn icon={Pencil} onClick={() => onEdit(row)} title="Edit" />}
                        {onDelete && <RowBtn icon={Trash2} danger onClick={() => onDelete(row)} title="Delete" />}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-3 md:hidden">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-lg" />)
        ) : pageRows.length === 0 ? (
          <EmptyState title="No records found" />
        ) : (
          pageRows.map((row, idx) => (
            <div key={row[rowKey] ?? idx} className="rounded-lg border border-line p-3">
              {columns.map((c) => (
                <div key={c.key} className="flex justify-between gap-3 py-1 text-[13px]">
                  <span className="text-muted">{c.title}</span>
                  <span className="text-right font-medium text-ink">
                    {c.render ? c.render(row) : row[c.key] ?? "—"}
                  </span>
                </div>
              ))}
              {hasActions && (
                <div className="mt-2 flex justify-end gap-1 border-t border-line pt-2">
                  {onView && <RowBtn icon={Eye} onClick={() => onView(row)} title="View" />}
                  {onEdit && <RowBtn icon={Pencil} onClick={() => onEdit(row)} title="Edit" />}
                  {onDelete && <RowBtn icon={Trash2} danger onClick={() => onDelete(row)} title="Delete" />}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > pageSize && (
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[13px] text-muted">
          <span>
            {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <RowBtn icon={ChevronLeft} title="Prev" disabled={safePage === 1} onClick={() => setPage((p) => p - 1)} />
            <span className="px-2 font-medium text-ink">
              {safePage} / {totalPages}
            </span>
            <RowBtn icon={ChevronRight} title="Next" disabled={safePage === totalPages} onClick={() => setPage((p) => p + 1)} />
          </div>
        </div>
      )}
    </div>
  );
}

function RowBtn({ icon: Icon, onClick, title, danger, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "press rounded-md p-2 text-muted transition-colors hover:bg-subtle hover:text-ink disabled:opacity-40",
        danger && "hover:bg-red-50 hover:text-danger"
      )}
    >
      <Icon size={16} />
    </button>
  );
}
