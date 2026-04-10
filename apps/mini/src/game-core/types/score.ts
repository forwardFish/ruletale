export type ScoreGrade = "S" | "A" | "B" | "C" | "D";

export type ScoreBreakdown = {
  survival: number;
  mental: number;
  rules: number;
  combat: number;
  choice: number;
  understanding: number;
  overall: number;
};

export type SettlementGrades = Record<keyof ScoreBreakdown, ScoreGrade>;

export type SettlementResult = {
  dungeonId: string;
  dungeonTitle: string;
  endingId: string;
  endingTitle: string;
  summary: string;
  breakdown: ScoreBreakdown;
  grades: SettlementGrades;
  hiddenRoute: boolean;
  ruleCount: number;
  verifiedRuleCount: number;
  falseRuleBreaks: number;
  falseRuleTraps: number;
  battleCount: number;
  trustedWrongNpc: boolean;
  understandingDelta: number;
  totalUnderstanding: number;
  understandingLevelName: string;
  rewards: Array<{
    itemId: string;
    reason: string;
    quantity: number;
  }>;
  unlockedArchives: string[];
  obtainedEvents: string[];
  behaviorLabel: string;
  blackZoneProgressNotes: string[];
  blackZoneUnlocked: boolean;
};
