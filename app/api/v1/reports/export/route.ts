import * as XLSX from "xlsx";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireApiSession } from "@/lib/api";
import { assertResourceAccess, listResource, ResourceError } from "@/lib/resources";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    const resource = request.nextUrl.searchParams.get("resource");

    if (!resource) {
      throw new ResourceError("resource query parameter is required.");
    }

    assertResourceAccess(session, resource, "read");

    const rows = await listResource(resource, request.nextUrl.searchParams);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${resource}-report.xlsx"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
