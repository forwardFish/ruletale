import type { PlatformRuntimeCapabilities } from "@game-core/platform";

import { miniGameStorageAdapter } from "@/platform/storage";

export const miniRuntimeCapabilities: PlatformRuntimeCapabilities = {
  platform: "mini",
  storage: miniGameStorageAdapter,
  assistantMode: "local",
  supportsMotion: false,
};
