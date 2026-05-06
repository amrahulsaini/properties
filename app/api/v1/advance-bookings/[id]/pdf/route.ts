import { NextResponse } from "next/server";
import { createAdvanceBookingPdf } from "@/lib/pdf";
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
    const booking = await getResourceById("advance-bookings", Number(id));
    const pdf = await createAdvanceBookingPdf({
      title: "Advance Payment Received",
      partyName: String(booking.customer_name ?? ""),
      partyPhone: String(booking.customer_phone ?? ""),
      partyEmail: String(booking.customer_email ?? ""),
      village: String(booking.village ?? ""),
      surveyNumber: String(booking.survey_number ?? ""),
      area: `${booking.area_sqft ?? 0} sq.ft.`,
      totalAmount: Number(booking.total_amount ?? 0),
      paidAmount: Number(booking.advance_amount ?? 0),
      remainingAmount: Number(booking.remaining_amount ?? 0),
      paymentMode: String(booking.payment_mode ?? ""),
      eventAt: String(booking.payment_at ?? new Date().toISOString()),
      memoNumber: String(booking.memo_number ?? ""),
      gstNumber: String(booking.gst_number ?? ""),
      customerSignatureUrl: String(booking.customer_signature_url ?? ""),
      companySignatureUrl: String(booking.company_signature_url ?? ""),
      partyPhotoUrl: String(booking.customer_photo_url ?? booking.customer_photo ?? ""),
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="advance-booking-${id}.pdf"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
