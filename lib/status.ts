import type { DashboardRepo, RepoMetadata, RepoStatus, RepositoryRecord } from "@/lib/types";

const ACTIVE_DAYS = 30;
const WIP_DAYS = 90;

function daysSince(value: string | null) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
}

export function deriveAutoStatus(repo: RepositoryRecord): RepoStatus {
  if (repo.isArchived) {
    return "abandoned";
  }

  const freshestActivity = Math.min(
    daysSince(repo.pushedAtGithub),
    daysSince(repo.updatedAtGithub),
  );

  if (freshestActivity <= ACTIVE_DAYS) {
    return "active";
  }

  if (freshestActivity <= WIP_DAYS) {
    return "wip";
  }

  return "abandoned";
}

export function getEffectiveStatus(
  repo: RepositoryRecord,
  metadata: RepoMetadata | null,
) {
  if (metadata?.statusOverride) {
    return {
      effectiveStatus: metadata.statusOverride,
      statusSource: "manual" as const,
    };
  }

  return {
    effectiveStatus: deriveAutoStatus(repo),
    statusSource: "auto" as const,
  };
}

export function enrichRepoWithStatus(
  repo: RepositoryRecord,
  metadata: RepoMetadata | null,
): DashboardRepo {
  return {
    ...repo,
    metadata,
    ...getEffectiveStatus(repo, metadata),
  };
}

const statusSortOrder: Record<RepoStatus, number> = {
  active: 0,
  wip: 1,
  abandoned: 2,
  done: 3,
};

export function compareStatuses(a: RepoStatus, b: RepoStatus) {
  return statusSortOrder[a] - statusSortOrder[b];
}
