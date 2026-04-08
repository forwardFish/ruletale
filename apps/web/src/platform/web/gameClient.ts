import { createGameApiClient } from "@/lib/api/client";

import { webRuntimeConfig } from "./runtime";

export const webGameApiClient = createGameApiClient(webRuntimeConfig);
