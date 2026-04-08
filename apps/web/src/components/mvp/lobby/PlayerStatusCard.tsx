import type { MvpPlayerState } from "@/lib/types/game";

import { UnderstandingProgress } from "@/components/mvp/game/UnderstandingProgress";
import { Surface, SurfaceHeader, StatusPill } from "@/components/mvp/ui/Surface";

type Props = {
  player: MvpPlayerState;
  behaviorLabel: string;
  unlockedArchiveCount: number;
};

export function PlayerStatusCard({ player, behaviorLabel, unlockedArchiveCount }: Props) {
  return (
    <Surface tone="default" className="border-white/12 p-5">
      <SurfaceHeader
        eyebrow="Player Status"
        title="玩家状态"
        description="这里展示会持续影响后续副本体验的长期状态，而不是一次性的副本读数。"
        action={<StatusPill tone="accent">{behaviorLabel}</StatusPill>}
      />
      <div className="mt-4">
        <UnderstandingProgress total={player.understanding} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[20px] border border-white/10 bg-[#0d1115] p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">污染值</div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">{player.contamination}</div>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-[#0d1115] p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">已解锁档案</div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">{unlockedArchiveCount}</div>
        </div>
      </div>
      <div className="mt-4 rounded-[20px] border border-white/10 bg-[#0d1115] p-4 text-sm leading-7 text-slate-400">
        当前世界状态会受理解度、污染和行为画像共同影响。大厅只负责把它们整理出来，不替你消除。
      </div>
    </Surface>
  );
}
