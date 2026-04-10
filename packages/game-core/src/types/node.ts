import type { BehaviorDelta } from "./profile";

export type ActionIntent =
  | "observe"
  | "inspect_object"
  | "move_to_area"
  | "ask_question"
  | "verify_rule"
  | "respond_voice"
  | "hide"
  | "wait"
  | "use_item"
  | "fight"
  | "flee"
  | "test_boundary"
  | "open_inventory"
  | "check_archive";

export type SceneActionSuggestion = {
  id: string;
  label: string;
  command: string;
  kind: ActionIntent;
  reason: string;
  riskTone?: "safe" | "balanced" | "risky";
  riskLabel?: string;
};

export type NodeEffectDelta = Partial<
  Record<
    "HP" | "SAN" | "STA" | "COG" | "COR" | "ATK" | "DEF" | "SPD" | "ACC" | "RES",
    number
  >
>;

export type PsychDelta = Partial<
  Record<"FEAR" | "SUSP" | "DEP" | "IMP" | "WILL" | "EMP" | "OBS", number>
>;

export type WorldDelta = Partial<Record<"AGGRO" | "DRIFT" | "HOSTILE", number>>;

export type NodeCondition = {
  requireFlags?: string[];
  forbidFlags?: string[];
  requireItems?: string[];
  minUnderstanding?: number;
  requireRules?: string[];
};

export type NodeOutcome = NodeCondition & {
  id: string;
  label: string;
  intents: ActionIntent[];
  targetKeywords?: string[];
  narrative: string;
  fallbackNarrative?: string;
  systemNotes?: string[];
  nextNodeId?: string;
  setFlags?: string[];
  statDelta?: NodeEffectDelta;
  psychDelta?: PsychDelta;
  worldDelta?: WorldDelta;
  understandingDelta?: number;
  discoverRuleIds?: string[];
  verifyRuleIds?: string[];
  eventIds?: string[];
  triggerMonsterId?: string;
  hiddenRoute?: boolean;
  trustNpcId?: string;
  trustNpcDelta?: number;
  markWrongNpc?: boolean;
  profileDelta?: BehaviorDelta;
  consumeItemId?: string;
  rewardItemIds?: string[];
  archiveFragmentIds?: string[];
  unlockConditionProgress?: string[];
  insightTextByItem?: Record<string, string>;
  endingId?: string;
};

export type SceneNode = {
  id: string;
  title: string;
  area: string;
  description: string;
  visibleObjects: string[];
  suspiciousPoints: string[];
  currentGoal: string;
  discoverableRuleIds: string[];
  suggestedActions: SceneActionSuggestion[];
  interactions: NodeOutcome[];
  understandingRewards: Partial<Record<ActionIntent, number>>;
  understandingPenalty: number;
  insightThreshold: number;
  bonusDescriptionByUnderstanding: string;
};
