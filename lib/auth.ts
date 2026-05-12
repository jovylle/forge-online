import { createHash, timingSafeEqual } from "node:crypto";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { getAuthEnv } from "@/lib/env";
import { readSessionFromCookies } from "@/lib/session";
import type { LoginRequest } from "@/lib/types";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function safeEqual(a: string, b: string) {
  return timingSafeEqual(digest(a), digest(b));
}

export async function verifyOwnerCredentials(input: LoginRequest) {
  const { FORGE_OWNER_USERNAME, FORGE_OWNER_PASSWORD_HASH } = getAuthEnv();

  const usernameMatches = safeEqual(input.username, FORGE_OWNER_USERNAME);
  const passwordMatches = await bcrypt.compare(
    input.password,
    FORGE_OWNER_PASSWORD_HASH,
  );

  return usernameMatches && passwordMatches;
}

export async function getCurrentSession() {
  return readSessionFromCookies();
}

export async function requirePageSession() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireApiSession() {
  const session = await getCurrentSession();

  if (!session) {
    throw new UnauthorizedError();
  }

  return session;
}
