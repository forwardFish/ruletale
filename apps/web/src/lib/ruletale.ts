import { apiFetch, DEFAULT_PLAYER_NAME } from "@/lib/api/client";
import { formatChoiceKind, formatCombatAction } from "@/lib/copy";
import { extractActiveRun, isRunInProgress } from "@/lib/gameState";
import { SESSION_STORAGE_KEY, webSessionStorage } from "@/platform/web/sessionStorage";

export { apiFetch, DEFAULT_PLAYER_NAME, extractActiveRun, formatChoiceKind, formatCombatAction, isRunInProgress };
export { SESSION_STORAGE_KEY };

export type {
  ArchivesView,
  DungeonCardView as DungeonCard,
  HallModuleView,
  RunSnapshot,
  SceneChoice,
  SceneView,
} from "@/lib/types/game";

export type JsonMap = Record<string, unknown>;

export function getStoredSessionId() {
  return webSessionStorage.getSessionId();
}

export function storeSessionId(sessionId: string) {
  webSessionStorage.setSessionId(sessionId);
}

export function clearStoredSessionId() {
  webSessionStorage.clearSessionId();
}
