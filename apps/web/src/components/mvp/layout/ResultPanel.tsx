"use client";

import { ArrowLeft, LockKeyhole, Trophy } from "lucide-react";

import { ITEM_DEFINITIONS } from "@/lib/data/items";
import type { SettlementResult } from "@/lib/types/score";

import { Button } from "@/components/mvp/ui/Button";
import { EmptyState } from "@/components/mvp/ui/EmptyState";
import { Surface, SurfaceHeader, StatusPill } from "@/components/mvp/ui/Surface";

type Props = {
  result: SettlementResult;
  onReturn: () => void;
};

const METRICS = [
  ["生存", "survival"],
  ["心理", "mental"],
  ["规则", "rules"],
  ["战斗", "combat"],
  ["抉择", "choice"],
  ["怪谈理解", "understanding"],
] as const;

export function ResultPanel({ result, onReturn }: Props) {
  return (
    <Surface tone="accent" className="overflow-hidden p-0">
      <div className="border-b border-white/10 px-6 py-6 md:px-7 md:py-7">
        <SurfaceHeader
          eyebrow="Settlement"
          title={result.endingTitle}
          description={result.summary}
          action={<StatusPill tone={result.blackZoneUnlocked ? "success" : "accent"}>{result.blackZoneUnlocked ? "黑区已解锁" : "结算完成"}</StatusPill>}
        />
      </div>

      <div className="px-6 py-6 md:px-7 md:py-7">
        <div className="grid gap-3 md:grid-cols-3">
          {METRICS.map(([label, key]) => (
            <div key={label} className="rounded-[20px] border border-white/10 bg-[#0d141b] p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-50">{result.grades[key]}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[20px] border border-white/10 bg-[#0d141b] p-4 text-sm leading-7 text-slate-300">
            <div>规则发现：{result.ruleCount}</div>
            <div>识破伪规则：{result.falseRuleBreaks}</div>
            <div>误入伪规则：{result.falseRuleTraps}</div>
            <div>战斗次数：{result.battleCount}</div>
            <div>理解度提升：+{result.understandingDelta}</div>
            <div>当前理解等级：{result.understandingLevelName}</div>
            <div>黑区状态：{result.blackZoneUnlocked ? "已解锁" : "未解锁"}</div>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-[#0d141b] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Trophy className="h-4 w-4 text-amber-200" />
              本局奖励
            </div>
            <div className="mt-4 space-y-3">
              {result.rewards.length === 0 ? (
                <EmptyState title="这次没有带回物品" description="你带回了变化，但没有带回可归档的实体奖励。" />
              ) : (
                result.rewards.map((reward) => {
                  const item = ITEM_DEFINITIONS[reward.itemId];
                  return (
                    <div key={reward.itemId} className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
                      <div className="font-medium text-slate-100">
                        {item?.name ?? reward.itemId} x{reward.quantity}
                      </div>
                      <div className="mt-2 text-xs leading-6 text-slate-400">{reward.reason}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {result.blackZoneProgressNotes.length > 0 ? (
          <div className="mt-6 rounded-[20px] border border-amber-300/18 bg-amber-200/[0.08] p-4 text-sm leading-7 text-amber-50">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <LockKeyhole className="h-4 w-4" />
              黑区推进
            </div>
            {result.blackZoneProgressNotes.map((note) => (
              <div key={note}>{note}</div>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button type="button" variant="secondary" onClick={onReturn} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回大厅
          </Button>
        </div>
      </div>
    </Surface>
  );
}
