import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { handleRouteError, requireApiSession } from "@/lib/api";
import { assertResourceAccess, listResource } from "@/lib/resources";
import { createAdvanceBookingPdf } from "@/lib/pdf";

function resolveAssetUrl(request: Request, value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  try {
    return new URL(raw).toString();
  } catch {
    return new URL(raw, request.url).toString();
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    assertResourceAccess(session, "advance-bookings", "read");

    const url = new URL(request.url);
    // allow passing a limit param, default to 500
    if (!url.searchParams.get("limit")) {
      url.searchParams.set("limit", "500");
    }

    const rows = await listResource("advance-bookings", url.searchParams);
    if (!rows.length) {
      return NextResponse.json({ error: "No records to export." }, { status: 404 });
    }

    const master = await PDFDocument.create();

    for (const row of rows) {
      const pdfBytes = await createAdvanceBookingPdf({
        title: "Advance Payment Received",
        partyName: String(row.customer_name ?? ""),
        partyPhone: String(row.customer_phone ?? ""),
        partyEmail: String(row.customer_email ?? ""),
        village: String(row.village ?? ""),
        surveyNumber: String(row.survey_number ?? ""),
        area: `${row.area_sqft ?? 0} sq.ft.`,
        totalAmount: Number(row.total_amount ?? 0),
        paidAmount: Number(row.advance_amount ?? 0),
        remainingAmount: Number(row.remaining_amount ?? 0),
        paymentMode: String(row.payment_mode ?? ""),
        eventAt: String(row.payment_at ?? new Date().toISOString()),
        memoNumber: String(row.memo_number ?? ""),
        gstNumber: String(row.gst_number ?? ""),
        customerSignatureUrl: resolveAssetUrl(request, row.customer_signature_url),
        companySignatureUrl: resolveAssetUrl(request, row.company_signature_url),
        partyPhotoUrl: resolveAssetUrl(request, row.customer_photo_url ?? row.customer_photo),
      });

      const src = await PDFDocument.load(pdfBytes);
      const pages = await master.copyPages(src, src.getPageIndices());
      for (const p of pages) master.addPage(p);
    }

    const output = await master.save();

    return new NextResponse(Buffer.from(output), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="advance-bookings-all.pdf"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
