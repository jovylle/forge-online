import type { DashboardRepo } from "@/lib/types";

type SummaryCardsProps = {
  repos: DashboardRepo[];
};

export function SummaryCards({ repos }: SummaryCardsProps) {
  const totals = repos.reduce(
    (accumulator, repo) => {
      accumulator.total += 1;
      accumulator[repo.effectiveStatus] += 1;

      if (repo.isPrivate) {
        accumulator.private += 1;
      } else {
        accumulator.public += 1;
      }

      return accumulator;
    },
    {
      total: 0,
      public: 0,
      private: 0,
      active: 0,
      wip: 0,
      abandoned: 0,
      done: 0,
    },
  );

  const cards = [
    {
      label: "Total repos",
      value: totals.total,
      hint: `${totals.public} public / ${totals.private} private`,
    },
    {
      label: "Active now",
      value: totals.active,
      hint: `${totals.wip} marked wip`,
    },
    {
      label: "Completed",
      value: totals.done,
      hint: `${totals.abandoned} abandoned`,
    },
    {
      label: "Private repos",
      value: totals.private,
      hint: "Only visible when a token is configured",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10"
        >
          <p className="text-sm text-zinc-400">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
          <p className="mt-2 text-sm text-zinc-500">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}
