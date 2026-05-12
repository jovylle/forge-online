import type { SyncState } from "@/lib/types";

type SyncButtonProps = {
  syncState: SyncState | null;
  isSyncing: boolean;
  onSync: () => Promise<void>;
};

function formatSyncTime(value: string | null) {
  if (!value) {
    return "Never synced";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SyncButton({ syncState, isSyncing, onSync }: SyncButtonProps) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-100">GitHub sync</p>
        <p className="text-sm text-zinc-400">
          Last sync: {formatSyncTime(syncState?.lastSyncedAt ?? null)}
        </p>
        {syncState?.message ? (
          <p
            className={`text-xs ${
              syncState.status === "error" ? "text-rose-300" : "text-zinc-500"
            }`}
          >
            {syncState.message}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onSync}
        disabled={isSyncing}
        className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
      >
        {isSyncing ? "Syncing..." : "Sync from GitHub"}
      </button>
    </div>
  );
}
