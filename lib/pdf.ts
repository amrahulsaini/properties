import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";
import { defaultBranding } from "@/lib/brand";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getEnv } from "@/lib/env";

interface PdfPayload {
  title: string;
  partyName: string;
  partyPhone?: string | null;
  partyEmail?: string | null;
  village: string;
  surveyNumber: string;
  area: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMode: string;
  eventAt: string;
  memoNumber?: string | null;
  gstNumber?: string | null;
  conditions?: string | null;
  partyPhotoUrl?: string | null;
  customerSignatureUrl?: string | null;
  companySignatureUrl?: string | null;
}

const ACCENT_COLOR = rgb(0.95, 0.42, 0.11); // Orange accent
const PRIMARY_TEXT = rgb(0.07, 0.07, 0.07); // Dark gray
const SECONDARY_TEXT = rgb(0.35, 0.32, 0.28); // Medium gray
const BORDER_COLOR = rgb(0.85, 0.85, 0.85); // Light gray border
const HEADER_BG = rgb(0.98, 0.95, 0.90); // Warm light background
const GRID_BG = rgb(0.99, 0.99, 0.99); // Very light background for grids

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_LEFT = 35;
const MARGIN_RIGHT = 35;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const COL_WIDTH = (CONTENT_WIDTH - 10) / 2; // Two columns with gap

const DEVELOPER_TERMS = [
  "Plot will be confirmed only after full payment.",
  "Developer can cancel agreement if payment is not completed.",
  "Advance amount is non-refundable unless specified.",
  "Developer has rights to modify project if required.",
];

const BUYER_TERMS = [
  "Buyer must complete payment on time.",
  "All taxes and charges are payable by Buyer.",
  "Delay due to government or natural reasons is not Developer's responsibility.",
];

function getAbsoluteImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const env = getEnv();
  return `${env.APP_URL}${url}`;
}

function extractUploadFilename(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/(?:api\/v1\/)?uploads\/([^/?#]+)/i);
    if (!match?.[1]) {
      return null;
    }

    const filename = decodeURIComponent(match[1]);
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return null;
    }

    return filename;
  } catch {
    return null;
  }
}

function contentTypeFromFilename(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

async function loadImageBytes(url: string | null | undefined) {
  const absoluteUrl = getAbsoluteImageUrl(url);
  if (!absoluteUrl) {
    return null;
  }

  const uploadFilename = extractUploadFilename(absoluteUrl);
  if (uploadFilename) {
    try {
      const localPath = path.join(process.cwd(), "public", "uploads", uploadFilename);
      const fileBuffer = await readFile(localPath);
      return {
        bytes: fileBuffer,
        contentType: contentTypeFromFilename(uploadFilename),
      };
    } catch {
      // Fall back to HTTP fetch below.
    }
  }

  try {
    const response = await fetch(absoluteUrl);
    if (!response.ok) {
      return null;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "";
    return { bytes, contentType };
  } catch {
    return null;
  }
}

async function drawSection(
  page: any,
  x: number,
  y: number,
  width: number,
  height: number,
  bgColor: any = null,
  borderColor: any = BORDER_COLOR,
) {
  if (bgColor) {
    page.drawRectangle({
      x,
      y: y - height,
      width,
      height,
      color: bgColor,
    });
  }
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    borderColor,
    borderWidth: 1,
  });
}

