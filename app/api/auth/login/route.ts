import { NextResponse } from "next/server";

import { getAuthEnv } from "@/lib/env";
import { errorResponse, readJsonBody } from "@/lib/http";
import { createSessionToken, getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/session";
import { verifyOwnerCredentials } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = await readJsonBody(request, loginSchema);
    const isValid = await verifyOwnerCredentials(input);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    const { FORGE_OWNER_USERNAME } = getAuthEnv();
    const token = await createSessionToken({ username: FORGE_OWNER_USERNAME });
    const response = NextResponse.json({
      ok: true,
      user: {
        username: FORGE_OWNER_USERNAME,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      ...getSessionCookieOptions(),
    });

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
