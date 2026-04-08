"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Compass, Package2, ShieldAlert, Sparkles } from "lucide-react";

import { MONSTERS } from "@/lib/data/monsters";
import { parseInput } from "@/lib/engine/inputParser";
import { buildSceneNode, getDungeonConfig, getNode } from "@/lib/engine/nodeEngine";
import type { DeepseekSceneRequest, DeepseekSceneResponse } from "@/lib/types/assistant";
import type { SceneActionSuggestion } from "@/lib/types/node";
import { ArchivePanel } from "@/components/mvp/layout/ArchivePanel";
import { ChoicePanel } from "@/components/mvp/layout/ChoicePanel";
import { GameShell } from "@/components/mvp/layout/GameShell";
import { InputPanel } from "@/components/mvp/layout/InputPanel";
import { ResultPanel } from "@/components/mvp/layout/ResultPanel";
import { ScenePanel } from "@/components/mvp/layout/ScenePanel";
import { SidePanel } from "@/components/mvp/layout/SidePanel";
import { TopStatusBar } from "@/components/mvp/layout/TopStatusBar";
import { CombatPanel } from "@/components/mvp/game/CombatPanel";
import { DungeonIntroOverlay } from "@/components/mvp/game/DungeonIntroOverlay";
import { EventFeed } from "@/components/mvp/game/EventFeed";
import { InsightPanel } from "@/components/mvp/game/InsightPanel";
import { InventoryButton } from "@/components/mvp/game/InventoryButton";
import { InventoryDrawer } from "@/components/mvp/game/InventoryDrawer";
import { MonsterCard } from "@/components/mvp/game/MonsterCard";
import { SceneRenderer } from "@/components/mvp/game/SceneRenderer";
import { StatBadges } from "@/components/mvp/game/StatBadges";
import { UnderstandingBadge } from "@/components/mvp/game/UnderstandingBadge";
import { UnderstandingProgress } from "@/components/mvp/game/UnderstandingProgress";
import { EmptyState } from "@/components/mvp/ui/EmptyState";
import { Surface } from "@/components/mvp/ui/Surface";
import { useGameStore, usePrimaryBehaviorLabel } from "@/store/gameStore";

const MONSTER_MAP = new Map(MONSTERS.map((monster) => [monster.id, monster]));
const DUNGEON_COVER_MAP: Record<string, string> = {
  hospital_night_shift: "/mvp/cover-hospital.svg",
  apartment_night_return: "/mvp/cover-apartment.svg",
  black_zone_entry: "/mvp/cover-blackzone.svg",
};

const INTENT_LABEL: Record<SceneActionSuggestion["kind"], string> = {
  observe: "观察",
  inspect_object: "检查",
  move_to_area: "移动",
  ask_question: "询问",
  verify_rule: "求证",
  respond_voice: "回应",
  hide: "回避",
  wait: "等待",
  use_item: "使用物品",
  fight: "压制",
  flee: "撤离",
  test_boundary: "试探",
  open_inventory: "打开背包",
  check_archive: "查看档案",
};

const INVENTORY_PICK_COMMAND = "__open_inventory_for_use__";

type AssistantGuidance = Pick<
  DeepseekSceneResponse,
  "actionInterpretation" | "pressureHint" | "ruleLead" | "rewardLead" | "playerFacingHint"
>;

function hasAssistantGuidance(guidance: AssistantGuidance | null) {
  if (!guidance) return false;
  return Boolean(
    guidance.playerFacingHint ||
      guidance.actionInterpretation ||
      guidance.pressureHint ||
      guidance.ruleLead ||
      guidance.rewardLead,
  );
}

function riskToneForIntent(kind: SceneActionSuggestion["kind"]): {
  riskTone: NonNullable<SceneActionSuggestion["riskTone"]>;
  riskLabel: string;
} {
  if (kind === "fight" || kind === "respond_voice" || kind === "test_boundary") {
    return { riskTone: "risky", riskLabel: "高压试探" };
  }

  if (kind === "observe" || kind === "verify_rule" || kind === "check_archive" || kind === "hide") {
    return { riskTone: "safe", riskLabel: "低风险" };
  }

  return { riskTone: "balanced", riskLabel: "稳步推进" };
}

