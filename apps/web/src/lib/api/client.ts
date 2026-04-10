import { z } from "zod";

import type { RuntimeConfig } from "@/lib/platform";
import type {
  ArchivesView,
  CombatResultView,
  HallView,
  RunSnapshot,
  SceneView,
  SessionSnapshot,
  SettlementView,
} from "@game-core/types/game";

export const DEFAULT_RULETALE_API_BASE = "http://127.0.0.1:8011";
export const DEFAULT_PLAYER_NAME = "无名访客";

const rewardSchema = z.object({
  item_id: z.string(),
  name: z.string(),
  rarity: z.string(),
  description: z.string(),
  reason: z.string(),
  quantity: z.number(),
});

const understandingSchema = z.object({
  total: z.number(),
  level: z.string(),
  current_threshold: z.number(),
  next_threshold: z.number(),
  next_level: z.string(),
  progress_percent: z.number(),
});

const inventoryItemSchema = z.object({
  item_id: z.string(),
  name: z.string(),
  item_type: z.string(),
  rarity: z.string(),
  description: z.string(),
  effect_type: z.string(),
  effect_value: z.number(),
  use_condition: z.string(),
  stackable: z.boolean(),
  quantity: z.number(),
  usable_in_lobby: z.boolean(),
  usable_in_dungeon: z.boolean(),
  consume_on_use: z.boolean(),
  tags: z.array(z.string()),
  aliases: z.array(z.string()),
  unlocks_insight: z.boolean().optional(),
  modifies_understanding_check: z.boolean().optional(),
});

const settlementSchema: z.ZodType<SettlementView> = z.object({
  report_id: z.string(),
  run_id: z.string(),
  dungeon_id: z.string(),
  dungeon_title: z.string(),
  outcome: z.string(),
  grades: z.object({
    survival: z.string(),
    mental: z.string(),
    rules: z.string(),
    combat: z.string(),
    choice: z.string(),
    understanding: z.string(),
    overall: z.string(),
  }),
  summary: z.string(),
  rewards: z.array(rewardSchema),
  hidden_behavior_tag: z.string(),
  unlocked_features: z.array(z.string()),
  metrics: z.record(z.string(), z.number()),
  understanding_delta: z.number(),
  total_understanding: z.number(),
  understanding_level: z.string(),
  generated_at: z.string(),
});

const runSchema: z.ZodType<RunSnapshot> = z.object({
  run_id: z.string(),
  dungeon_id: z.string(),
  dungeon_title: z.string(),
  threat_value: z.number(),
  matching_multiplier: z.number(),
  current_node_id: z.string(),
  status: z.string(),
  step_count: z.number(),
  discovered_rule_ids: z.array(z.string()),
  verified_rule_ids: z.array(z.string()),
  flags: z.record(z.string(), z.unknown()),
  combat: z.object({
    active: z.boolean().optional(),
    monster_id: z.string().nullable().optional(),
    monster_name: z.string().nullable().optional(),
    options: z.array(z.string()).optional(),
    reason: z.string().nullable().optional(),
    weakness_known: z.boolean().optional(),
  }),
  outcome: z.string().nullable().optional(),
  understanding_delta: z.number().optional(),
  insight_log: z.array(z.string()).optional(),
  false_rule_hits: z.array(z.string()).optional(),
  hidden_route_triggered: z.boolean().optional(),
  used_item_ids: z.array(z.string()).optional(),
});

const sessionSchema: z.ZodType<SessionSnapshot> = z.object({
  session_id: z.string(),
  player: z.object({
    player_name: z.string(),
    visible_stats: z.object({
      hp: z.number(),
      san: z.number(),
      sta: z.number(),
      cog: z.number(),
      cor: z.number(),
      atk: z.number(),
      defense: z.number(),
      spd: z.number(),
      acc: z.number(),
      res: z.number(),
    }),
    psych_hint: z.record(z.string(), z.string()),
    world_state: z.record(z.string(), z.number()),
    inventory: z.array(inventoryItemSchema),
    behavior_profile: z.record(z.string(), z.number()),
    hall_permissions: z.array(z.string()),
    understanding: understandingSchema,
    recent_rewards: z.array(rewardSchema),
    obtained_items: z.array(z.string()),
    unlocked_archives: z.array(z.string()),
  }),
  completed_dungeons: z.array(z.string()),
  last_settlement: settlementSchema.nullish(),
  active_run: runSchema.nullish(),
  flags: z.record(z.string(), z.unknown()),
  updated_at: z.string(),
});

