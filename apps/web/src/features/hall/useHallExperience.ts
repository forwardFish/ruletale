import { useEffect, useState } from "react";

import type { GameApiClient } from "@/lib/api/client";
import { buildHallViewModel } from "@/lib/viewModels";
import type { NavigationAdapter, SessionStorageAdapter } from "@/lib/platform";
import type { ArchivesView, HallModuleId, HallView, SessionSnapshot } from "@game-core/types/game";

type HallExperienceDeps = {
  client: GameApiClient;
  navigation: NavigationAdapter;
  sessionStorage: SessionStorageAdapter;
  forceLobby?: boolean;
};

export function useHallExperience({
  client,
  navigation,
  sessionStorage,
  forceLobby = false,
}: HallExperienceDeps) {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [hall, setHall] = useState<HallView | null>(null);
  const [archives, setArchives] = useState<ArchivesView | null>(null);
  const [activePanel, setActivePanel] = useState<HallModuleId | null>(null);
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);
  const [lastNarrative, setLastNarrative] = useState("大厅会先记住你要从哪一扇门离开。");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setBooting(true);
      setError(null);

      const storedSessionId = sessionStorage.getSessionId();
      if (storedSessionId) {
        try {
          const payload = await client.getHall(storedSessionId);
          if (cancelled) {
            return;
          }

          setSession(payload.session);
          setHall(payload.hall);
          setArchives(null);
          setLastNarrative(payload.hall.admin_hint || payload.hall.narrative);

          if (
            !forceLobby &&
            payload.session.active_run &&
            ["active", "combat", "settlement_ready"].includes(payload.session.active_run.status)
          ) {
            navigation.replace(`/dungeon/${storedSessionId}`);
            return;
          }

          setBooting(false);
          return;
        } catch {
          sessionStorage.clearSessionId();
        }
      }

      try {
        const created = await client.startSession();
        if (cancelled) {
          return;
        }

        sessionStorage.setSessionId(created.session.session_id);
        setSession(created.session);
        setHall(created.hall);
        setArchives(null);
        setLastNarrative(created.hall.admin_hint || created.hall.narrative);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "大厅没有按时显影。");
        }
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [client, navigation, sessionStorage, forceLobby]);

  async function ensureArchives(activeSessionId: string) {
    const payload = await client.getArchives(activeSessionId);
    setArchives(payload.archives);
    setSession(payload.session);
  }

  async function refreshHall(activeSessionId: string) {
    const payload = await client.getHall(activeSessionId);
    setSession(payload.session);
    setHall(payload.hall);
    setLastNarrative(payload.hall.admin_hint || payload.hall.narrative);
    return payload;
  }

  async function openPanel(panel: HallModuleId) {
    setActivePanel(panel);
    setError(null);

    if (!session?.session_id || panel === "task_wall") {
      return;
    }

    setLoadingTarget(panel);
    try {
      const visit = await client.visitHallModule(session.session_id, panel);
      const hallPayload = await refreshHall(session.session_id);

      setLastNarrative(visit.visit?.narrative || hallPayload.hall.admin_hint || hallPayload.hall.narrative);

      if (panel === "archives") {
        await ensureArchives(session.session_id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "大厅没有回应这一角。");
    } finally {
      setLoadingTarget(null);
    }
  }

  async function enterDungeon(dungeonId: string) {
    if (!session?.session_id) {
      return;
    }

    setLoadingTarget(dungeonId);
    setError(null);
    try {
      await client.enterDungeon(session.session_id, dungeonId);
      sessionStorage.setSessionId(session.session_id);
      navigation.push(`/dungeon/${session.session_id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "门没有为你打开。");
    } finally {
      setLoadingTarget(null);
    }
  }

  function closePanel() {
    setActivePanel(null);
  }

  function continueRun() {
    if (session?.session_id) {
      navigation.push(`/dungeon/${session.session_id}`);
    }
  }

  return {
    viewModel: buildHallViewModel({
      booting,
      loading: loadingTarget !== null,
      error,
      activePanel,
      loadingTarget,
      lastNarrative,
      session,
      hall,
      archives,
    }),
    openPanel,
    closePanel,
    continueRun,
    enterDungeon,
  };
}
