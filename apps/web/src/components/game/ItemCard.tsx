import { BadgeAlert, Package2 } from "lucide-react";

import type { InventoryItemView } from "@/lib/types/game";

export function ItemCard({
  item,
  onUse,
  scope,
}: {
  item: InventoryItemView;
  onUse?: (itemId: string) => void;
  scope: "lobby" | "dungeon";
}) {
  const usable = scope === "lobby" ? item.usable_in_lobby : item.usable_in_dungeon;

  return (
    <article className="rounded-3xl border border-stone-300/70 bg-white/85 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Package2 className="h-4 w-4" />
            <span>{item.rarity}</span>
          </div>
          <h4 className="mt-1 font-semibold text-stone-900">{item.name}</h4>
          <p className="mt-2 text-sm leading-6 text-stone-600">{item.description}</p>
        </div>
        <div className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">x{item.quantity}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-600">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <BadgeAlert className="h-4 w-4" />
          <span>{item.use_condition}</span>
        </div>
        {onUse ? (
          <button
            type="button"
            disabled={!usable}
            onClick={() => onUse(item.item_id)}
            className="rounded-full border border-stone-400/70 px-3 py-1.5 text-xs font-medium text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
          >
            {usable ? "使用" : "此处不可用"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
