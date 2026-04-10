import { describe, expect, it } from "vitest";

import { addInventoryItem, applyInventoryItem, findUsableItems, useInventoryItem } from "@game-core/engine/inventoryEngine";
import type { InventoryEntry } from "@game-core/types/inventory";

const flashlight: InventoryEntry = {
  id: "half_broken_flashlight",
  name: "半损手电",
  type: "insight",
  rarity: "rare",
  description: "test",
  effectType: "reveal_clue",
  effectValue: 1,
  useCondition: "test",
  stackable: false,
  quantity: 1,
  usableInLobby: false,
  usableInDungeon: true,
  consumeOnUse: false,
  tags: ["light"],
  aliases: ["手电"],
  unlocksInsight: true,
  modifiesUnderstandingCheck: true,
};

const battery: InventoryEntry = {
  id: "spare_battery",
  name: "备用电池",
  type: "insight",
  rarity: "common",
  description: "test",
  effectType: "focus_observation",
  effectValue: 1,
  useCondition: "test",
  stackable: true,
  quantity: 1,
  usableInLobby: false,
  usableInDungeon: true,
  consumeOnUse: true,
  tags: ["battery"],
  aliases: ["电池"],
};

describe("inventoryEngine", () => {
  it("stacks consumables and consumes them", () => {
    const stacked = addInventoryItem([battery], battery);
    expect(stacked[0].quantity).toBe(2);

    const used = useInventoryItem(stacked, "spare_battery");
    expect(used[0].quantity).toBe(1);
  });

  it("filters usable dungeon items", () => {
    const usable = findUsableItems([flashlight, battery], "dungeon");
    expect(usable).toHaveLength(2);
  });

  it("rejects items that cannot be used in the lobby", () => {
    const result = applyInventoryItem([flashlight], "half_broken_flashlight", "lobby");
    expect(result.ok).toBe(false);
  });
});
