import Taro from "@tarojs/taro";

import type { GameStorageAdapter } from "@game-core/platform";

export const miniGameStorageAdapter: GameStorageAdapter = {
  getItem<T>(key: string) {
    try {
      const value = Taro.getStorageSync<string | T>(key);
      if (typeof value === "string") {
        return JSON.parse(value) as T;
      }
      return (value as T) ?? null;
    } catch {
      return null;
    }
  },
  setItem<T>(key: string, value: T) {
    Taro.setStorageSync(key, JSON.stringify(value));
  },
  removeItem(key: string) {
    Taro.removeStorageSync(key);
  },
};
