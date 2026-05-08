import { NextResponse } from "next/server";
import { handleRouteError, requireApiSession } from "@/lib/api";
import { createDevelopmentEntryPdf } from "@/lib/record-pdfs";
import { assertResourceAccess, getResourceById, ResourceError } from "@/lib/resources";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireApiSession(request);
    if (!session) {
      throw new ResourceError("Authentication required.", 401);
    }

    assertResourceAccess(session, "development-entries", "read");

    const { id } = await context.params;
    const entry = await getResourceById("development-entries", Number(id));
    const pdf = await createDevelopmentEntryPdf(entry);

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="development-entry-${id}.pdf"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
