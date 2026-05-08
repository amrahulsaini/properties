"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { StatCard } from "@/components/ui/stat-card";
import { applyDevelopmentEntryComputedValues } from "@/lib/development-entries";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { GenericRecord, ModuleConfig, ModuleField } from "@/lib/types";
import { FileText, MessageCircleMore, Search, X, Building2 } from "lucide-react";

interface ResourceWorkspaceProps {
  module: ModuleConfig;
}

type ProjectOption = {
  id: number;
  name?: string | null;
  code?: string | null;
};

function ProjectSelectField({
  value,
  onChange,
  required,
}: {
  value: string | number | boolean;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const response = await fetch("/api/v1/projects?limit=500");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load projects.");
        }

        if (active) {
          setProjects(payload.data ?? []);
        }
      } catch {
        if (active) {
          setProjects([]);
        }
      } finally {
        if (active) {
          setLoadingProjects(false);
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  return (
    <select
      className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
      onChange={(event) => onChange(event.target.value)}
      required={required}
      value={String(value ?? "")}
    >
      <option value="">{loadingProjects ? "Loading projects..." : "Select project"}</option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.code || `Project ${project.id}`}
          {project.name ? ` - ${project.name}` : ""}
        </option>
      ))}
    </select>
  );
}

function createInitialState(fields: ModuleField[]) {
  return fields.reduce<Record<string, string | number | boolean>>((accumulator, field) => {
    accumulator[field.key] = field.type === "checkbox" ? false : "";
    return accumulator;
  }, {});
}

function toFormRecord(input: GenericRecord) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => {
      if (typeof value === "boolean" || typeof value === "number") {
        return [key, value];
      }

      return [key, value == null ? "" : String(value)];
    }),
  ) as Record<string, string | number | boolean>;
}

function applyModuleRules(
  module: ModuleConfig,
  form: Record<string, string | number | boolean>,
) {
  if (module.slug === "development-sites") {
    return toFormRecord(applyDevelopmentEntryComputedValues(form));
  }

  return form;
}

function matchesExpectedValue(
  expected: unknown,
  current: string | number | boolean,
): boolean {
  if (Array.isArray(expected)) {
    return expected.some((value) => matchesExpectedValue(value, current));
  }

  if (typeof expected === "boolean") {
    return Boolean(current) === expected;
  }

  if (typeof expected === "number") {
    return Number(current) === expected;
  }

  return String(current ?? "") === String(expected ?? "");
}

function isFieldVisible(
  field: ModuleField,
  form: Record<string, string | number | boolean>,
) {
  if (!field.showWhen) {
    return true;
  }

  const rules = Array.isArray(field.showWhen) ? field.showWhen : [field.showWhen];

  return rules.some((rule) =>
    Object.entries(rule).every(([key, expected]) =>
      matchesExpectedValue(expected, form[key] ?? ""),
    ),
  );
}

function formatInputValue(field: ModuleField, value: unknown) {
  if (field.type === "checkbox") {
    return Boolean(value);
  }

  if (!value) {
    return "";
  }

  if (field.type === "datetime-local") {
    return String(value).slice(0, 16);
  }

  if (field.type === "date") {
    return String(value).slice(0, 10);
  }

  if (field.type === "time") {
    return String(value).slice(0, 5);
  }

  return String(value);
}

function toPayload(fields: ModuleField[], form: Record<string, string | number | boolean>) {
  return Object.fromEntries(
    fields.map((field) => {
      const value = form[field.key];

      if (field.type === "checkbox") {
        return [field.key, Boolean(value)];
      }

      if (field.type === "number") {
        return [field.key, value === "" ? null : Number(value)];
      }

      if (field.type === "project_select") {
        return [field.key, value === "" ? null : Number(value)];
      }

      return [field.key, value];
    }),
  );
}

