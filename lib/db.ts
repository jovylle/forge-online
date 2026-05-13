import { createClient, type PostgrestError } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/env";
import { enrichRepoWithStatus } from "@/lib/status";
import type {
  DashboardPayload,
  GitHubRepositoryResponse,
  GitHubSyncSummary,
  RepoMetadata,
  RepoMetadataInput,
  RepositoryRecord,
  SyncState,
} from "@/lib/types";

const GITHUB_SYNC_KEY = "github";

type RepositoryRow = {
  id: string;
  github_repo_id: number;
  name: string;
  full_name: string;
  owner_login: string;
  is_private: boolean;
  description: string | null;
  default_branch: string | null;
  primary_language: string | null;
  topics: unknown;
  updated_at_github: string | null;
  pushed_at_github: string | null;
  html_url: string;
  homepage_url: string | null;
  is_archived: boolean;
  is_fork: boolean;
  stargazer_count: number;
  last_synced_at: string | null;
  sync_source: "public" | "token";
  hidden: boolean;
  pinned: boolean;
};

type RepoMetadataRow = {
  repository_id: string;
  goal: string | null;
  status_override: RepoMetadata["statusOverride"];
  notes: string | null;
  next_step: string | null;
  updated_at: string | null;
};

type SyncStateRow = {
  key: string;
  last_synced_at: string | null;
  status: SyncState["status"];
  message: string | null;
  updated_at: string | null;
};

function getSupabaseAdmin() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getSupabaseEnv();

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeTopics(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  return [];
}

function mapRepositoryRow(row: RepositoryRow): RepositoryRecord {
  return {
    id: row.id,
    githubRepoId: row.github_repo_id,
    name: row.name,
    fullName: row.full_name,
    ownerLogin: row.owner_login,
    isPrivate: row.is_private,
    description: row.description,
    defaultBranch: row.default_branch,
    primaryLanguage: row.primary_language,
    topics: normalizeTopics(row.topics),
    updatedAtGithub: row.updated_at_github,
    pushedAtGithub: row.pushed_at_github,
    htmlUrl: row.html_url,
    homepageUrl: row.homepage_url,
    isArchived: row.is_archived,
    isFork: row.is_fork,
    stargazerCount: row.stargazer_count,
    lastSyncedAt: row.last_synced_at,
    syncSource: row.sync_source,
    hidden: row.hidden,
    pinned: row.pinned,
  };
}

function mapRepoMetadataRow(row: RepoMetadataRow): RepoMetadata {
  return {
    repositoryId: row.repository_id,
    goal: row.goal,
    statusOverride: row.status_override,
    notes: row.notes,
    nextStep: row.next_step,
    updatedAt: row.updated_at,
  };
}

function mapSyncStateRow(row: SyncStateRow): SyncState {
  return {
    key: row.key,
    lastSyncedAt: row.last_synced_at,
    status: row.status,
    message: row.message,
    updatedAt: row.updated_at,
  };
}

function formatSupabaseError(error: PostgrestError) {
  const parts = [error.message, error.details, error.hint].filter(
    (part): part is string => Boolean(part && String(part).trim()),
  );
  const base = parts.join(" — ").trim() || "Supabase request failed";
  return error.code ? `${base} (code ${error.code})` : base;
}

