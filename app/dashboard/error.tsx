"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#09090b,_#111827_40%,_#020617)] px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-8">
        <h1 className="text-2xl font-semibold text-white">Dashboard failed to load</h1>
        <p className="mt-3 text-sm leading-6 text-rose-100">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
