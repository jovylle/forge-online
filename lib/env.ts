import { z } from "zod";

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

const authEnvSchema = z.object({
  AUTH_GITHUB_ID: z.string().trim().min(1),
  AUTH_GITHUB_SECRET: z.string().trim().min(1),
  NEXTAUTH_SECRET: z.string().trim().min(32),
});

function parseEnv<T>(schema: z.ZodType<T>, values: unknown, scope: string): T {
  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new ConfigError(
      `Missing or invalid ${scope} environment variables (${detail}). Check .env.example and your deployment settings.`,
    );
  }

  return parsed.data;
}

export function getAuthEnv() {
  return parseEnv(
    authEnvSchema,
    {
      AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
      AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    },
    "authentication",
  );
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
