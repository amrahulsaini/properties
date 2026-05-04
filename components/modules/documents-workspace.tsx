"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ResourceWorkspace } from "@/components/modules/resource-workspace";
import { getModuleConfig } from "@/lib/modules";
import type { GenericRecord } from "@/lib/types";

const documentModule = getModuleConfig("documents");

export function DocumentsWorkspace() {
  const [documents, setDocuments] = useState<GenericRecord[]>([]);
  const [folders, setFolders] = useState<GenericRecord[]>([]);
  const [folderId, setFolderId] = useState("");
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("agreement");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      try {
        const [docsRes, foldersRes] = await Promise.all([
          fetch("/api/v1/documents?limit=50"),
          fetch("/api/v1/document-folders?limit=100")
        ]);
        const docsPayload = await docsRes.json();
        const foldersPayload = await foldersRes.json();
        if (docsRes.ok && active) {
          setDocuments(docsPayload.data ?? []);
        }
        if (foldersRes.ok && active) {
          setFolders(foldersPayload.data ?? []);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, []);

  async function loadDocuments() {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/documents?limit=50");
      const payload = await response.json();
      if (response.ok) {
        setDocuments(payload.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Select a document file before upload.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("folder_id", folderId);
      formData.append("title", title);
      formData.append("document_type", documentType);
      formData.append("file", file);

      const response = await fetch("/api/v1/documents/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      setFolderId("");
      setTitle("");
      setDocumentType("agreement");
      setFile(null);
      void loadDocuments();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Upload failed.");
    }
  }

  if (!documentModule) {
    return null;
  }

  return (
    <div className="space-y-4">
      <ResourceWorkspace module={documentModule} />

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Secure upload
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">Document Vault</h3>
            <p className="mt-2 text-sm text-muted">
              Upload Aadhar, PAN, 7/12, maps, agreements, and reference documents into an existing folder. The Folder ID is the auto-generated ID from the "Folders / Clients" table above.
            </p>
          </div>
          <button
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
            View Vault Files {!loading && `(${documents.length})`}
          </button>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={uploadFile}>
          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Select Client / Folder
            </span>
            <select
              className="w-full rounded-2xl border border-line bg-white px-4 py-3"
              onChange={(event) => setFolderId(event.target.value)}
              required
              value={folderId}
            >
              <option value="" disabled>-- Choose a folder --</option>
              {folders.map((folder) => (
                <option key={String(folder.id)} value={String(folder.id)}>
                  {String(folder.client_name)} (ID: {String(folder.id)})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Title
            </span>
            <input
              className="w-full rounded-2xl border border-line bg-white px-4 py-3"
              onChange={(event) => setTitle(event.target.value)}
              required
              type="text"
              value={title}
            />
          </label>

          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Type
            </span>
            <select
              className="w-full rounded-2xl border border-line bg-white px-4 py-3"
              onChange={(event) => setDocumentType(event.target.value)}
              value={documentType}
            >
              <option value="agreement">Agreement</option>
              <option value="aadhar">Aadhar</option>
              <option value="pan">PAN</option>
              <option value="7-12">7/12</option>
              <option value="map">Map</option>
              <option value="receipt">Receipt</option>
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              File
            </span>
            <input
              className="w-full rounded-2xl border border-line bg-white px-4 py-3"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
              type="file"
            />
          </label>

          {error ? (
            <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-accent px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105"
              type="submit"
            >
              Upload document
            </button>
          </div>
        </form>
      </Card>

      {isRecordsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
          <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-line bg-app/50 p-6 backdrop-blur-md">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  Recent files
                </p>
                <h3 className="mt-1 flex items-center gap-3 text-2xl font-semibold text-ink">
                  {loading ? (
                    <span className="flex items-center gap-2 text-muted text-base">
                      <svg className="animate-spin h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading vault...
                    </span>
                  ) : "Latest uploads"}
                </h3>
              </div>
              <button
                className="rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-zinc-800"
                onClick={() => setIsRecordsModalOpen(false)}
              >
                Close Window
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-white/80 p-6 pb-12">
              <DataTable
                columns={[
                  { key: "title", label: "Title" },
                  { key: "document_type", label: "Type", type: "badge" },
                  { key: "file_name", label: "File" },
                  { key: "uploaded_at", label: "Uploaded", type: "date" },
                ]}
                getExtraAction={(row) => (
                  <a
                    className="rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-black hover:text-white"
                    href={`/api/v1/documents/file/${row.id}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open
                  </a>
                )}
                rows={documents}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
