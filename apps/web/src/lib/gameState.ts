import type { RunSnapshot, SessionSnapshot } from "@/lib/types/game";

const ACTIVE_RUN_STATUSES = new Set(["active", "combat", "settlement_ready"]);

export function extractActiveRun(
  session: Pick<SessionSnapshot, "active_run"> | null | undefined,
): RunSnapshot | null {
  return session?.active_run ?? null;
}

export function isRunInProgress(run: RunSnapshot | null | undefined) {
  return Boolean(run && ACTIVE_RUN_STATUSES.has(run.status));
}
