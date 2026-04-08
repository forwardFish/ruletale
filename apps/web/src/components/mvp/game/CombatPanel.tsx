"use client";

import { Shield, Swords, TrendingDown, Zap } from "lucide-react";

import type { MvpCombatState } from "@/lib/types/game";

import { Button } from "@/components/mvp/ui/Button";
import { Surface, SurfaceHeader, StatusPill } from "@/components/mvp/ui/Surface";

import { EventFeed } from "./EventFeed";

type Props = {
  combat: MvpCombatState;
  onAction: (action: "attack" | "defend" | "flee" | "exploit_rule") => void;
};

const ACTIONS = [
  { id: "attack", label: "攻击", icon: Swords, variant: "secondary" as const },
  { id: "defend", label: "防御", icon: Shield, variant: "secondary" as const },
  { id: "flee", label: "撤离", icon: TrendingDown, variant: "secondary" as const },
  { id: "exploit_rule", label: "利用规则压制", icon: Zap, variant: "primary" as const },
] satisfies Array<{
  id: "attack" | "defend" | "flee" | "exploit_rule";
  label: string;
  icon: typeof Swords;
  variant: "primary" | "secondary";
}>;

export function CombatPanel({ combat, onAction }: Props) {
  return (
    <Surface tone="danger" className="p-5 md:p-6">
      <SurfaceHeader
        eyebrow="Combat State"
        title={combat.monsterId}
        description="战斗不是唯一答案，但你已经被逼进必须立刻作出反应的窄窗。先手、恐惧、规则弱点和逃离机会都会在这里重新洗牌。"
        action={<StatusPill tone="accent">第 {combat.round} 轮</StatusPill>}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {ACTIONS.map(({ id, label, icon: Icon, variant }) => (
          <Button
            key={id}
            type="button"
            variant={variant}
            disabled={id === "exploit_rule" && !combat.canExploitRule}
            onClick={() => onAction(id)}
            fullWidth
            className="justify-start gap-2 px-4"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      <div className="mt-5 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-xs leading-6 text-slate-400">
        只有在识破它的行为弱点后，“利用规则压制”才会变成稳定选项。否则它更可能把你的确认动作反过来当成入口。
      </div>

      <div className="mt-5">
        <EventFeed entries={combat.log.map((entry) => entry.text)} title="战斗日志" />
      </div>
    </Surface>
  );
}
