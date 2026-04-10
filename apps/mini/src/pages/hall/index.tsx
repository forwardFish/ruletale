import { useMemo, useState } from "react";

import { Button, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import { getMiniDungeonCards, loadMiniState, enterMiniDungeon, saveMiniState } from "@/lib/gameState";
import type { MvpGameStoreState } from "@game-core/types/game";

export default function HallPage() {
  const [state, setState] = useState<MvpGameStoreState>(loadMiniState);

  useDidShow(() => {
    setState(loadMiniState());
  });

  const dungeonCards = useMemo(() => getMiniDungeonCards(state), [state]);

  const enterDungeon = (dungeonId: string) => {
    const next = enterMiniDungeon(state, dungeonId);
    saveMiniState(next);
    setState(next);
    Taro.navigateTo({ url: `/pages/dungeon/index?dungeonId=${dungeonId}` });
  };

  return (
    <View className="page-shell">
      <Text className="page-title">规则怪谈大厅</Text>
      <View className="page-subtitle">
        微信端固定使用本地规则引擎。输入解析、规则判定、奖励、结算、成长和黑区门槛都离线完成。
      </View>

      <View className="surface-card">
        <View className="surface-row">
          <Text className="pill">理解度 {state.player.understanding}</Text>
          <Text className="pill">完成副本 {state.progress.completedDungeons.length}</Text>
        </View>
        <View className="grid-two" style={{ marginTop: "16px" }}>
          <View className="surface-card" style={{ marginTop: 0, padding: "18px" }}>
            <Text className="card-title">显性状态</Text>
            <View className="card-copy">HP {state.player.visibleStats.HP} / SAN {state.player.visibleStats.SAN}</View>
          </View>
          <View className="surface-card" style={{ marginTop: 0, padding: "18px" }}>
            <Text className="card-title">黑区进度</Text>
            <View className="card-copy">{state.lobby.blackZone.summary}</View>
          </View>
        </View>
      </View>

      <Text className="section-title">副本任务墙</Text>
      <View className="list-stack">
        {dungeonCards.map((card) => (
          <View key={card.id} className="surface-card">
            <Text className="card-title">{card.title}</Text>
            <View className="card-copy">{card.subtitle}</View>
            <View className="card-copy">风险标签: {card.riskLabel}</View>
            <View className="card-copy">{card.recommendationNote}</View>
            <Button className="action-button" disabled={card.locked || card.id === "black_zone_entry"} onClick={() => enterDungeon(card.id)}>
              {card.locked ? card.lockReason || "未解锁" : "进入副本"}
            </Button>
          </View>
        ))}
      </View>

      <View className="surface-row" style={{ marginTop: "24px" }}>
        <Button className="action-button" onClick={() => Taro.navigateTo({ url: "/pages/archive/index" })}>
          打开档案
        </Button>
        <Button className="action-button" onClick={() => Taro.navigateTo({ url: "/pages/settlement/index" })}>
          最近结算
        </Button>
      </View>
    </View>
  );
}
