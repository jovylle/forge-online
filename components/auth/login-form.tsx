"use client";

import { signIn } from "next-auth/react";

type LoginFormProps = {
  nextPath: string;
  configError?: string | null;
};

function sanitizeNextPath(nextPath: string) {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

export function LoginForm({ nextPath, configError }: LoginFormProps) {
  async function handleGitHubSignIn() {
    await signIn("github", {
      callbackUrl: sanitizeNextPath(nextPath),
    });
  }

  return (
    <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
      {configError ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {configError}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleGitHubSignIn}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-300"
        >
          Continue with GitHub
        </button>
      )}

      <p className="text-xs leading-5 text-zinc-500">
        GitHub OAuth is required so we can sync your repositories and private repo
        metadata (if you grant `repo` scope).
      </p>
    </div>
  );
}
