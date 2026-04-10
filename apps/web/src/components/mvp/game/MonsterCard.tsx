import type { MonsterDefinition } from "@game-core/types/monster";

import { StatusPill, Surface, SurfaceHeader } from "@/components/mvp/ui/Surface";

type Props = {
  monster: MonsterDefinition;
  weaknessKnown?: boolean;
};

export function MonsterCard({ monster, weaknessKnown = false }: Props) {
  return (
    <Surface tone="danger" className="p-5">
      <SurfaceHeader
        eyebrow="Active Threat"
        title={monster.name}
        description={monster.behaviorDescription}
        action={<StatusPill>威胁 {monster.battleStats.threat}</StatusPill>}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill>{monster.type}</StatusPill>
        <StatusPill tone={weaknessKnown ? "success" : "default"}>{weaknessKnown ? "弱点已识破" : "弱点未确认"}</StatusPill>
      </div>
      <div className="mt-4 text-sm leading-7 text-slate-300">规则弱点：{weaknessKnown ? monster.ruleWeakness : "尚未识破"}</div>
    </Surface>
  );
}
