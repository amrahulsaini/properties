"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ResourceWorkspace } from "@/components/modules/resource-workspace";
import { getModuleConfig } from "@/lib/modules";
import type { GenericRecord } from "@/lib/types";
import { Printer, Upload, Crop, X, FileText, ChevronDown, ChevronUp } from "lucide-react";

const documentModule = getModuleConfig("documents");

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const SECTIONS = [
  { label: "Buyer", value: "buyer" },
  { label: "Seller", value: "seller" },
  { label: "Witness 1", value: "witness_1" },
  { label: "Witness 2", value: "witness_2" },
  { label: "Identifier 1", value: "identifier_1" },
  { label: "Identifier 2", value: "identifier_2" },
  { label: "Plot / Land", value: "plot" },
  { label: "Other", value: "other" },
];

const DOCUMENT_TYPES = [
  { label: "Aadhaar Front", value: "aadhaar_front" },
  { label: "Aadhaar Back", value: "aadhaar_back" },
  { label: "PAN Card", value: "pan" },
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

const PRINT_LAYOUT_OPTIONS = [
  { label: "A4 Size", value: "a4" },
  { label: "Legal Size", value: "legal" },
  { label: "Half Page", value: "half-page" },
  { label: "Full Page", value: "full-page" },
];

const AADHAAR_LAYOUT_OPTIONS = [
  { label: "One Aadhaar / Page", value: "single-page" },
  { label: "Front + Back One Page", value: "front-back" },
  { label: "Two Aadhaar / Page", value: "two-per-page" },
  { label: "Four Documents Grid", value: "four-grid" },
];

const PAGE_ORIENTATION_OPTIONS = [
  { label: "Portrait", value: "portrait" },
  { label: "Landscape", value: "landscape" },
];

const DPI_QUALITY_OPTIONS = [
  { label: "Standard", value: "standard" },
  { label: "High", value: "high" },
  { label: "Print Ready", value: "print-ready" },
];

const COLOR_MODE_OPTIONS = [
  { label: "Color", value: "color" },
  { label: "Black & White", value: "bw" },
];

const EXPORT_TYPE_OPTIONS = [
  { label: "PDF", value: "pdf" },
  { label: "Image", value: "image" },
  { label: "Print Direct", value: "print" },
  { label: "WhatsApp Share", value: "whatsapp" },
];

// ──────────────────────────────────────────────────────────────────────────────
// Canvas Crop Modal
// ──────────────────────────────────────────────────────────────────────────────

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function CropModal({
  src,
  onConfirm,
  onClose,
}: {
  src: string;
  onConfirm: (blob: Blob) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const CANVAS_MAX = 600;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = src;
  }, [src]);

  // Draw image + crop overlay whenever crop changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const scale = Math.min(CANVAS_MAX / img.naturalWidth, CANVAS_MAX / img.naturalHeight, 1);
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (crop) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      // top
      ctx.fillRect(0, 0, canvas.width, crop.y);
      // bottom
      ctx.fillRect(0, crop.y + crop.h, canvas.width, canvas.height - crop.y - crop.h);
      // left
      ctx.fillRect(0, crop.y, crop.x, crop.h);
      // right
      ctx.fillRect(crop.x + crop.w, crop.y, canvas.width - crop.x - crop.w, crop.h);
      // border
      ctx.strokeStyle = "#F26A1B";
      ctx.lineWidth = 2;
      ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
    }
  }, [crop, imgLoaded]);

  function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = getCanvasPos(e);
    setStartPos(pos);
    setCrop(null);
    setDragging(true);
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragging) return;
    const pos = getCanvasPos(e);
    const x = Math.min(startPos.x, pos.x);
    const y = Math.min(startPos.y, pos.y);
    const w = Math.abs(pos.x - startPos.x);
    const h = Math.abs(pos.y - startPos.y);
    setCrop({ x, y, w, h });
  }

  function onMouseUp() {
    setDragging(false);
  }

  function confirmCrop() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !crop || crop.w < 5 || crop.h < 5) return;

    const scale = canvas.width / img.naturalWidth;
    const sx = crop.x / scale;
    const sy = crop.y / scale;
    const sw = crop.w / scale;
    const sh = crop.h / scale;

    const out = document.createElement("canvas");
    out.width = sw;
    out.height = sh;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    out.toBlob((blob) => {
      if (blob) onConfirm(blob);
    }, "image/jpeg", 0.95);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Image Crop</p>
            <h3 className="mt-1 text-lg font-semibold text-ink">Drag to select crop area</h3>
          </div>
          <button
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted hover:bg-zinc-100"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {!imgLoaded ? (
            <div className="flex items-center justify-center py-16 text-muted">Loading image...</div>
          ) : (
            <canvas
              ref={canvasRef}
              className="mx-auto block cursor-crosshair rounded-xl border border-line"
              onMouseDown={onMouseDown}
              onMouseLeave={onMouseUp}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              style={{ maxWidth: "100%" }}
            />
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line px-6 py-4">
          <p className="flex-1 text-xs text-muted">
            {crop && crop.w > 5 ? `Crop: ${Math.round(crop.w)} × ${Math.round(crop.h)} px` : "Drag on the image to select the area to keep"}
          </p>
          <button
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.24em] text-white hover:brightness-105 disabled:opacity-50"
            disabled={!crop || crop.w < 5 || crop.h < 5}
            onClick={confirmCrop}
            type="button"
          >
            <Crop size={13} />
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Print Settings Modal
// ──────────────────────────────────────────────────────────────────────────────

