"use client";

import { AnimatePresence, motion } from "framer-motion";

type Props = {
  open: boolean;
  title: string;
  intro: string;
  onClose: () => void;
};

export function DungeonIntroOverlay({ open, title, intro, onClose }: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(128,28,36,0.16),rgba(4,6,8,0.94)_52%,rgba(2,3,5,0.98)_100%)] px-4 text-left backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.985, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: 8 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="relative w-full max-w-3xl overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(8,9,12,0.97),rgba(9,10,13,0.94))] px-6 py-12 shadow-[0_24px_64px_rgba(0,0,0,0.42)] md:px-10 md:py-16"
          >
            <div className="pointer-events-none absolute inset-x-7 top-4 h-px bg-white/15" />
            <div className="pointer-events-none absolute inset-x-7 bottom-4 h-px bg-white/12" />
            <div className="pointer-events-none absolute left-6 top-6 h-5 w-5 border-l border-t border-white/18 md:left-8 md:top-8" />
            <div className="pointer-events-none absolute right-6 top-6 h-5 w-5 border-r border-t border-white/18 md:right-8 md:top-8" />
            <div className="pointer-events-none absolute left-6 bottom-6 h-5 w-5 border-b border-l border-white/18 md:left-8 md:bottom-8" />
            <div className="pointer-events-none absolute right-6 bottom-6 h-5 w-5 border-b border-r border-white/18 md:right-8 md:bottom-8" />
            <div className="pointer-events-none absolute left-14 top-4 h-[3px] w-14 rounded-full bg-[#9e3038]" />
            <div className="pointer-events-none absolute right-14 bottom-4 h-[3px] w-14 rounded-full bg-[#8e6a3a]" />

            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <div className="text-[11px] uppercase tracking-[0.42em] text-slate-500">Dungeon Entry</div>
              <h1 className="mt-6 text-3xl font-semibold tracking-[0.08em] text-slate-50 md:text-[42px] md:leading-[1.15]">
                欢迎进入 {title}
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-8 text-slate-400 md:text-[15px]">{intro}</p>
              <div className="mt-8 inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs tracking-[0.18em] text-slate-500">
                点击任意区域跳过
              </div>
            </div>
          </motion.div>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