function assertNoError(error: PostgrestError | null) {
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export async function getDashboardData(): Promise<DashboardPayload> {
  const supabase = getSupabaseAdmin();

  const [repositoriesResult, metadataResult, syncStateResult] = await Promise.all([
    supabase
      .from("repositories")
      .select(
        "id, github_repo_id, name, full_name, owner_login, is_private, description, default_branch, primary_language, topics, updated_at_github, pushed_at_github, html_url, homepage_url, is_archived, is_fork, stargazer_count, last_synced_at, sync_source, hidden, pinned",
      )
      .order("pinned", { ascending: false })
      .order("pushed_at_github", { ascending: false, nullsFirst: false })
      .order("updated_at_github", { ascending: false, nullsFirst: false }),
    supabase
      .from("repo_metadata")
      .select("repository_id, goal, status_override, notes, next_step, updated_at"),
    supabase
      .from("sync_state")
      .select("key, last_synced_at, status, message, updated_at")
      .eq("key", GITHUB_SYNC_KEY)
      .maybeSingle(),
  ]);

  assertNoError(repositoriesResult.error);
  assertNoError(metadataResult.error);
  assertNoError(syncStateResult.error);

  const metadataByRepoId = new Map(
    (metadataResult.data ?? []).map((row) => {
      const metadata = mapRepoMetadataRow(row as RepoMetadataRow);
      return [metadata.repositoryId, metadata] as const;
    }),
  );

  const repos = (repositoriesResult.data ?? [])
    .map((row) => mapRepositoryRow(row as RepositoryRow))
    .filter((repo) => !repo.hidden)
    .map((repo) => enrichRepoWithStatus(repo, metadataByRepoId.get(repo.id) ?? null));

  return {
    repos,
    syncState: syncStateResult.data
      ? mapSyncStateRow(syncStateResult.data as SyncStateRow)
      : null,
  };
}

export async function getRepoMetadata(repositoryId: string) {
  const supabase = getSupabaseAdmin();
  const result = await supabase
    .from("repo_metadata")
    .select("repository_id, goal, status_override, notes, next_step, updated_at")
    .eq("repository_id", repositoryId)
    .maybeSingle();

  assertNoError(result.error);

  return result.data ? mapRepoMetadataRow(result.data as RepoMetadataRow) : null;
}

export async function upsertRepoMetadata(
  repositoryId: string,
  input: RepoMetadataInput,
) {
  const supabase = getSupabaseAdmin();

  const result = await supabase
    .from("repo_metadata")
    .upsert(
      {
        repository_id: repositoryId,
        goal: input.goal,
        status_override: input.statusOverride,
        notes: input.notes,
        next_step: input.nextStep,
      },
      {
        onConflict: "repository_id",
      },
    )
    .select("repository_id, goal, status_override, notes, next_step, updated_at")
    .single();

  assertNoError(result.error);

  return mapRepoMetadataRow(result.data as RepoMetadataRow);
}

export async function updateSyncState(
  input: Pick<SyncState, "lastSyncedAt" | "message" | "status">,
) {
  const supabase = getSupabaseAdmin();

  const result = await supabase
    .from("sync_state")
    .upsert(
      {
        key: GITHUB_SYNC_KEY,
        last_synced_at: input.lastSyncedAt,
        message: input.message,
        status: input.status,
      },
      {
        onConflict: "key",
      },
    )
    .select("key, last_synced_at, status, message, updated_at")
    .single();

  assertNoError(result.error);

  return mapSyncStateRow(result.data as SyncStateRow);
}

const UPSERT_CHUNK_SIZE = 100;

function mapRepoToRow(
  repo: GitHubRepositoryResponse,
  mode: GitHubSyncSummary["mode"],
  syncedAt: string,
) {
  return {
    github_repo_id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    owner_login: repo.owner.login,
    is_private: repo.private,
    description: repo.description,
    default_branch: repo.default_branch,
    primary_language: repo.language,
    topics: repo.topics ?? [],
    updated_at_github: repo.updated_at,
    pushed_at_github: repo.pushed_at,
    html_url: repo.html_url,
    homepage_url: repo.homepage,
    is_archived: repo.archived,
    is_fork: repo.fork,
    stargazer_count: repo.stargazers_count,
    last_synced_at: syncedAt,
    sync_source: mode,
  };
}

export async function upsertGitHubRepositories(
  repositories: GitHubRepositoryResponse[],
  mode: GitHubSyncSummary["mode"],
) {
  if (repositories.length === 0) {
    return {
      inserted: 0,
      updated: 0,
      skipped: 0,
      syncedAt: new Date().toISOString(),
    };
  }

  const supabase = getSupabaseAdmin();
  const syncedAt = new Date().toISOString();

  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < repositories.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = repositories.slice(i, i + UPSERT_CHUNK_SIZE);
    const chunkIds = chunk.map((repo) => repo.id);

    const existingResult = await supabase
      .from("repositories")
      .select("github_repo_id")
      .in("github_repo_id", chunkIds);

    assertNoError(existingResult.error);

    const existingIds = new Set(
      (existingResult.data ?? []).map((row) => row.github_repo_id as number),
    );

    const rows = chunk.map((repo) => mapRepoToRow(repo, mode, syncedAt));

    const upsertResult = await supabase
      .from("repositories")
      .upsert(rows, { onConflict: "github_repo_id" })
      .select("github_repo_id");

    assertNoError(upsertResult.error);

    const chunkInserted = rows.filter(
      (row) => !existingIds.has(row.github_repo_id),
    ).length;
    inserted += chunkInserted;
    updated += rows.length - chunkInserted;
  }

  return {
    inserted,
    updated,
    skipped: 0,
    syncedAt,
  };
}
