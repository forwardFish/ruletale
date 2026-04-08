import type { VisibleStats } from "@/lib/types/game";

const primaryStats: Array<keyof VisibleStats> = ["hp", "san", "sta", "cog", "cor"];

export function StatBadges({ stats }: { stats: VisibleStats }) {
  return (
    <div className="flex flex-wrap gap-2">
      {primaryStats.map((key) => (
        <div key={key} className="rounded-full border border-stone-300/70 bg-white/80 px-3 py-1.5 text-sm text-stone-700 shadow-sm">
          <span className="uppercase tracking-[0.2em] text-stone-400">{key}</span>
          <strong className="ml-2 text-stone-900">{stats[key]}</strong>
        </div>
      ))}
    </div>
  );
}
