import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { handleRouteError, requireApiSession } from "@/lib/api";
import { ResourceError } from "@/lib/resources";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (!session) {
      throw new ResourceError("Authentication required.", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ResourceError("A valid 'file' is required.", 400);
    }

    // Save to public/uploads
    const uploadDirectory = path.join(process.cwd(), "public", "uploads");
    
    try {
      await mkdir(uploadDirectory, { recursive: true });
    } catch (err) {
      console.error("Failed to create upload directory:", err);
      throw new ResourceError("Failed to create upload directory.", 500);
    }

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
    const fullPath = path.join(uploadDirectory, safeName);
    
    try {
      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(fullPath, bytes);
    } catch (err) {
      console.error("Failed to write file:", err);
      throw new ResourceError("Failed to save file to disk.", 500);
    }

    const url = `/uploads/${safeName}`;

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
