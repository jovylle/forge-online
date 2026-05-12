export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#09090b,_#111827_40%,_#020617)] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="h-40 animate-pulse rounded-[2rem] border border-white/10 bg-white/5" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-3xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
        <div className="h-20 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        <div className="h-24 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        <div className="h-80 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/5" />
      </div>
    </main>
  );
}
