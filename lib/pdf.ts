import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { defaultBranding } from "@/lib/brand";
import { formatCurrency, formatDateTime } from "@/lib/format";

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
}

async function createBaseDocument(payload: PdfPayload) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const accent = rgb(0.95, 0.42, 0.11);
  let y = 790;

  page.drawRectangle({
    x: 28,
    y: 755,
    width: 539,
    height: 58,
    color: rgb(1, 0.97, 0.94),
    borderColor: accent,
    borderWidth: 1,
  });

  page.drawText(defaultBranding.companyName, {
    x: 42,
    y,
    size: 18,
    font: bold,
    color: rgb(0.07, 0.07, 0.07),
  });
  y -= 20;

  page.drawText(
    `GSTIN: ${defaultBranding.gstin} | ${defaultBranding.location}`,
    {
      x: 42,
      y,
      size: 10,
      font: regular,
      color: rgb(0.35, 0.32, 0.28),
    },
  );

  y = 720;

  page.drawText(payload.title, {
    x: 42,
    y,
    size: 20,
    font: bold,
    color: accent,
  });
  y -= 28;

  const lines = [
    `Party: ${payload.partyName}`,
    `Phone / Email: ${payload.partyPhone ?? "-"} | ${payload.partyEmail ?? "-"}`,
    `Property: ${payload.village} - Survey No. ${payload.surveyNumber}, Area ${payload.area}`,
    `Total Amount: ${formatCurrency(payload.totalAmount)}`,
    `Paid Amount: ${formatCurrency(payload.paidAmount)}`,
    `Remaining Amount: ${formatCurrency(payload.remainingAmount)}`,
    `Payment Mode: ${payload.paymentMode}`,
    `Date & Time: ${formatDateTime(payload.eventAt)}`,
    `Memo No.: ${payload.memoNumber ?? "-"}`,
    `GST No.: ${payload.gstNumber ?? defaultBranding.gstin}`,
  ];

  for (const line of lines) {
    page.drawText(line, {
      x: 42,
      y,
      size: 12,
      font: regular,
      color: rgb(0.07, 0.07, 0.07),
    });
    y -= 24;
  }

  if (payload.conditions) {
    page.drawText("Conditions", {
      x: 42,
      y: y - 8,
      size: 13,
      font: bold,
      color: rgb(0.07, 0.07, 0.07),
    });
    y -= 34;

    page.drawText(payload.conditions, {
      x: 42,
      y,
      size: 11,
      lineHeight: 15,
      maxWidth: 500,
      font: regular,
      color: rgb(0.35, 0.32, 0.28),
    });
    y -= 80;
  }

  page.drawLine({
    start: { x: 42, y: 110 },
    end: { x: 250, y: 110 },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawLine({
    start: { x: 340, y: 110 },
    end: { x: 548, y: 110 },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText("Customer / Owner Signature", {
    x: 42,
    y: 94,
    size: 10,
    font: regular,
  });
  page.drawText("Company Signature", {
    x: 340,
    y: 94,
    size: 10,
    font: regular,
  });

  return pdf;
}

export async function createAdvanceBookingPdf(payload: PdfPayload) {
  const pdf = await createBaseDocument({
    ...payload,
    title: "Advance Payment Received",
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
