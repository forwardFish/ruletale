import { describe, expect, it } from "vitest";

import { calculateScoreBreakdown } from "@game-core/engine/scoringEngine";

describe("scoringEngine", () => {
  it("scores a strong understanding route higher", () => {
    const strong = calculateScoreBreakdown({
      hp: 78,
      san: 74,
      cor: 18,
      rulesFound: 5,
      rulesVerified: 3,
      falseRuleDiscerned: 1,
      falseRuleTrapped: 0,
      understandingDelta: 9,
      hiddenRoute: true,
    });

    const weak = calculateScoreBreakdown({
      hp: 78,
      san: 74,
      cor: 18,
      rulesFound: 3,
      rulesVerified: 1,
      falseRuleDiscerned: 0,
      falseRuleTrapped: 1,
      understandingDelta: 1,
      hiddenRoute: false,
    });

    expect(strong.understandingScore).toBeGreaterThan(weak.understandingScore);
    expect(strong.overallScore).toBeGreaterThan(weak.overallScore);
  });
});
