export const STATUS_VALUES = ["active", "wip", "abandoned", "done"] as const;

export type RepoStatus = (typeof STATUS_VALUES)[number];

export type SortOption = "pushed" | "updated" | "name" | "status";
export type VisibilityFilter = "all" | "public" | "private";
export type StatusFilter = "all" | RepoStatus;

export interface SessionUser {
  username: string;
}

export interface RepoMetadata {
  repositoryId: string;
  goal: string | null;
  statusOverride: RepoStatus | null;
  notes: string | null;
  nextStep: string | null;
  updatedAt: string | null;
}

export interface RepositoryRecord {
  id: string;
  githubRepoId: number;
  name: string;
  fullName: string;
  ownerLogin: string;
  isPrivate: boolean;
  description: string | null;
  defaultBranch: string | null;
  primaryLanguage: string | null;
  topics: string[];
  updatedAtGithub: string | null;
  pushedAtGithub: string | null;
  htmlUrl: string;
  homepageUrl: string | null;
  isArchived: boolean;
  isFork: boolean;
  stargazerCount: number;
  lastSyncedAt: string | null;
  syncSource: "public" | "token";
  hidden: boolean;
  pinned: boolean;
}

export interface DashboardRepo extends RepositoryRecord {
  metadata: RepoMetadata | null;
  effectiveStatus: RepoStatus;
  statusSource: "auto" | "manual";
}

export interface SyncState {
  key: string;
  lastSyncedAt: string | null;
  status: "idle" | "success" | "error";
  message: string | null;
  updatedAt: string | null;
}

export interface DashboardPayload {
  repos: DashboardRepo[];
  syncState: SyncState | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RepoMetadataInput {
  goal: string | null;
  statusOverride: RepoStatus | null;
  notes: string | null;
  nextStep: string | null;
}

export interface GitHubRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  default_branch: string | null;
  language: string | null;
  topics?: string[];
  updated_at: string;
  pushed_at: string | null;
  html_url: string;
  homepage: string | null;
  archived: boolean;
  fork: boolean;
  stargazers_count: number;
  owner: {
    login: string;
  };
}

export interface GitHubSyncSummary {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  total: number;
  mode: "public" | "token";
  completedAt: string;
  message: string;
}
