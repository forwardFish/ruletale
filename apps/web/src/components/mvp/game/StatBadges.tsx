import type { MvpPlayerState } from "@game-core/types/game";

import { cn } from "@game-core/utils/cn";

type Props = {
  player: MvpPlayerState;
  compact?: boolean;
};

const PRIMARY_STATS: Array<{ key: keyof MvpPlayerState["visibleStats"]; label: string; tone: string }> = [
  { key: "HP", label: "HP", tone: "text-rose-100" },
  { key: "SAN", label: "SAN", tone: "text-cyan-100" },
  { key: "STA", label: "STA", tone: "text-emerald-100" },
  { key: "COG", label: "COG", tone: "text-amber-100" },
  { key: "COR", label: "COR", tone: "text-violet-100" },
];

export function StatBadges({ player, compact = false }: Props) {
  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-5")}>
      {PRIMARY_STATS.map((stat) => (
        <div key={stat.key} className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{stat.label}</div>
          <div className={cn("mt-2 text-xl font-semibold", stat.tone)}>{player.visibleStats[stat.key]}</div>
        </div>
      ))}
    </div>
  );
}
