import type { InventoryItemView } from "@game-core/types/game";

import { ItemCard } from "./ItemCard";

export function InventoryPanel({
  items,
  scope,
  onUse,
}: {
  items: InventoryItemView[];
  scope: "lobby" | "dungeon";
  onUse?: (itemId: string) => void;
}) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-500">
        背包现在是空的，接下来每一步都要更慎重。
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <ItemCard key={item.item_id} item={item} onUse={onUse} scope={scope} />
      ))}
    </div>
  );
}
