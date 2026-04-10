import type { GameStorageAdapter } from "@game-core/platform";
import type { PersistStorage, StorageValue } from "zustand/middleware";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function createGameStorageAdapter(getStorage: () => StorageLike | null): GameStorageAdapter {
  return {
    getItem<T>(key: string): T | null {
      const raw = getStorage()?.getItem(key);
      if (!raw) {
        return null;
      }

      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    setItem<T>(key: string, value: T) {
      getStorage()?.setItem(key, JSON.stringify(value));
    },
    removeItem(key) {
      getStorage()?.removeItem(key);
    },
  };
}

export function createPersistStorage<T>(adapter: GameStorageAdapter): PersistStorage<T> {
  return {
    getItem(name) {
      return adapter.getItem<StorageValue<T>>(name);
    },
    setItem(name, value) {
      adapter.setItem(name, value);
    },
    removeItem(name) {
      adapter.removeItem(name);
    },
  };
}

function resolveBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export const webGameStorageAdapter = createGameStorageAdapter(resolveBrowserStorage);
