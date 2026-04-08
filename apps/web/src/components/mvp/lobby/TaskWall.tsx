"use client";

import Image from "next/image";

import { Button } from "@/components/mvp/ui/Button";
import { EmptyState } from "@/components/mvp/ui/EmptyState";
import { Surface, SurfaceHeader, StatusPill } from "@/components/mvp/ui/Surface";

type DungeonCard = {
  id: string;
  title: string;
  subtitle: string;
  danger: string;
  recommendedStyle: string;
  locked: boolean;
  lockReason: string;
  statusLabel?: string;
  recommendationNote?: string;
  coverImage: string;
  riskLabel: string;
  ambientLine: string;
};

type Props = {
  dungeons: DungeonCard[];
  onEnter: (dungeonId: string) => void;
};

export function TaskWall({ dungeons, onEnter }: Props) {
  return (
    <Surface tone="default" className="border-white/12 p-5 md:p-6">
      <SurfaceHeader
        eyebrow="Available Dungeons"
        title="可进入副本"
        description="每一张卡片都是一个真正可进入的怪谈入口。图片负责氛围，说明负责提醒你它更擅长利用哪一类错误。"
      />

      <div className="mt-5">
        {dungeons.length === 0 ? (
          <EmptyState title="当前没有可见副本" description="大厅还没有向你展示新的可进入空间，可能是理解度、物品或结局条件尚未到位。" />
        ) : (
          <div className="grid gap-5">
            {dungeons.map((dungeon) => (
              <div
                key={dungeon.id}
                className={`group grid overflow-hidden rounded-[26px] border bg-[#111317] transition duration-200 md:grid-cols-[320px_minmax(0,1fr)] ${
                  dungeon.locked ? "border-white/10" : "border-white/12 hover:border-white/20 hover:bg-[#12151a]"
                }`}
              >
                <div className="relative min-h-[248px] border-b border-white/10 md:min-h-full md:border-b-0 md:border-r">
                  <Image src={dungeon.coverImage} alt={`${dungeon.title} 封面图`} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,9,0.08),rgba(9,9,9,0.34)_46%,rgba(9,9,9,0.74)_100%)]" />
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                    <StatusPill tone={dungeon.locked ? "default" : "accent"}>{dungeon.riskLabel}</StatusPill>
                    <StatusPill>{dungeon.statusLabel ?? (dungeon.locked ? "锁定" : "可进入")}</StatusPill>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="max-w-[18rem] rounded-[18px] border border-white/10 bg-black/35 p-4 backdrop-blur-sm">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Atmosphere</div>
                      <div className="mt-3 text-sm leading-7 text-slate-200">{dungeon.ambientLine}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">{dungeon.title}</div>
                      <div className="mt-2 text-sm leading-7 text-slate-400">{dungeon.subtitle}</div>
                    </div>
                    {dungeon.id === "black_zone_entry" ? <StatusPill>Long-term Gate</StatusPill> : null}
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">氛围与威胁</div>
                      <div className="mt-3 text-sm leading-7 text-slate-300">{dungeon.danger}</div>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">推荐玩法</div>
                      <div className="mt-3 text-sm leading-7 text-slate-300">{dungeon.recommendedStyle}</div>
                    </div>
                  </div>

                  {dungeon.recommendationNote ? <div className="mt-4 text-xs leading-6 text-amber-50/82">{dungeon.recommendationNote}</div> : null}
                  {dungeon.locked && dungeon.lockReason ? <div className="mt-2 text-xs leading-6 text-rose-100/78">{dungeon.lockReason}</div> : null}

                  <div className="mt-5 flex justify-end">
                    <Button type="button" variant={dungeon.locked ? "secondary" : "primary"} disabled={dungeon.locked} onClick={() => onEnter(dungeon.id)}>
                      {dungeon.id === "black_zone_entry" ? "查看入口状态" : "进入副本"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Surface>
  );
}
