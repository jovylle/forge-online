import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentSession } from "@/lib/auth";
import { ConfigError, getAuthEnv } from "@/lib/env";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "/dashboard";

  let configError: string | null = null;

  try {
    getAuthEnv();
  } catch (error) {
    if (error instanceof ConfigError) {
      configError = error.message;
    } else {
      throw error;
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_36%),linear-gradient(180deg,_#0a0a0a,_#111827_55%,_#020617)] px-6 py-10 text-zinc-100">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-200">
              Forge Online
            </div>
            <div className="space-y-5">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Understand your GitHub progress from one dashboard.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                Sign in with GitHub, sync repositories (including private repos when
                authorized), and keep Forge-style notes without local setup.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-medium text-zinc-100">Per-user repository view</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Each user sees only repositories available from their own GitHub account.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-medium text-zinc-100">Private repos supported</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Forge Online requests GitHub access through OAuth and keeps token usage server-side.
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="mb-4 space-y-2">
              <h2 className="text-2xl font-semibold text-white">Sign in</h2>
              <p className="text-sm leading-6 text-zinc-400">
                Continue with GitHub to open your personal Forge dashboard.
              </p>
            </div>
            <LoginForm nextPath={nextPath} configError={configError} />
          </section>
        </div>
      </div>
    </main>
  );
}
