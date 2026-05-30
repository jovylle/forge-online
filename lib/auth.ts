import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth-options";
import type { SessionUser } from "@/lib/types";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

type SessionLike = {
  user?: {
    id?: string;
    login?: string;
  };
  accessToken?: string;
} | null;

function toSessionUser(session: SessionLike) {
  const githubUserId = session?.user?.id;
  const login = session?.user?.login;
  const accessToken = session?.accessToken;

  if (!githubUserId || !login || !accessToken) {
    return null;
  }

  return {
    githubUserId,
    login,
    accessToken,
  } satisfies SessionUser;
}

export async function getCurrentSession() {
  const session = (await getServerSession(authOptions)) as SessionLike;
  return toSessionUser(session);
}

export async function requirePageSession() {
  const session = await getCurrentSession();

  if (!session) {
    console.warn("[auth] Missing session in page request, redirecting to /login");
    redirect("/login");
  }

  return session;
}

export async function requireApiSession() {
  const session = await getCurrentSession();

  if (!session) {
    console.warn("[auth] Missing session in API request");
    throw new UnauthorizedError();
  }

  return session;
}
