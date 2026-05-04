import { NextResponse } from "next/server";
import { handleRouteError, requireApiSession } from "@/lib/api";
import {
  assertResourceAccess,
  deleteResource,
  getResourceById,
  ResourceError,
  updateResource,
} from "@/lib/resources";

export async function GET(
  request: Request,
  context: { params: Promise<{ resource: string; id: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const { resource, id } = await context.params;

    assertResourceAccess(session, resource, "read");
    const data = await getResourceById(resource, Number(id));

    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ resource: string; id: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const { resource, id } = await context.params;

    assertResourceAccess(session, resource, "write");
    if (!session) {
      throw new ResourceError("Authentication required.", 401);
    }

    const body = await request.json();
    const data = await updateResource(resource, Number(id), body, session);

    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ resource: string; id: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const { resource, id } = await context.params;

    assertResourceAccess(session, resource, "delete");
    const data = await deleteResource(resource, Number(id));

    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}
