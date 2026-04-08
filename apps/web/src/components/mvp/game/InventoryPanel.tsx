"use client";

import type { InventoryEntry } from "@/lib/types/inventory";

import { EmptyState } from "@/components/mvp/ui/EmptyState";

import { ItemCard } from "./ItemCard";

type Props = {
  items: InventoryEntry[];
  onUse?: (itemId: string) => void;
  scope: "lobby" | "dungeon";
};

export function InventoryPanel({ items, onUse, scope }: Props) {
  if (!items.length) {
    return <EmptyState title="背包还是空的" description="你还没有从副本里带回任何可归类的物品。先完成一次探索，再回来整理它们。" />;
  }

  const usableItems = items.filter((item) => (scope === "lobby" ? item.usableInLobby : item.usableInDungeon));
  const lockedItems = items.filter((item) => !(scope === "lobby" ? item.usableInLobby : item.usableInDungeon));

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate-500">当前可用</div>
        <div className="grid gap-3">
          {usableItems.length === 0 ? (
            <EmptyState title="当前场景没有可用物品" description="背包里有东西，但它们不适合在这个环境里直接动用。" />
          ) : (
            usableItems.map((item) => <ItemCard key={item.id} item={item} onUse={onUse} useDisabled={!onUse} />)
          )}
        </div>
      </div>

      {lockedItems.length > 0 ? (
        <div>
          <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate-500">暂不可用</div>
          <div className="grid gap-3">
            {lockedItems.map((item) => (
              <ItemCard key={item.id} item={item} onUse={onUse} useDisabled />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
