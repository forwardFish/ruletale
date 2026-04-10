"use client";

import Image from "next/image";

import { ITEM_DEFINITIONS } from "@game-core/data/items";
import type { MvpPlayerState, MvpProgressState } from "@game-core/types/game";
import type { InventoryEntry } from "@game-core/types/inventory";

import { Button } from "@/components/mvp/ui/Button";
import { Surface, StatusPill } from "@/components/mvp/ui/Surface";

type Props = {
  player: MvpPlayerState;
  progress: MvpProgressState;
  inventory: InventoryEntry[];
  behaviorLabel: string;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
};

export function LobbyHero({ player, progress, inventory, behaviorLabel, onPrimaryAction, onSecondaryAction }: Props) {
  const recentReward = progress.recentRewards[0];

  return (
    <Surface tone="hero" className="overflow-hidden border-white/12 p-0">
      <div className="grid gap-0 lg:grid-cols-[1.06fr_0.94fr]">
        <div className="flex flex-col justify-between p-6 md:p-8">
          <div>
            <StatusPill tone="accent">Rule Horror Hall</StatusPill>
            <h1 className="mt-5 max-w-3xl text-[2.7rem] font-semibold leading-[0.95] tracking-tight text-slate-50 md:text-[4rem]">
              大厅不是安全区，
              <br />
              它只会记住你的判断。
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-300 md:text-[15px]">
              这里是所有怪谈副本之间的缓冲层，也是外层叙事本身。每一次误判、每一次识破、每一次带回大厅的物品与碎片，
              都会被这处空间重新整理，然后在下一次探索前原样还给你。
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={onPrimaryAction}>
                继续探索
              </Button>
              <Button variant="secondary" onClick={onSecondaryAction}>
                打开背包
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">理解度</div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">{player.understanding}</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">污染值</div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">{player.contamination}</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">行为标签</div>
                <div className="mt-2 text-lg font-semibold text-slate-50">{behaviorLabel}</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">最近奖励</div>
                <div className="mt-2 text-sm font-medium text-slate-100">{recentReward ? ITEM_DEFINITIONS[recentReward.itemId]?.name ?? recentReward.itemId : "暂无"}</div>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-400">
              当前已带回 {inventory.reduce((sum, item) => sum + item.quantity, 0)} 件物品，已沉淀 {progress.archive.adminFragments.length} 条管理员碎片。
            </div>
          </div>
        </div>

        <div className="relative min-h-[320px] overflow-hidden border-t border-white/10 lg:min-h-[560px] lg:border-l lg:border-t-0">
          <Image src="/mvp/hall-hero.svg" alt="怪谈大厅氛围图" fill className="object-cover object-center" priority />
          <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(9,9,9,0.08),rgba(9,9,9,0.24)_34%,rgba(9,9,9,0.86)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
            <div className="w-full max-w-sm rounded-[24px] border border-white/10 bg-black/50 p-4 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Atmosphere</div>
              <div className="mt-3 text-base font-semibold text-slate-50">旧秩序仍在运转，只是已经不再完全为活人服务。</div>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                这张图不是海报，而是大厅的情绪底板：低照明、深暗部、局部红色高亮，以及一条把视线往更深处拉过去的秩序轴线。
              </p>
            </div>
          </div>
        </div>
      </div>
    </Surface>
  );
}
