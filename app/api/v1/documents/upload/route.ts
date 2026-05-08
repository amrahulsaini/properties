import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { createResource, ResourceError } from "@/lib/resources";
import { handleRouteError, requireApiSession } from "@/lib/api";

function buildSafeName(file: File) {
  return `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
}

function buildTitle(file: File, fallbackTitle: string, index: number, total: number) {
  if (fallbackTitle) {
    return total > 1 ? `${fallbackTitle} ${index + 1}` : fallbackTitle;
  }

  return file.name.replace(/\.[^.]+$/, "");
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (!session) {
      throw new ResourceError("Authentication required.", 401);
    }

    const formData = await request.formData();
    const folderId = formData.get("folder_id");
    const title = String(formData.get("title") ?? "").trim();
    const documentType = formData.get("document_type");
    const section = String(formData.get("section") ?? "").trim();
    const partyName = String(formData.get("party_name") ?? "").trim();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const singleFile = formData.get("file");
    if (singleFile instanceof File && singleFile.size > 0) {
      files.push(singleFile);
    }

    if (typeof folderId !== "string" || typeof documentType !== "string" || !files.length) {
      throw new ResourceError("folder_id, document_type, and at least one file are required.");
    }

    const env = getEnv();
    const storageRoot = path.join(process.cwd(), "storage", env.FILE_STORAGE_DIR);
    const storageDirectory = path.join(storageRoot, folderId);
    await mkdir(storageDirectory, { recursive: true });

    const created = [];

    for (const [index, file] of files.entries()) {
      const fileName = buildSafeName(file);
      const fullPath = path.join(storageDirectory, fileName);
      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(fullPath, bytes);

      const data = await createResource(
        "documents",
        {
          folder_id: Number(folderId),
          section,
          party_name: partyName || null,
          sort_order: index,
          title: buildTitle(file, title, index, files.length),
          document_type: documentType,
          file_name: file.name,
          file_path: fullPath,
          mime_type: file.type,
          file_size: file.size,
        },
        session,
      );

      created.push(data);
    }

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
