import { Button, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";

import { loadMiniState, returnMiniToHall, saveMiniState } from "@/lib/gameState";
import { buildSettlementPresentation } from "@game-core/presentation";
import type { SettlementResult } from "@game-core/types/score";

export default function SettlementPage() {
  const state = loadMiniState();
  const settlement: SettlementResult | null = state.runtime?.pendingSettlement ?? state.progress.lastSettlement;
  const presentation = buildSettlementPresentation(settlement);

  return (
    <View className="page-shell">
      <Text className="page-title">{presentation.title}</Text>
      <View className="page-subtitle">{presentation.subtitle}</View>

      <View className="surface-card">
        <Text className="card-title">{presentation.endingTitle}</Text>
        <View className="card-copy">{presentation.summary}</View>
        {settlement ? (
          <>
            {presentation.metrics.map((metric) => (
              <View key={metric.label} className="card-copy">{metric.label}: {metric.value}</View>
            ))}
            <View className="card-copy">
              奖励: {presentation.rewards.join(" / ") || "无"}
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
        {presentation.returnAction.label}
      </Button>
    </View>
  );
}
