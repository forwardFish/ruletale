"use client";

import type { ReactNode } from "react";

import type { InventoryEntry } from "@game-core/types/inventory";

import { Button } from "@/components/mvp/ui/Button";
import { StatusPill } from "@/components/mvp/ui/Surface";

type Props = {
  item: InventoryEntry;
  onUse?: (itemId: string) => void;
  useDisabled?: boolean;
  footer?: ReactNode;
};

export function ItemCard({ item, onUse, useDisabled = false, footer }: Props) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#0d141b] p-4 text-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold">{item.name}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusPill>{item.rarity}</StatusPill>
            <StatusPill>{item.type}</StatusPill>
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">x{item.quantity}</div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-300">{item.description}</p>
      <div className="mt-3 text-xs leading-6 text-slate-500">使用条件：{item.useCondition}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <StatusPill key={tag}>{tag}</StatusPill>
        ))}
      </div>
      {(onUse || footer) && (
        <div className="mt-5 flex items-center justify-between gap-3">
          {onUse ? (
            <Button type="button" variant="primary" disabled={useDisabled} onClick={() => onUse(item.id)}>
              使用
            </Button>
          ) : (
            <span />
          )}
          {footer}
        </div>
      )}
    </div>
  );
}
