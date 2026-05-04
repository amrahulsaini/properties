import { NextResponse } from "next/server";
import { authenticateUser, buildSessionCookie, createSessionToken } from "@/lib/auth";
import { handleRouteError } from "@/lib/api";
import { ResourceError } from "@/lib/resources";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      throw new ResourceError("Email and password are required.");
    }

    const user = await authenticateUser(body.email, body.password);
    if (!user) {
      throw new ResourceError("Invalid email or password.", 401);
    }

    const token = await createSessionToken(user);
    const response = NextResponse.json({ user, token });
    response.cookies.set(buildSessionCookie(token));
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
