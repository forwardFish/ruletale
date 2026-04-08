"use client";

import { Backpack } from "lucide-react";

type Props = {
  count: number;
  onClick: () => void;
};

export function InventoryButton({ count, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-100 transition hover:border-white/14 hover:bg-white/[0.08]"
    >
      <span className="inline-flex items-center gap-2">
        <Backpack className="h-4 w-4" />
        背包
      </span>
      <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-xs text-slate-300">{count}</span>
    </button>
  );
}