function computeSummary(summary: ModuleConfig["summaries"][number], rows: GenericRecord[]) {
  if (summary.type === "count") {
    return String(rows.length);
  }

  if (summary.type === "unique" && summary.field) {
    const field = summary.field;
    return String(
      new Set(rows.map((row) => String(row[field] ?? ""))).size,
    );
  }

  if (summary.type === "sum" && summary.field) {
    const field = summary.field;
    const filter = summary.filter;
    const filteredRows = filter
      ? rows.filter((row) =>
          Object.entries(filter).every(([k, v]) => row[k] === v),
        )
      : rows;
    const total = filteredRows.reduce(
      (accumulator, row) => accumulator + Number(row[field] ?? 0),
      0,
    );

    return summary.prefix ? `${summary.prefix} ${formatNumber(total)}` : formatNumber(total);
  }

  if (summary.type === "computed") {
    // Balance = income - expense
    const income = rows
      .filter((r) => r["transaction_type"] === "income")
      .reduce((a, r) => a + Number(r["amount"] ?? 0), 0);
    const expense = rows
      .filter((r) => r["transaction_type"] === "expense")
      .reduce((a, r) => a + Number(r["amount"] ?? 0), 0);
    return formatCurrency(income - expense);
  }

  return "0";
}

const hasProjectSelect = (fields: ModuleField[]) =>
  fields.some((f) => f.type === "project_select");

