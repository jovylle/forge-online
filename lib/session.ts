import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

import { getAuthEnv, isProduction } from "@/lib/env";
import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE_NAME = "forge_online_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

const sessionPayloadSchema = z.object({
  username: z.string().min(1),
});

function getSessionSecret() {
  const { SESSION_SECRET } = getAuthEnv();
  return new TextEncoder().encode(SESSION_SECRET);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction(),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });

    return sessionPayloadSchema.parse(payload);
  } catch {
    return null;
  }
}

export async function readSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
