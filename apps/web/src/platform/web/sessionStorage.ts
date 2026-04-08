import type { SessionStorageAdapter } from "@/lib/platform";

export const SESSION_STORAGE_KEY = "ruletale-session-id";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function createSessionStorageAdapter(
  getStorage: () => StorageLike | null,
  storageKey = SESSION_STORAGE_KEY,
): SessionStorageAdapter {
  return {
    getSessionId() {
      return getStorage()?.getItem(storageKey) ?? null;
    },
    setSessionId(sessionId) {
      getStorage()?.setItem(storageKey, sessionId);
    },
    clearSessionId() {
      getStorage()?.removeItem(storageKey);
    },
  };
}

function resolveBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export const webSessionStorage = createSessionStorageAdapter(resolveBrowserStorage);
