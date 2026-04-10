import { useEffect, useState } from "react";

import type { GameApiClient } from "@/lib/api/client";
import { buildDungeonViewModel } from "@/lib/viewModels";
import type { NavigationAdapter, SessionStorageAdapter } from "@/lib/platform";
import type {
  ArchivesView,
  DrawerTab,
  RunSnapshot,
  SceneView,
  SessionSnapshot,
  SettlementView,
} from "@game-core/types/game";

type DungeonExperienceDeps = {
  client: GameApiClient;
  navigation: NavigationAdapter;
  sessionStorage: SessionStorageAdapter;
  sessionId: string;
};

export function useDungeonExperience({
  client,
  navigation,
  sessionStorage,
  sessionId,
}: DungeonExperienceDeps) {
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [run, setRun] = useState<RunSnapshot | null>(null);
  const [scene, setScene] = useState<SceneView | null>(null);
  const [archives, setArchives] = useState<ArchivesView | null>(null);
  const [settlement, setSettlement] = useState<SettlementView | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<DrawerTab>("inventory");
  const [showComposer, setShowComposer] = useState(false);
  const [actionText, setActionText] = useState("");
  const [lastNarrative, setLastNarrative] = useState("门后的空气还没有把答案递给你。");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refreshArchives() {
      const payload = await client.getArchives(sessionId);
      if (cancelled) {
        return;
      }

      setArchives(payload.archives);
      setSession(payload.session);
    }

    async function refreshSettlement() {
      try {
        const payload = await client.getSettlement(sessionId);
        if (cancelled) {
          return;
        }

        setSettlement(payload.settlement);
        setSession(payload.session);
        setRun(payload.session.active_run ?? null);
      } catch {
        // Settlement is only expected late in a run.
      }
    }

    async function refreshRun() {
      setLoading(true);
      setError(null);
      try {
        const payload = await client.getActiveRun(sessionId);
        if (cancelled) {
          return;
        }

        setSession(payload.session);
        setRun(payload.run);
        setScene(payload.scene);
        setSettlement(payload.settlement ?? null);
        setLastNarrative(payload.scene.ai_hint ?? payload.scene.description);
        setActionText(payload.scene.suggested_actions[0]?.action_text ?? "观察当前场景");

        await refreshArchives();

        if (payload.settlement_ready && !payload.settlement) {
          await refreshSettlement();
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "门后的场景没有成功显影。");
          navigation.replace("/?lobby=1");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setBooting(false);
        }
      }
    }

    sessionStorage.setSessionId(sessionId);
    void refreshRun();

    return () => {
      cancelled = true;
    };
  }, [client, navigation, sessionId, sessionStorage]);

  async function refreshArchives() {
    const payload = await client.getArchives(sessionId);
    setArchives(payload.archives);
    setSession(payload.session);
  }

  async function refreshSettlement() {
    const payload = await client.getSettlement(sessionId);
    setSettlement(payload.settlement);
    setSession(payload.session);
    setRun(payload.session.active_run ?? null);
  }

  async function refreshRun() {
    const payload = await client.getActiveRun(sessionId);
    setSession(payload.session);
    setRun(payload.run);
    setScene(payload.scene);
    setSettlement(payload.settlement ?? null);
    setLastNarrative(payload.scene.ai_hint ?? payload.scene.description);
    setActionText(payload.scene.suggested_actions[0]?.action_text ?? "观察当前场景");
    await refreshArchives();
    if (payload.settlement_ready && !payload.settlement) {
      await refreshSettlement();
    }
  }

  async function submitAction(text: string) {
    if (!text.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = await client.interpretAction(sessionId, text);
      setSession(payload.session);
      setRun(payload.run);
      setScene(payload.scene);
      setSettlement(payload.settlement ?? null);
      setLastNarrative(payload.narrative ?? "场景短暂安静了一瞬。");
      setActionText(payload.scene.suggested_actions[0]?.action_text ?? text);

      if (text.includes("背包")) {
        setActiveDrawer("inventory");
      }

      await refreshArchives();

      if (payload.settlement_ready && !payload.combat?.active) {
        await refreshSettlement();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "这一步没有得到回应。");
    } finally {
      setLoading(false);
    }
  }

  async function resolveCombat(action: string) {
    setLoading(true);
    setError(null);
    try {
      const payload = await client.resolveCombat(sessionId, action);
      setSession(payload.session);
      setRun(payload.run);
      setLastNarrative(payload.combat_result.narrative);
      await refreshArchives();
      if (payload.settlement_ready) {
        await refreshSettlement();
      } else {
        await refreshRun();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "你没能从这次碰撞里拿回主动。");
    } finally {
      setLoading(false);
    }
  }

  function goBackToHall() {
    navigation.push("/?lobby=1");
  }

  return {
    viewModel: buildDungeonViewModel({
      booting,
      loading,
      error,
      activeDrawer,
      showComposer,
      actionText,
      lastNarrative,
      sessionId,
      session,
      run,
      scene,
      archives,
      settlement,
    }),
    setActiveDrawer,
    setActionText,
    toggleComposer() {
      setShowComposer((value) => !value);
    },
    hideComposer() {
      setShowComposer(false);
    },
    submitAction,
    resolveCombat,
    goBackToHall,
  };
}