function buildInventoryChoiceAction(inventory: typeof useGameStore extends never ? never : any[]): SceneActionSuggestion | null {
  const usableItems = inventory.filter((item) => item.usableInDungeon && item.quantity > 0);
  if (!usableItems.length) {
    return null;
  }

  const itemPreview = usableItems
    .slice(0, 3)
    .map((item) => item.name)
    .join("、");

  return {
    id: "inventory-choice",
    label: "使用物品",
    command: INVENTORY_PICK_COMMAND,
    kind: "use_item",
    reason: `直接打开背包选择物品。当前可用：${itemPreview}${usableItems.length > 3 ? "等" : ""}。`,
    riskTone: "balanced",
    riskLabel: "稳步推进",
  };
}

function withInventoryChoice(
  actions: SceneActionSuggestion[],
  inventory: typeof useGameStore extends never ? never : any[],
): SceneActionSuggestion[] {
  const inventoryAction = buildInventoryChoiceAction(inventory);
  if (!inventoryAction) {
    return actions;
  }

  const alreadyHasInventoryEntry = actions.some(
    (action) =>
      action.command === INVENTORY_PICK_COMMAND ||
      action.label === "使用物品" ||
      (action.kind === "use_item" && !action.command.startsWith("使用")),
  );

  if (alreadyHasInventoryEntry) {
    return actions;
  }

  return [...actions, inventoryAction];
}

function DungeonHero({
  dungeonId,
  dungeonTitle,
  intro,
  activeNodeTitle,
  understanding,
  contamination,
  onReturn,
  onOpenInventory,
}: {
  dungeonId: string;
  dungeonTitle: string;
  intro: string;
  activeNodeTitle: string;
  understanding: number;
  contamination: number;
  onReturn: () => void;
  onOpenInventory: () => void;
}) {
  return (
    <Surface tone="hero" className="mt-6 overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden border-b border-white/10 p-6 md:p-7 lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(157,30,40,0.20),transparent_34%),linear-gradient(180deg,rgba(9,9,10,0.08),rgba(9,9,10,0.28))]" />
          <div className="relative">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.26em] text-slate-500">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Dungeon Session</span>
              <span>{dungeonId}</span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50 md:text-[2.7rem]">{dungeonTitle}</h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-8 text-slate-300">{intro}</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
                <Compass className="h-3.5 w-3.5" />
                当前节点：{activeNodeTitle}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/16 bg-amber-200/[0.08] px-3 py-1.5 text-xs text-amber-50/90">
                <Sparkles className="h-3.5 w-3.5" />
                理解度 {understanding}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/16 bg-rose-300/[0.08] px-3 py-1.5 text-xs text-rose-50/90">
                <ShieldAlert className="h-3.5 w-3.5" />
                污染 {contamination}
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onReturn}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08]"
              >
                <ArrowLeft className="h-4 w-4" />
                返回大厅
              </button>
              <button
                onClick={onOpenInventory}
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-200/[0.10] px-4 py-3 text-sm font-medium text-amber-50 transition hover:bg-amber-200/[0.14]"
              >
                <Package2 className="h-4 w-4" />
                打开背包
              </button>
            </div>
          </div>
        </div>

        <div
          className="relative min-h-[260px] border-t border-white/10 bg-[#0e1015] lg:border-t-0"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(8,8,10,0.16), rgba(8,8,10,0.4)), url(${DUNGEON_COVER_MAP[dungeonId] ?? DUNGEON_COVER_MAP.hospital_night_shift})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,35,45,0.20),transparent_30%)]" />
        </div>
      </div>
    </Surface>
  );
}