function wrapTextLines(text: string, font: any, size: number, maxWidth: number) {
  const paragraphs = String(text ?? "").split(/\r?\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }

    let currentLine = words[0];
    for (const word of words.slice(1)) {
      const candidate = `${currentLine} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    lines.push(currentLine);
  }

  return lines.length ? lines : [""];
}

function drawWrappedText(
  page: any,
  text: string,
  x: number,
  y: number,
  font: any,
  size: number,
  color: any,
  maxWidth: number,
  lineHeight: number,
) {
  const lines = wrapTextLines(text, font, size, maxWidth);

  lines.forEach((line, index) => {
    page.drawText(line || " ", {
      x,
      y: y - index * lineHeight,
      size,
      font,
      color,
      maxWidth,
    });
  });

  return lines.length * lineHeight;
}

function drawTextSection(
  page: any,
  title: string,
  text: string,
  y: number,
  font: any,
  regular: any,
) {
  const textSize = 10;
  const lineHeight = 13;
  const boxPadding = 10;
  const contentWidth = CONTENT_WIDTH - boxPadding * 2;
  const measuredLines = wrapTextLines(text, regular, textSize, contentWidth);
  const boxHeight = 18 + boxPadding + measuredLines.length * lineHeight + boxPadding;

  page.drawText(title, {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font,
    color: PRIMARY_TEXT,
  });

  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 18 - boxHeight,
    width: CONTENT_WIDTH,
    height: boxHeight,
    color: GRID_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  drawWrappedText(
    page,
    text,
    MARGIN_LEFT + boxPadding,
    y - 18 - boxPadding,
    regular,
    textSize,
    PRIMARY_TEXT,
    contentWidth,
    lineHeight,
  );

  return y - 18 - boxHeight - 20;
}

function drawTermsSection(
  page: any,
  title: string,
  items: string[],
  y: number,
  font: any,
  regular: any,
) {
  const titleSize = 11;
  const bulletSize = 9.5;
  const lineHeight = 12;
  const boxPadding = 10;
  const innerWidth = CONTENT_WIDTH - boxPadding * 2;
  const itemHeights = items.map((item) => {
    const wrapped = wrapTextLines(`- ${item}`, regular, bulletSize, innerWidth);
    return wrapped.length * lineHeight;
  });
  const boxHeight = 18 + boxPadding + itemHeights.reduce((sum, height) => sum + height + 3, 0) + boxPadding - 3;

  page.drawText(title, {
    x: MARGIN_LEFT,
    y,
    size: titleSize,
    font,
    color: PRIMARY_TEXT,
  });

  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 18 - boxHeight,
    width: CONTENT_WIDTH,
    height: boxHeight,
    color: GRID_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  let currentY = y - 18 - boxPadding;
  items.forEach((item, index) => {
    drawWrappedText(
      page,
      `- ${item}`,
      MARGIN_LEFT + boxPadding,
      currentY,
      regular,
      bulletSize,
      PRIMARY_TEXT,
      innerWidth,
      lineHeight,
    );
    currentY -= itemHeights[index] + 3;
  });

  return y - 18 - boxHeight - 20;
}

async function createBaseDocument(payload: PdfPayload) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  
  let y = PAGE_HEIGHT - 35;

  // ====== HEADER SECTION ======
  const headerHeight = 70;
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - headerHeight,
    width: CONTENT_WIDTH,
    height: headerHeight,
    color: HEADER_BG,
    borderColor: ACCENT_COLOR,
    borderWidth: 2,
  });

  // Company name in header
  page.drawText(defaultBranding.companyName, {
    x: MARGIN_LEFT + 15,
    y: y - 22,
    size: 22,
    font: bold,
    color: ACCENT_COLOR,
  });

  // GSTIN and location
  page.drawText(`GSTIN: ${defaultBranding.gstin}`, {
    x: MARGIN_LEFT + 15,
    y: y - 42,
    size: 9,
    font: regular,
    color: SECONDARY_TEXT,
  });

  page.drawText(defaultBranding.location, {
    x: MARGIN_LEFT + 15,
    y: y - 55,
    size: 9,
    font: regular,
    color: SECONDARY_TEXT,
  });

  y -= headerHeight + 20;

  // ====== TITLE SECTION ======
  page.drawText(payload.title.toUpperCase(), {
    x: MARGIN_LEFT,
    y,
    size: 18,
    font: bold,
    color: ACCENT_COLOR,
  });

  // Horizontal line under title
  page.drawLine({
    start: { x: MARGIN_LEFT, y: y - 8 },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: y - 8 },
    thickness: 2,
    color: ACCENT_COLOR,
  });

  y -= 35;

  // ====== PARTY INFORMATION SECTION ======
  page.drawText("PARTY INFORMATION", {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font: bold,
    color: PRIMARY_TEXT,
  });
  y -= 18;

  // Section border
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 65,
    width: CONTENT_WIDTH,
    height: 65,
    color: GRID_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  // Left column - Party Name
  page.drawText("PARTY NAME", {
    x: MARGIN_LEFT + 10,
    y: y - 10,
    size: 8,
    font: bold,
    color: SECONDARY_TEXT,
  });
  page.drawText(payload.partyName || "—", {
    x: MARGIN_LEFT + 10,
    y: y - 28,
    size: 12,
    font: bold,
    color: PRIMARY_TEXT,
  });

  // Right column - Phone
  page.drawText("PHONE", {
    x: MARGIN_LEFT + COL_WIDTH + 15,
    y: y - 10,
    size: 8,
    font: bold,
    color: SECONDARY_TEXT,
  });
  page.drawText(payload.partyPhone || "—", {
    x: MARGIN_LEFT + COL_WIDTH + 15,
    y: y - 28,
    size: 12,
    font: bold,
    color: PRIMARY_TEXT,
  });

  // Email (spans full width below)
  page.drawText("EMAIL", {
    x: MARGIN_LEFT + 10,
    y: y - 42,
    size: 8,
    font: bold,
    color: SECONDARY_TEXT,
  });
  page.drawText(payload.partyEmail || "—", {
    x: MARGIN_LEFT + 10,
    y: y - 60,
    size: 11,
    font: regular,
    color: PRIMARY_TEXT,
  });

  y -= 85;

  // ====== PROPERTY DETAILS SECTION ======
  page.drawText("PROPERTY DETAILS", {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font: bold,
    color: PRIMARY_TEXT,
  });
  y -= 18;

  // Two-column grid for property details
  const gridHeight = 75;
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - gridHeight,
    width: CONTENT_WIDTH,
    height: gridHeight,
    color: GRID_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  // Left column - Village
  page.drawText("VILLAGE", {
    x: MARGIN_LEFT + 10,
    y: y - 10,
    size: 8,
    font: bold,
    color: SECONDARY_TEXT,
  });
  page.drawText(payload.village, {
    x: MARGIN_LEFT + 10,
    y: y - 28,
    size: 12,
    font: bold,
    color: PRIMARY_TEXT,
  });

  // Right column - Survey Number
  page.drawText("SURVEY NUMBER", {
    x: MARGIN_LEFT + COL_WIDTH + 15,
    y: y - 10,
    size: 8,
    font: bold,
    color: SECONDARY_TEXT,
  });
  page.drawText(payload.surveyNumber, {
    x: MARGIN_LEFT + COL_WIDTH + 15,
    y: y - 28,
    size: 12,
    font: bold,
    color: PRIMARY_TEXT,
  });

  // Area (second row left)
  page.drawText("AREA", {
    x: MARGIN_LEFT + 10,
    y: y - 42,
    size: 8,
    font: bold,
    color: SECONDARY_TEXT,
  });
  page.drawText(payload.area, {
    x: MARGIN_LEFT + 10,
    y: y - 60,
    size: 12,
    font: bold,
    color: PRIMARY_TEXT,
  });

  y -= gridHeight + 20;

  // ====== FINANCIAL DETAILS SECTION ======
  page.drawText("FINANCIAL DETAILS", {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font: bold,
    color: PRIMARY_TEXT,
  });
  y -= 18;

  const finHeight = 85;
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - finHeight,
    width: CONTENT_WIDTH,
    height: finHeight,
    color: GRID_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  // Left column - Total Amount
  page.drawText("TOTAL AMOUNT", {
    x: MARGIN_LEFT + 10,
    y: y - 10,
    size: 8,
    font: bold,
    color: SECONDARY_TEXT,
  });
  page.drawText(formatCurrency(payload.totalAmount, true), {
    x: MARGIN_LEFT + 10,
    y: y - 28,
    size: 13,
    font: bold,
    color: ACCENT_COLOR,
  });

  // Right column - Paid Amount
  page.drawText("PAID AMOUNT", {
    x: MARGIN_LEFT + COL_WIDTH + 15,
    y: y - 10,
    size: 8,
    font: bold,
    color: SECONDARY_TEXT,
  });
  page.drawText(formatCurrency(payload.paidAmount, true), {
    x: MARGIN_LEFT + COL_WIDTH + 15,
    y: y - 28,
    size: 13,
    font: bold,
    color: rgb(0.0, 0.6, 0.0), // Green for paid
  });

  // Remaining Amount (second row left)
  page.drawText("REMAINING AMOUNT", {
    x: MARGIN_LEFT + 10,
    y: y - 42,
    size: 8,
    font: bold,
    color: SECONDARY_TEXT,
  });
  page.drawText(formatCurrency(payload.remainingAmount, true), {
    x: MARGIN_LEFT + 10,
    y: y - 60,
    size: 13,
    font: bold,
    color: payload.remainingAmount > 0 ? rgb(0.8, 0.0, 0.0) : rgb(0.0, 0.6, 0.0),
  });

  y -= finHeight + 20;

  // ====== TRANSACTION DETAILS SECTION ======
  page.drawText("TRANSACTION DETAILS", {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font: bold,
    color: PRIMARY_TEXT,
  });
  y -= 18;

  const transHeight = 75;
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - transHeight,
    width: CONTENT_WIDTH,
    height: transHeight,
    color: GRID_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  // Left column - Payment Mode
  page.drawText("PAYMENT MODE", {
    x: MARGIN_LEFT + 10,
    y: y - 10,
    size: 8,
    font: bold,
    color: SECONDARY_TEXT,
  });
  page.drawText(payload.paymentMode, {
    x: MARGIN_LEFT + 10,
    y: y - 28,
    size: 12,
    font: bold,
    color: PRIMARY_TEXT,
  });

  // Right column - Date & Time
  page.drawText("DATE & TIME", {
    x: MARGIN_LEFT + COL_WIDTH + 15,
    y: y - 10,
    size: 8,
    font: bold,
    color: SECONDARY_TEXT,
  });
  page.drawText(formatDateTime(payload.eventAt), {
    x: MARGIN_LEFT + COL_WIDTH + 15,
    y: y - 28,
    size: 11,
    font: regular,
    color: PRIMARY_TEXT,
  });

  // Memo Number (second row left)
  page.drawText("MEMO NUMBER", {
    x: MARGIN_LEFT + 10,
    y: y - 42,
    size: 8,
    font: bold,
    color: SECONDARY_TEXT,
  });
  page.drawText(payload.memoNumber || "—", {
    x: MARGIN_LEFT + 10,
    y: y - 60,
    size: 12,
    font: bold,
    color: PRIMARY_TEXT,
  });

  // GST Number (second row right)
  page.drawText("GST NUMBER", {
    x: MARGIN_LEFT + COL_WIDTH + 15,
    y: y - 42,
    size: 8,
    font: bold,
    color: SECONDARY_TEXT,
  });
  page.drawText(payload.gstNumber || defaultBranding.gstin, {
    x: MARGIN_LEFT + COL_WIDTH + 15,
    y: y - 60,
    size: 11,
    font: regular,
    color: PRIMARY_TEXT,
  });

  y -= transHeight + 20;

  // ====== CONDITIONS SECTION (if present) ======
  if (payload.conditions) {
    y = drawTextSection(page, "ADDITIONAL CONDITIONS", payload.conditions, y, bold, regular);
  }

  y = drawTermsSection(page, "DEVELOPER TERMS", DEVELOPER_TERMS, y, bold, regular);
  y = drawTermsSection(page, "TERMS & CONDITIONS", BUYER_TERMS, y, bold, regular);

  // ====== PARTY PHOTO (top-right if available) ======
  if (payload.partyPhotoUrl) {
    try {
      const image = await loadImageBytes(payload.partyPhotoUrl);
      if (image) {
        let img: any = null;
        if (
          image.contentType.includes("png") ||
          String(payload.partyPhotoUrl).toLowerCase().endsWith(".png")
        ) {
          img = await pdf.embedPng(image.bytes);
        } else {
          img = await pdf.embedJpg(image.bytes);
        }

        const photoSize = 65;
        page.drawRectangle({
          x: PAGE_WIDTH - MARGIN_RIGHT - photoSize - 1,
          y: PAGE_HEIGHT - 35 - 70 - 1,
          width: photoSize,
          height: photoSize,
          borderColor: ACCENT_COLOR,
          borderWidth: 1.5,
        });

        page.drawImage(img, {
          x: PAGE_WIDTH - MARGIN_RIGHT - photoSize,
          y: PAGE_HEIGHT - 35 - 70,
          width: photoSize,
          height: photoSize,
        });
      }
    } catch {
      // ignore image embedding errors
    }
  }

  // ====== SIGNATURE SECTION ======
  const sigY = 110;
  const sigBoxHeight = 70;
  const sigBoxWidth = (CONTENT_WIDTH - 15) / 2;

  // Section label
  page.drawText("AUTHORIZED SIGNATURES", {
    x: MARGIN_LEFT,
    y: sigY + 20,
    size: 11,
    font: bold,
    color: PRIMARY_TEXT,
  });

  // Customer signature box
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: sigY - sigBoxHeight,
    width: sigBoxWidth,
    height: sigBoxHeight,
    color: GRID_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  page.drawLine({
    start: { x: MARGIN_LEFT + 10, y: sigY - 50 },
    end: { x: MARGIN_LEFT + sigBoxWidth - 10, y: sigY - 50 },
    thickness: 1,
    color: BORDER_COLOR,
  });

  page.drawText("Customer / Owner", {
    x: MARGIN_LEFT + 10,
    y: sigY - 60,
    size: 9,
    font: regular,
    color: SECONDARY_TEXT,
  });

  // Company signature box
  page.drawRectangle({
    x: MARGIN_LEFT + sigBoxWidth + 15,
    y: sigY - sigBoxHeight,
    width: sigBoxWidth,
    height: sigBoxHeight,
    color: GRID_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });

  page.drawLine({
    start: { x: MARGIN_LEFT + sigBoxWidth + 15 + 10, y: sigY - 50 },
    end: { x: MARGIN_LEFT + sigBoxWidth + 15 + sigBoxWidth - 10, y: sigY - 50 },
    thickness: 1,
    color: BORDER_COLOR,
  });

  page.drawText("Company Authorized", {
    x: MARGIN_LEFT + sigBoxWidth + 15 + 10,
    y: sigY - 60,
    size: 9,
    font: regular,
    color: SECONDARY_TEXT,
  });

  // Embed signatures if available
  if (payload.customerSignatureUrl) {
    try {
      const image = await loadImageBytes(payload.customerSignatureUrl);
      if (image) {
        let sigImg: any = null;
        if (
          image.contentType.includes("png") ||
          String(payload.customerSignatureUrl).toLowerCase().endsWith(".png")
        ) {
          sigImg = await pdf.embedPng(image.bytes);
        } else {
          sigImg = await pdf.embedJpg(image.bytes);
        }

        page.drawImage(sigImg, {
          x: MARGIN_LEFT + 10,
          y: sigY - 48,
          width: sigBoxWidth - 20,
          height: 40,
        });
      }
    } catch {
      // ignore signature embedding errors
    }
  }

  if (payload.companySignatureUrl) {
    try {
      const image = await loadImageBytes(payload.companySignatureUrl);
      if (image) {
        let sigImg: any = null;
        if (
          image.contentType.includes("png") ||
          String(payload.companySignatureUrl).toLowerCase().endsWith(".png")
        ) {
          sigImg = await pdf.embedPng(image.bytes);
        } else {
          sigImg = await pdf.embedJpg(image.bytes);
        }

        page.drawImage(sigImg, {
          x: MARGIN_LEFT + sigBoxWidth + 15 + 10,
          y: sigY - 48,
          width: sigBoxWidth - 20,
          height: 40,
        });
      }
    } catch {
      // ignore signature embedding errors
    }
  }

  // Footer with date generated
  const today = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  page.drawText(`Generated on: ${today}`, {
    x: MARGIN_LEFT,
    y: 20,
    size: 8,
    font: regular,
    color: SECONDARY_TEXT,
  });

  return pdf;
}

export async function createAdvanceBookingPdf(payload: PdfPayload) {
  const pdf = await createBaseDocument({
    ...payload,
    title: "Advance Payment Booking",
  });

  return pdf.save();
}

export async function createAdvanceAgreementPdf(payload: PdfPayload) {
  const pdf = await createBaseDocument({
    ...payload,
    title: "Advance Agreement Memo",
  });

  return pdf.save();

}
