import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { execute, queryRows } from "@/lib/db";
import { getEnv, isEmailConfigured } from "@/lib/env";
import { handleRouteError } from "@/lib/api";
import { ResourceError } from "@/lib/resources";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };

    if (!body.email) {
      throw new ResourceError("Email is required.");
    }

    const users = await queryRows<{ id: number }>(
      "SELECT id FROM users WHERE email = ? AND status = 'active' LIMIT 1",
      [body.email],
    );

    if (users[0]) {
      if (!isEmailConfigured()) {
        throw new ResourceError("Email service is not configured. Contact admin.");
      }

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await execute("DELETE FROM password_reset_otps WHERE email = ?", [body.email]);
      await execute(
        "INSERT INTO password_reset_otps (email, otp, expires_at) VALUES (?, ?, ?)",
        [body.email, otp, expiresAt],
      );

      const env = getEnv();
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      });

      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: body.email,
        subject: "Password Reset OTP - PropertySuite",
        text: [
          `Your OTP for password reset is: ${otp}`,
          "",
          "This OTP is valid for 15 minutes.",
          "If you did not request this, please ignore this email.",
          "",
          "- Samarth Properties",
        ].join("\n"),
      });
    }

    return NextResponse.json({
      message: "If an account with that email exists, an OTP has been sent.",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
