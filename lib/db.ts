import { getStore } from "@netlify/blobs";

import { ConfigError } from "@/lib/env";
import { enrichRepoWithStatus } from "@/lib/status";
import type {
  DashboardPayload,
  GitHubRepositoryResponse,
  GitHubSyncSummary,
  RepoMetadata,
  RepoMetadataInput,
  RepositoryRecord,
  SessionUser,
  SyncState,
} from "@/lib/types";

const STORE_NAME = "forge-online";
const SYNC_STATE_KEY = "state.json";

type StoredRepository = RepositoryRecord;

function getBlobsStore() {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID?.trim();
  const token = process.env.NETLIFY_BLOBS_TOKEN?.trim();

  if (siteID && token) {
    return getStore(STORE_NAME, { siteID, token });
  }

  return getStore(STORE_NAME);
}

function getUserBasePath(user: SessionUser) {
  const encodedUserId = encodeURIComponent(user.githubUserId);
  return `users/${encodedUserId}`;
}

function getRepoKey(user: SessionUser, repoId: string) {
  return `${getUserBasePath(user)}/repos/${repoId}.json`;
}

function getMetadataKey(user: SessionUser, repoId: string) {
  return `${getUserBasePath(user)}/metadata/${repoId}.json`;
}

function getSyncStateKey(user: SessionUser) {
  return `${getUserBasePath(user)}/sync/${SYNC_STATE_KEY}`;
}

function getPrefixForRepos(user: SessionUser) {
  return `${getUserBasePath(user)}/repos/`;
}

function getPrefixForMetadata(user: SessionUser) {
  return `${getUserBasePath(user)}/metadata/`;
}

function parseRepoIdFromKey(key: string) {
  const lastSegment = key.split("/").pop();
  if (!lastSegment || !lastSegment.endsWith(".json")) {
    return null;
  }

  return lastSegment.slice(0, -".json".length);
}

async function listAllBlobKeys(prefix: string) {
  const store = getBlobsStore();
  const keys: string[] = [];

  for await (const page of store.list({ prefix, paginate: true })) {
    for (const blob of page.blobs) {
      keys.push(blob.key);
    }
  }

  return keys;
}

async function readBlobJson<T>(key: string) {
  const store = getBlobsStore();
  return (await store.get(key, { type: "json" })) as T | null;
}

async function writeBlobJson(key: string, value: unknown) {
  const store = getBlobsStore();
  await store.setJSON(key, value);
}

function asRepositoryRecord(value: unknown): RepositoryRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const repo = value as Partial<StoredRepository>;
  if (
    typeof repo.id !== "string" ||
    typeof repo.githubRepoId !== "number" ||
    typeof repo.name !== "string" ||
    typeof repo.fullName !== "string" ||
    typeof repo.ownerLogin !== "string" ||
    typeof repo.isPrivate !== "boolean" ||
    typeof repo.htmlUrl !== "string" ||
    typeof repo.isArchived !== "boolean" ||
    typeof repo.isFork !== "boolean" ||
    typeof repo.stargazerCount !== "number" ||
    typeof repo.syncSource !== "string" ||
    typeof repo.hidden !== "boolean" ||
    typeof repo.pinned !== "boolean"
  ) {
    return null;
  }

  return {
    id: repo.id,
    githubRepoId: repo.githubRepoId,
    name: repo.name,
    fullName: repo.fullName,
    ownerLogin: repo.ownerLogin,
    isPrivate: repo.isPrivate,
    description: repo.description ?? null,
    defaultBranch: repo.defaultBranch ?? null,
    primaryLanguage: repo.primaryLanguage ?? null,
    topics: Array.isArray(repo.topics)
      ? repo.topics.filter((entry): entry is string => typeof entry === "string")
      : [],
    createdAtGithub: repo.createdAtGithub ?? null,
    updatedAtGithub: repo.updatedAtGithub ?? null,
    pushedAtGithub: repo.pushedAtGithub ?? null,
    htmlUrl: repo.htmlUrl,
    homepageUrl: repo.homepageUrl ?? null,
    isArchived: repo.isArchived,
    isFork: repo.isFork,
    stargazerCount: repo.stargazerCount,
    lastSyncedAt: repo.lastSyncedAt ?? null,
    syncSource: repo.syncSource === "public" ? "public" : "token",
    hidden: repo.hidden,
    pinned: repo.pinned,
  };
}

function asRepoMetadata(value: unknown): RepoMetadata | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const metadata = value as Partial<RepoMetadata>;
  if (typeof metadata.repositoryId !== "string") {
    return null;
  }

  return {
    repositoryId: metadata.repositoryId,
    goal: metadata.goal ?? null,
    statusOverride:
      metadata.statusOverride === "active" ||
      metadata.statusOverride === "wip" ||
      metadata.statusOverride === "abandoned" ||
      metadata.statusOverride === "done"
        ? metadata.statusOverride
        : null,
    notes: metadata.notes ?? null,
    nextStep: metadata.nextStep ?? null,
    updatedAt: metadata.updatedAt ?? null,
  };
}

function asSyncState(value: unknown): SyncState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const state = value as Partial<SyncState>;
  if (
    typeof state.key !== "string" ||
    (state.status !== "idle" && state.status !== "success" && state.status !== "error")
  ) {
    return null;
  }

  return {
    key: state.key,
    lastSyncedAt: state.lastSyncedAt ?? null,
    status: state.status,
    message: state.message ?? null,
    updatedAt: state.updatedAt ?? null,
  };
}

