import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { handleRouteError } from "@/lib/api";
import { ResourceError } from "@/lib/resources";

const encoder = new TextEncoder();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { resetToken?: string; password?: string };

    if (!body.resetToken || !body.password) {
      throw new ResourceError("Reset token and new password are required.");
    }

    if (body.password.length < 6) {
      throw new ResourceError("Password must be at least 6 characters.");
    }

    let email: string;
    try {
      const secret = encoder.encode(getEnv().APP_SESSION_SECRET);
      const { payload } = await jwtVerify(body.resetToken, secret);
      if (payload.purpose !== "password-reset" || !payload.email) {
        throw new Error("Invalid token purpose");
      }
      email = String(payload.email);
    } catch {
      throw new ResourceError("Invalid or expired reset token.", 400);
    }

    const passwordHash = await hashPassword(body.password);
    await execute(
      "UPDATE users SET password_hash = ? WHERE email = ? AND status = 'active'",
      [passwordHash, email],
    );

    return NextResponse.json({ message: "Password reset successfully." });
  } catch (error) {
    return handleRouteError(error);
  }
}
