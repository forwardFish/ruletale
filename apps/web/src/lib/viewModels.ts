import {
  formatChoiceKind,
  formatCombatAction,
  getDungeonCopy,
  getDungeonDangerTone,
  getSettlementMood,
  hallModuleCopy,
  hallModuleOrder,
} from "@/lib/copy";
import { extractActiveRun, isRunInProgress } from "@/lib/gameState";
import type {
  ArchivesView,
  DrawerTab,
  HallModuleId,
  HallView,
  InventoryItemView,
  RunSnapshot,
  SceneView,
  SessionSnapshot,
  SettlementView,
} from "@/lib/types/game";

export type HallViewModel = {
  booting: boolean;
  loading: boolean;
  error: string | null;
  sessionId: string | null;
  activePanel: HallModuleId | null;
  loadingTarget: string | null;
  lastNarrative: string;
  canContinue: boolean;
  primaryActions: Array<{
    id: "continue" | "task_wall" | "backpack";
    label: string;
    tone: "primary" | "secondary";
  }>;
  dockModules: Array<{
    moduleId: HallModuleId;
    label: string;
    action: string;
    locked: boolean;
    active: boolean;
  }>;
  dungeonCards: Array<{
    dungeonId: string;
    title: string;
    hook: string;
    danger: string;
    button: string;
    tone: string;
    locked: boolean;
  }>;
  inventory: InventoryItemView[];
  archives: Pick<ArchivesView, "rules" | "notebook_entries" | "recent_rewards">;
  understanding: HallView["understanding"] | null;
  contamination: number;
  archiveCount: number;
  recentRewards: HallView["recent_rewards"];
  settlement: SettlementView | null;
  hallSummary: string;
  settlementMood: string;
};

export type DungeonViewModel = {
  booting: boolean;
  loading: boolean;
  error: string | null;
  sessionId: string;
  activeDrawer: DrawerTab;
  showComposer: boolean;
  actionText: string;
  activeCombat: boolean;
  lastNarrative: string;
  scene: SceneView | null;
  run: RunSnapshot | null;
  settlement: SettlementView | null;
  primaryActions: Array<{
    id: string;
    eyebrow: string;
    label: string;
    detail: string;
    value: string;
    tone: "choice" | "combat" | "settlement";
  }>;
  inventory: InventoryItemView[];
  rules: ArchivesView["rules"];
  notebookEntries: ArchivesView["notebook_entries"];
  recentRewards: ArchivesView["recent_rewards"];
  understanding: SessionSnapshot["player"]["understanding"] | null;
  visibleStats: SessionSnapshot["player"]["visible_stats"] | null;
  monster: {
    name: string;
    weaknessKnown: boolean;
    reason: string | null;
  } | null;
};

