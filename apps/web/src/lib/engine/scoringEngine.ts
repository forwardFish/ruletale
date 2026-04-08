import type { ScoreBreakdown, ScoreGrade, SettlementGrades } from "@/lib/types/score";

export type ScoreInput = {
  hp: number;
  san: number;
  cor: number;
  rulesFound: number;
  rulesVerified: number;
  falseRuleDiscerned: number;
  falseRuleTrapped: number;
  understandingDelta: number;
  hiddenRoute: boolean;
  battleCount?: number;
  violentClear?: boolean;
  failed?: boolean;
  trustedWrongNpc?: boolean;
};

export function gradeScore(value: number): ScoreGrade {
  if (value >= 90) return "S";
  if (value >= 80) return "A";
  if (value >= 68) return "B";
  if (value >= 56) return "C";
  return "D";
}

export function calculateScoreBreakdown(input: ScoreInput) {
  const survival = Math.max(0, input.hp - (input.failed ? 24 : 0));
  const mental = Math.max(0, input.san - input.cor * 0.35 - (input.trustedWrongNpc ? 6 : 0));
  const rules = Math.min(
    100,
    32 +
      input.rulesFound * 8 +
      input.rulesVerified * 14 +
      input.falseRuleDiscerned * 12 -
      input.falseRuleTrapped * 14,
  );
  const combat = Math.max(
    0,
    84 -
      (input.violentClear ? 14 : 0) -
      (input.failed ? 18 : 0) -
      Math.max(0, (input.battleCount ?? 0) - 1) * 4 +
      (input.hiddenRoute ? 8 : 0),
  );
  const choice = Math.max(
    0,
    60 + (input.hiddenRoute ? 10 : 0) - input.falseRuleTrapped * 10 - (input.trustedWrongNpc ? 8 : 0),
  );
  const understanding = Math.min(
    100,
    Math.max(
      0,
      42 +
        input.understandingDelta * 5 +
        input.rulesVerified * 5 +
        input.falseRuleDiscerned * 10 +
        (input.hiddenRoute ? 8 : 0) -
        input.falseRuleTrapped * 12,
    ),
  );
  const overall = Number(((survival + mental + rules + combat + choice + understanding) / 6).toFixed(2));

  return {
    survival,
    mental,
    rules,
    combat,
    choice,
    understanding,
    overall,
    survivalScore: survival,
    mentalScore: mental,
    rulesScore: rules,
    combatScore: combat,
    choiceScore: choice,
    understandingScore: understanding,
    overallScore: overall,
  };
}

export function breakdownToGrades(breakdown: ScoreBreakdown): SettlementGrades {
  return {
    survival: gradeScore(breakdown.survival),
    mental: gradeScore(breakdown.mental),
    rules: gradeScore(breakdown.rules),
    combat: gradeScore(breakdown.combat),
    choice: gradeScore(breakdown.choice),
    understanding: gradeScore(breakdown.understanding),
    overall: gradeScore(breakdown.overall),
  };
}
