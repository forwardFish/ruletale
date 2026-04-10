import { ITEM_DEFINITIONS } from "@game-core/data/items";
import type { MvpProgressState } from "@game-core/types/game";

import { EmptyState } from "@/components/mvp/ui/EmptyState";
import { Surface, SurfaceHeader, StatusPill } from "@/components/mvp/ui/Surface";

export function RewardPreview({ progress }: { progress: MvpProgressState }) {
  return (
    <Surface tone="soft" className="p-5">
      <SurfaceHeader eyebrow="Recent Rewards" title="最近获得" description="这里展示你最近从副本带回大厅、并真正保留下来的东西。" />
      <div className="mt-4 space-y-3">
        {progress.recentRewards.length === 0 ? (
          <EmptyState title="还没有带回任何物品" description="先完成一轮探索，你的长期物品栏才会开始有真正可追踪的变化。" />
        ) : (
          progress.recentRewards.map((reward) => {
            const item = ITEM_DEFINITIONS[reward.itemId];
            return (
              <div key={`${reward.itemId}-${reward.reason}`} className="rounded-[18px] border border-white/10 bg-[#0d141b] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-100">{item?.name ?? reward.itemId}</div>
                  <StatusPill>{item?.rarity ?? "item"}</StatusPill>
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-400">{reward.reason}</div>
              </div>
            );
          })
        )}
      </div>
    </Surface>
  );
}
