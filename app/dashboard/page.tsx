import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { requirePageSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/db";
import { ConfigError } from "@/lib/env";
import type { DashboardPayload } from "@/lib/types";

export default async function DashboardPage() {
  const session = await requirePageSession();

  let data: DashboardPayload;

  try {
    data = await getDashboardData(session);
  } catch (error) {
    if (error instanceof ConfigError) {
      return (
        <main className="min-h-screen bg-[linear-gradient(180deg,_#09090b,_#111827_40%,_#020617)] px-6 py-10 text-zinc-100">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-8">
            <h1 className="text-2xl font-semibold text-white">Dashboard is not configured yet</h1>
            <p className="mt-3 text-sm leading-6 text-amber-100">
              {error.message}
            </p>
          </div>
        </main>
      );
    }

    console.error("[dashboard] Failed to render dashboard page", error);

    const fallbackMessage =
      error instanceof Error && error.message.trim()
        ? error.message
        : "Unexpected dashboard error.";

    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,_#09090b,_#111827_40%,_#020617)] px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-8">
          <h1 className="text-2xl font-semibold text-white">Dashboard failed to load</h1>
          <p className="mt-3 text-sm leading-6 text-rose-100">
            {fallbackMessage}
          </p>
          <p className="mt-2 text-xs text-rose-200/80">
            Check Netlify function logs for full diagnostics.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,_#09090b,_#111827_40%,_#020617)] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <DashboardClient initialData={data} />
      </div>
    </main>
  );
}
