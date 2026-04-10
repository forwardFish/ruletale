import { DEFAULT_RULETALE_API_BASE } from "@/lib/api/client";
import type { AssistantMode } from "@/lib/platform";
import type { RuntimeConfig } from "@/lib/platform";
import { webGameStorageAdapter } from "@/platform/web/storage";

function resolveAssistantMode(): AssistantMode {
  if (process.env.NODE_ENV !== "development") {
    return "local";
  }

  return process.env.NEXT_PUBLIC_RULETALE_ASSISTANT_MODE === "direct-model-dev" ? "direct-model-dev" : "local";
}

export const webRuntimeConfig: RuntimeConfig = {
  apiBase: process.env.NEXT_PUBLIC_RULETALE_API_BASE ?? DEFAULT_RULETALE_API_BASE,
  platform: "web",
  storage: webGameStorageAdapter,
  assistantMode: resolveAssistantMode(),
  supportsMotion: true,
  enableMotion: true,
};
