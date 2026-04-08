import { z } from "zod";

import type { InventoryEntry } from "./inventory";
import type { MonsterDefinition } from "./monster";
import type { BehaviorProfile } from "./profile";
import type { RuleArchiveEntry } from "./rule";
import type { SettlementResult } from "./score";
import type { SceneNode } from "./node";
import type { UnderstandingSnapshot } from "./understanding";

export type HallModuleId =
  | "task_wall"
  | "archives"
  | "backpack"
  | "shop"
  | "rest_area"
  | "settlement_desk"
  | "black_zone";

export type DrawerTab = "inventory" | "records" | "status";

export type VisibleStats = {
  hp: number;
  san: number;
  sta: number;
  cog: number;
  cor: number;
  atk: number;
  defense: number;
  spd: number;
  acc: number;
  res: number;
};

export type UnderstandingProgress = {
  total: number;
  level: string;
  current_threshold: number;
  next_threshold: number;
  next_level: string;
  progress_percent: number;
};

export type InventoryItemView = {
  item_id: string;
  name: string;
  item_type: string;
  rarity: string;
  description: string;
  effect_type: string;
  effect_value: number;
  use_condition: string;
  stackable: boolean;
  quantity: number;
  usable_in_lobby: boolean;
  usable_in_dungeon: boolean;
  consume_on_use: boolean;
  tags: string[];
  aliases: string[];
  unlocks_insight?: boolean;
  modifies_understanding_check?: boolean;
};

export type RewardView = {
  item_id: string;
  name: string;
  rarity: string;
  description: string;
  reason: string;
  quantity: number;
};

export type RuleView = {
  rule_id: string;
  title?: string | null;
  text: string;
  rule_type: "explicit" | "hidden" | "false" | "conditional";
  source: string;
  confidence: number;
  contradictions: string[];
  conditions: string[];
  discovered: boolean;
  verified: boolean;
  note?: string;
  anomaly_hint?: string;
};

export type NotebookEntryView = {
  entry_id: string;
  title: string;
  content: string;
  source: string;
  tags: string[];
  tampered?: boolean;
};

export type MonsterArchiveEntry = {
  monster_id: string;
  name: string;
  type: string;
  weakness_rule_id: string;
  weakness_rule_text: string;
  archive_hint: string;
  special_mechanic?: string;
};

export type SceneChoice = {
  choice_id: string;
  kind: string;
  label: string;
  action_text: string;
  reason: string;
};

export type SceneView = {
  node_id: string;
  title: string;
  description: string;
  visible_objects: string[];
  clues: string[];
  insight?: string | null;
  ai_hint?: string;
  suggested_actions: SceneChoice[];
  inventory_usable?: InventoryItemView[];
};

export type RunSnapshot = {
  run_id: string;
  dungeon_id: string;
  dungeon_title: string;
  threat_value: number;
  matching_multiplier: number;
  current_node_id: string;
  status: string;
  step_count: number;
  discovered_rule_ids: string[];
  verified_rule_ids: string[];
  flags: Record<string, unknown>;
  combat: {
    active?: boolean;
    monster_id?: string | null;
    monster_name?: string | null;
    options?: string[];
    reason?: string | null;
    weakness_known?: boolean;
  };
  outcome?: string | null;
  understanding_delta?: number;
  insight_log?: string[];
  false_rule_hits?: string[];
  hidden_route_triggered?: boolean;
  used_item_ids?: string[];
};

export type SessionPlayerSnapshot = {
  player_name: string;
  visible_stats: VisibleStats;
  psych_hint: Record<string, string>;
  world_state: Record<string, number>;
  inventory: InventoryItemView[];
  behavior_profile: Record<string, number>;
  hall_permissions: string[];
  understanding: UnderstandingProgress;
  recent_rewards: RewardView[];
  obtained_items: string[];
  unlocked_archives: string[];
};

export type SessionSnapshot = {
  session_id: string;
  player: SessionPlayerSnapshot;
  completed_dungeons: string[];
  last_settlement?: SettlementView | null;
  active_run?: RunSnapshot | null;
  flags: Record<string, unknown>;
  updated_at: string;
};

export type HallModuleView = {
  module_id: HallModuleId;
  title: string;
  summary: string;
  status: string;
  locked: boolean;
};

