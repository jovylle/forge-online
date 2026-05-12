import { RepoCard } from "@/components/dashboard/repo-card";
import type { DashboardRepo, RepoMetadataInput } from "@/lib/types";

type RepoGridProps = {
  repos: DashboardRepo[];
  onSaveMetadata: (repoId: string, values: RepoMetadataInput) => Promise<void>;
};

export function RepoGrid({ repos, onSaveMetadata }: RepoGridProps) {
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

  return (
    <div className="grid gap-5">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} onSaveMetadata={onSaveMetadata} />
      ))}
    </div>
  );
}
