"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [guestUsername, setGuestUsername] = useState("");
  const [guestError, setGuestError] = useState<string | null>(null);

  async function handleGitHubSignIn() {
    await signIn("github", {
      callbackUrl: sanitizeNextPath(nextPath),
    });
  }

  function handleGuestEnter() {
    const username = guestUsername.trim();

    if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
      setGuestError("Enter a valid GitHub username.");
      return;
    }

    setGuestError(null);
    router.push(`/guest/${encodeURIComponent(username)}`);
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

      <div className="space-y-3 rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
        <p className="text-sm font-medium text-zinc-100">Continue as guest</p>
        <p className="text-xs leading-5 text-zinc-400">
          Enter any GitHub username to view public repositories only.
        </p>
        <div className="flex gap-2">
          <input
            value={guestUsername}
            onChange={(event) => setGuestUsername(event.target.value)}
            placeholder="octocat"
            className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={handleGuestEnter}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
          >
            View
          </button>
        </div>
        {guestError ? <p className="text-xs text-rose-300">{guestError}</p> : null}
      </div>

      <p className="text-xs leading-5 text-zinc-500">
        GitHub OAuth is required so we can sync your repositories and private repo
        metadata (if you grant `repo` scope).
      </p>
    </div>
  );
}