function AssistantModelPanel({
  guidance,
  loading,
}: {
  guidance: AssistantGuidance | null;
  loading?: boolean;
}) {
  if (!hasAssistantGuidance(guidance) && !loading) {
    return null;
  }

  const cards = [
    { label: "模型解读", value: guidance?.actionInterpretation ?? null },
    { label: "风险方向", value: guidance?.pressureHint ?? null },
    { label: "规则焦点", value: guidance?.ruleLead ?? null },
    { label: "收益倾向", value: guidance?.rewardLead ?? null },
  ].filter((item) => item.value);

  return (
    <Surface tone="soft" className="p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Model Reading</div>
          <div className="mt-2 text-lg font-semibold text-slate-100">模型判断</div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            模型可以更大胆地整理方向，但它不会替本地副本引擎发奖励、改规则或改结局。
          </div>
        </div>
        {loading ? <div className="text-xs text-slate-500">正在整理更尖锐的推进方向…</div> : null}
      </div>

      {guidance?.playerFacingHint ? (
        <div className="mt-4 rounded-[20px] border border-amber-300/14 bg-amber-200/[0.06] px-4 py-3 text-sm leading-6 text-amber-50/90">
          {guidance.playerFacingHint}
        </div>
      ) : null}

      {cards.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {cards.map((item) => (
            <div key={item.label} className="rounded-[20px] border border-white/10 bg-[#0d141b] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{item.label}</div>
              <div className="mt-2 text-sm leading-7 text-slate-200">{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </Surface>
  );
}

function buildAssistantPayload(params: {
  mode: "normalize" | "suggest";
  rawInput?: string;
  dungeonTitle: string;
  nodeId: string;
  nodeTitle: string;
  area: string;
  description: string;
  visibleObjects: string[];
  suspiciousPoints: string[];
  currentGoal: string;
  suggestedActions: SceneActionSuggestion[];
  discoveredRules: string[];
  verifiedRules: string[];
  recentLog: string[];
  actionHistory: string[];
  understanding: number;
  contamination: number;
  behaviorLabel: string;
  inventoryNames: string[];
}): DeepseekSceneRequest {
  return {
    mode: params.mode,
    rawInput: params.rawInput,
    dungeonTitle: params.dungeonTitle,
    nodeId: params.nodeId,
    nodeTitle: params.nodeTitle,
    area: params.area,
    description: params.description,
    visibleObjects: params.visibleObjects.slice(0, 12),
    suspiciousPoints: params.suspiciousPoints.slice(0, 12),
    currentGoal: params.currentGoal,
    localSuggestedActions: params.suggestedActions.map((action) => ({
      label: action.label,
      command: action.command,
      kind: action.kind,
      reason: action.reason,
      riskTone: action.riskTone,
      riskLabel: action.riskLabel,
    })),
    discoveredRules: params.discoveredRules.slice(0, 16),
    verifiedRules: params.verifiedRules.slice(0, 16),
    recentLog: params.recentLog.slice(-8),
    actionHistory: params.actionHistory.slice(-6),
    understanding: params.understanding,
    contamination: params.contamination,
    behaviorLabel: params.behaviorLabel,
    inventoryNames: params.inventoryNames.slice(0, 16),
  };
}

async function requestDeepSeekScene(payload: DeepseekSceneRequest): Promise<DeepseekSceneResponse> {
  const response = await fetch("/api/mvp/deepseek", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek route failed with status ${response.status}`);
  }

  return (await response.json()) as DeepseekSceneResponse;
}

function buildLocalInputPreview(params: {
  rawInput: string;
  node: NonNullable<ReturnType<typeof buildSceneNode>>;
  understanding: number;
  contamination: number;
  behaviorLabel: string;
  inventoryNames: string[];
  psych: typeof useGameStore extends never ? never : any;
  inventory: typeof useGameStore extends never ? never : any[];
}): { hint: string; suggestions: SceneActionSuggestion[]; guidance: AssistantGuidance } {
  const parsed = parseInput(params.rawInput, params.understanding, {
    visibleObjects: [...params.node.visibleObjects, ...params.node.suspiciousPoints],
    psych: params.psych,
    inventory: params.inventory,
  });

  const target = parsed.target?.trim() || "当前可疑点";
  const primaryLabel = INTENT_LABEL[parsed.primaryIntent];

  const ranked = params.node.suggestedActions
    .map((action) => {
      let score = action.kind === parsed.primaryIntent ? 5 : 0;
      if (parsed.target && (action.command.includes(parsed.target) || action.label.includes(parsed.target) || action.reason.includes(parsed.target))) {
        score += 4;
      }
      if (parsed.matchedKeywords.some((keyword) => action.command.includes(keyword) || action.reason.includes(keyword))) {
        score += 2;
      }
      return { action, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.action);

  const suggestions: SceneActionSuggestion[] = [
    {
      id: `typed-direct-${parsed.primaryIntent}`,
      label: `按当前输入推进`,
      command: params.rawInput.trim(),
      kind: parsed.primaryIntent,
      reason: `当前输入更接近“${primaryLabel}”，会优先围绕${target}推进。`,
      ...riskToneForIntent(parsed.primaryIntent),
    },
    ...ranked.slice(0, 4).map((action, index) => ({
      ...action,
      id: `typed-ranked-${index}-${action.id}`,
    })),
  ];

  const uniqueSuggestions = suggestions.filter(
    (action, index, list) => list.findIndex((entry) => entry.command === action.command) === index,
  );

  return {
    hint: `根据你当前的输入，系统更倾向于把这一步理解成“${primaryLabel}”。真正的事件、规则解锁和奖励会在提交后再结算。`,
    suggestions: uniqueSuggestions.slice(0, 5),
    guidance: {
      playerFacingHint: `你现在不是在随机试探，而是在把局面推向“${primaryLabel}”。`,
      actionInterpretation: `当前输入会被优先理解为“${primaryLabel}”。`,
      pressureHint:
        parsed.primaryIntent === "fight" || parsed.primaryIntent === "respond_voice"
          ? "这一步会明显提高场景压强，更适合在你已经看见破绽时推进。"
          : parsed.primaryIntent === "verify_rule" || parsed.primaryIntent === "observe"
            ? "这一步更像是在先收束信息，再决定是否冒险。"
            : "这一步会让局面继续向前，但还没有完全交出判断权。",
      ruleLead: `更可能牵动和“${target}”有关的规则冲突。`,
      rewardLead:
        parsed.primaryIntent === "verify_rule" || parsed.primaryIntent === "observe"
          ? "更可能提升规则理解与档案沉淀质量。"
          : "更可能影响推进效率、生存压力或临场收益。",
    },
  };
}

export function DungeonView({ dungeonId }: { dungeonId: string }) {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);
  const [sceneSuggestions, setSceneSuggestions] = useState<SceneActionSuggestion[] | null>(null);
  const [sceneHint, setSceneHint] = useState<string | null>(null);
  const [sceneGuidance, setSceneGuidance] = useState<AssistantGuidance | null>(null);
  const [inputSuggestions, setInputSuggestions] = useState<SceneActionSuggestion[] | null>(null);
  const [inputHint, setInputHint] = useState<string | null>(null);
  const [inputNormalizedAction, setInputNormalizedAction] = useState<string | null>(null);
  const [inputGuidance, setInputGuidance] = useState<AssistantGuidance | null>(null);
  const [isSceneAssistantLoading, setIsSceneAssistantLoading] = useState(false);
  const [isInputAssistantLoading, setIsInputAssistantLoading] = useState(false);
  const [isSubmittingInput, setIsSubmittingInput] = useState(false);
  const hasHydrated = useGameStore((state) => state.meta.hasHydrated);
  const hydrateSave = useGameStore((state) => state.hydrateSave);
  const runtime = useGameStore((state) => state.runtime);
  const player = useGameStore((state) => state.player);
  const progress = useGameStore((state) => state.progress);
  const inventory = useGameStore((state) => state.inventory);
  const input = useGameStore((state) => state.input);
  const drawer = useGameStore((state) => state.meta.currentDrawer);
  const enterDungeon = useGameStore((state) => state.enterDungeon);
  const setDrawer = useGameStore((state) => state.setDrawer);
  const setInputText = useGameStore((state) => state.setInputText);
  const submitAction = useGameStore((state) => state.submitAction);
  const onResolveCombatAction = useGameStore((state) => state.resolveCombatAction);
  const returnToLobby = useGameStore((state) => state.returnToLobby);
  const primaryBehavior = usePrimaryBehaviorLabel();

  useEffect(() => {
    hydrateSave();
  }, [hydrateSave]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!runtime || runtime.dungeonId !== dungeonId) {
      enterDungeon(dungeonId);
    }
  }, [dungeonId, enterDungeon, hasHydrated, runtime]);

  useEffect(() => {
    setShowIntro(true);
  }, [dungeonId]);

  useEffect(() => {
    if (!hasHydrated || !runtime || runtime.dungeonId !== dungeonId || runtime.pendingSettlement) {
      return;
    }
    const timer = window.setTimeout(() => setShowIntro(false), 1700);
    return () => window.clearTimeout(timer);
  }, [dungeonId, hasHydrated, runtime]);

  const activeNode = useMemo(() => {
    if (!runtime) return null;
    const node = getNode(runtime.dungeonId, runtime.currentNodeId);
    return node ? buildSceneNode(node, player.understanding, inventory) : null;
  }, [inventory, player.understanding, runtime]);

  const dungeonConfig = useMemo(() => getDungeonConfig(dungeonId), [dungeonId]);
  const activeMonster = runtime?.activeCombat ? MONSTER_MAP.get(runtime.activeCombat.monsterId) ?? null : null;
  const recentFeedback = runtime?.log.slice(-3) ?? [];
  const totalInventory = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const inventoryNames = useMemo(
    () => inventory.map((item) => `${item.name}x${item.quantity}`),
    [inventory],
  );
  const inventorySignature = useMemo(
    () => inventory.map((item) => `${item.id}:${item.quantity}`).join("|"),
    [inventory],
  );

  const localInputPreview = useMemo(() => {
    if (!activeNode || !input.text.trim()) {
      return null;
    }
    return buildLocalInputPreview({
      rawInput: input.text,
      node: activeNode,
      understanding: player.understanding,
      contamination: player.contamination,
      behaviorLabel: primaryBehavior,
      inventoryNames,
      psych: player.psych,
      inventory,
    });
  }, [activeNode, input.text, inventory, inventoryNames, player.contamination, player.psych, player.understanding, primaryBehavior]);

  const displayedActions = input.text.trim()
    ? inputSuggestions?.length
      ? withInventoryChoice(inputSuggestions, inventory)
      : withInventoryChoice(localInputPreview?.suggestions ?? activeNode?.suggestedActions ?? [], inventory)
    : sceneSuggestions?.length
      ? withInventoryChoice(sceneSuggestions, inventory)
      : withInventoryChoice(activeNode?.suggestedActions ?? [], inventory);

  const displayedHint = input.text.trim()
    ? inputHint ?? localInputPreview?.hint ?? "正在根据你的输入整理更贴近当前场景的动作。"
    : sceneHint ??
      "你可以直接点击这些动作推进副本；如果想更自由地表达，也可以继续使用下面的输入框。";
  const displayedGuidance = input.text.trim()
    ? inputGuidance ?? localInputPreview?.guidance ?? null
    : sceneGuidance;

  useEffect(() => {
    if (!runtime || !activeNode || runtime.pendingSettlement || runtime.status !== "exploring" || runtime.activeCombat) {
      setSceneSuggestions(null);
      setSceneHint(null);
      setSceneGuidance(null);
      setIsSceneAssistantLoading(false);
      return;
    }

    let cancelled = false;
    const loadSuggestions = async () => {
      setIsSceneAssistantLoading(true);
      try {
        const payload = buildAssistantPayload({
          mode: "suggest",
          dungeonTitle: runtime.dungeonTitle,
          nodeId: activeNode.id,
          nodeTitle: activeNode.title,
          area: activeNode.area,
          description: activeNode.description,
          visibleObjects: activeNode.visibleObjects,
          suspiciousPoints: activeNode.suspiciousPoints,
          currentGoal: activeNode.currentGoal,
          suggestedActions: activeNode.suggestedActions,
          discoveredRules: runtime.discoveredRuleIds,
          verifiedRules: runtime.verifiedRuleIds,
          recentLog: runtime.log,
          actionHistory: runtime.actionHistory,
          understanding: player.understanding,
          contamination: player.contamination,
          behaviorLabel: primaryBehavior,
          inventoryNames,
        });
        const response = await requestDeepSeekScene(payload);
        if (cancelled) return;
        setSceneSuggestions(
          response.suggestions.map((action, index) => ({
            id: `ai-${activeNode.id}-${index}-${action.kind}`,
            ...action,
          })),
        );
        setSceneHint(response.playerFacingHint ?? null);
        setSceneGuidance({
          playerFacingHint: response.playerFacingHint ?? null,
          actionInterpretation: response.actionInterpretation ?? null,
          pressureHint: response.pressureHint ?? null,
          ruleLead: response.ruleLead ?? null,
          rewardLead: response.rewardLead ?? null,
        });
      } catch {
        if (cancelled) return;
        setSceneSuggestions(null);
        setSceneHint(null);
        setSceneGuidance(null);
      } finally {
        if (!cancelled) {
          setIsSceneAssistantLoading(false);
        }
      }
    };

    void loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, [activeNode, inventoryNames, inventorySignature, player.contamination, player.understanding, primaryBehavior, runtime]);

  useEffect(() => {
    if (!runtime || !activeNode || runtime.pendingSettlement || runtime.status !== "exploring" || runtime.activeCombat) {
      setInputSuggestions(null);
      setInputHint(null);
      setInputNormalizedAction(null);
      setInputGuidance(null);
      setIsInputAssistantLoading(false);
      return;
    }

    const raw = input.text.trim();
    if (!raw) {
      setInputSuggestions(null);
      setInputHint(null);
      setInputNormalizedAction(null);
      setInputGuidance(null);
      setIsInputAssistantLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsInputAssistantLoading(true);
      try {
        const payload = buildAssistantPayload({
          mode: "normalize",
          rawInput: raw,
          dungeonTitle: runtime.dungeonTitle,
          nodeId: activeNode.id,
          nodeTitle: activeNode.title,
          area: activeNode.area,
          description: activeNode.description,
          visibleObjects: activeNode.visibleObjects,
          suspiciousPoints: activeNode.suspiciousPoints,
          currentGoal: activeNode.currentGoal,
          suggestedActions: activeNode.suggestedActions,
          discoveredRules: runtime.discoveredRuleIds,
          verifiedRules: runtime.verifiedRuleIds,
          recentLog: runtime.log,
          actionHistory: runtime.actionHistory,
          understanding: player.understanding,
          contamination: player.contamination,
          behaviorLabel: primaryBehavior,
          inventoryNames,
        });
        const response = await requestDeepSeekScene(payload);
        if (cancelled) return;
        setInputNormalizedAction(response.normalizedAction?.trim() || raw);
        setInputSuggestions(
          response.suggestions.map((action, index) => ({
            id: `typed-ai-${activeNode.id}-${index}-${action.kind}`,
            ...action,
          })),
        );
        setInputHint(
          response.playerFacingHint ??
            `系统已结合你的输入重新整理下一步动作，提交后会按当前副本规则结算。`,
        );
        setInputGuidance({
          playerFacingHint: response.playerFacingHint ?? null,
          actionInterpretation: response.actionInterpretation ?? null,
          pressureHint: response.pressureHint ?? null,
          ruleLead: response.ruleLead ?? null,
          rewardLead: response.rewardLead ?? null,
        });
      } catch {
        if (cancelled) return;
        setInputSuggestions(null);
        setInputHint(null);
        setInputNormalizedAction(null);
        setInputGuidance(null);
      } finally {
        if (!cancelled) {
          setIsInputAssistantLoading(false);
        }
      }
    }, 650);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    activeNode,
    input.text,
    inventoryNames,
    inventorySignature,
    player.contamination,
    player.understanding,
    primaryBehavior,
    runtime,
  ]);

  const handleQuickAction = (command: string) => {
    if (!runtime || runtime.pendingSettlement || isSubmittingInput) {
      return;
    }
    if (command === INVENTORY_PICK_COMMAND) {
      setDrawer("inventory");
      return;
    }
    setSceneSuggestions(null);
    setSceneHint(null);
    setSceneGuidance(null);
    setInputSuggestions(null);
    setInputHint(null);
    setInputNormalizedAction(null);
    setInputGuidance(null);
    setInputText("");
    submitAction(command);
  };

  const handleSubmitAction = async (value: string) => {
    if (!runtime || !activeNode || runtime.pendingSettlement) {
      return;
    }

    const raw = value.trim();
    if (!raw) {
      return;
    }

    setIsSubmittingInput(true);
    setSceneSuggestions(null);
    setSceneHint(null);
    setSceneGuidance(null);
    setInputSuggestions(null);
    setInputHint(null);
    setInputGuidance(null);

    let command = inputNormalizedAction?.trim() && input.text.trim() === raw ? inputNormalizedAction.trim() : raw;

    if (!inputNormalizedAction?.trim()) {
      try {
        const payload = buildAssistantPayload({
          mode: "normalize",
          rawInput: raw,
          dungeonTitle: runtime.dungeonTitle,
          nodeId: activeNode.id,
          nodeTitle: activeNode.title,
          area: activeNode.area,
          description: activeNode.description,
          visibleObjects: activeNode.visibleObjects,
          suspiciousPoints: activeNode.suspiciousPoints,
          currentGoal: activeNode.currentGoal,
          suggestedActions: activeNode.suggestedActions,
          discoveredRules: runtime.discoveredRuleIds,
          verifiedRules: runtime.verifiedRuleIds,
          recentLog: runtime.log,
          actionHistory: runtime.actionHistory,
          understanding: player.understanding,
          contamination: player.contamination,
          behaviorLabel: primaryBehavior,
          inventoryNames,
        });
        const response = await requestDeepSeekScene(payload);
        if (response.normalizedAction?.trim()) {
          command = response.normalizedAction.trim();
        }
      } catch {
        command = raw;
      }
    }

    setIsSubmittingInput(false);
    setInputNormalizedAction(null);
    setInputGuidance(null);
    submitAction(command);
  };

  if (!hasHydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#09090a_0%,#0f1014_42%,#09090a_100%)] px-4">
        <div className="w-full max-w-xl">
          <EmptyState
            title="正在接入存档"
            description="大厅正在把你上一局留下的状态、理解度和背包重新接回这次探索。"
          />
        </div>
      </div>
    );
  }

  if (!runtime || !activeNode) {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#09090a_0%,#0f1014_42%,#09090a_100%)] px-4">
        <div className="w-full max-w-xl">
          <EmptyState
            title="正在进入副本"
            description="系统正在定位当前节点和实时状态，等场景稳定后你就能开始行动。"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <DungeonIntroOverlay
        open={showIntro && Boolean(runtime) && !runtime?.pendingSettlement}
        title={dungeonConfig.title}
        intro={dungeonConfig.intro}
        onClose={() => setShowIntro(false)}
      />

      <GameShell
        header={
          <>
            <TopStatusBar
              eyebrow="单机规则怪谈 MVP"
              title={runtime.dungeonTitle}
              subtitle={`当前区域：${activeNode.area} · 已发现规则 ${runtime.discoveredRuleIds.length} 条 · 识破伪规则 ${runtime.falseRuleBreaks} 次`}
              right={<UnderstandingBadge total={player.understanding} />}
            />
            <DungeonHero
              dungeonId={runtime.dungeonId}
              dungeonTitle={runtime.dungeonTitle}
              intro={dungeonConfig.intro}
              activeNodeTitle={activeNode.title}
              understanding={player.understanding}
              contamination={player.contamination}
              onReturn={() => {
                returnToLobby();
                router.push("/mvp");
              }}
              onOpenInventory={() => setDrawer("inventory")}
            />
          </>
        }
        main={
          <ScenePanel>
            {runtime.pendingSettlement ? (
              <ResultPanel
                result={runtime.pendingSettlement}
                onReturn={() => {
                  returnToLobby();
                  router.push("/mvp");
                }}
              />
            ) : null}

            <SceneRenderer
              title={activeNode.title}
              area={activeNode.area}
              description={activeNode.description}
              visibleObjects={activeNode.visibleObjects}
              suspiciousPoints={activeNode.suspiciousPoints}
              currentGoal={activeNode.currentGoal}
            />

            <InsightPanel insight={"bonusInsight" in activeNode ? activeNode.bonusInsight : null} />

            {activeMonster && runtime.activeCombat ? (
              <>
                <MonsterCard monster={activeMonster} weaknessKnown={runtime.activeCombat.weaknessKnown} />
                <CombatPanel combat={runtime.activeCombat} onAction={onResolveCombatAction} />
              </>
            ) : (
              <>
                <AssistantModelPanel
                  guidance={displayedGuidance}
                  loading={isSceneAssistantLoading || isInputAssistantLoading}
                />
                <ChoicePanel
                  actions={displayedActions}
                  onCommand={handleQuickAction}
                  loading={isSceneAssistantLoading || isInputAssistantLoading || isSubmittingInput}
                  disabled={Boolean(runtime.pendingSettlement) || isSubmittingInput}
                  description={displayedHint}
                />
                <InputPanel
                  value={input.text}
                  onChange={setInputText}
                  onSubmit={handleSubmitAction}
                  disabled={Boolean(runtime.pendingSettlement)}
                  isSubmitting={isSubmittingInput}
                />
              </>
            )}

            <EventFeed entries={runtime.log.concat(runtime.actionHistory.map((item) => `你的动作：${item}`))} />
          </ScenePanel>
        }
        sidebar={
          <>
            <SidePanel title="当前状态">
              <div className="space-y-4">
                <StatBadges player={player} compact />
                <UnderstandingProgress total={player.understanding} />
                <div className="rounded-[20px] border border-white/10 bg-[#0d141b] p-4 text-sm leading-7 text-slate-300">
                  <div>污染值：{player.contamination}</div>
                  <div>主行为标签：{primaryBehavior}</div>
                  <div>场景敌意：{player.world.HOSTILE}</div>
                  <div>异常关注：{player.world.AGGRO}</div>
                </div>
                <InventoryButton count={totalInventory} onClick={() => setDrawer("inventory")} />
              </div>
            </SidePanel>

            <SidePanel title="规则记录">
              <ArchivePanel rules={progress.archive.rules} understanding={player.understanding} />
            </SidePanel>

            <SidePanel title="最近反馈">
              {recentFeedback.length === 0 ? (
                <EmptyState
                  title="还没有新的即时反馈"
                  description="当你开始试探、求证或触发冲突后，这里会优先显示最近几条变化。"
                />
              ) : (
                <div className="space-y-3">
                  {recentFeedback.map((entry, index) => (
                    <div
                      key={`${index}-${entry}`}
                      className="rounded-[18px] border border-white/10 bg-[#0d141b] p-4 text-sm leading-7 text-slate-300"
                    >
                      {entry}
                    </div>
                  ))}
                </div>
              )}
            </SidePanel>
          </>
        }
      />

      <InventoryDrawer
        open={drawer === "inventory"}
        title="副本背包"
        items={inventory}
        scope="dungeon"
        onUse={(itemId) => submitAction(`使用${inventory.find((item) => item.id === itemId)?.name ?? itemId}`)}
        onClose={() => setDrawer(null)}
      />
    </>
  );
}
