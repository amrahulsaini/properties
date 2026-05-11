import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import { execute, queryRows } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { handleRouteError } from "@/lib/api";
import { ResourceError } from "@/lib/resources";

const encoder = new TextEncoder();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; otp?: string };

    if (!body.email || !body.otp) {
      throw new ResourceError("Email and OTP are required.");
    }

    const rows = await queryRows<{ id: number; otp: string; expires_at: string }>(
      "SELECT id, otp, expires_at FROM password_reset_otps WHERE email = ? AND used = 0 ORDER BY created_at DESC LIMIT 1",
      [body.email],
    );

    const record = rows[0];
    if (!record || record.otp !== body.otp || new Date(record.expires_at) < new Date()) {
      throw new ResourceError("Invalid or expired OTP.", 400);
    }

    await execute("UPDATE password_reset_otps SET used = 1 WHERE id = ?", [record.id]);

    const secret = encoder.encode(getEnv().APP_SESSION_SECRET);
    const resetToken = await new SignJWT({ email: body.email, purpose: "password-reset" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(secret);

    return NextResponse.json({ resetToken });
  } catch (error) {
    return handleRouteError(error);
  }
}
