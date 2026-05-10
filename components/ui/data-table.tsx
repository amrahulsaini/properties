"use client";

import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import type { GenericRecord, ModuleColumn } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

interface DataTableProps {
  columns: ModuleColumn[];
  rows: GenericRecord[];
  onEdit?: (row: GenericRecord) => void;
  onDelete?: (row: GenericRecord) => void;
  getExtraAction?: (row: GenericRecord) => React.ReactNode;
}

function formatCell(row: GenericRecord, column: ModuleColumn) {
  const value = row[column.key];

  switch (column.type) {
    case "currency":
      return formatCurrency(value);
    case "number":
      return formatNumber(value);
    case "date":
      return formatDate(value);
    case "datetime":
      return formatDateTime(value);
    case "boolean":
      return value ? "Yes" : "No";
    case "badge":
      return (
        <span className="inline-flex rounded-full border border-line-strong bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          {String(value ?? "-")}
        </span>
      );
    default:
      return String(value ?? "-");
  }
}

export function DataTable({
  columns,
  rows,
  onEdit,
  onDelete,
  getExtraAction,
}: DataTableProps) {
  if (!rows.length) {
    return (
      <div className="rounded-[20px] border border-dashed border-line-strong bg-white/70 p-6 text-sm text-muted">
        No records available yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-white/80">
      {/* Desktop column headers — hidden on mobile */}
      <div className="hidden grid-cols-[repeat(auto-fit,minmax(110px,1fr))_140px] gap-3 border-b border-line bg-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white lg:grid">
        {columns.map((column) => (
          <div key={column.key}>{column.label}</div>
        ))}
        <div>Actions</div>
      </div>

      <div className="divide-y divide-line">
        {rows.map((row) => (
          <div
            key={String(row.id)}
            className="px-4 py-4 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(110px,1fr))_140px] lg:items-center lg:gap-3"
          >
            {/* Mobile: 2-column label+value grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 lg:contents">
              {columns.map((column) => (
                <div key={column.key} className="min-w-0">
                  <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted lg:hidden">
                    {column.label}
                  </p>
                  <div className="truncate text-sm text-ink">{formatCell(row, column)}</div>
                </div>
              ))}
            </div>

            {/* Actions row */}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 lg:mt-0 lg:border-0 lg:pt-0">
              {getExtraAction ? getExtraAction(row) : null}
              {onEdit ? (
                <button
                  className="rounded-full border border-line p-2 text-ink transition hover:border-accent hover:bg-accent/10 hover:text-accent focus:outline-none"
                  onClick={() => onEdit(row)}
                  title="Edit"
                  type="button"
                >
                  <Pencil size={15} />
                </button>
              ) : null}
              {onDelete ? (
                <button
                  className="rounded-full border border-line p-2 text-red-500 transition hover:border-red-300 hover:bg-red-50 focus:outline-none"
                  onClick={() => onDelete(row)}
                  title="Delete"
                  type="button"
                >
                  <Trash2 size={15} />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