function mapRepoToRecord(
  repo: GitHubRepositoryResponse,
  mode: GitHubSyncSummary["mode"],
  syncedAt: string,
) {
  const stableId = String(repo.id);

  return {
    id: stableId,
    githubRepoId: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    ownerLogin: repo.owner.login,
    isPrivate: repo.private,
    description: repo.description,
    defaultBranch: repo.default_branch,
    primaryLanguage: repo.language,
    topics: repo.topics ?? [],
    createdAtGithub: repo.created_at ?? null,
    updatedAtGithub: repo.updated_at,
    pushedAtGithub: repo.pushed_at,
    htmlUrl: repo.html_url,
    homepageUrl: repo.homepage,
    isArchived: repo.archived,
    isFork: repo.fork,
    stargazerCount: repo.stargazers_count,
    lastSyncedAt: syncedAt,
    syncSource: mode,
    hidden: false,
    pinned: false,
  } satisfies StoredRepository;
}

function sortRepositories(left: RepositoryRecord, right: RepositoryRecord) {
  if (left.pinned !== right.pinned) {
    return left.pinned ? -1 : 1;
  }

  const pushedLeft = Date.parse(left.pushedAtGithub ?? "");
  const pushedRight = Date.parse(right.pushedAtGithub ?? "");
  const pushedDelta =
    (Number.isNaN(pushedRight) ? 0 : pushedRight) -
    (Number.isNaN(pushedLeft) ? 0 : pushedLeft);

  if (pushedDelta !== 0) {
    return pushedDelta;
  }

  const updatedLeft = Date.parse(left.updatedAtGithub ?? "");
  const updatedRight = Date.parse(right.updatedAtGithub ?? "");
  return (
    (Number.isNaN(updatedRight) ? 0 : updatedRight) -
    (Number.isNaN(updatedLeft) ? 0 : updatedLeft)
  );
}

export async function getDashboardData(user: SessionUser): Promise<DashboardPayload> {
  try {
    const [repoKeys, metadataKeys, rawSyncState] = await Promise.all([
      listAllBlobKeys(getPrefixForRepos(user)),
      listAllBlobKeys(getPrefixForMetadata(user)),
      readBlobJson<unknown>(getSyncStateKey(user)),
    ]);

    const [rawRepos, rawMetadata] = await Promise.all([
      Promise.all(repoKeys.map((key) => readBlobJson<unknown>(key))),
      Promise.all(metadataKeys.map((key) => readBlobJson<unknown>(key))),
    ]);

    const metadataByRepoId = new Map<string, RepoMetadata>();
    for (const entry of rawMetadata) {
      const metadata = asRepoMetadata(entry);
      if (metadata) {
        metadataByRepoId.set(metadata.repositoryId, metadata);
      }
    }

    const repos = rawRepos
      .map((entry) => asRepositoryRecord(entry))
      .filter((entry): entry is RepositoryRecord => Boolean(entry))
      .filter((repo) => !repo.hidden)
      .sort(sortRepositories)
      .map((repo) =>
        enrichRepoWithStatus(repo, metadataByRepoId.get(repo.id) ?? null),
      );

    return {
      repos,
      syncState: asSyncState(rawSyncState),
    };
  } catch (error) {
    console.error("[blobs] Failed to load dashboard data", error);
    throw new ConfigError(
      `Netlify Blobs request failed while loading dashboard data. ${error instanceof Error ? error.message : ""}`.trim(),
    );
  }
}

export async function getRepoMetadata(user: SessionUser, repositoryId: string) {
  const metadata = await readBlobJson<unknown>(getMetadataKey(user, repositoryId));
  return asRepoMetadata(metadata);
}

export async function upsertRepoMetadata(
  user: SessionUser,
  repositoryId: string,
  input: RepoMetadataInput,
) {
  const value: RepoMetadata = {
    repositoryId,
    goal: input.goal,
    statusOverride: input.statusOverride,
    notes: input.notes,
    nextStep: input.nextStep,
    updatedAt: new Date().toISOString(),
  };

  await writeBlobJson(getMetadataKey(user, repositoryId), value);
  return value;
}

export async function updateSyncState(
  user: SessionUser,
  input: Pick<SyncState, "lastSyncedAt" | "message" | "status">,
) {
  const value: SyncState = {
    key: "github",
    lastSyncedAt: input.lastSyncedAt,
    status: input.status,
    message: input.message,
    updatedAt: new Date().toISOString(),
  };

  await writeBlobJson(getSyncStateKey(user), value);
  return value;
}

export async function upsertGitHubRepositories(
  user: SessionUser,
  repositories: GitHubRepositoryResponse[],
  mode: GitHubSyncSummary["mode"],
) {
  const syncedAt = new Date().toISOString();
  const existingKeys = await listAllBlobKeys(getPrefixForRepos(user));
  const existingRepoIds = new Set(
    existingKeys
      .map((key) => parseRepoIdFromKey(key))
      .filter((entry): entry is string => Boolean(entry)),
  );

  let inserted = 0;
  let updated = 0;

  await Promise.all(
    repositories.map(async (repo) => {
      const repoId = String(repo.id);
      const row = mapRepoToRecord(repo, mode, syncedAt);

      await writeBlobJson(getRepoKey(user, repoId), row);

      if (existingRepoIds.has(repoId)) {
        updated += 1;
      } else {
        inserted += 1;
      }
    }),
  );

  return {
    inserted,
    updated,
    skipped: 0,
    syncedAt,
  };
}
