import type { ReactNode } from "react";

import { EmptyState } from "@/components/mvp/ui/EmptyState";
import { Surface, SurfaceHeader, StatusPill } from "@/components/mvp/ui/Surface";

type RailItem = {
  id: string;
  title: string;
  description: string;
  meta?: string;
  badge?: string;
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  items: RailItem[];
  emptyTitle: string;
  emptyDescription: string;
  action?: ReactNode;
};

export function DiscoveryRail({ eyebrow, title, description, items, emptyTitle, emptyDescription, action }: Props) {
  return (
    <Surface tone="soft" className="p-5">
      <SurfaceHeader eyebrow={eyebrow} title={title} description={description} action={action} />
      <div className="mt-4">
        {items.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-[18px] border border-white/10 bg-[#0d141b] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-100">{item.title}</div>
                  {item.badge ? <StatusPill>{item.badge}</StatusPill> : null}
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-400">{item.description}</div>
                {item.meta ? <div className="mt-3 text-xs leading-6 text-slate-500">{item.meta}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </Surface>
  );
}
