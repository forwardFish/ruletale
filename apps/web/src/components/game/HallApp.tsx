"use client";

import { useHallExperience } from "@/features/hall/useHallExperience";
import { webGameApiClient } from "@/platform/web/gameClient";
import { useWebNavigation } from "@/platform/web/navigation";
import { webSessionStorage } from "@/platform/web/sessionStorage";

import { HallScreen } from "./HallScreen";

export function HallApp({ forceLobby = false }: { forceLobby?: boolean }) {
  const navigation = useWebNavigation();
  const experience = useHallExperience({
    client: webGameApiClient,
    navigation,
    sessionStorage: webSessionStorage,
    forceLobby,
  });

  return <HallScreen {...experience} />;
}
