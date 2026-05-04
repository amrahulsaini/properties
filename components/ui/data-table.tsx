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
        <span className="rounded-full border border-line-strong bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
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
      <div className="rounded-[24px] border border-dashed border-line-strong bg-white/70 p-8 text-sm text-muted">
        No records available yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-white/80">
      <div className="hidden grid-cols-[repeat(auto-fit,minmax(120px,1fr))_160px] gap-4 border-b border-line bg-black px-5 py-3 text-xs font-bold uppercase tracking-[0.24em] text-white lg:grid">
        {columns.map((column) => (
          <div key={column.key}>{column.label}</div>
        ))}
        <div>Actions</div>
      </div>

      <div className="divide-y divide-line">
        {rows.map((row) => (
          <div
            key={String(row.id)}
            className="grid gap-4 px-5 py-5 lg:grid-cols-[repeat(auto-fit,minmax(120px,1fr))_160px] lg:items-center"
          >
            {columns.map((column) => (
              <div key={column.key} className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted lg:hidden">
                  {column.label}
                </p>
                <div className="text-sm text-ink">{formatCell(row, column)}</div>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-2">
              {getExtraAction ? getExtraAction(row) : null}
              {onEdit ? (
                <button
                  className="rounded-full border border-line p-2 text-ink transition hover:border-accent hover:text-accent hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent"
                  onClick={() => onEdit(row)}
                  title="Edit"
                  type="button"
                >
                  <Pencil size={16} />
                </button>
              ) : null}
              {onDelete ? (
                <button
                  className="rounded-full border border-line p-2 text-red-600 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600"
                  onClick={() => onDelete(row)}
                  title="Delete"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
