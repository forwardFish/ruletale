export type AssistantMode = "local" | "direct-model-dev";

export type GameStorageAdapter = {
  getItem: <T>(key: string) => T | null;
  setItem: <T>(key: string, value: T) => void;
  removeItem: (key: string) => void;
};

export type PlatformRuntimeCapabilities = {
  platform: "web" | "mini";
  storage: GameStorageAdapter;
  assistantMode: AssistantMode;
  supportsMotion: boolean;
};
