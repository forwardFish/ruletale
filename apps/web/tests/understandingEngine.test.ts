import { describe, expect, it } from "vitest";

import { APARTMENT_DUNGEON } from "@/lib/data/dungeon_apartment_night_return";
import { addItemById } from "@/lib/engine/inventoryEngine";
import { getNodeInsight, getUnderstandingSnapshot } from "@/lib/engine/understandingEngine";

describe("understandingEngine", () => {
  it("returns stable level snapshots", () => {
    const snapshot = getUnderstandingSnapshot(130);
    expect(snapshot.levelName).toBe("记录者");
    expect(snapshot.nextThreshold).toBeGreaterThan(snapshot.currentThreshold);
  });

  it("unlocks apartment node insight with enough understanding", () => {
    const node = APARTMENT_DUNGEON.nodes.find((entry) => entry.id === "home_door");
    expect(node).toBeTruthy();
    const insight = getNodeInsight(node!, 150, []);
    expect(insight).toContain("门内");
  });

  it("lets insight items help reach a node threshold earlier", () => {
    const node = APARTMENT_DUNGEON.nodes.find((entry) => entry.id === "stairwell");
    expect(node).toBeTruthy();
    const inventory = addItemById([], "half_broken_flashlight");
    const insight = getNodeInsight(node!, 92, inventory);
    expect(insight).toContain("划痕");
  });
});
