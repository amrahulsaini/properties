import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { queryRows } from "@/lib/db";
import type { Role, SessionUser } from "@/lib/types";

interface UserRow {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  password_hash: string;
}

const encoder = new TextEncoder();

function getSecret() {
  return encoder.encode(getEnv().APP_SESSION_SECRET);
}

async function signSessionToken(session: SessionUser) {
  const payload: JWTPayload = {
    userId: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function createSessionToken(session: SessionUser) {
  return signSessionToken(session);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    return {
      userId: Number(payload.userId),
      name: String(payload.name),
      email: String(payload.email),
      role: String(payload.role) as Role,
    } satisfies SessionUser;
  } catch {
    return null;
  }
}

export function buildSessionCookie(token: string) {
  const env = getEnv();

  return {
    name: env.APP_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.APP_URL.startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: getEnv().APP_SESSION_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });
}

export async function setSessionCookie(response: NextResponse, session: SessionUser) {
  const token = await createSessionToken(session);
  response.cookies.set(buildSessionCookie(token));
  return token;
}

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function authenticateUser(email: string, password: string) {
  const users = await queryRows<UserRow>(
    "SELECT id, full_name, email, role, password_hash FROM users WHERE email = ? AND status = 'active' LIMIT 1",
    [email],
  );

  const user = users[0];
  if (!user) {
    return null;
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return null;
  }

  return {
    userId: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role,
  } satisfies SessionUser;
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getEnv().APP_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getRequestSession(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    return verifySessionToken(token);
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieName = `${getEnv().APP_SESSION_COOKIE}=`;
  const token = cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(cookieName))
    ?.slice(cookieName.length);

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
