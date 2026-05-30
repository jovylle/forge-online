import { RepoCard } from "@/components/dashboard/repo-card";
import type { DashboardRepo, RepoMetadataInput, RepoViewType } from "@/lib/types";

type RepoGridProps = {
  repos: DashboardRepo[];
  viewType: RepoViewType;
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

export function RepoGrid({ repos, viewType, onSaveMetadata }: RepoGridProps) {
  if (repos.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center">
        <p className="text-lg font-medium text-zinc-100">No repositories match this view.</p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Try a different search, clear a filter, or run a GitHub sync to populate the cache.
        </p>
      </div>
    );
  }

  if (viewType === "list") {
    return (
      <div className="space-y-3">
        <p className="px-1 text-xs uppercase tracking-[0.14em] text-zinc-500">
          Compact list view. Switch to cards to edit notes, goals, and next steps.
        </p>
        <ul className="space-y-2">
          {repos.map((repo) => (
            <li
              key={repo.id}
              className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-lg shadow-black/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-zinc-100">{repo.name}</p>
                  <p className="truncate text-xs text-zinc-500">{repo.fullName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${statusClasses(repo.effectiveStatus)}`}
                  >
                    {repo.effectiveStatus}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-300">
                    {repo.isPrivate ? "Private" : "Public"}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                <span>{repo.primaryLanguage || "Unknown language"}</span>
                <span>{repo.stargazerCount} stars</span>
                <span>Updated {formatDate(repo.updatedAtGithub)}</span>
                <a
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-200 transition hover:text-cyan-100"
                >
                  Open GitHub
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (viewType === "table") {
    return (
      <div className="space-y-3">
        <p className="px-1 text-xs uppercase tracking-[0.14em] text-zinc-500">
          Table view is read-focused. Switch to cards to edit notes, goals, and next steps.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/70">
          <table className="min-w-full border-collapse text-sm text-zinc-300">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Repository</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Visibility</th>
                <th className="px-4 py-3 text-left font-medium">Language</th>
                <th className="px-4 py-3 text-left font-medium">Stars</th>
                <th className="px-4 py-3 text-left font-medium">Updated</th>
                <th className="px-4 py-3 text-left font-medium">Links</th>
              </tr>
            </thead>
            <tbody>
              {repos.map((repo) => (
                <tr key={repo.id} className="border-t border-white/10 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-100">{repo.name}</p>
                    <p className="text-xs text-zinc-500">{repo.fullName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${statusClasses(repo.effectiveStatus)}`}
                    >
                      {repo.effectiveStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {repo.isPrivate ? "Private" : "Public"}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {repo.primaryLanguage || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{repo.stargazerCount}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatDate(repo.updatedAtGithub)}</td>
                  <td className="px-4 py-3">
                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-200 transition hover:text-cyan-100"
                    >
                      GitHub
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} onSaveMetadata={onSaveMetadata} />
      ))}
    </div>
  );
}
