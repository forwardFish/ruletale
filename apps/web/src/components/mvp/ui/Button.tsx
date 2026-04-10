import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@game-core/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "border border-amber-300/20 bg-amber-200/[0.14] text-amber-50 shadow-[0_10px_30px_rgba(0,0,0,0.22)] hover:border-amber-200/30 hover:bg-amber-200/[0.18]",
  secondary:
    "border border-white/10 bg-white/[0.05] text-slate-100 hover:border-white/14 hover:bg-white/[0.08]",
  ghost:
    "border border-transparent bg-transparent text-slate-300 hover:bg-white/[0.04] hover:text-slate-100",
  danger:
    "border border-rose-300/20 bg-rose-300/[0.10] text-rose-50 hover:border-rose-300/30 hover:bg-rose-300/[0.14]",
};

export function Button({ children, className, variant = "secondary", fullWidth = false, ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-[18px] px-4 py-2.5 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-40",
        fullWidth && "w-full",
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
