import type { RuleArchiveEntry } from "@game-core/types/rule";

import { StatusPill } from "@/components/mvp/ui/Surface";

type Props = {
  rule: RuleArchiveEntry;
  anomaly?: string | null;
};

const TYPE_LABELS: Record<RuleArchiveEntry["type"], string> = {
  explicit: "明规则",
  hidden: "暗规则",
  false: "伪规则",
  conditional: "条件规则",
};

export function RuleHintCard({ rule, anomaly }: Props) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[#0d141b] p-4 text-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">{rule.title}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusPill>{TYPE_LABELS[rule.type]}</StatusPill>
            <StatusPill>{rule.source}</StatusPill>
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-400">{Math.round(rule.confidence * 100)}%</div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-300">{rule.text}</p>
      {rule.contradictions.length > 0 ? <div className="mt-3 text-xs leading-6 text-slate-500">冲突来源：{rule.contradictions.join(" / ")}</div> : null}
      {anomaly ? <div className="mt-4 rounded-[16px] border border-amber-300/18 bg-amber-200/[0.08] px-3 py-3 text-xs leading-6 text-amber-50">{anomaly}</div> : null}
    </div>
  );
}
