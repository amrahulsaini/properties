import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
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
    const document = await getResourceById("documents", Number(id));
    const buffer = await readFile(String(document.file_path));

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": String(document.mime_type ?? "application/octet-stream"),
        "Content-Disposition": `inline; filename="${String(document.file_name ?? "document")}"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
