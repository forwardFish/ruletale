import { describe, expect, it } from "vitest";

import { resolveCombat } from "@/lib/engine/combatEngine";

const stats = {
  HP: 88,
  SAN: 72,
  STA: 75,
  COG: 68,
  COR: 12,
  ATK: 20,
  DEF: 18,
  SPD: 17,
  ACC: 19,
  RES: 17,
};

describe("combatEngine", () => {
  it("makes exploit_rule stronger when weakness is known", () => {
    const known = resolveCombat({
      action: "exploit_rule",
      stats,
      psych: { FEAR: 22, WILL: 60, SUSP: 52, DEP: 18 },
      understanding: 140,
      monsterThreat: 78,
      weaknessKnown: true,
    });

    const blind = resolveCombat({
      action: "exploit_rule",
      stats,
      psych: { FEAR: 22, WILL: 60, SUSP: 52, DEP: 18 },
      understanding: 140,
      monsterThreat: 78,
      weaknessKnown: false,
    });

    expect(known.effectivePower).toBeGreaterThan(blind.effectivePower);
  });
});
