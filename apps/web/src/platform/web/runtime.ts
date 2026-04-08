import { DEFAULT_RULETALE_API_BASE } from "@/lib/api/client";
import type { RuntimeConfig } from "@/lib/platform";

export const webRuntimeConfig: RuntimeConfig = {
  apiBase: process.env.NEXT_PUBLIC_RULETALE_API_BASE ?? DEFAULT_RULETALE_API_BASE,
  platform: "web",
  enableMotion: true,
};
