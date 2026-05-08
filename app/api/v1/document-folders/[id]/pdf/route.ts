import { NextResponse } from "next/server";
import { handleRouteError, requireApiSession } from "@/lib/api";
import { queryRows } from "@/lib/db";
import { createDocumentFolderPackPdf } from "@/lib/record-pdfs";
import { assertResourceAccess, getResourceById, ResourceError } from "@/lib/resources";
import type { GenericRecord } from "@/lib/types";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireApiSession(request);
    if (!session) {
      throw new ResourceError("Authentication required.", 401);
    }

    assertResourceAccess(session, "document-folders", "read");

    const { id } = await context.params;
    const folder = await getResourceById("document-folders", Number(id));
    const documents = await queryRows<GenericRecord>(
      `SELECT * FROM documents
       WHERE folder_id = ?
       ORDER BY section ASC, sort_order ASC, uploaded_at ASC`,
      [Number(id)],
    );

    const projectId = Number(folder.project_id ?? 0);
    if (projectId > 0) {
      const projectRows = await queryRows<{ id: number; name: string | null; code: string | null }>(
        "SELECT id, name, code FROM projects WHERE id = ? LIMIT 1",
        [projectId],
      );
      const project = projectRows[0];

      if (project) {
        folder.project_name = project.code
          ? `${project.code} - ${project.name ?? ""}`.trim()
          : String(project.name ?? "");
      }
    }

    const pdf = await createDocumentFolderPackPdf(folder, documents);

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="dast-folder-${id}.pdf"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
