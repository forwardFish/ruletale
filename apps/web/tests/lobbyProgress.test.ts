import { describe, expect, it } from "vitest";

import { evaluateBlackZoneProgress } from "@/lib/data/lobby";
import { createInitialProfile } from "@/lib/engine/gameEngine";
import { addItemById } from "@/lib/engine/inventoryEngine";

describe("black zone progress", () => {
  it("stays locked when only one condition is met", () => {
    const { player, progress, inventory } = createInitialProfile();
    player.understanding = 130;

    const result = evaluateBlackZoneProgress(player, progress, inventory);
    expect(result.unlocked).toBe(false);
    expect(result.conditions.filter((condition) => condition.satisfied)).toHaveLength(1);
  });

  it("unlocks after all three conditions are satisfied", () => {
    const { player, progress, inventory } = createInitialProfile();
    player.understanding = 130;
    progress.archive.endings.push("insight_clear");
    const nextInventory = addItemById(inventory, "temporary_pass");

    const result = evaluateBlackZoneProgress(player, progress, nextInventory);
    expect(result.unlocked).toBe(true);
    expect(result.conditions.every((condition) => condition.satisfied)).toBe(true);
  });
});
