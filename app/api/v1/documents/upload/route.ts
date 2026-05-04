import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { createResource, ResourceError } from "@/lib/resources";
import { handleRouteError, requireApiSession } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (!session) {
      throw new ResourceError("Authentication required.", 401);
    }

    const formData = await request.formData();
    const folderId = formData.get("folder_id");
    const title = formData.get("title");
    const documentType = formData.get("document_type");
    const file = formData.get("file");

    if (
      typeof folderId !== "string" ||
      typeof title !== "string" ||
      typeof documentType !== "string" ||
      !(file instanceof File)
    ) {
      throw new ResourceError("folder_id, title, document_type, and file are required.");
    }

    const env = getEnv();
    const storageRoot = path.join(process.cwd(), "storage", env.FILE_STORAGE_DIR);
    const storageDirectory = path.join(storageRoot, folderId);
    await mkdir(storageDirectory, { recursive: true });

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const fullPath = path.join(storageDirectory, fileName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, bytes);

    const data = await createResource(
      "documents",
      {
        folder_id: Number(folderId),
        title,
        document_type: documentType,
        file_name: file.name,
        file_path: fullPath,
        mime_type: file.type,
        file_size: file.size,
      },
      session,
    );

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
