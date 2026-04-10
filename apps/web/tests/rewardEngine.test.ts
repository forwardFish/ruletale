import { describe, expect, it } from "vitest";

import { generateRewards } from "@game-core/engine/rewardEngine";
import type { SettlementResult } from "@game-core/types/score";

function makeSettlement(overrides: Partial<SettlementResult>): SettlementResult {
  return {
    dungeonId: "apartment_night_return",
    dungeonTitle: "公寓夜归",
    endingId: "apartment_insight_clear",
    endingTitle: "在门外识破回家",
    summary: "summary",
    breakdown: {
      survival: 90,
      mental: 88,
      rules: 92,
      combat: 76,
      choice: 90,
      understanding: 94,
      overall: 89,
    },
    grades: {
      survival: "A",
      mental: "A",
      rules: "S",
      combat: "B",
      choice: "A",
      understanding: "S",
      overall: "A",
    },
    hiddenRoute: true,
    ruleCount: 6,
    verifiedRuleCount: 4,
    falseRuleBreaks: 2,
    falseRuleTraps: 0,
    battleCount: 1,
    trustedWrongNpc: false,
    understandingDelta: 8,
    totalUnderstanding: 132,
    understandingLevelName: "记录者",
    rewards: [],
    unlockedArchives: [],
    obtainedEvents: [],
    behaviorLabel: "试探型",
    blackZoneProgressNotes: [],
    blackZoneUnlocked: false,
    ...overrides,
  };
}

describe("rewardEngine", () => {
  it("grants premium reward for apartment insight ending", () => {
    const rewards = generateRewards(makeSettlement({}));
    expect(rewards.some((reward) => reward.itemId === "temporary_pass")).toBe(true);
  });

  it("grants high-risk reward for apartment wrong clear", () => {
    const rewards = generateRewards(
      makeSettlement({
        endingId: "apartment_wrong_clear",
        grades: {
          survival: "C",
          mental: "C",
          rules: "B",
          combat: "C",
          choice: "D",
          understanding: "C",
          overall: "C",
        },
      }),
    );
    expect(rewards.some((reward) => reward.itemId === "mirror_shard")).toBe(true);
  });
});