interface PrintSettings {
  printLayout: string;
  aadhaarLayout: string;
  pageOrientation: string;
  dpiQuality: string;
  colorMode: string;
  exportType: string;
}

function PrintSettingsModal({
  settings,
  onChange,
  onPrint,
  onClose,
  title,
}: {
  settings: PrintSettings;
  onChange: (s: PrintSettings) => void;
  onPrint: () => void;
  onClose: () => void;
  title: string;
}) {
  function set(key: keyof PrintSettings, value: string) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[24px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Print Settings</p>
            <h3 className="mt-1 text-lg font-semibold text-ink">{title}</h3>
          </div>
          <button className="rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted hover:bg-zinc-100" onClick={onClose} type="button">Close</button>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {([
            ["Print Layout", "printLayout", PRINT_LAYOUT_OPTIONS],
            ["Aadhaar Layout", "aadhaarLayout", AADHAAR_LAYOUT_OPTIONS],
            ["Page Orientation", "pageOrientation", PAGE_ORIENTATION_OPTIONS],
            ["DPI Quality", "dpiQuality", DPI_QUALITY_OPTIONS],
            ["Color Mode", "colorMode", COLOR_MODE_OPTIONS],
            ["Export Type", "exportType", EXPORT_TYPE_OPTIONS],
          ] as [string, keyof PrintSettings, { label: string; value: string }[]][]).map(([label, key, opts]) => (
            <label key={key}>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">{label}</span>
              <select
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                onChange={(e) => set(key, e.target.value)}
                value={settings[key]}
              >
                {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button
            className="flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.24em] text-white hover:brightness-105"
            onClick={onPrint}
            type="button"
          >
            <Printer size={13} />
            Print / Export
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Single document card
// ──────────────────────────────────────────────────────────────────────────────

function DocumentCard({
  folderId,
  section,
  docType,
  documents,
  onUploaded,
}: {
  folderId: string;
  section: string;
  docType: { label: string; value: string };
  documents: GenericRecord[];
  onUploaded: () => void;
}) {
  const existing = documents.find(
    (d) => String(d.section) === section && String(d.document_type) === docType.value,
  );

  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [printSettingsOpen, setPrintSettingsOpen] = useState(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    printLayout: "a4",
    aadhaarLayout: "single-page",
    pageOrientation: "portrait",
    dpiQuality: "standard",
    colorMode: "color",
    exportType: "pdf",
  });
  const [error, setError] = useState("");

  async function uploadFile(file: File, title?: string) {
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("folder_id", folderId);
      formData.append("section", section);
      formData.append("party_name", section);
      formData.append("title", title ?? `${section} ${docType.label}`);
      formData.append("document_type", docType.value);
      formData.append("files", file);

      const res = await fetch("/api/v1/documents/upload", { method: "POST", body: formData });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Upload failed.");
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPendingFile(file);
      setCropSrc(url);
    } else {
      void uploadFile(file);
    }
    e.target.value = "";
  }

  async function handleCropConfirm(blob: Blob) {
    const file = new File([blob], pendingFile?.name ?? "cropped.jpg", { type: "image/jpeg" });
    setCropSrc(null);
    setPendingFile(null);
    await uploadFile(file);
  }

  function handlePrint() {
    if (!existing) return;
    const fileUrl = `/api/v1/documents/file/${existing.id}`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Print</title>
      <style>
        @page { size: ${printSettings.pageOrientation === "landscape" ? "landscape" : "portrait"}; margin: 0; }
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        img { max-width: 100%; max-height: 100vh; object-fit: contain; filter: ${printSettings.colorMode === "bw" ? "grayscale(1)" : "none"}; }
      </style>
      </head><body>
      <img src="${fileUrl}" onload="window.print();window.close();" />
      </body></html>
    `);
    win.document.close();
  }

  const previewUrl = existing ? `/api/v1/documents/file/${existing.id}` : null;

  return (
    <>
      {cropSrc ? (
        <CropModal
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onClose={() => { setCropSrc(null); setPendingFile(null); }}
        />
      ) : null}

      {printSettingsOpen ? (
        <PrintSettingsModal
          settings={printSettings}
          onChange={setPrintSettings}
          onPrint={() => { setPrintSettingsOpen(false); handlePrint(); }}
          onClose={() => setPrintSettingsOpen(false)}
          title={`Print ${docType.label}`}
        />
      ) : null}

      <div className="flex flex-col rounded-2xl border border-line bg-white p-3 gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{docType.label}</p>

        {previewUrl ? (
          <div className="relative h-20 w-full overflow-hidden rounded-xl border border-line bg-zinc-50">
            {String(existing?.mime_type ?? "").startsWith("image/") ? (
              <img
                alt={docType.label}
                className="h-full w-full object-contain"
                src={previewUrl}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted">
                <FileText size={24} />
              </div>
            )}
          </div>
        ) : (
          <div className="relative flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 text-xs text-muted">
            {uploading ? "Uploading..." : <Upload size={18} className="text-zinc-300" />}
            {!uploading && (
              <input
                accept="image/*,.pdf"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={handleFileChange}
                type="file"
              />
            )}
          </div>
        )}

        {error ? <p className="text-[10px] text-red-500">{error}</p> : null}

        <div className="flex gap-1.5 flex-wrap">
          {previewUrl ? (
            <>
              <label className="flex cursor-pointer items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted hover:border-accent hover:text-accent transition relative">
                <Upload size={10} />
                Replace
                <input accept="image/*,.pdf" className="absolute inset-0 h-full w-full opacity-0 cursor-pointer" onChange={handleFileChange} type="file" />
              </label>
              <button
                className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted hover:border-accent hover:text-accent transition"
                onClick={() => {
                  const url = previewUrl;
                  setPendingFile(null);
                  setCropSrc(url);
                }}
                type="button"
              >
                <Crop size={10} />
                Crop
              </button>
              <button
                className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted hover:border-black hover:text-black transition"
                onClick={() => setPrintSettingsOpen(true)}
                type="button"
              >
                <Printer size={10} />
                Print
              </button>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section accordion
// ──────────────────────────────────────────────────────────────────────────────

function SectionAccordion({
  section,
  folderId,
  documents,
  onUploaded,
}: {
  section: { label: string; value: string };
  folderId: string;
  documents: GenericRecord[];
  onUploaded: () => void;
}) {
  const [open, setOpen] = useState(section.value === "buyer");

  const sectionDocs = documents.filter((d) => String(d.section) === section.value);
  const uploadedCount = sectionDocs.length;

  return (
    <div className="rounded-2xl border border-line bg-white overflow-hidden">
      <button
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-zinc-50 transition"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ink">{section.label}</span>
          {uploadedCount > 0 && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
              {uploadedCount} uploaded
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
      </button>

      {open && (
        <div className="border-t border-line p-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {DOCUMENT_TYPES.map((docType) => (
              <DocumentCard
                key={docType.value}
                folderId={folderId}
                section={section.value}
                docType={docType}
                documents={documents}
                onUploaded={onUploaded}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main DocumentsWorkspace
// ──────────────────────────────────────────────────────────────────────────────

export function DocumentsWorkspace() {
  const [documents, setDocuments] = useState<GenericRecord[]>([]);
  const [folders, setFolders] = useState<GenericRecord[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [pdfPrintSettings, setPdfPrintSettings] = useState<PrintSettings>({
    printLayout: "a4",
    aadhaarLayout: "front-back",
    pageOrientation: "portrait",
    dpiQuality: "standard",
    colorMode: "color",
    exportType: "pdf",
  });
  const [pdfSettingsModal, setPdfSettingsModal] = useState<1 | 2 | null>(null);

  const selectedFolder = folders.find((f) => String(f.id) === selectedFolderId);
  const folderDocuments = documents.filter((d) => String(d.folder_id) === selectedFolderId);

  async function loadData() {
    setLoading(true);
    try {
      const [docsRes, foldersRes] = await Promise.all([
        fetch("/api/v1/documents?limit=500"),
        fetch("/api/v1/document-folders?limit=200"),
      ]);
      const docsPayload = await docsRes.json();
      const foldersPayload = await foldersRes.json();
      if (docsRes.ok) setDocuments(docsPayload.data ?? []);
      if (foldersRes.ok) setFolders(foldersPayload.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function handleUploaded() {
    void loadData();
  }

  function openPdf(type: 1 | 2) {
    if (!selectedFolderId) return;
    const url = `/api/v1/document-folders/${selectedFolderId}/pdf?type=${type}&layout=${pdfPrintSettings.printLayout}&aadhaar=${pdfPrintSettings.aadhaarLayout}&orientation=${pdfPrintSettings.pageOrientation}&dpi=${pdfPrintSettings.dpiQuality}&color=${pdfPrintSettings.colorMode}`;
    window.open(url, "_blank");
  }

  if (!documentModule) return null;

  return (
    <div className="space-y-4">
      {/* Folder CRUD */}
      <ResourceWorkspace module={documentModule} />

      {/* Active folder selector */}
      <Card>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Document Vault</p>
          <h3 className="mt-2 text-2xl font-semibold text-ink">Upload &amp; Manage Documents</h3>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Select a Dast folder to upload buyer, seller, witness, and identifier documents section by section. Each document type supports crop and direct print.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex-1 min-w-[200px]">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Select Dast Folder
            </span>
            <select
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              onChange={(e) => setSelectedFolderId(e.target.value)}
              value={selectedFolderId}
            >
              <option value="">-- Choose a folder --</option>
              {folders.map((folder) => (
                <option key={String(folder.id)} value={String(folder.id)}>
                  {String(folder.folder_code ?? `Folder ${folder.id}`)} — {String(folder.plot_number ?? "")} — {String(folder.buyer_name ?? "")}
                </option>
              ))}
            </select>
          </label>

          <button
            className="flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white hover:brightness-105"
            onClick={() => setIsVaultOpen(true)}
            type="button"
          >
            View All Files {!loading && `(${documents.length})`}
          </button>
        </div>

        {selectedFolder ? (
          <div className="mt-4 flex flex-wrap gap-3 rounded-2xl border border-line bg-zinc-50 p-4 text-sm">
            <span className="font-semibold text-ink">{String(selectedFolder.folder_code ?? "")}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">Plot: <span className="text-ink">{String(selectedFolder.plot_number ?? "—")}</span></span>
            <span className="text-muted">·</span>
            <span className="text-muted">Buyer: <span className="text-ink">{String(selectedFolder.buyer_name ?? "—")}</span></span>
            {selectedFolder.seller_name ? (
              <>
                <span className="text-muted">·</span>
                <span className="text-muted">Seller: <span className="text-ink">{String(selectedFolder.seller_name)}</span></span>
              </>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* Section accordions */}
      {selectedFolderId ? (
        <div className="space-y-3">
          {SECTIONS.map((section) => (
            <SectionAccordion
              key={section.value}
              section={section}
              folderId={selectedFolderId}
              documents={folderDocuments}
              onUploaded={handleUploaded}
            />
          ))}

          {/* PDF Generation */}
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">PDF Generation</p>
            <h3 className="mt-2 text-xl font-semibold text-ink">Generate &amp; Print Document Packs</h3>
            <p className="mt-2 text-sm text-muted">
              Generate print-ready PDF packs for two workflows from the uploaded documents.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-line p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink">PDF Type 1</p>
                <p className="mt-1.5 text-sm text-muted">
                  Buyer Aadhaar (Front + Back), PAN Card + Seller Aadhaar (Front + Back), PAN Card
                </p>
                <button
                  className="mt-4 flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.24em] text-white hover:brightness-105"
                  onClick={() => setPdfSettingsModal(1)}
                  type="button"
                >
                  <FileText size={13} />
                  Generate PDF 1
                </button>
              </div>

              <div className="rounded-2xl border border-line p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink">PDF Type 2</p>
                <p className="mt-1.5 text-sm text-muted">
                  2 × Witness Aadhaar (Front + Back), PAN + 2 × Identifier Aadhaar (Front + Back), PAN
                </p>
                <button
                  className="mt-4 flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.24em] text-white hover:brightness-105"
                  onClick={() => setPdfSettingsModal(2)}
                  type="button"
                >
                  <FileText size={13} />
                  Generate PDF 2
                </button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {/* PDF settings modals */}
      {pdfSettingsModal !== null ? (
        <PrintSettingsModal
          settings={pdfPrintSettings}
          onChange={setPdfPrintSettings}
          onPrint={() => { setPdfSettingsModal(null); openPdf(pdfSettingsModal!); }}
          onClose={() => setPdfSettingsModal(null)}
          title={`PDF Type ${pdfSettingsModal} — Print Settings`}
        />
      ) : null}

      {/* Vault modal */}
      {isVaultOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-line bg-app/50 p-6 backdrop-blur-md">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">All uploaded files</p>
                <h3 className="mt-1 text-2xl font-semibold text-ink">
                  {loading ? "Loading vault..." : `${documents.length} documents`}
                </h3>
              </div>
              <button
                className="rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white hover:bg-zinc-800"
                onClick={() => setIsVaultOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-white/80 p-6 pb-12">
              <DataTable
                columns={[
                  { key: "folder_code", label: "Dast No." },
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
      ) : null}
    </div>
  );
}
