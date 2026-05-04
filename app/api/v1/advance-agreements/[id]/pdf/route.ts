import { NextResponse } from "next/server";
import { createAdvanceAgreementPdf } from "@/lib/pdf";
import { getResourceById, ResourceError } from "@/lib/resources";
import { handleRouteError, requireApiSession } from "@/lib/api";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireApiSession(request);
    if (!session) {
      throw new ResourceError("Authentication required.", 401);
    }

    const { id } = await context.params;
    const agreement = await getResourceById("advance-agreements", Number(id));
    const pdf = await createAdvanceAgreementPdf({
      title: "Advance Agreement Memo",
      partyName: String(agreement.owner_name ?? ""),
      partyPhone: String(agreement.owner_phone ?? ""),
      partyEmail: String(agreement.owner_email ?? ""),
      village: String(agreement.village ?? ""),
      surveyNumber: String(agreement.survey_number ?? ""),
      area: `${agreement.area_sqft ?? 0} sq.ft.`,
      totalAmount: Number(agreement.total_amount ?? 0),
      paidAmount: Number(agreement.paid_amount ?? 0),
      remainingAmount: Number(agreement.remaining_amount ?? 0),
      paymentMode: String(agreement.payment_mode ?? ""),
      eventAt: String(agreement.agreement_at ?? new Date().toISOString()),
      conditions: [agreement.conditions_text, agreement.inspection_rights]
        .filter(Boolean)
        .join(" | "),
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="advance-agreement-${id}.pdf"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
