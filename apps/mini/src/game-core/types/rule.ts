export type RuleType = "explicit" | "hidden" | "false" | "conditional";

export type RuleDefinition = {
  id: string;
  title: string;
  text: string;
  type: RuleType;
  source: string;
  note: string;
  contradictions: string[];
  activeConditions?: string[];
  tamperHint?: string;
};

export type RuleArchiveEntry = RuleDefinition & {
  discovered: boolean;
  confidence: number;
  seenSources: string[];
  verified: boolean;
};
