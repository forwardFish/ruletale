export type RuntimePlatform = "web" | "miniapp";

export type SafeAreaInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type RuntimeConfig = {
  apiBase: string;
  platform: RuntimePlatform;
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