export function buildHallViewModel({
  booting,
  loading,
  error,
  activePanel,
  loadingTarget,
  lastNarrative,
  session,
  hall,
  archives,
}: {
  booting: boolean;
  loading: boolean;
  error: string | null;
  activePanel: HallModuleId | null;
  loadingTarget: string | null;
  lastNarrative: string;
  session: SessionSnapshot | null;
  hall: HallView | null;
  archives: ArchivesView | null;
}): HallViewModel {
  const activeRun = extractActiveRun(session);
  const canContinue = isRunInProgress(activeRun);

  return {
    booting,
    loading,
    error,
    sessionId: session?.session_id ?? null,
    activePanel,
    loadingTarget,
    lastNarrative,
    canContinue,
    primaryActions: [
      {
        id: canContinue ? "continue" : "task_wall",
        label: canContinue ? "继续深入" : "查看任务墙",
        tone: "primary",
      },
      {
        id: "backpack",
        label: "翻看背包",
        tone: "secondary",
      },
    ],
    dockModules: hallModuleOrder.map((moduleId) => {
      const module = hall?.modules.find((item) => item.module_id === moduleId);
      return {
        moduleId,
        label: module?.title ?? hallModuleCopy[moduleId].label,
        action: hallModuleCopy[moduleId].action,
        locked: module?.locked ?? false,
        active: activePanel === moduleId,
      };
    }),
    dungeonCards: (hall?.available_dungeons ?? []).map((card) => {
      const copy = getDungeonCopy(card);
      return {
        dungeonId: card.dungeon_id,
        title: card.title,
        hook: copy.hook,
        danger: copy.danger,
        button: copy.button,
        tone: getDungeonDangerTone(card),
        locked: card.locked,
      };
    }),
    inventory: session?.player.inventory ?? [],
    archives: {
      rules: archives?.rules ?? [],
      notebook_entries: archives?.notebook_entries ?? [],
      recent_rewards: archives?.recent_rewards ?? [],
    },
    understanding: hall?.understanding ?? session?.player.understanding ?? null,
    contamination: hall?.contamination ?? 0,
    archiveCount: hall?.archive_count ?? archives?.rules.length ?? 0,
    recentRewards: hall?.recent_rewards ?? session?.player.recent_rewards ?? [],
    settlement: session?.last_settlement ?? null,
    hallSummary: hall?.narrative ?? "大厅会先记住你是从哪一扇门回来的。",
    settlementMood: getSettlementMood(session?.last_settlement ?? null),
  };
}

export function buildDungeonViewModel({
  booting,
  loading,
  error,
  activeDrawer,
  showComposer,
  actionText,
  lastNarrative,
  sessionId,
  session,
  run,
  scene,
  archives,
  settlement,
}: {
  booting: boolean;
  loading: boolean;
  error: string | null;
  activeDrawer: DrawerTab;
  showComposer: boolean;
  actionText: string;
  lastNarrative: string;
  sessionId: string;
  session: SessionSnapshot | null;
  run: RunSnapshot | null;
  scene: SceneView | null;
  archives: ArchivesView | null;
  settlement: SettlementView | null;
}): DungeonViewModel {
  const primaryActions = settlement
    ? [
        {
          id: "return-hall",
          eyebrow: "回到大厅前",
          label: settlement.dungeon_title,
          detail: settlement.summary,
          value: "return-hall",
          tone: "settlement" as const,
        },
      ]
    : run?.combat?.active
      ? (run.combat.options ?? ["avoid", "probe", "fight", "flee", "exploit_rule"]).map((action) => ({
          id: action,
          eyebrow: formatCombatAction(action),
          label: run.combat.monster_name ?? "未知怪异",
          detail: run.combat.weakness_known
            ? "你已经摸到它退让的规则，现在关键是顺序和代价。"
            : "弱点还没有完全显形，仓促硬拼通常不是最优解。",
          value: action,
          tone: "combat" as const,
        }))
      : (scene?.suggested_actions ?? []).slice(0, 5).map((choice) => ({
          id: choice.choice_id,
          eyebrow: formatChoiceKind(choice.kind),
          label: choice.label,
          detail: choice.reason,
          value: choice.action_text,
          tone: "choice" as const,
        }));

  return {
    booting,
    loading,
    error,
    sessionId,
    activeDrawer,
    showComposer,
    actionText,
    activeCombat: Boolean(run?.combat?.active),
    lastNarrative,
    scene,
    run,
    settlement,
    primaryActions,
    inventory: session?.player.inventory ?? [],
    rules: archives?.rules ?? [],
    notebookEntries: archives?.notebook_entries ?? [],
    recentRewards: archives?.recent_rewards ?? [],
    understanding: session?.player.understanding ?? null,
    visibleStats: session?.player.visible_stats ?? null,
    monster: run?.combat?.active
      ? {
          name: run.combat.monster_name ?? "未知怪异",
          weaknessKnown: Boolean(run.combat.weakness_known),
          reason: run.combat.reason ?? null,
        }
      : null,
  };
}
