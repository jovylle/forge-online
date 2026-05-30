import Link from "next/link";

import { fetchPublicRepositoriesByUsername, GitHubApiError } from "@/lib/github";
import { deriveAutoStatus } from "@/lib/status";
import type { RepositoryRecord } from "@/lib/types";

type GuestPageProps = {
  params: Promise<{
    username: string;
  }>;
};

function toRepositoryRecord(
  repo: Awaited<ReturnType<typeof fetchPublicRepositoriesByUsername>>[number],
): RepositoryRecord {
  return {
    id: String(repo.id),
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
    lastSyncedAt: null,
    syncSource: "public",
    hidden: false,
    pinned: false,
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function GuestDashboardPage({ params }: GuestPageProps) {
  const { username } = await params;
  let mapped: Array<{ record: RepositoryRecord; status: string }> = [];
  let message: string | null = null;

  try {
    const repos = await fetchPublicRepositoriesByUsername(username);
    mapped = repos.map((repo) => {
      const record = toRepositoryRecord(repo);
      return {
        record,
        status: deriveAutoStatus(record),
      };
    });
  } catch (error) {
    message =
      error instanceof GitHubApiError
        ? error.userMessage
        : error instanceof Error
          ? error.message
          : "Failed to load guest repositories.";
  }

  if (message) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,_#09090b,_#111827_40%,_#020617)] px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-8">
          <h1 className="text-2xl font-semibold text-white">Guest dashboard failed</h1>
          <p className="mt-3 text-sm leading-6 text-rose-100">{message}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(180deg,_#09090b,_#111827_40%,_#020617)] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
                Guest mode
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Public repositories for @{username}
              </h1>
              <p className="max-w-3xl text-sm text-zinc-300">
                Viewing public repositories only. Sign in with GitHub to include
                private repos and save Forge metadata.
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-300"
            >
              Sign in with GitHub
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
          Found <span className="font-semibold text-white">{mapped.length}</span>{" "}
          public repositories.
        </section>

        <section className="grid gap-4">
          {mapped.map(({ record, status }) => (
            <article
              key={record.githubRepoId}
              className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-xl shadow-black/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white">{record.name}</h2>
                  <p className="text-sm text-zinc-400">{record.fullName}</p>
                  <p className="text-sm text-zinc-300">
                    {record.description ?? "No description provided."}
                  </p>
                </div>
                <a
                  href={record.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
                >
                  Open GitHub
                </a>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 xl:grid-cols-5">
                <p>
                  <span className="text-zinc-500">Status:</span> {status}
                </p>
                <p>
                  <span className="text-zinc-500">Created:</span>{" "}
                  {formatDate(record.createdAtGithub)}
                </p>
                <p>
                  <span className="text-zinc-500">Updated:</span>{" "}
                  {formatDate(record.updatedAtGithub)}
                </p>
                <p>
                  <span className="text-zinc-500">Pushed:</span>{" "}
                  {formatDate(record.pushedAtGithub)}
                </p>
                <p>
                  <span className="text-zinc-500">Stars:</span> {record.stargazerCount}
                </p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