const hallSchema: z.ZodType<HallView> = z.object({
  modules: z.array(
    z.object({
      module_id: z.enum([
        "task_wall",
        "archives",
        "backpack",
        "shop",
        "rest_area",
        "settlement_desk",
        "black_zone",
      ]),
      title: z.string(),
      summary: z.string(),
      status: z.string(),
      locked: z.boolean(),
    }),
  ),
  narrative: z.string(),
  available_dungeons: z.array(
    z.object({
      dungeon_id: z.string(),
      title: z.string(),
      kind: z.string(),
      difficulty_band: z.string(),
      recommended_style: z.string(),
      reward_pool: z.array(z.string()),
      locked: z.boolean(),
      lock_reason: z.string().nullable().optional(),
    }),
  ),
  admin_hint: z.string(),
  archive_count: z.number(),
  recent_rewards: z.array(rewardSchema),
  understanding: understandingSchema,
  contamination: z.number(),
});

const ruleSchema = z.object({
  rule_id: z.string(),
  title: z.string().nullish(),
  text: z.string(),
  rule_type: z.enum(["explicit", "hidden", "false", "conditional"]),
  source: z.string(),
  confidence: z.number(),
  contradictions: z.array(z.string()).default([]),
  conditions: z.array(z.string()).default([]),
  discovered: z.boolean(),
  verified: z.boolean(),
  note: z.string().optional(),
  anomaly_hint: z.string().optional(),
});

const archivesSchema: z.ZodType<ArchivesView> = z.object({
  rules: z.array(ruleSchema),
  notebook_entries: z.array(
    z.object({
      entry_id: z.string(),
      title: z.string(),
      content: z.string(),
      source: z.string(),
      tags: z.array(z.string()),
      tampered: z.boolean().optional(),
    }),
  ),
  monster_archive: z.array(
    z.object({
      monster_id: z.string(),
      name: z.string(),
      type: z.string(),
      weakness_rule_id: z.string(),
      weakness_rule_text: z.string(),
      archive_hint: z.string(),
      special_mechanic: z.string().optional(),
    }),
  ),
  run_history: z.array(settlementSchema),
  recent_rewards: z.array(rewardSchema),
  unlocked_archives: z.array(z.string()),
  obtained_items: z.array(z.string()),
});

const sceneSchema: z.ZodType<SceneView> = z.object({
  node_id: z.string(),
  title: z.string(),
  description: z.string(),
  visible_objects: z.array(z.string()),
  clues: z.array(z.string()),
  insight: z.string().nullish(),
  ai_hint: z.string().optional(),
  suggested_actions: z.array(
    z.object({
      choice_id: z.string(),
      kind: z.string(),
      label: z.string(),
      action_text: z.string(),
      reason: z.string(),
    }),
  ),
  inventory_usable: z.array(inventoryItemSchema).optional(),
});

const combatResultSchema: z.ZodType<CombatResultView> = z.object({
  action: z.string(),
  outcome: z.string(),
  combat_success: z.boolean(),
  effective_power: z.number(),
  monster_threat: z.number(),
  margin: z.number(),
  weakness_known: z.boolean(),
  narrative: z.string(),
});

