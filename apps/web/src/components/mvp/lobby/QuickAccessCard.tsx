"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { Button } from "@/components/mvp/ui/Button";
import { Surface, StatusPill } from "@/components/mvp/ui/Surface";

type Props = {
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
  actionLabel: string;
  onAction?: () => void;
  disabled?: boolean;
  badge?: ReactNode;
};

export function QuickAccessCard({ image, imageAlt, eyebrow, title, description, meta, actionLabel, onAction, disabled = false, badge }: Props) {
  return (
    <Surface tone="soft" className="overflow-hidden border-white/10 p-0">
      <div className="relative h-32 border-b border-white/10">
        <Image src={image} alt={imageAlt} fill className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,9,0.08),rgba(9,9,9,0.62))]" />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{eyebrow}</div>
            <div className="mt-2 text-lg font-semibold text-slate-50">{title}</div>
          </div>
          {badge ? badge : <StatusPill>{disabled ? "锁定" : "可用"}</StatusPill>}
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
        {meta ? <div className="mt-3 text-xs leading-6 text-slate-500">{meta}</div> : null}
        <div className="mt-5">
          <Button variant={disabled ? "secondary" : "primary"} fullWidth disabled={disabled} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      </div>
    </Surface>
  );
}
