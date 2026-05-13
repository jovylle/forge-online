import { z } from "zod";

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

const authEnvSchema = z.object({
  FORGE_OWNER_USERNAME: z.string().trim().min(1),
  FORGE_OWNER_PASSWORD_HASH: z.string().trim().min(1),
  SESSION_SECRET: z.string().trim().min(32),
});

/** Netlify and other hosts often set unset vars to "" — treat as missing. */
function emptyGithubTokenToUndefined(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const githubEnvSchema = z.object({
  GITHUB_USERNAME: z.string().trim().min(1),
  GITHUB_TOKEN: z.preprocess(
    emptyGithubTokenToUndefined,
    z.string().min(1).optional(),
  ),
});

const supabaseEnvSchema = z.object({
  SUPABASE_URL: z.string().trim().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1),
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
      FORGE_OWNER_USERNAME: process.env.FORGE_OWNER_USERNAME,
      FORGE_OWNER_PASSWORD_HASH: process.env.FORGE_OWNER_PASSWORD_HASH,
      SESSION_SECRET: process.env.SESSION_SECRET,
    },
    "authentication",
  );
}

export function getGitHubEnv() {
  return parseEnv(
    githubEnvSchema,
    {
      GITHUB_USERNAME: process.env.GITHUB_USERNAME,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    },
    "GitHub",
  );
}

export function getSupabaseEnv() {
  return parseEnv(
    supabaseEnvSchema,
    {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    "Supabase",
  );
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
