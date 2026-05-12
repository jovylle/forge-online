import { getGitHubEnv } from "@/lib/env";
import { updateSyncState, upsertGitHubRepositories } from "@/lib/db";
import type { GitHubRepositoryResponse, GitHubSyncSummary } from "@/lib/types";

const GITHUB_API_URL = "https://api.github.com";
const PAGE_SIZE = 100;

export class GitHubApiError extends Error {
  status: number;
  userMessage: string;

  constructor(message: string, status: number, userMessage: string) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.userMessage = userMessage;
  }
}

function buildHeaders(token?: string) {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "forge-online",
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function requestGitHub<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    headers: buildHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    let userMessage = "GitHub request failed. Please try again.";

    if (response.status === 401) {
      userMessage = "GitHub rejected the configured token. Check GITHUB_TOKEN.";
    } else if (response.status === 403 || response.status === 429) {
      const remaining = response.headers.get("x-ratelimit-remaining");
      userMessage =
        remaining === "0"
          ? "GitHub rate limit reached. Wait a bit and try syncing again."
          : "GitHub temporarily refused the request. Try again in a few minutes.";
    } else if (response.status === 404) {
      userMessage =
        "GitHub could not find the configured account or endpoint. Check GITHUB_USERNAME.";
    }

    throw new GitHubApiError(
      `GitHub API request failed with status ${response.status}.`,
      response.status,
      userMessage,
    );
  }

  return response.json() as Promise<T>;
}

async function fetchAllPages(
  createPath: (page: number) => string,
  token?: string,
) {
  const results: GitHubRepositoryResponse[] = [];

  for (let page = 1; ; page += 1) {
    const pageItems = await requestGitHub<GitHubRepositoryResponse[]>(
      createPath(page),
      token,
    );

    results.push(...pageItems);

    if (pageItems.length < PAGE_SIZE) {
      break;
    }
  }

  return results;
}

export async function fetchOwnedRepositories() {
  const { GITHUB_TOKEN, GITHUB_USERNAME } = getGitHubEnv();

  if (GITHUB_TOKEN) {
    const repos = await fetchAllPages(
      (page) =>
        `/user/repos?affiliation=owner&visibility=all&sort=updated&per_page=${PAGE_SIZE}&page=${page}`,
      GITHUB_TOKEN,
    );

    return {
      mode: "token" as const,
      repos: repos.filter((repo) => repo.owner.login === GITHUB_USERNAME),
    };
  }

  const repos = await fetchAllPages(
    (page) =>
      `/users/${encodeURIComponent(GITHUB_USERNAME)}/repos?type=owner&sort=updated&per_page=${PAGE_SIZE}&page=${page}`,
  );

  return {
    mode: "public" as const,
    repos,
  };
}

export async function syncGitHubRepositories(): Promise<GitHubSyncSummary> {
  try {
    const { mode, repos } = await fetchOwnedRepositories();
    const upsertSummary = await upsertGitHubRepositories(repos, mode);
    const completedAt = upsertSummary.syncedAt;
    const message =
      repos.length === 0
        ? "No repositories were returned from GitHub."
        : `Synced ${repos.length} repositories from GitHub.`;

    await updateSyncState({
      lastSyncedAt: completedAt,
      status: "success",
      message,
    });

    return {
      inserted: upsertSummary.inserted,
      updated: upsertSummary.updated,
      skipped: upsertSummary.skipped,
      errors: 0,
      total: repos.length,
      mode,
      completedAt,
      message,
    };
  } catch (error) {
    const completedAt = new Date().toISOString();
    const message =
      error instanceof GitHubApiError
        ? error.userMessage
        : "GitHub sync failed unexpectedly. Check the server logs for details.";

    await updateSyncState({
      lastSyncedAt: completedAt,
      status: "error",
      message,
    });

    if (error instanceof GitHubApiError) {
      throw error;
    }

    throw new GitHubApiError(
      "Unexpected GitHub sync failure.",
      500,
      message,
    );
  }
}
