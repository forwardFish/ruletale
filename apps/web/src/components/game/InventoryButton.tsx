import { Backpack } from "lucide-react";

export function InventoryButton({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-stone-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-stone-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
    >
      <Backpack className="h-4 w-4" />
      <span>背包</span>
      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{count}</span>
    </button>
  );
}
