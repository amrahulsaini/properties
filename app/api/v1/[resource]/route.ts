import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireApiSession } from "@/lib/api";
import {
  assertResourceAccess,
  createResource,
  listResource,
  ResourceError,
} from "@/lib/resources";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ resource: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const { resource } = await context.params;

    assertResourceAccess(session, resource, "read");
    const data = await listResource(resource, request.nextUrl.searchParams);

    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ resource: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const { resource } = await context.params;

    assertResourceAccess(session, resource, "write");
    if (!session) {
      throw new ResourceError("Authentication required.", 401);
    }

    const body = await request.json();
    const data = await createResource(resource, body, session);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