export const sessionOnlySchema = z.object({ session: sessionSchema });
export const hallPayloadSchema = z.object({ session: sessionSchema, hall: hallSchema });
export const hallVisitPayloadSchema = z
  .object({
    session: sessionSchema,
    visit: z
      .object({
        narrative: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();
export const archivesPayloadSchema = z.object({ session: sessionSchema, archives: archivesSchema });
export const activeRunPayloadSchema = z.object({
  session: sessionSchema,
  run: runSchema,
  scene: sceneSchema,
  settlement_ready: z.boolean(),
  settlement: settlementSchema.nullish(),
});
export const actionPayloadSchema = z.object({
  session: sessionSchema,
  run: runSchema,
  scene: sceneSchema,
  classification: z.object({
    primary_intent: z.string(),
    secondary_intent: z.string(),
    target: z.string().nullable().optional(),
    risk_tendency: z.number(),
    cautious_level: z.number(),
    trust_target: z.string(),
    raw_input: z.string(),
  }),
  narrative: z.string(),
  combat: z.record(z.string(), z.unknown()),
  illegal_action: z.boolean(),
  settlement_ready: z.boolean(),
  rules: z.array(ruleSchema),
  inventory: z.array(inventoryItemSchema),
  understanding: understandingSchema,
  idempotent_replay: z.boolean().optional(),
  settlement: settlementSchema.nullish(),
});
export const combatPayloadSchema = z.object({
  session: sessionSchema,
  run: runSchema,
  combat_result: combatResultSchema,
  settlement_ready: z.boolean(),
});
export const settlementPayloadSchema = z.object({ session: sessionSchema, settlement: settlementSchema });
export const dungeonEnterPayloadSchema = z
  .object({
    session: sessionSchema,
    run: runSchema,
    scene: sceneSchema,
  })
  .passthrough();

async function requestJson<T>(
  baseUrl: string,
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text) as { detail?: string };
      if (parsed.detail) {
        throw new Error(parsed.detail);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
    }
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return schema.parse(await response.json());
}

export function createGameApiClient(config: Pick<RuntimeConfig, "apiBase">) {
  const baseUrl = config.apiBase || DEFAULT_RULETALE_API_BASE;

  return {
    request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit) {
      return requestJson(baseUrl, path, schema, init);
    },
    startSession(playerName = DEFAULT_PLAYER_NAME) {
      return requestJson(baseUrl, "/api/v1/session/start", hallPayloadSchema, {
        method: "POST",
        body: JSON.stringify({ player_name: playerName }),
      });
    },
    getHall(sessionId: string) {
      return requestJson(baseUrl, `/api/v1/hall/${sessionId}`, hallPayloadSchema);
    },
    visitHallModule(sessionId: string, moduleId: string) {
      return requestJson(baseUrl, `/api/v1/hall/${sessionId}/visit`, hallVisitPayloadSchema, {
        method: "POST",
        body: JSON.stringify({ module_id: moduleId }),
      });
    },
    getArchives(sessionId: string) {
      return requestJson(baseUrl, `/api/v1/archives/${sessionId}`, archivesPayloadSchema);
    },
    enterDungeon(sessionId: string, dungeonId: string) {
      return requestJson(baseUrl, `/api/v1/dungeons/${dungeonId}/enter`, dungeonEnterPayloadSchema, {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
      });
    },
    getActiveRun(sessionId: string) {
      return requestJson(baseUrl, `/api/v1/runs/${sessionId}/active`, activeRunPayloadSchema);
    },
    interpretAction(sessionId: string, text: string) {
      return requestJson(baseUrl, `/api/v1/actions/${sessionId}/interpret`, actionPayloadSchema, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
    },
    resolveCombat(sessionId: string, action: string) {
      return requestJson(baseUrl, `/api/v1/combat/${sessionId}/resolve`, combatPayloadSchema, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
    },
    getSettlement(sessionId: string) {
      return requestJson(baseUrl, `/api/v1/settlement/${sessionId}`, settlementPayloadSchema);
    },
  };
}

export type GameApiClient = ReturnType<typeof createGameApiClient>;

export async function apiFetch<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  return requestJson(
    process.env.NEXT_PUBLIC_RULETALE_API_BASE ?? DEFAULT_RULETALE_API_BASE,
    path,
    schema,
    init,
  );
}
