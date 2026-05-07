"use client";

import { startTransition, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/notice";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { GenericRecord, ModuleConfig, ModuleField } from "@/lib/types";
import { FileText, MessageCircleMore } from "lucide-react";

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
    const total = rows.reduce(
      (accumulator, row) => accumulator + Number(row[field] ?? 0),
      0,
    );

    return summary.prefix ? formatCurrency(total) : formatNumber(total);
  }

  return "0";
}

export function ResourceWorkspace({ module }: ResourceWorkspaceProps) {
  const [rows, setRows] = useState<GenericRecord[]>([]);
  const [form, setForm] = useState(createInitialState(module.fields));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [deletingRow, setDeletingRow] = useState<GenericRecord | null>(null);
  const [projectCodeStatus, setProjectCodeStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

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
            setForm((c) => ({ ...c, project_id: Number(param) }));
            return;
          }

          const saved = localStorage.getItem("ps:defaultProjectId");
          if (saved) {
            setForm((c) => ({ ...c, project_id: Number(saved) }));
            return;
          }
        }

        const resp = await fetch("/api/v1/projects?limit=1");
        const payload = await resp.json();
        if (resp.ok && payload.data && payload.data[0]) {
          setForm((c) => ({ ...c, project_id: Number(payload.data[0].id) }));
        }
      } catch (e) {
        // ignore
      }
    }

    void findDefault();
  }, [module.fields, editingId]);

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
      
      const result = await response.json();
      if (response.ok && result.url) {
        setForm((current) => ({
          ...current,
          [key]: result.url,
        }));
      } else {
        setError(result.error || "Failed to upload image.");
      }
    } catch (err) {
      setError("An error occurred during upload.");
    } finally {
      setUploadingField(null);
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(createInitialState(module.fields));
    setProjectCodeStatus("idle");
  }

  function handleEdit(row: GenericRecord) {
    const next = createInitialState(module.fields);

    for (const field of module.fields) {
      next[field.key] = formatInputValue(field, row[field.key]);
    }

    setEditingId(Number(row.id));
    setForm(next);
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

  return (
    <div className="space-y-4">
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
            {(module.slug === "advance-bookings" || module.slug === "advance-agreements") ? (
              <a
                className={`rounded-full border border-line px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted ${
                  !rows?.length ? "opacity-60 pointer-events-none" : ""
                }`}
                href={rows?.length ? `/api/v1/${module.resource}/export` : "#"}
                rel="noreferrer"
                target="_blank"
              >
                Export PDF
              </a>
            ) : null}
          </div>
        ) : null}
      </Card>

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
              <button style={{cursor:'pointer'}} 
                className="flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105"
                onClick={() => setIsRecordsModalOpen(true)}
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
                <button style={{cursor:'pointer'}} 
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
              {module.fields.map((field) => (
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
                      onChange={(nextValue) =>
                        setForm((current) => ({
                          ...current,
                          [field.key]: nextValue,
                        }))
                      }
                      required={field.required}
                      value={form[field.key]}
                    />
                  ) : field.type === "select" ? (
                    <select
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
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
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      required={field.required}
                      value={String(form[field.key] ?? "")}
                    />
                  ) : field.type === "checkbox" ? (
                    <div className="flex h-[52px] items-center rounded-2xl border border-line bg-white px-4">
                      <input
                        checked={Boolean(form[field.key])}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [field.key]: event.target.checked,
                          }))
                        }
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
                                setForm((current) => ({ ...current, [field.key]: "" }));
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
                                <span className="mb-1 block font-semibold text-accent">Click or Drag & Drop</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted">Upload {field.label}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        accept="image/*"
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
                          setForm((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }));

                          if (module.slug === "projects" && field.key === "code") {
                            setProjectCodeStatus("idle");
                          }
                        }}
                        placeholder={field.placeholder}
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
              <button style={{cursor:'pointer'}} 
                className="rounded-full bg-accent px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105 disabled:opacity-70"
                disabled={saving}
                type="submit"
              >
                {saving ? "Saving..." : editingId ? "Update record" : "Create record"}
              </button>
              <button style={{cursor:'pointer'}} 
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

      {isRecordsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
          <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-line bg-app/50 p-6 backdrop-blur-md">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  Live records
                </p>
                <h3 className="mt-1 flex items-center gap-3 text-2xl font-semibold text-ink">
                  {loading ? (
                    <span className="flex items-center gap-2 text-muted text-base">
                      <svg className="animate-spin h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading records...
                    </span>
                  ) : (
                    `${rows.length} ${module.title}`
                  )}
                </h3>
              </div>
              <button style={{cursor:'pointer'}} 
                className="rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-zinc-800"
                onClick={() => setIsRecordsModalOpen(false)}
              >
                Close Window
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-white/80 p-6 pb-12">
              {!rows.length && !loading ? (
                <div className="rounded-[24px] border border-dashed border-line p-10 text-center text-sm text-muted">
                  {module.emptyState}
                </div>
              ) : (
                <DataTable
                  columns={module.columns}
                  getExtraAction={(row) => {
                    if (module.slug === "advance-bookings" || module.slug === "advance-agreements") {
                      const pdfUrl =
                        module.slug === "advance-bookings"
                          ? `/api/v1/advance-bookings/${row.id}/pdf`
                          : `/api/v1/advance-agreements/${row.id}/pdf`;
                      const phone = String(
                        module.slug === "advance-bookings"
                          ? row.customer_phone ?? ""
                          : row.owner_phone ?? row.customer_phone ?? "",
                      ).replace(/\D/g, "");
                      const origin = typeof window !== "undefined" 
                        ? window.location.origin 
                        : (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL 
                          ? process.env.NEXT_PUBLIC_APP_URL 
                          : "https://yourdomain.com");
                      const fullPdfUrl = `${origin}${pdfUrl}`;
                      const whatsappMessage = `Your ${module.slug === "advance-bookings" ? "Advance Booking" : "Advance Agreement"} PDF:\n${fullPdfUrl}`;

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
                    setIsRecordsModalOpen(false); // Close modal when editing
                  }}
                  rows={rows}
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
            <button style={{cursor:'pointer'}} 
              className="rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted transition hover:bg-neutral-100"
              onClick={() => setDeletingRow(null)}
              type="button"
            >
              Cancel
            </button>
            <button style={{cursor:'pointer'}} 
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
