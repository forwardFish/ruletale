import type { RuleArchiveEntry } from "@game-core/types/rule";

import { getFalseRuleAnomaly } from "@game-core/engine/understandingEngine";
import { EmptyState } from "@/components/mvp/ui/EmptyState";

import { RuleHintCard } from "@/components/mvp/game/RuleHintCard";

type Props = {
  rules: RuleArchiveEntry[];
  understanding: number;
};

export function ArchivePanel({ rules, understanding }: Props) {
  return (
    <div className="space-y-3">
      {rules.length === 0 ? (
        <EmptyState title="还没有带回规则记录" description="你发现过异常，但还没有把足够稳定的规则线索带回大厅归档。" />
      ) : (
        rules.map((rule) => <RuleHintCard key={rule.id} rule={rule} anomaly={getFalseRuleAnomaly(rule, understanding)} />)
      )}
    </div>
  );
}
