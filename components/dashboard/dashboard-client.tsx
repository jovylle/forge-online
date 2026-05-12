"use client";

import { useMemo, useState } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { RepoGrid } from "@/components/dashboard/repo-grid";
import { RepoToolbar } from "@/components/dashboard/repo-toolbar";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SyncButton } from "@/components/dashboard/sync-button";
import { compareStatuses } from "@/lib/status";
import type {
  DashboardPayload,
  DashboardRepo,
  RepoMetadataInput,
  SortOption,
  StatusFilter,
  VisibilityFilter,
} from "@/lib/types";

type DashboardClientProps = {
  initialData: DashboardPayload;
};

function repoSearchText(repo: DashboardRepo) {
  return [
    repo.name,
    repo.fullName,
    repo.description,
    repo.primaryLanguage,
    repo.topics.join(" "),
    repo.metadata?.goal,
    repo.metadata?.notes,
    repo.metadata?.nextStep,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function sortRepos(repos: DashboardRepo[], sortBy: SortOption) {
  return [...repos].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }

    if (sortBy === "status") {
      return compareStatuses(a.effectiveStatus, b.effectiveStatus);
    }

    const left =
      sortBy === "updated"
        ? Date.parse(a.updatedAtGithub ?? "")
        : Date.parse(a.pushedAtGithub ?? "");
    const right =
      sortBy === "updated"
        ? Date.parse(b.updatedAtGithub ?? "")
        : Date.parse(b.pushedAtGithub ?? "");

    return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
  });
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("pushed");
  const [isSyncing, setIsSyncing] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  async function refreshDashboard() {
    const response = await fetch("/api/dashboard", {
      method: "GET",
      cache: "no-store",
    });
    const payload = (await response.json()) as DashboardPayload & { error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to refresh dashboard.");
    }

    setData(payload);
    return payload;
  }

  async function handleSync() {
    setBannerMessage(null);
    setIsSyncing(true);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Sync failed.");
      }

      await refreshDashboard();
      setBannerMessage(payload.message ?? "GitHub sync completed.");
    } catch (error) {
      setBannerMessage(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSaveMetadata(repoId: string, values: RepoMetadataInput) {
    const response = await fetch(`/api/repos/${repoId}/metadata`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to save metadata.");
    }

    await refreshDashboard();
  }

  const filteredRepos = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    const repos = data.repos.filter((repo) => {
      if (
        visibilityFilter === "public" &&
        repo.isPrivate
      ) {
        return false;
      }

      if (
        visibilityFilter === "private" &&
        !repo.isPrivate
      ) {
        return false;
      }

      if (statusFilter !== "all" && repo.effectiveStatus !== statusFilter) {
        return false;
      }

      if (!lowerSearch) {
        return true;
      }

      return repoSearchText(repo).includes(lowerSearch);
    });

    return sortRepos(repos, sortBy);
  }, [data.repos, search, sortBy, statusFilter, visibilityFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-200">
            Forge Online
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Personal project dashboard
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
              Track owned GitHub repositories, add Forge-style notes, and keep your project
              inventory synced from the server.
            </p>
          </div>
        </div>

        <LogoutButton />
      </header>

      {bannerMessage ? (
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
          {bannerMessage}
        </div>
      ) : null}

      <SummaryCards repos={data.repos} />

      <SyncButton
        syncState={data.syncState}
        isSyncing={isSyncing}
        onSync={handleSync}
      />

      <RepoToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        visibilityFilter={visibilityFilter}
        onVisibilityFilterChange={setVisibilityFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      <div className="flex items-center justify-between px-1 text-sm text-zinc-400">
        <p>
          Showing <span className="font-medium text-zinc-100">{filteredRepos.length}</span> of{" "}
          <span className="font-medium text-zinc-100">{data.repos.length}</span> repositories
        </p>
      </div>

      <RepoGrid repos={filteredRepos} onSaveMetadata={handleSaveMetadata} />
    </div>
  );
}
