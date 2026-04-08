import { Gift } from "lucide-react";

import type { RewardView } from "@/lib/types/game";

export function RewardPanel({ rewards }: { rewards: RewardView[] }) {
  return (
    <div className="rounded-[2rem] border border-amber-200/80 bg-gradient-to-br from-amber-50 via-rose-50 to-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-amber-800">
        <Gift className="h-4 w-4" />
        <span>本局获得物品</span>
      </div>
      <div className="mt-4 grid gap-3">
        {rewards.length ? (
          rewards.map((reward) => (
            <article key={reward.item_id} className="rounded-2xl border border-amber-200/70 bg-white/85 p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold text-stone-900">{reward.name}</h4>
                <span className="text-xs uppercase tracking-[0.2em] text-stone-400">{reward.rarity}</span>
              </div>
              <p className="mt-2 text-sm text-stone-600">{reward.description}</p>
              <p className="mt-2 text-xs text-amber-800">{reward.reason}</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-stone-500">这次你只带回了经验和代价。</p>
        )}
      </div>
    </div>
  );
}