export type DungeonCardView = {
  dungeon_id: string;
  title: string;
  kind: string;
  difficulty_band: string;
  recommended_style: string;
  reward_pool: string[];
  locked: boolean;
  lock_reason?: string | null;
};

export type HallView = {
  modules: HallModuleView[];
  narrative: string;
  available_dungeons: DungeonCardView[];
  admin_hint: string;
  archive_count: number;
  recent_rewards: RewardView[];
  understanding: UnderstandingProgress;
  contamination: number;
};

export type SettlementGrades = {
  survival: string;
  mental: string;
  rules: string;
  combat: string;
  choice: string;
  understanding: string;
  overall: string;
};

export type SettlementView = {
  report_id: string;
  run_id: string;
  dungeon_id: string;
  dungeon_title: string;
  outcome: string;
  grades: SettlementGrades;
  summary: string;
  rewards: RewardView[];
  hidden_behavior_tag: string;
  unlocked_features: string[];
  metrics: Record<string, number>;
  understanding_delta: number;
  total_understanding: number;
  understanding_level: string;
  generated_at: string;
};

export type ArchivesView = {
  rules: RuleView[];
  notebook_entries: NotebookEntryView[];
  monster_archive: MonsterArchiveEntry[];
  run_history: SettlementView[];
  recent_rewards: RewardView[];
  unlocked_archives: string[];
  obtained_items: string[];
};

export type CombatResultView = {
  action: string;
  outcome: string;
  combat_success: boolean;
  effective_power: number;
  monster_threat: number;
  margin: number;
  weakness_known: boolean;
  narrative: string;
};

export type MvpVisibleStats = {
  HP: number;
  SAN: number;
  STA: number;
  COG: number;
  COR: number;
  ATK: number;
  DEF: number;
  SPD: number;
  ACC: number;
  RES: number;
};

export type MvpPsychStats = {
  FEAR: number;
  SUSP: number;
  DEP: number;
  IMP: number;
  WILL: number;
  EMP: number;
  OBS: number;
};

export type MvpWorldState = {
  AGGRO: number;
  DRIFT: number;
  HOSTILE: number;
};

export type MvpThreatBreakdown = {
  combatPressure: number;
  rulePressure: number;
  environmentPressure: number;
  misleadPressure: number;
  pursuitPressure: number;
};

export type MvpThreatProfile = {
  effectivePower: number;
  threatValue: number;
  multiplier: number;
  breakdown: MvpThreatBreakdown;
};

export type MvpParsedAction = {
  primaryIntent: import("./node").ActionIntent;
  target: string | null;
  riskTendency: number;
  cautiousLevel: number;
  trustTarget: string | null;
  rawInput: string;
  confidence: number;
  matchedKeywords: string[];
};

export type MvpCombatAction = "attack" | "defend" | "flee" | "exploit_rule" | "use_item";

export type MvpBlackZoneConditionId = "understanding" | "temporary_pass" | "story_thread";

export type MvpBlackZoneConditionProgress = {
  id: MvpBlackZoneConditionId;
  label: string;
  satisfied: boolean;
  detail: string;
};

export type MvpBlackZoneProgress = {
  unlocked: boolean;
  conditions: MvpBlackZoneConditionProgress[];
  summary: string;
};

export type MvpCombatState = {
  monsterId: string;
  round: number;
  weaknessKnown: boolean;
  canExploitRule: boolean;
  log: Array<{ round: number; text: string; emphasis?: "neutral" | "success" | "danger" }>;
};

export type MvpRuntimeStatus = "idle" | "exploring" | "combat" | "result";

export type MvpArchiveState = {
  rules: RuleArchiveEntry[];
  monsters: MonsterDefinition[];
  events: string[];
  endings: string[];
  adminFragments: string[];
  importantItems: string[];
  byDungeon: Record<
    string,
    {
      rules: string[];
      events: string[];
      endings: string[];
      adminFragments: string[];
    }
  >;
};

export type MvpLobbyState = {
  availableDungeons: string[];
  restUses: number;
  shopStockIds: string[];
  blackMarketUnlocked: boolean;
  blackMarketRequirements: MvpBlackZoneConditionProgress[];
  blackMarketInventory: string[];
  blackZone: MvpBlackZoneProgress;
};

