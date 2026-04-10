import { useMemo, useState } from "react";

import { Button, Input, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";

import { enterMiniDungeon, getActiveNode, loadMiniState, resolveMiniCombat, returnMiniToHall, saveMiniState, submitMiniAction } from "@/lib/gameState";
import type { MvpGameStoreState } from "@game-core/types/game";

const COMBAT_ACTIONS = [
  { label: "强攻", value: "attack" },
  { label: "防守", value: "defend" },
  { label: "撤离", value: "flee" },
  { label: "利用规则", value: "exploit_rule" },
] as const;

export default function DungeonPage() {
  const params = Taro.getCurrentInstance().router?.params ?? {};
  const dungeonId = typeof params.dungeonId === "string" ? params.dungeonId : "hospital_night_shift";
  const [inputText, setInputText] = useState("");
  const [state, setState] = useState<MvpGameStoreState>(() => {
    const current = loadMiniState();
    const next = !current.runtime || current.runtime.dungeonId !== dungeonId ? enterMiniDungeon(current, dungeonId) : current;
    saveMiniState(next);
    return next;
  });

  const activeNode = useMemo(() => getActiveNode(state), [state]);
  const suggestions = activeNode?.suggestedActions ?? [];

  const commit = (nextState: typeof state) => {
    saveMiniState(nextState);
    setState(nextState);
    if (nextState.runtime?.pendingSettlement) {
      Taro.navigateTo({ url: "/pages/settlement/index" });
    }
  };

  if (!state.runtime || !activeNode) {
    return (
      <View className="page-shell">
        <Text className="page-title">副本载入中</Text>
      </View>
    );
  }

  return (
    <View className="page-shell">
      <Text className="page-title">{state.runtime.dungeonTitle}</Text>
      <View className="page-subtitle">纯本地模式，不请求任何在线模型。</View>

      <View className="surface-card">
        <Text className="card-title">{activeNode.title}</Text>
        <View className="card-copy">{activeNode.description}</View>
        <View className="card-copy">当前目标: {activeNode.currentGoal}</View>
      </View>

      <Text className="section-title">可点击动作</Text>
      <View className="list-stack">
        {suggestions.map((action) => (
          <Button key={action.id} className="action-button" onClick={() => commit(submitMiniAction(state, action.command))}>
            {action.label}
          </Button>
        ))}
      </View>

      <View className="surface-card">
        <Text className="card-title">输入区</Text>
        <Input
          className="input-box"
          value={inputText}
          placeholder="例如: 观察广播 / 核对门牌 / 使用手电"
          onInput={(event) => setInputText(event.detail.value)}
        />
        <Button
          className="action-button"
          onClick={() => {
            if (!inputText.trim()) {
              return;
            }
            commit(submitMiniAction(state, inputText));
            setInputText("");
          }}
        >
          提交本地动作
        </Button>
      </View>

      {state.runtime.activeCombat ? (
        <>
          <Text className="section-title">战斗结算</Text>
          <View className="list-stack">
            {COMBAT_ACTIONS.map((action) => (
              <Button
                key={action.value}
                className="action-button"
                onClick={() => commit(resolveMiniCombat(state, action.value))}
              >
                {action.label}
              </Button>
            ))}
          </View>
        </>
      ) : null}

      <View className="surface-card">
        <Text className="card-title">最近反馈</Text>
        {state.runtime.log.slice(-5).map((entry: string, index: number) => (
          <View key={`${index}-${entry}`} className="card-copy">
            {entry}
          </View>
        ))}
      </View>

      <Button
        className="action-button"
        onClick={() => {
          const next = returnMiniToHall(state);
          saveMiniState(next);
          Taro.redirectTo({ url: "/pages/hall/index" });
        }}
      >
        返回大厅
      </Button>
    </View>
  );
}
