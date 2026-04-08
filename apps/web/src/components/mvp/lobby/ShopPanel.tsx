"use client";

import { ITEM_DEFINITIONS, SHOP_PRICES } from "@/lib/data/items";

import { Button } from "@/components/mvp/ui/Button";
import { Surface, SurfaceHeader, StatusPill } from "@/components/mvp/ui/Surface";

type Props = {
  stockIds: string[];
  supplyMarks: number;
  onBuy: (itemId: string) => void;
};

export function ShopPanel({ stockIds, supplyMarks, onBuy }: Props) {
  return (
    <Surface tone="soft" className="p-5">
      <SurfaceHeader eyebrow="Supply Store" title="商店" description="这里出售的是能帮助你继续判断的工具，而不是把判断替你做完的答案。" action={<StatusPill>{`供给点 ${supplyMarks}`}</StatusPill>} />
      <div className="mt-4 grid gap-3">
        {stockIds.map((itemId) => {
          const item = ITEM_DEFINITIONS[itemId];
          const price = SHOP_PRICES[itemId] ?? 0;
          return (
            <div key={itemId} className="rounded-[18px] border border-white/10 bg-[#0d141b] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100">{item.name}</div>
                  <div className="mt-2 text-sm leading-7 text-slate-400">{item.description}</div>
                </div>
                <Button type="button" variant="primary" disabled={supplyMarks < price} onClick={() => onBuy(itemId)} className="px-3">
                  {price}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}
