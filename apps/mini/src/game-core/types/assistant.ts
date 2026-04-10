import { z } from "zod";

export const assistantActionIntentSchema = z.enum([
  "observe",
  "inspect_object",
  "move_to_area",
  "ask_question",
  "verify_rule",
  "respond_voice",
  "hide",
  "wait",
  "use_item",
  "fight",
  "flee",
  "test_boundary",
  "open_inventory",
  "check_archive",
]);

export const assistantSuggestionRiskToneSchema = z.enum(["safe", "balanced", "risky"]);

export const assistantSuggestionSchema = z.object({
  label: z.string().min(1).max(36),
  command: z.string().min(1).max(80),
  kind: assistantActionIntentSchema,
  reason: z.string().min(1).max(90),
  riskTone: assistantSuggestionRiskToneSchema.optional(),
  riskLabel: z.string().min(1).max(16).optional(),
});

export const deepseekSceneRequestSchema = z.object({
  mode: z.enum(["normalize", "suggest"]),
  rawInput: z.string().max(200).optional(),
  dungeonTitle: z.string(),
  nodeId: z.string(),
  nodeTitle: z.string(),
  area: z.string(),
  description: z.string(),
  visibleObjects: z.array(z.string()).max(12),
  suspiciousPoints: z.array(z.string()).max(12),
  currentGoal: z.string(),
  localSuggestedActions: z.array(
    z.object({
      label: z.string(),
      command: z.string(),
      kind: assistantActionIntentSchema,
      reason: z.string(),
      riskTone: assistantSuggestionRiskToneSchema.optional(),
      riskLabel: z.string().optional(),
    }),
  ),
  discoveredRules: z.array(z.string()).max(16),
  verifiedRules: z.array(z.string()).max(16),
  recentLog: z.array(z.string()).max(8),
  actionHistory: z.array(z.string()).max(6),
  understanding: z.number(),
  contamination: z.number(),
  behaviorLabel: z.string(),
  inventoryNames: z.array(z.string()).max(16),
});

export const deepseekSceneResponseSchema = z.object({
  normalizedAction: z.string().max(120).optional(),
  playerFacingHint: z.string().max(180).nullable().optional(),
  actionInterpretation: z.string().max(120).nullable().optional(),
  pressureHint: z.string().max(120).nullable().optional(),
  ruleLead: z.string().max(120).nullable().optional(),
  rewardLead: z.string().max(120).nullable().optional(),
  suggestions: z.array(assistantSuggestionSchema).min(3).max(5),
});

export type DeepseekSceneRequest = z.infer<typeof deepseekSceneRequestSchema>;
export type DeepseekSceneResponse = z.infer<typeof deepseekSceneResponseSchema>;
