import { Button, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";

import { loadMiniState, returnMiniToHall, saveMiniState } from "@/lib/gameState";
import type { SettlementResult } from "@game-core/types/score";

export default function SettlementPage() {
  const state = loadMiniState();
  const settlement: SettlementResult | null = state.runtime?.pendingSettlement ?? state.progress.lastSettlement;

  return (
    <View className="page-shell">
      <Text className="page-title">结算台</Text>
      <View className="page-subtitle">结局摘要、六维评分、奖励和理解度变化都会保留在本地存档中。</View>

      <View className="surface-card">
        <Text className="card-title">{settlement?.endingTitle ?? "暂无结算"}</Text>
        <View className="card-copy">{settlement?.summary ?? "完成任一副本后，这里会显示最近一次结算。"}</View>
        {settlement ? (
          <>
            <View className="card-copy">总理解度: {settlement.totalUnderstanding}</View>
            <View className="card-copy">理解度变化: +{settlement.understandingDelta}</View>
            <View className="card-copy">综合评分: {settlement.grades.overall}</View>
            <View className="card-copy">
              奖励: {settlement.rewards.map((reward) => `${reward.itemId} x${reward.quantity}`).join(" / ") || "无"}
            </View>
          </>
        ) : null}
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
