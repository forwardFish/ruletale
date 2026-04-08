"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import type { InventoryEntry } from "@/lib/types/inventory";

import { Button } from "@/components/mvp/ui/Button";
import { SurfaceHeader } from "@/components/mvp/ui/Surface";

import { InventoryPanel } from "./InventoryPanel";

type Props = {
  open: boolean;
  title: string;
  items: InventoryEntry[];
  scope: "lobby" | "dungeon";
  onClose: () => void;
  onUse?: (itemId: string) => void;
};

export function InventoryDrawer({ open, title, items, scope, onClose, onUse }: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/72 p-3 backdrop-blur-sm md:p-6">
          <div className="flex min-h-full items-end justify-center md:items-center">
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="w-full max-w-4xl rounded-[26px] border border-white/10 bg-[#101822] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.34)] md:p-6"
            >
              <SurfaceHeader
                eyebrow="Inventory"
                title={title}
                description={scope === "lobby" ? "大厅里能整理、查看与消费部分物品。" : "副本里只显示当前环境能真正动用的东西。"}
                action={
                  <Button type="button" variant="ghost" onClick={onClose} className="rounded-full p-3">
                    <X className="h-4 w-4" />
                  </Button>
                }
              />
              <div className="mt-5 max-h-[72vh] overflow-auto pr-1">
                <InventoryPanel items={items} onUse={onUse} scope={scope} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
