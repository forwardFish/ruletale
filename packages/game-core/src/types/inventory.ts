import type { ItemDefinition } from "./item";

export type InventoryEntry = ItemDefinition & {
  quantity: number;
};

export type InventoryScope = "lobby" | "dungeon";

export type InventoryUseResult = {
  ok: boolean;
  message: string;
  inventory: InventoryEntry[];
  consumedItemId?: string;
  appliedEffects?: string[];
};
