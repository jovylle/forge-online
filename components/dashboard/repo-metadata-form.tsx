"use client";

import { useState } from "react";

import type { DashboardRepo, RepoMetadataInput, RepoStatus } from "@/lib/types";

type RepoMetadataFormProps = {
  repo: DashboardRepo;
  onSave: (repoId: string, values: RepoMetadataInput) => Promise<void>;
};

type StatusValue = RepoStatus | "";

function toDraft(repo: DashboardRepo) {
  return {
    goal: repo.metadata?.goal ?? "",
    statusOverride: (repo.metadata?.statusOverride ?? "") as StatusValue,
    notes: repo.metadata?.notes ?? "",
    nextStep: repo.metadata?.nextStep ?? "",
  };
}

export function RepoMetadataForm({ repo, onSave }: RepoMetadataFormProps) {
  const [draft, setDraft] = useState(() => toDraft(repo));
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSaveMessage(null);
    setIsSaving(true);

    try {
      await onSave(repo.id, {
        goal: draft.goal.trim() || null,
        statusOverride: draft.statusOverride || null,
        notes: draft.notes.trim() || null,
        nextStep: draft.nextStep.trim() || null,
      });

      setSaveMessage("Saved");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
            Goal
          </span>
          <input
            value={draft.goal}
            onChange={(event) =>
              setDraft((current) => ({ ...current, goal: event.target.value }))
            }
            className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-cyan-400"
            placeholder="Why does this repo exist?"
            disabled={isSaving}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
            Manual status
          </span>
          <select
            value={draft.statusOverride}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                statusOverride: event.target.value as StatusValue,
              }))
            }
            className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-cyan-400"
            disabled={isSaving}
          >
            <option value="">Auto ({repo.effectiveStatus})</option>
            <option value="active">Active</option>
            <option value="wip">WIP</option>
            <option value="abandoned">Abandoned</option>
            <option value="done">Done</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
          Notes
        </span>
        <textarea
          value={draft.notes}
          onChange={(event) =>
            setDraft((current) => ({ ...current, notes: event.target.value }))
          }
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-cyan-400"
          placeholder="Anything worth remembering about the project."
          disabled={isSaving}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
          Next step
        </span>
        <input
          value={draft.nextStep}
          onChange={(event) =>
            setDraft((current) => ({ ...current, nextStep: event.target.value }))
          }
          className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-cyan-400"
          placeholder="The next concrete thing to do."
          disabled={isSaving}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <p className="text-zinc-500">
          Current status:{" "}
          <span className="font-medium text-zinc-300">
            {repo.effectiveStatus}
            {repo.statusSource === "manual" ? " (manual)" : " (auto)"}
          </span>
        </p>
        {saveMessage ? <p className="text-emerald-300">{saveMessage}</p> : null}
        {errorMessage ? <p className="text-rose-300">{errorMessage}</p> : null}
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save metadata"}
      </button>
    </form>
  );
}
