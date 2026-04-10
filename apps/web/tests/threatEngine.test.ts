import { describe, expect, it } from "vitest";

import { calculateThreatProfile } from "@game-core/engine/threatEngine";

describe("threatEngine", () => {
  it("calculates hidden threat from player state", () => {
    const profile = calculateThreatProfile(
      {
        HP: 92,
        SAN: 84,
        STA: 80,
        COG: 68,
        COR: 12,
        ATK: 20,
        DEF: 18,
        SPD: 17,
        ACC: 18,
        RES: 18,
      },
      120,
      1.03,
      { SUSP: 52 },
      { DRIFT: 18 },
    );

    expect(profile.effectivePower).toBeGreaterThan(0);
    expect(profile.threatValue).toBeCloseTo(profile.effectivePower * 1.03, 1);
    expect(profile.breakdown.rulePressure).toBeGreaterThan(profile.breakdown.environmentPressure / 2);
  });
});