export type MvpDungeonRuntime = {
  dungeonId: string;
  dungeonTitle: string;
  currentNodeId: string;
  status: MvpRuntimeStatus;
  nodeOrder: string[];
  visitedNodeIds: string[];
  discoveredRuleIds: string[];
  verifiedRuleIds: string[];
  falseRuleBreaks: number;
  falseRuleTraps: number;
  seenMonsterIds: string[];
  seenEventIds: string[];
  flags: string[];
  log: string[];
  actionHistory: string[];
  currentThreat: MvpThreatProfile;
  activeCombat: MvpCombatState | null;
  hiddenRouteTriggered: boolean;
  trustedWrongNpc: boolean;
  pendingSettlement: SettlementResult | null;
};

export type MvpProgressState = {
  completedDungeons: string[];
  archive: MvpArchiveState;
  recentRewards: Array<{ itemId: string; reason: string; quantity: number }>;
  lastSettlement: SettlementResult | null;
  supplyMarks: number;
};

export type MvpPlayerState = {
  name: string;
  visibleStats: MvpVisibleStats;
  psych: MvpPsychStats;
  world: MvpWorldState;
  understanding: number;
  behaviorProfile: BehaviorProfile;
  contamination: number;
};

export type MvpGameStoreState = {
  meta: {
    version: number;
    hasHydrated: boolean;
    debugMode: boolean;
    currentView: "lobby" | "dungeon";
    currentDrawer: "inventory" | "archives" | "shop" | null;
  };
  player: MvpPlayerState;
  progress: MvpProgressState;
  inventory: InventoryEntry[];
  lobby: MvpLobbyState;
  runtime: MvpDungeonRuntime | null;
  input: {
    text: string;
    suggestions: string[];
    lastParsed: MvpParsedAction | null;
  };
};

export type MvpGameViewModel = {
  player: MvpPlayerState;
  understanding: UnderstandingSnapshot;
  inventory: InventoryEntry[];
  progress: MvpProgressState;
  runtime: MvpDungeonRuntime | null;
  activeNode: SceneNode | null;
};

export const mvpSaveSchema = z.object({
  meta: z.object({
    version: z.number(),
    hasHydrated: z.boolean().optional(),
    debugMode: z.boolean(),
    currentView: z.enum(["lobby", "dungeon"]),
    currentDrawer: z.enum(["inventory", "archives", "shop"]).nullable(),
  }),
  player: z.object({
    name: z.string(),
    visibleStats: z.record(z.string(), z.number()),
    psych: z.record(z.string(), z.number()),
    world: z.record(z.string(), z.number()),
    understanding: z.number(),
    behaviorProfile: z.record(z.string(), z.number()),
    contamination: z.number(),
  }),
  progress: z.object({
    completedDungeons: z.array(z.string()),
    archive: z.object({
      rules: z.array(z.any()),
      monsters: z.array(z.any()),
      events: z.array(z.string()),
      endings: z.array(z.string()),
      adminFragments: z.array(z.string()),
      importantItems: z.array(z.string()),
      byDungeon: z.record(
        z.string(),
        z.object({
          rules: z.array(z.string()),
          events: z.array(z.string()),
          endings: z.array(z.string()),
          adminFragments: z.array(z.string()),
        }),
      ),
    }),
    recentRewards: z.array(
      z.object({
        itemId: z.string(),
        reason: z.string(),
        quantity: z.number(),
      }),
    ),
    lastSettlement: z.any().nullable(),
    supplyMarks: z.number(),
  }),
  inventory: z.array(z.any()),
  lobby: z.object({
    availableDungeons: z.array(z.string()),
    restUses: z.number(),
    shopStockIds: z.array(z.string()),
    blackMarketUnlocked: z.boolean(),
    blackMarketRequirements: z.array(
      z.object({
        id: z.enum(["understanding", "temporary_pass", "story_thread"]),
        label: z.string(),
        satisfied: z.boolean(),
        detail: z.string(),
      }),
    ),
    blackMarketInventory: z.array(z.string()),
    blackZone: z.object({
      unlocked: z.boolean(),
      conditions: z.array(
        z.object({
          id: z.enum(["understanding", "temporary_pass", "story_thread"]),
          label: z.string(),
          satisfied: z.boolean(),
          detail: z.string(),
        }),
      ),
      summary: z.string(),
    }),
  }),
  runtime: z.any().nullable(),
  input: z.object({
    text: z.string(),
    suggestions: z.array(z.string()),
    lastParsed: z.any().nullable(),
  }),
});
