import type { SortOption, StatusFilter, VisibilityFilter } from "@/lib/types";

type RepoToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  visibilityFilter: VisibilityFilter;
  onVisibilityFilterChange: (value: VisibilityFilter) => void;
  sortBy: SortOption;
  onSortByChange: (value: SortOption) => void;
};

export function RepoToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  visibilityFilter,
  onVisibilityFilterChange,
  sortBy,
  onSortByChange,
}: RepoToolbarProps) {
  return (
    <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
          Search
        </span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search name, description, topic, language, goal, notes..."
          className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-cyan-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
          Status
        </span>
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as StatusFilter)}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-cyan-400"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="wip">WIP</option>
          <option value="abandoned">Abandoned</option>
          <option value="done">Done</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
          Visibility
        </span>
        <select
          value={visibilityFilter}
          onChange={(event) =>
            onVisibilityFilterChange(event.target.value as VisibilityFilter)
          }
          className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-cyan-400"
        >
          <option value="all">All repos</option>
          <option value="public">Public only</option>
          <option value="private">Private only</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
          Sort
        </span>
        <select
          value={sortBy}
          onChange={(event) => onSortByChange(event.target.value as SortOption)}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-cyan-400"
        >
          <option value="pushed">Pushed date</option>
          <option value="updated">Updated date</option>
          <option value="name">Name</option>
          <option value="status">Status</option>
        </select>
      </label>
    </div>
  );
}
