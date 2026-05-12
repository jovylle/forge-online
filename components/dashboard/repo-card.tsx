import { RepoMetadataForm } from "@/components/dashboard/repo-metadata-form";
import type { DashboardRepo, RepoMetadataInput } from "@/lib/types";

type RepoCardProps = {
  repo: DashboardRepo;
  onSaveMetadata: (repoId: string, values: RepoMetadataInput) => Promise<void>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClasses(status: DashboardRepo["effectiveStatus"]) {
  switch (status) {
    case "active":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "wip":
      return "border-amber-400/30 bg-amber-400/10 text-amber-100";
    case "done":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
    default:
      return "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";
  }
}

export function RepoCard({ repo, onSaveMetadata }: RepoCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-white">{repo.name}</h3>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${statusClasses(repo.effectiveStatus)}`}
            >
              {repo.effectiveStatus}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${
                repo.isPrivate
                  ? "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-100"
                  : "border-white/10 bg-white/5 text-zinc-300"
              }`}
            >
              {repo.isPrivate ? "Private" : "Public"}
            </span>
            {repo.isArchived ? (
              <span className="rounded-full border border-zinc-500/30 bg-zinc-500/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-300">
                Archived
              </span>
            ) : null}
            {repo.isFork ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-300">
                Fork
              </span>
            ) : null}
          </div>

          <p className="text-sm text-zinc-500">{repo.fullName}</p>
          <p className="max-w-3xl text-sm leading-6 text-zinc-300">
            {repo.description || "No description provided on GitHub yet."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
          >
            Open GitHub
          </a>
          {repo.homepageUrl ? (
            <a
              href={repo.homepageUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
            >
              Homepage
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Language</p>
          <p className="mt-1 text-zinc-200">{repo.primaryLanguage || "Unknown"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Default branch</p>
          <p className="mt-1 text-zinc-200">{repo.defaultBranch || "Unknown"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Last pushed</p>
          <p className="mt-1 text-zinc-200">{formatDate(repo.pushedAtGithub)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Last updated</p>
          <p className="mt-1 text-zinc-200">{formatDate(repo.updatedAtGithub)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Stars</p>
          <p className="mt-1 text-zinc-200">{repo.stargazerCount}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Source</p>
          <p className="mt-1 text-zinc-200">{repo.syncSource === "token" ? "Private-enabled" : "Public-only"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Status source</p>
          <p className="mt-1 text-zinc-200">{repo.statusSource === "manual" ? "Manual override" : "Auto suggestion"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Last cached sync</p>
          <p className="mt-1 text-zinc-200">{formatDate(repo.lastSyncedAt)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {repo.topics.length > 0 ? (
          repo.topics.map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
            >
              {topic}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-dashed border-white/10 px-3 py-1 text-xs text-zinc-500">
            No topics
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Goal</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-200">
            {repo.metadata?.goal || "No goal saved yet."}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-200">
            {repo.metadata?.notes || "No notes saved yet."}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Next step</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-200">
            {repo.metadata?.nextStep || "No next step saved yet."}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <RepoMetadataForm
          key={`${repo.id}:${repo.metadata?.updatedAt ?? "empty"}`}
          repo={repo}
          onSave={onSaveMetadata}
        />
      </div>
    </article>
  );
}
