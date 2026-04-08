"use client";

import { useDungeonExperience } from "@/features/dungeon/useDungeonExperience";
import { webGameApiClient } from "@/platform/web/gameClient";
import { useWebNavigation } from "@/platform/web/navigation";
import { webSessionStorage } from "@/platform/web/sessionStorage";

import { DungeonScreen } from "./DungeonScreen";

export function DungeonApp({ sessionId }: { sessionId: string }) {
  const navigation = useWebNavigation();
  const experience = useDungeonExperience({
    client: webGameApiClient,
    navigation,
    sessionStorage: webSessionStorage,
    sessionId,
  });

  return <DungeonScreen {...experience} />;
}
