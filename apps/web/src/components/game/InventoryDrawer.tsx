"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { InventoryItemView } from "@game-core/types/game";

import { InventoryPanel } from "./InventoryPanel";

export function InventoryDrawer({
  open,
  items,
  scope,
  onClose,
  onUse,
}: {
  open: boolean;
  items: InventoryItemView[];
  scope: "lobby" | "dungeon";
  onClose: () => void;
  onUse?: (itemId: string) => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/20 p-4 md:items-center"
        >
          <div className="w-full max-w-3xl rounded-[2rem] border border-stone-200/70 bg-stone-50/95 p-6 shadow-2xl backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Inventory</p>
                <h3 className="text-2xl font-semibold text-stone-900">你带回来的东西</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-stone-300 px-3 py-1.5 text-sm text-stone-700"
              >
                关闭
              </button>
            </div>
            <InventoryPanel items={items} scope={scope} onUse={onUse} />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
