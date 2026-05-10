import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { GenericRecord } from "@/lib/types";

const BORDER = rgb(0.86, 0.86, 0.86);
const TEXT = rgb(0.1, 0.1, 0.1);
const MUTED = rgb(0.42, 0.42, 0.42);
const ACCENT = rgb(0.95, 0.42, 0.11);
const SOFT = rgb(0.98, 0.97, 0.95);

function getPageSize(layout: unknown, orientation: unknown) {
  let width = 595;
  let height = 842;
  const normalized = String(layout ?? "a4").toLowerCase();

  if (normalized === "legal") {
    width = 612;
    height = 1008;
  } else if (normalized === "half-page") {
    width = 420;
    height = 595;
  } else if (normalized === "full-page") {
    width = 842;
    height = 1191;
  }

  if (String(orientation ?? "portrait").toLowerCase() === "landscape") {
    return { width: height, height: width };
  }

  return { width, height };
}

function normalizeUploadFilename(value: string) {
  const match = value.match(/\/(?:api\/v1\/)?uploads\/([^/?#]+)/i);
  if (!match?.[1]) {
    return null;
  }

  const filename = decodeURIComponent(match[1]);
  return /^[a-zA-Z0-9._-]+$/.test(filename) ? filename : null;
}

async function loadPublicImage(url: unknown) {
  const raw = String(url ?? "").trim();
  if (!raw) {
    return null;
  }

  const localUpload = normalizeUploadFilename(raw);
  if (localUpload) {
    const localPath = path.join(process.cwd(), "public", "uploads", localUpload);
    return readFile(localPath).catch(() => null);
  }

  try {
    const response = await fetch(raw);
    if (!response.ok) {
      return null;
    }

    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function embedImage(
  pdf: PDFDocument,
  bytes: Uint8Array | Buffer,
  fileName = "",
  mimeType = "",
) {
  const lower = fileName.toLowerCase();
  const mime = mimeType.toLowerCase();
  const isPng =
    mime === "image/png" ||
    (!mime && lower.endsWith(".png"));
  return isPng ? pdf.embedPng(bytes) : pdf.embedJpg(bytes);
}

function drawLabelValue(
  page: PDFPage,
  bold: PDFFont,
  regular: PDFFont,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
) {
  page.drawText(label.toUpperCase(), {
    x,
    y,
    size: 8,
    font: bold,
    color: MUTED,
  });

  page.drawText(value || "-", {
    x,
    y: y - 16,
    size: 11,
    font: regular,
    color: TEXT,
    maxWidth: width,
  });
}

function resolveEquipmentNumber(record: GenericRecord) {
  return String(
    record.jcb_number ?? record.tractor_number ?? record.damper_number ?? "",
  ).trim();
}

export async function createDevelopmentEntryPdf(record: GenericRecord) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);

  const margin = 36;
  const width = page.getWidth() - margin * 2;
  const half = (width - 18) / 2;
  const category = String(record.category ?? "").toUpperCase();
  const workMode = String(record.rent_type ?? record.amount_mode ?? "").replace(/_/g, " ");
  const note = String(record.work_description ?? record.description ?? record.notes ?? "").trim();

  let y = 806;

  page.drawRectangle({
    x: margin,
    y: y - 72,
    width,
    height: 72,
    color: SOFT,
    borderColor: ACCENT,
    borderWidth: 2,
  });
  page.drawText("Development Work Slip", {
    x: margin + 16,
    y: y - 26,
    size: 22,
    font: bold,
    color: ACCENT,
  });
  page.drawText(String(record.site_name ?? "Site"), {
    x: margin + 16,
    y: y - 50,
    size: 11,
    font: regular,
    color: TEXT,
  });

  y -= 100;

  page.drawText("WORK SUMMARY", {
    x: margin,
    y,
    size: 11,
    font: bold,
    color: TEXT,
  });
  y -= 18;

  page.drawRectangle({
    x: margin,
    y: y - 160,
    width,
    height: 160,
    borderColor: BORDER,
    borderWidth: 1,
  });

  drawLabelValue(page, bold, regular, "Category", category, margin + 12, y - 12, half);
  drawLabelValue(page, bold, regular, "Work Date", formatDate(record.entry_date), margin + half + 18, y - 12, half);
  drawLabelValue(page, bold, regular, "Machine / Vehicle", resolveEquipmentNumber(record), margin + 12, y - 54, half);
  drawLabelValue(page, bold, regular, "Owner", String(record.owner_name ?? ""), margin + half + 18, y - 54, half);
  drawLabelValue(page, bold, regular, "Driver", String(record.driver_name ?? ""), margin + 12, y - 96, half);
  drawLabelValue(page, bold, regular, "Mobile", String(record.mobile_number ?? ""), margin + half + 18, y - 96, half);
  drawLabelValue(page, bold, regular, "Mode", workMode, margin + 12, y - 138, half);
  drawLabelValue(page, bold, regular, "Work Type", String(record.work_type ?? ""), margin + half + 18, y - 138, half);

  y -= 190;

  page.drawText("AMOUNT DETAILS", {
    x: margin,
    y,
    size: 11,
    font: bold,
    color: TEXT,
  });
  y -= 18;

  page.drawRectangle({
    x: margin,
    y: y - 142,
    width,
    height: 142,
    borderColor: BORDER,
    borderWidth: 1,
  });

  drawLabelValue(page, bold, regular, "Total Hours", formatNumber(record.total_hours), margin + 12, y - 12, half);
  drawLabelValue(page, bold, regular, "Total Days", formatNumber(record.total_days), margin + half + 18, y - 12, half);
  drawLabelValue(page, bold, regular, "Total Trips", formatNumber(record.total_trips), margin + 12, y - 54, half);
  drawLabelValue(page, bold, regular, "Advance Diesel", formatNumber(record.advance_diesel), margin + half + 18, y - 54, half);
  drawLabelValue(page, bold, regular, "Total Amount", formatCurrency(record.amount, true), margin + 12, y - 96, half);
  drawLabelValue(page, bold, regular, "Advance Paid", formatCurrency(record.advance_paid, true), margin + half + 18, y - 96, half);
  drawLabelValue(page, bold, regular, "Remaining", formatCurrency(record.remaining_amount, true), margin + 12, y - 138, half);
  drawLabelValue(page, bold, regular, "Payment Status", String(record.payment_status ?? ""), margin + half + 18, y - 138, half);

  y -= 170;

  page.drawText("WORK DETAILS", {
    x: margin,
    y,
    size: 11,
    font: bold,
    color: TEXT,
  });
  y -= 18;

  page.drawRectangle({
    x: margin,
    y: y - 110,
    width,
    height: 110,
    borderColor: BORDER,
    borderWidth: 1,
  });

  drawLabelValue(page, bold, regular, "Work Location", String(record.work_location ?? ""), margin + 12, y - 12, width - 24);
  drawLabelValue(page, bold, regular, "GPS Location", String(record.gps_location ?? ""), margin + 12, y - 52, width - 24);
  drawLabelValue(page, bold, regular, "Notes", note, margin + 12, y - 92, width - 24);

  const imageEntries = [
    { label: "Working", url: record.working_photo_url },
    { label: "Before", url: record.before_photo_url },
    { label: "After", url: record.after_photo_url },
    { label: "Signature", url: record.signature_url },
  ];

  const images = [];
  for (const entry of imageEntries) {
    const bytes = await loadPublicImage(entry.url);
    if (bytes) {
      images.push({ ...entry, bytes });
    }
  }

  if (images.length) {
    const photoPage = pdf.addPage([595, 842]);
    photoPage.drawText("WORK PHOTOS", {
      x: margin,
      y: 800,
      size: 18,
      font: bold,
      color: ACCENT,
    });

    const boxWidth = 245;
    const boxHeight = 250;

    for (const [index, image] of images.entries()) {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + column * (boxWidth + 18);
      const top = 760 - row * (boxHeight + 22);
      const embedded = await embedImage(pdf, image.bytes, String(image.url ?? ""));
      const scale = Math.min(boxWidth / embedded.width, (boxHeight - 28) / embedded.height);
      const widthScaled = embedded.width * scale;
      const heightScaled = embedded.height * scale;

      photoPage.drawRectangle({
        x,
        y: top - boxHeight,
        width: boxWidth,
        height: boxHeight,
        borderColor: BORDER,
        borderWidth: 1,
      });
      photoPage.drawText(image.label, {
        x: x + 10,
        y: top - 18,
        size: 10,
        font: bold,
        color: TEXT,
      });
      photoPage.drawImage(embedded, {
        x: x + (boxWidth - widthScaled) / 2,
        y: top - boxHeight + 12 + (boxHeight - 40 - heightScaled) / 2,
        width: widthScaled,
        height: heightScaled,
      });
    }
  }

  return pdf.save();
}

function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }

  return groups;
}

async function appendImageGroups(
  pdf: PDFDocument,
  images: GenericRecord[],
  layout: unknown,
  orientation: unknown,
  gridCount: number,
) {
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const { width, height } = getPageSize(layout, orientation);
  const margin = 28;
  const usableWidth = width - margin * 2;
  const usableHeight = height - margin * 2 - 28;
  const columns = gridCount === 4 ? 2 : 1;
  const rows = gridCount === 4 ? 2 : gridCount;
  const boxWidth = (usableWidth - (columns - 1) * 14) / columns;
  const boxHeight = (usableHeight - (rows - 1) * 14) / rows;

  for (const group of chunk(images, gridCount)) {
    const page = pdf.addPage([width, height]);
    page.drawText("Document Attachments", {
      x: margin,
      y: height - margin,
      size: 16,
      font: bold,
      color: ACCENT,
    });

    for (const [index, record] of group.entries()) {
      let fileBuffer: Buffer | null = null;
      try {
        fileBuffer = await readFile(String(record.file_path));
      } catch {
        continue;
      }

      let embedded;
      try {
        embedded = await embedImage(
          pdf,
          fileBuffer,
          String(record.file_name ?? ""),
          String(record.mime_type ?? ""),
        );
      } catch {
        continue;
      }

      const column = columns === 1 ? 0 : index % columns;
      const row = columns === 1 ? index : Math.floor(index / columns);
      const x = margin + column * (boxWidth + 14);
      const top = height - margin - 24 - row * (boxHeight + 14);
      const scale = Math.min(boxWidth / embedded.width, (boxHeight - 26) / embedded.height);
      const scaledWidth = embedded.width * scale;
      const scaledHeight = embedded.height * scale;

      page.drawRectangle({
        x,
        y: top - boxHeight,
        width: boxWidth,
        height: boxHeight,
        borderColor: BORDER,
        borderWidth: 1,
      });
      page.drawText(String(record.title ?? record.file_name ?? "Attachment"), {
        x: x + 8,
        y: top - 16,
        size: 9,
        font: regular,
        color: TEXT,
        maxWidth: boxWidth - 16,
      });
      page.drawImage(embedded, {
        x: x + (boxWidth - scaledWidth) / 2,
        y: top - boxHeight + 10 + (boxHeight - 34 - scaledHeight) / 2,
        width: scaledWidth,
        height: scaledHeight,
      });
    }
  }
}

export async function createDocumentFolderPackPdf(
  folder: GenericRecord,
  documents: GenericRecord[],
) {
  const pdf = await PDFDocument.create();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const { width, height } = getPageSize(folder.print_layout, folder.page_orientation);
  const page = pdf.addPage([width, height]);
  const margin = 34;
  const contentWidth = width - margin * 2;

  let y = height - margin;

  page.drawRectangle({
    x: margin,
    y: y - 76,
    width: contentWidth,
    height: 76,
    color: SOFT,
    borderColor: ACCENT,
    borderWidth: 2,
  });
  page.drawText("Dast Document Pack", {
    x: margin + 16,
    y: y - 28,
    size: 22,
    font: bold,
    color: ACCENT,
  });
  page.drawText(String(folder.folder_code ?? folder.folder_label ?? "Vault Folder"), {
    x: margin + 16,
    y: y - 52,
    size: 11,
    font: regular,
    color: TEXT,
  });

  y -= 104;

  const details: Array<[string, string]> = [
    ["Plot Number", String(folder.plot_number ?? "")],
    ["Project", String(folder.project_name ?? folder.project_id ?? "")],
    ["Buyer", String(folder.buyer_name ?? folder.client_name ?? "")],
    ["Buyer Mobile", String(folder.buyer_mobile_number ?? "")],
    ["Seller", String(folder.seller_name ?? "")],
    ["Seller Mobile", String(folder.seller_mobile_number ?? "")],
    ["Witness 1", String(folder.witness_1_name ?? "")],
    ["Witness 2", String(folder.witness_2_name ?? "")],
    ["Identifier", String(folder.identifier_name ?? "")],
    ["Identifier Mobile", String(folder.identifier_mobile_number ?? "")],
    ["Print Layout", String(folder.print_layout ?? "a4")],
    ["Aadhaar Layout", String(folder.aadhaar_layout ?? "single-page")],
  ];

  page.drawText("FOLDER DETAILS", {
    x: margin,
    y,
    size: 12,
    font: bold,
    color: TEXT,
  });
  y -= 18;

  page.drawRectangle({
    x: margin,
    y: y - 230,
    width: contentWidth,
    height: 230,
    borderColor: BORDER,
    borderWidth: 1,
  });

  const leftWidth = (contentWidth - 24) / 2;
  details.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    drawLabelValue(
      page,
      bold,
      regular,
      label,
      value,
      margin + 12 + column * (leftWidth + 12),
      y - 14 - row * 36,
      leftWidth - 8,
    );
  });

  const note = String(folder.notes ?? "").trim();
  if (note) {
    page.drawText("NOTES", {
      x: margin,
      y: y - 252,
      size: 11,
      font: bold,
      color: TEXT,
    });
    page.drawText(note, {
      x: margin,
      y: y - 270,
      size: 10,
      font: regular,
      color: TEXT,
      maxWidth: contentWidth,
      lineHeight: 14,
    });
  }

  const imageDocs = documents.filter((record) =>
    String(record.mime_type ?? "").startsWith("image/"),
  );
  const pdfDocs = documents.filter((record) =>
    String(record.mime_type ?? "").toLowerCase().includes("pdf"),
  );

  const layoutMode = String(folder.aadhaar_layout ?? "single-page").toLowerCase();
  const gridCount = layoutMode === "four-grid" ? 4 : layoutMode === "single-page" ? 1 : 2;

  if (imageDocs.length) {
    await appendImageGroups(pdf, imageDocs, folder.print_layout, folder.page_orientation, gridCount);
  }

  for (const record of pdfDocs) {
    try {
      const fileBuffer = await readFile(String(record.file_path));
      const source = await PDFDocument.load(fileBuffer);
      const pages = await pdf.copyPages(source, source.getPageIndices());
      pages.forEach((copiedPage) => pdf.addPage(copiedPage));
    } catch {
      // skip missing or corrupt PDF attachments
    }
  }

  return pdf.save();
}
