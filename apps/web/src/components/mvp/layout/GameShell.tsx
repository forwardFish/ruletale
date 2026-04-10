import type { ReactNode } from "react";

import { cn } from "@game-core/utils/cn";

type Props = {
  header: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  footer?: ReactNode;
};

export function GameShell({ header, sidebar, main, footer }: Props) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(121,23,32,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(153,120,68,0.10),transparent_24%),linear-gradient(180deg,#09090a_0%,#0f1014_42%,#09090a_100%)] text-slate-100">
      <div className="mx-auto max-w-[1440px] px-4 py-4 md:px-6 md:py-6 xl:px-8">
        {header}
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px] xl:items-start">
          <main className="space-y-6">{main}</main>
          <aside className={cn("space-y-6", "xl:sticky xl:top-6")}>{sidebar}</aside>
        </div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}
