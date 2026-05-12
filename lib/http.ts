import { ZodError, type ZodSchema } from "zod";

import { ConfigError } from "@/lib/env";
import { UnauthorizedError } from "@/lib/auth";

export async function readJsonBody<T>(
  request: Request,
  schema: ZodSchema<T>,
  fallback?: unknown,
) {
  try {
    const text = await request.text();
    const raw = text.length > 0 ? JSON.parse(text) : fallback;

    return schema.parse(raw ?? fallback ?? {});
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new Error("Request body must be valid JSON.");
    }

    throw error;
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return Response.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ConfigError) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        error: "Validation failed.",
        details: error.flatten(),
      },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ error: "Unexpected server error." }, { status: 500 });
}
