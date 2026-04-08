export type UnderstandingLevelId =
  | "unknown"
  | "first_witness"
  | "observer"
  | "recorder"
  | "breaker"
  | "glimpsewalker"
  | "inverse_reader"
  | "lawbreaker";

export type UnderstandingLevel = {
  id: UnderstandingLevelId;
  name: string;
  min: number;
  hintBonus: number;
  parserBias: number;
  falseRuleSense: number;
  monsterTellBonus: number;
};

export type UnderstandingSnapshot = {
  total: number;
  levelId: UnderstandingLevelId;
  levelName: string;
  currentThreshold: number;
  nextThreshold: number;
  nextLevelName: string;
  progressPercent: number;
};