export function ResourceWorkspace({ module }: ResourceWorkspaceProps) {
  const [rows, setRows] = useState<GenericRecord[]>([]);
  const [form, setForm] = useState(() => applyModuleRules(module, createInitialState(module.fields)));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [deletingRow, setDeletingRow] = useState<GenericRecord | null>(null);
  const [projectCodeStatus, setProjectCodeStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Project name map for resolving project_id → name
  const [projectMap, setProjectMap] = useState<Map<number, { name: string; code: string }>>(new Map());
  const projectMapLoaded = useRef(false);

  // Instant search state — pure client-side, zero latency
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const visibleFields = useMemo(
    () => module.fields.filter((field) => isFieldVisible(field, form)),
    [module.fields, form],
  );

  function updateFieldValue(key: string, value: string | number | boolean) {
    setForm((current) => applyModuleRules(module, { ...current, [key]: value }));
  }

  // Load project names once for modules that use project_select
  useEffect(() => {
    if (!hasProjectSelect(module.fields) || projectMapLoaded.current) return;
    projectMapLoaded.current = true;

    fetch("/api/v1/projects?limit=500")
      .then((r) => r.json())
      .then((payload) => {
        if (!payload.data) return;
        const map = new Map<number, { name: string; code: string }>();
        for (const p of payload.data) {
          map.set(Number(p.id), { name: String(p.name ?? ""), code: String(p.code ?? "") });
        }
        setProjectMap(map);
      })
      .catch(() => {});
  }, [module.fields]);

  // Enrich rows with _project_name for display and search
  const enrichedRows = useMemo(() => {
    if (!hasProjectSelect(module.fields) || projectMap.size === 0) return rows;
    return rows.map((row) => {
      const pid = Number(row["project_id"]);
      const proj = projectMap.get(pid);
      const label = proj
        ? proj.code
          ? `${proj.code} – ${proj.name}`
          : proj.name
        : pid ? `Project ${pid}` : "";
      return { ...row, _project_name: label };
    });
  }, [rows, projectMap, module.fields]);

  // Instant client-side filtering — O(n) array scan, sub-millisecond
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return enrichedRows;
    return enrichedRows.filter((row) =>
      Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q)),
    );
  }, [enrichedRows, searchQuery]);

  // Branch (project) summary for project-linked modules
  const branchSummary = useMemo(() => {
    if (!hasProjectSelect(module.fields)) return [];
    const map = new Map<number, { name: string; count: number; income: number; expense: number; total: number }>();
    for (const row of rows) {
      const pid = Number(row["project_id"]);
      if (!pid) continue;
      const proj = projectMap.get(pid);
      const name = proj
        ? proj.code
          ? `${proj.code} – ${proj.name}`
          : proj.name || `Project ${pid}`
        : `Project ${pid}`;
      const existing = map.get(pid) ?? { name, count: 0, income: 0, expense: 0, total: 0 };
      existing.count++;
      const amt = Number(row["amount"] ?? 0);
      existing.total += amt;
      if (row["entry_type"] === "income" || row["transaction_type"] === "income") {
        existing.income += amt;
      } else if (row["entry_type"] === "expense" || row["transaction_type"] === "expense") {
        existing.expense += amt;
      }
      map.set(pid, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [rows, projectMap, module.fields]);

  // Build display columns — prepend project name if applicable
  const displayColumns = useMemo(() => {
    if (!hasProjectSelect(module.fields) || projectMap.size === 0) return module.columns;
    const already = module.columns.some((c) => c.key === "_project_name" || c.key === "project_id");
    if (already) return module.columns;
    return [{ key: "_project_name", label: "Branch / Project" }, ...module.columns];
  }, [module.columns, module.fields, projectMap]);

  async function loadRows() {
    if (!module.resource) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/v1/${module.resource}?limit=200`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load data.");
      }

      setRows(payload.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function run() {
      if (!module.resource) {
        return;
      }

      try {
        const response = await fetch(`/api/v1/${module.resource}?limit=200`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load data.");
        }

        if (active) {
          setRows(payload.data ?? []);
        }
      } catch (nextError) {
        if (active) {
          setError(
            nextError instanceof Error ? nextError.message : "Failed to load data.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [module.resource]);

  // Prefill project_id from URL -> localStorage -> first project
  useEffect(() => {
    if (editingId) return;
    if (!module.fields.some((f) => f.key === "project_id")) return;
    const current = String(form["project_id"] ?? "");
    if (current) return;

    async function findDefault() {
      try {
        if (typeof window !== "undefined") {
          const params = new URL(window.location.href).searchParams;
          const param = params.get("project_id") || params.get("project");
          if (param) {
            setForm((c) => applyModuleRules(module, { ...c, project_id: Number(param) }));
            return;
          }

          const saved = localStorage.getItem("ps:defaultProjectId");
          if (saved) {
            setForm((c) => applyModuleRules(module, { ...c, project_id: Number(saved) }));
            return;
          }
        }

        const resp = await fetch("/api/v1/projects?limit=1");
        const payload = await resp.json();
        if (resp.ok && payload.data && payload.data[0]) {
          setForm((c) => applyModuleRules(module, { ...c, project_id: Number(payload.data[0].id) }));
        }
      } catch {
        // ignore
      }
    }

    void findDefault();
  }, [editingId, form, module]);

  async function handleFileUpload(file: File, key: string) {
    setUploadingField(key);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const localPreviewUrl = URL.createObjectURL(file);
      setForm((current) => ({
        ...current,
        [key]: localPreviewUrl,
      }));

      const response = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(`Upload failed: ${result.error || response.statusText || "Unknown error"}`);
      }

      const result = await response.json();
      if (result.url) {
        setForm((current) => ({
          ...current,
          [key]: result.url,
        }));
        URL.revokeObjectURL(localPreviewUrl);
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during upload.");
    } finally {
      setUploadingField(null);
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(applyModuleRules(module, createInitialState(module.fields)));
    setProjectCodeStatus("idle");
  }

  function handleEdit(row: GenericRecord) {
    const next = createInitialState(module.fields);

    for (const field of module.fields) {
      next[field.key] = formatInputValue(field, row[field.key]);
    }

    setEditingId(Number(row.id));
    setForm(applyModuleRules(module, next));
    setProjectCodeStatus("idle");
  }

  async function checkProjectCodeAvailability(nextCode: string) {
    if (module.slug !== "projects") {
      return;
    }

    const code = nextCode.trim();
    if (!code) {
      setProjectCodeStatus("idle");
      return;
    }

    setProjectCodeStatus("checking");

    try {
      const response = await fetch("/api/v1/projects?limit=200");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to validate project code.");
      }

      const exists = (payload.data ?? []).some((project: GenericRecord) => {
        const projectCode = String(project.code ?? "").trim().toLowerCase();
        const projectId = Number(project.id ?? 0);
        return projectCode === code.toLowerCase() && projectId !== editingId;
      });

      setProjectCodeStatus(exists ? "taken" : "available");
    } catch {
      setProjectCodeStatus("idle");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!module.resource) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        editingId
          ? `/api/v1/${module.resource}/${editingId}`
          : `/api/v1/${module.resource}`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(toPayload(module.fields, form)),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Save failed.");
      }

      resetForm();
      startTransition(() => {
        void loadRows();
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!module.resource || !deletingRow || !deletingRow.id) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/${module.resource}/${deletingRow.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Delete failed.");
      }

      setDeletingRow(null);
      startTransition(() => {
        void loadRows();
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Delete failed.");
      setDeletingRow(null);
    }
  }

  function handleDelete(row: GenericRecord) {
    setDeletingRow(row);
  }

  function openModal() {
    setSearchQuery("");
    setIsRecordsModalOpen(true);
    // Auto-focus search on next tick
    setTimeout(() => searchInputRef.current?.focus(), 80);
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="relative overflow-hidden">
        <div className="absolute -right-14 top-0 h-44 w-44 rounded-full bg-accent-soft blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          {module.badge}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">{module.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          {module.subtitle}
        </p>
        {module.resource ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              className="rounded-full bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white"
              href={`/api/v1/reports/export?resource=${module.resource}`}
              rel="noreferrer"
              target="_blank"
            >
              Export Excel
            </a>
            <a
              className="rounded-full border border-line px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted"
              href={`/api/v1/reports/export-pdf?resource=${module.resource}`}
              rel="noreferrer"
              target="_blank"
            >
              Export PDF
            </a>
          </div>
        ) : null}
      </Card>

      {/* Summary stat cards */}
      {module.summaries.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {module.summaries.map((summary) => (
            <StatCard
              key={summary.label}
              label={summary.label}
              tone={summary.tone}
              value={computeSummary(summary, rows)}
            />
          ))}
        </div>
      ) : null}

      {/* Form card */}
      <div className="space-y-4">
        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                {editingId ? "Edit record" : "New record"}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">
                {module.title}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                style={{ cursor: "pointer" }}
                className="flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105"
                onClick={openModal}
                type="button"
              >
                {loading ? (
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                View all records {!loading && `(${rows.length})`}
              </button>
              {editingId ? (
                <button
                  style={{ cursor: "pointer" }}
                  className="rounded-full border border-line px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted"
                  onClick={resetForm}
                  type="button"
                >
                  Clear edit
                </button>
              ) : null}
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              {visibleFields.map((field) => (
                <label
                  key={field.key}
                  className={field.type === "textarea" ? "md:col-span-2" : ""}
                >
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                    {field.label}
                    {field.required ? <span className="ml-1 text-red-500">*</span> : null}
                  </span>
                  {field.type === "project_select" ? (
                    <ProjectSelectField
                      onChange={(nextValue) => updateFieldValue(field.key, nextValue)}
                      required={field.required}
                      value={form[field.key]}
                    />
                  ) : field.type === "select" ? (
                    <select
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) => updateFieldValue(field.key, event.target.value)}
                      required={field.required}
                      value={String(form[field.key] ?? "")}
                    >
                      <option value="">Select</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      className="min-h-28 w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) => updateFieldValue(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      readOnly={field.readOnly}
                      required={field.required}
                      value={String(form[field.key] ?? "")}
                    />
                  ) : field.type === "checkbox" ? (
                    <div className="flex h-[52px] items-center rounded-2xl border border-line bg-white px-4">
                      <input
                        checked={Boolean(form[field.key])}
                        onChange={(event) => updateFieldValue(field.key, event.target.checked)}
                        type="checkbox"
                      />
                    </div>
                  ) : field.type === "image" || field.type === "file" ? (
                    <div className="relative w-full rounded-2xl border border-dashed border-gray-400 bg-gray-50/50 transition hover:bg-gray-50 p-4">
                      <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
                        {form[field.key] ? (
                          <div className="group relative mx-auto h-16 w-32 overflow-hidden rounded-md border border-line bg-white">
                            {field.type === "image" ? (
                              <img
                                alt="preview"
                                className="h-full w-full object-contain"
                                src={String(form[field.key])}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center break-all px-2 text-center text-xs font-semibold text-muted">
                                File uploaded
                              </div>
                            )}
                            <button
                              className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={(event) => {
                                event.preventDefault();
                                updateFieldValue(field.key, "");
                              }}
                              type="button"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {uploadingField === field.key ? (
                              <span className="mt-2 block animate-pulse">Uploading...</span>
                            ) : (
                              <>
                                <span className="mb-1 block font-semibold text-accent">Click or Drag &amp; Drop</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted">Upload {field.label}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        accept={field.accept ?? (field.type === "image" ? "image/*" : undefined)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0], field.key);
                          }
                        }}
                        type="file"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                        onBlur={
                          module.slug === "projects" && field.key === "code"
                            ? (event) => {
                                void checkProjectCodeAvailability(event.target.value);
                              }
                            : undefined
                        }
                        onChange={(event) => {
                          updateFieldValue(field.key, event.target.value);

                          if (module.slug === "projects" && field.key === "code") {
                            setProjectCodeStatus("idle");
                          }
                        }}
                        placeholder={field.placeholder}
                        readOnly={field.readOnly}
                        required={field.required}
                        step={field.step}
                        type={field.type}
                        value={String(form[field.key] ?? "")}
                      />
                      {module.slug === "projects" && field.key === "code" ? (
                        <p
                          className={`text-xs font-medium ${
                            projectCodeStatus === "taken"
                              ? "text-rose-600"
                              : projectCodeStatus === "available"
                                ? "text-emerald-600"
                                : "text-muted"
                          }`}
                        >
                          {projectCodeStatus === "taken"
                            ? "This project code already exists."
                            : projectCodeStatus === "available"
                              ? "Code is available."
                              : " "}
                        </p>
                      ) : null}
                    </div>
                  )}
                  {field.hint ? (
                    <span className="mt-2 block text-xs text-muted">{field.hint}</span>
                  ) : null}
                </label>
              ))}
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                style={{ cursor: "pointer" }}
                className="rounded-full bg-accent px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105 disabled:opacity-70"
                disabled={saving}
                type="submit"
              >
                {saving ? "Saving..." : editingId ? "Update record" : "Create record"}
              </button>
              <button
                style={{ cursor: "pointer" }}
                className="rounded-full border border-line px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted"
                onClick={resetForm}
                type="button"
              >
                Reset
              </button>
            </div>
          </form>
        </Card>
      </div>

      {/* ── Records Modal ── */}
      {isRecordsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-black/8">

            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 border-b border-line bg-black px-6 py-5">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-400">
                  Live records · {module.title}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  {loading ? (
                    <span className="flex items-center gap-2 text-zinc-300 text-base">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    <span>
                      {filteredRows.length !== rows.length ? (
                        <>
                          <span className="text-accent">{filteredRows.length}</span>
                          <span className="text-zinc-400"> / {rows.length} records</span>
                        </>
                      ) : (
                        `${rows.length} ${module.title}`
                      )}
                    </span>
                  )}
                </h3>
              </div>

              {/* Search bar */}
              <div className="relative flex-1 max-w-sm">
                <Search
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                />
                <input
                  ref={searchInputRef}
                  className="w-full rounded-full border border-zinc-700 bg-zinc-900 pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
                  placeholder="Search records instantly..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery ? (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                    onClick={() => setSearchQuery("")}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>

              <button
                style={{ cursor: "pointer" }}
                className="shrink-0 rounded-full border border-zinc-700 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300 transition hover:border-white hover:text-white"
                onClick={() => setIsRecordsModalOpen(false)}
              >
                Close
              </button>
            </div>

            {/* Branch / Project summary strip */}
            {branchSummary.length > 0 ? (
              <div className="border-b border-line bg-zinc-50 px-6 py-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400">
                  Branches
                </p>
                <div className="flex flex-wrap gap-2">
                  {branchSummary.map((branch) => (
                    <button
                      key={branch.name}
                      type="button"
                      onClick={() => setSearchQuery(branch.name.split(" – ")[0] ?? branch.name)}
                      className={`group flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-left transition hover:border-accent hover:bg-accent/5 ${
                        searchQuery && branch.name.toLowerCase().includes(searchQuery.toLowerCase())
                          ? "border-accent bg-accent/8"
                          : "border-line bg-white"
                      }`}
                    >
                      <Building2
                        size={14}
                        className="shrink-0 text-accent"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink truncate max-w-[140px]">
                          {branch.name}
                        </p>
                        <p className="text-[10px] text-muted">
                          {branch.count} record{branch.count !== 1 ? "s" : ""}
                          {branch.total > 0 ? ` · ${formatCurrency(branch.total)}` : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="flex items-center gap-1.5 rounded-2xl border border-dashed border-zinc-300 px-4 py-2.5 text-xs text-muted hover:border-accent hover:text-accent transition"
                    >
                      <X size={12} />
                      Clear filter
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Records body */}
            <div className="flex-1 overflow-auto bg-white/95 p-6 pb-12">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted">
                  <svg className="animate-spin h-8 w-8 text-accent mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm font-medium">Loading records...</p>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  {searchQuery ? (
                    <>
                      <Search size={32} className="mb-4 text-zinc-300" />
                      <p className="text-sm font-semibold text-ink">No results for &ldquo;{searchQuery}&rdquo;</p>
                      <p className="mt-1 text-xs text-muted">Try a different search term or clear the filter</p>
                      <button
                        className="mt-4 rounded-full border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:border-accent hover:text-accent"
                        onClick={() => setSearchQuery("")}
                        type="button"
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-line p-10 text-sm text-muted w-full">
                      {module.emptyState}
                    </div>
                  )}
                </div>
              ) : (
                <DataTable
                  columns={displayColumns}
                  getExtraAction={(row) => {
                    const origin = typeof window !== "undefined"
                      ? window.location.origin
                      : (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
                        ? process.env.NEXT_PUBLIC_APP_URL
                        : "https://yourdomain.com");

                    if (
                      module.slug === "advance-bookings" ||
                      module.slug === "advance-agreements" ||
                      module.slug === "development-sites" ||
                      module.slug === "documents"
                    ) {
                      const pdfUrl = module.slug === "advance-bookings"
                        ? `/api/v1/advance-bookings/${row.id}/pdf`
                        : module.slug === "advance-agreements"
                          ? `/api/v1/advance-agreements/${row.id}/pdf`
                          : module.slug === "development-sites"
                            ? `/api/v1/development-entries/${row.id}/pdf`
                            : `/api/v1/document-folders/${row.id}/pdf`;

                      const phone = String(
                        module.slug === "advance-bookings"
                          ? row.customer_phone ?? ""
                          : module.slug === "advance-agreements"
                            ? row.owner_phone ?? row.customer_phone ?? ""
                            : module.slug === "development-sites"
                              ? row.mobile_number ?? ""
                              : row.buyer_mobile_number ?? "",
                      ).replace(/\D/g, "");

                      const messageTitle = module.slug === "advance-bookings"
                        ? "Advance Booking"
                        : module.slug === "advance-agreements"
                          ? "Advance Agreement"
                          : module.slug === "development-sites"
                            ? "Development Work Slip"
                            : "Dast Document Pack";

                      const fullPdfUrl = `${origin}${pdfUrl}`;
                      const whatsappMessage = `Your ${messageTitle} PDF:\n${fullPdfUrl}`;

                      return (
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:border-accent hover:bg-accent/10 hover:text-accent"
                            href={fullPdfUrl}
                            rel="noreferrer"
                            target="_blank"
                            title="Open PDF"
                          >
                            <FileText size={15} />
                            PDF
                          </a>
                          {phone ? (
                            <a
                              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 transition hover:bg-emerald-100"
                              href={`https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`}
                              rel="noreferrer"
                              target="_blank"
                              title="Send on WhatsApp"
                            >
                              <MessageCircleMore size={15} />
                              WhatsApp
                            </a>
                          ) : null}
                        </div>
                      );
                    }

                    return null;
                  }}
                  onDelete={(row) => {
                    handleDelete(row);
                  }}
                  onEdit={(row) => {
                    handleEdit(row);
                    setIsRecordsModalOpen(false);
                  }}
                  rows={filteredRows}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {deletingRow && (
        <Dialog
          title="Delete record?"
          description="Are you sure you want to delete this record? This action cannot be undone."
          onClose={() => setDeletingRow(null)}
        >
          <div className="mt-6 flex justify-end gap-3">
            <button
              style={{ cursor: "pointer" }}
              className="rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted transition hover:bg-neutral-100"
              onClick={() => setDeletingRow(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              style={{ cursor: "pointer" }}
              className="rounded-full bg-rose-600 px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-rose-700"
              onClick={handleDeleteConfirm}
              type="button"
            >
              Delete
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
