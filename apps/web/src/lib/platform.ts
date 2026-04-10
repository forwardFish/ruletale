import type { AssistantMode, GameStorageAdapter, PlatformRuntimeCapabilities } from "@game-core/platform";

export type RuntimePlatform = PlatformRuntimeCapabilities["platform"];

export type SafeAreaInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type RuntimeConfig = PlatformRuntimeCapabilities & {
  apiBase: string;
  enableMotion: boolean;
  safeAreaInsets?: SafeAreaInsets;
};

export type SessionStorageAdapter = {
  getSessionId: () => string | null;
  setSessionId: (sessionId: string) => void;
  clearSessionId: () => void;
};

export type NavigationAdapter = {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
};

export type { AssistantMode, GameStorageAdapter, PlatformRuntimeCapabilities };
