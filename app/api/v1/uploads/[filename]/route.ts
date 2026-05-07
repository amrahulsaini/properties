import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { ResourceError } from "@/lib/resources";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await context.params;

    // Validate filename to prevent directory traversal
    if (!filename || filename.includes("..") || filename.includes("/")) {
      throw new ResourceError("Invalid filename.", 400);
    }

    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new ResourceError("File type not allowed.", 403);
    }

    const uploadDirectory = path.join(process.cwd(), "public", "uploads");
    const fullPath = path.join(uploadDirectory, filename);

    // Ensure the resolved path is within the uploads directory
    if (!fullPath.startsWith(uploadDirectory)) {
      throw new ResourceError("Invalid file path.", 403);
    }

    try {
      const fileBuffer = await readFile(fullPath);

      const mimeTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
      };

      const contentType = mimeTypes[ext] || "application/octet-stream";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (err) {
      console.error(`Failed to read file: ${fullPath}`, err);
      throw new ResourceError("File not found.", 404);
    }
  } catch (error) {
    if (error instanceof ResourceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("File serving error:", error);
    return NextResponse.json(
      { error: "Failed to serve file." },
      { status: 500 },
    );
  }
}
