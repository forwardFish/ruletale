import type { ReactNode } from "react";

export function ScenePanel({ children }: { children: ReactNode }) {
  return <div className="space-y-5 md:space-y-6">{children}</div>;
}
