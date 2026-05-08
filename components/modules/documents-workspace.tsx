"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ResourceWorkspace } from "@/components/modules/resource-workspace";
import { getModuleConfig } from "@/lib/modules";
import type { GenericRecord } from "@/lib/types";

const documentModule = getModuleConfig("documents");

const uploadSectionOptions = [
  { label: "Buyer", value: "buyer" },
  { label: "Seller", value: "seller" },
  { label: "Witness 1", value: "witness_1" },
  { label: "Witness 2", value: "witness_2" },
  { label: "Identifier", value: "identifier" },
  { label: "Plot / Land", value: "plot" },
  { label: "Final Dast", value: "final_dast" },
  { label: "Other", value: "other" },
];

const documentTypeOptions = [
  { label: "Aadhaar", value: "aadhaar" },
  { label: "PAN", value: "pan" },
  { label: "Photo", value: "photo" },
  { label: "Signature", value: "signature" },
  { label: "Address Proof", value: "address" },
  { label: "7/12", value: "7_12" },
  { label: "8A", value: "8a" },
  { label: "Ferfar", value: "ferfar" },
  { label: "Map", value: "map" },
  { label: "NA Order", value: "na_order" },
  { label: "Registry PDF", value: "registry_pdf" },
  { label: "Previous Agreement", value: "previous_agreement" },
  { label: "Tax Receipt", value: "tax_receipt" },
  { label: "Agreement", value: "agreement" },
  { label: "Other", value: "other" },
];

export function DocumentsWorkspace() {
  const [documents, setDocuments] = useState<GenericRecord[]>([]);
  const [folders, setFolders] = useState<GenericRecord[]>([]);
  const [folderId, setFolderId] = useState("");
  const [section, setSection] = useState("buyer");
  const [partyName, setPartyName] = useState("");
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("aadhaar");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      try {
        const [docsRes, foldersRes] = await Promise.all([
          fetch("/api/v1/documents?limit=100"),
          fetch("/api/v1/document-folders?limit=100"),
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
        if (active) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, []);

  async function refreshData() {
    setLoading(true);

    try {
      const [docsRes, foldersRes] = await Promise.all([
        fetch("/api/v1/documents?limit=100"),
        fetch("/api/v1/document-folders?limit=100"),
      ]);
      const docsPayload = await docsRes.json();
      const foldersPayload = await foldersRes.json();

      if (docsRes.ok) {
        setDocuments(docsPayload.data ?? []);
      }

      if (foldersRes.ok) {
        setFolders(foldersPayload.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function uploadFiles(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!folderId) {
      setError("Select a Dast folder before uploading documents.");
      return;
    }

    if (!files.length) {
      setError("Choose at least one image or PDF file.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("folder_id", folderId);
      formData.append("section", section);
      formData.append("party_name", partyName);
      formData.append("title", title);
      formData.append("document_type", documentType);

      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch("/api/v1/documents/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      setFolderId("");
      setSection("buyer");
      setPartyName("");
      setTitle("");
      setDocumentType("aadhaar");
      setFiles([]);
      await refreshData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Upload failed.");
    } finally {
      setUploading(false);
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
              Secure document upload
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">Smart Document Print Manager</h3>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              Upload buyer, seller, witness, identifier, and land documents as secure image or PDF files.
              Files are stored inside the selected Dast folder and included in the final export pack.
            </p>
          </div>
          <button
            className="flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105"
            onClick={() => setIsRecordsModalOpen(true)}
            type="button"
          >
            {loading ? (
              <svg className="h-3.5 w-3.5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            View Vault Files {!loading && `(${documents.length})`}
          </button>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={uploadFiles}>
          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Select Dast Folder
            </span>
            <select
              className="w-full rounded-2xl border border-line bg-white px-4 py-3"
              onChange={(event) => setFolderId(event.target.value)}
              required
              value={folderId}
            >
              <option value="">-- Choose a folder --</option>
              {folders.map((folder) => (
                <option key={String(folder.id)} value={String(folder.id)}>
                  {String(folder.folder_code ?? `Folder ${folder.id}`)} - {String(folder.plot_number ?? "")} - {String(folder.buyer_name ?? folder.client_name ?? "")}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Section
            </span>
            <select
              className="w-full rounded-2xl border border-line bg-white px-4 py-3"
              onChange={(event) => setSection(event.target.value)}
              value={section}
            >
              {uploadSectionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Party / Label
            </span>
            <input
              className="w-full rounded-2xl border border-line bg-white px-4 py-3"
              onChange={(event) => setPartyName(event.target.value)}
              placeholder="Buyer, Seller, Witness 1, Plot Docs..."
              type="text"
              value={partyName}
            />
          </label>

          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Document Type
            </span>
            <select
              className="w-full rounded-2xl border border-line bg-white px-4 py-3"
              onChange={(event) => setDocumentType(event.target.value)}
              value={documentType}
            >
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
              placeholder="Optional. Leave blank to use each file name."
              type="text"
              value={title}
            />
          </label>

          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Files
            </span>
            <input
              accept="image/*,.pdf"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              required
              type="file"
            />
            {files.length ? (
              <span className="mt-2 block text-xs text-muted">
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </span>
            ) : null}
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 md:col-span-2">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              className="rounded-full bg-accent px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105 disabled:opacity-70"
              disabled={uploading}
              type="submit"
            >
              {uploading ? "Uploading..." : "Upload documents"}
            </button>
          </div>
        </form>
      </Card>

      {isRecordsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-line bg-app/50 p-6 backdrop-blur-md">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  Recent files
                </p>
                <h3 className="mt-1 flex items-center gap-3 text-2xl font-semibold text-ink">
                  {loading ? (
                    <span className="flex items-center gap-2 text-base text-muted">
                      <svg className="h-5 w-5 animate-spin text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading vault...
                    </span>
                  ) : "Latest secure uploads"}
                </h3>
              </div>
              <button
                className="rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-zinc-800"
                onClick={() => setIsRecordsModalOpen(false)}
                type="button"
              >
                Close Window
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-white/80 p-6 pb-12">
              <DataTable
                columns={[
                  { key: "folder_code", label: "Dast No." },
                  { key: "folder_label", label: "Folder" },
                  { key: "section", label: "Section", type: "badge" },
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
