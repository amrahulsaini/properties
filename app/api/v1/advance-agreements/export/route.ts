import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { handleRouteError, requireApiSession } from "@/lib/api";
import { assertResourceAccess, listResource } from "@/lib/resources";
import { createAdvanceAgreementPdf } from "@/lib/pdf";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    assertResourceAccess(session, "advance-agreements", "read");

    const url = new URL(request.url);
    if (!url.searchParams.get("limit")) {
      url.searchParams.set("limit", "500");
    }

    const rows = await listResource("advance-agreements", url.searchParams);
    if (!rows.length) {
      return NextResponse.json({ error: "No records to export." }, { status: 404 });
    }

    const master = await PDFDocument.create();

    for (const row of rows) {
      const pdfBytes = await createAdvanceAgreementPdf({
        title: "Advance Agreement Memo",
        partyName: String(row.owner_name ?? ""),
        partyPhone: String(row.owner_phone ?? ""),
        partyEmail: String(row.owner_email ?? ""),
        village: String(row.village ?? ""),
        surveyNumber: String(row.survey_number ?? ""),
        area: `${row.area_sqft ?? 0} sq.ft.`,
        totalAmount: Number(row.total_amount ?? 0),
        paidAmount: Number(row.paid_amount ?? 0),
        remainingAmount: Number(row.remaining_amount ?? 0),
        paymentMode: String(row.payment_mode ?? ""),
        eventAt: String(row.agreement_at ?? new Date().toISOString()),
        memoNumber: String(row.memo_number ?? ""),
        gstNumber: String(row.gst_number ?? ""),
        customerSignatureUrl: String(row.owner_signature_url ?? row.customer_signature_url ?? ""),
        companySignatureUrl: String(row.company_signature_url ?? ""),
        partyPhotoUrl: String(row.owner_photo_url ?? row.customer_photo_url ?? ""),
        conditions: [row.conditions_text, row.inspection_rights].filter(Boolean).join(" | "),
      });

      const src = await PDFDocument.load(pdfBytes);
      const pages = await master.copyPages(src, src.getPageIndices());
      for (const p of pages) master.addPage(p);
    }

    const output = await master.save();

    return new NextResponse(Buffer.from(output), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="advance-agreements-all.pdf"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
