import { motion } from "framer-motion";
import { AlertTriangle, Goal, MapPinned, ScanSearch } from "lucide-react";

import { Surface, StatusPill } from "@/components/mvp/ui/Surface";

type Props = {
  title: string;
  area: string;
  description: string;
  visibleObjects: string[];
  suspiciousPoints: string[];
  currentGoal: string;
};

export function SceneRenderer({ title, area, description, visibleObjects, suspiciousPoints, currentGoal }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <Surface tone="hero" className="overflow-hidden p-0">
        <div className="relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(161,26,34,0.22),transparent_36%),linear-gradient(180deg,rgba(8,8,10,0.1),rgba(8,8,10,0.4))]" />
          <div className="relative border-b border-white/10 px-6 py-6 md:px-7 md:py-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                  <MapPinned className="h-3.5 w-3.5" />
                  {area}
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50 md:text-[2.3rem]">{title}</h2>
                <p className="mt-4 max-w-4xl whitespace-pre-line text-[15px] leading-8 text-slate-300">{description}</p>
              </div>
              <StatusPill tone="accent" className="self-start lg:self-auto">
                当前场景
              </StatusPill>
            </div>
          </div>

          <div className="relative grid gap-4 px-6 py-6 md:px-7 md:py-7 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                <ScanSearch className="h-4 w-4" />
                可见对象
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {visibleObjects.map((item) => (
                  <StatusPill key={item}>{item}</StatusPill>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                <Goal className="h-4 w-4" />
                当前目标
              </div>
              <div className="mt-4 text-sm leading-7 text-slate-300">{currentGoal}</div>
            </div>
          </div>

          <div className="relative border-t border-white/10 px-6 py-6 md:px-7 md:py-7">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
              <AlertTriangle className="h-4 w-4" />
              可疑点
            </div>
            <div className="mt-4 grid gap-3">
              {suspiciousPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-[18px] border border-amber-300/14 bg-amber-200/[0.06] px-4 py-3 text-sm leading-7 text-amber-50/90"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Surface>
    </motion.div>
  );
}
