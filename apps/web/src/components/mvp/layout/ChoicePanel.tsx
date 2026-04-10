"use client";

import type { SceneActionSuggestion } from "@game-core/types/node";

import { InteractionList } from "@/components/mvp/game/InteractionList";
import { Surface, SurfaceHeader } from "@/components/mvp/ui/Surface";

type Props = {
  title?: string;
  actions: SceneActionSuggestion[];
  onCommand: (command: string) => void;
  description?: string;
  loading?: boolean;
  disabled?: boolean;
};

export function ChoicePanel({
  title = "直接选择",
  actions,
  onCommand,
  description = "你可以直接点击这些动作推进副本，不需要每次都先手动输入。",
  loading = false,
  disabled = false,
}: Props) {
  return (
    <Surface tone="soft" className="p-5">
      <SurfaceHeader
        eyebrow="Suggested Moves"
        title={title}
        description={loading ? "模型正在整理更贴近当前场景的下一步动作，你也可以先点下面的选项。" : description}
      />
      <div className="mt-4">
        <InteractionList actions={actions} onCommand={onCommand} disabled={disabled} />
      </div>
    </Surface>
  );
}
