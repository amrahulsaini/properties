import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";
import { ResourceError } from "@/lib/resources";

export async function requireApiSession(request: Request) {
  return getRequestSession(request);
}

export function handleRouteError(error: unknown) {
  if (error instanceof ResourceError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
}
