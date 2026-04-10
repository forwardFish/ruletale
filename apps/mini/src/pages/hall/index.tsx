import { useMemo, useState } from "react";

import { Button, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import { loadMiniState, enterMiniDungeon, saveMiniState } from "@/lib/gameState";
import { buildHallPresentation } from "@game-core/presentation";
import type { MvpGameStoreState } from "@game-core/types/game";

export default function HallPage() {
  const [state, setState] = useState<MvpGameStoreState>(loadMiniState);

  useDidShow(() => {
    setState(loadMiniState());
  });

  const presentation = useMemo(() => buildHallPresentation(state), [state]);

  const enterDungeon = (dungeonId: string) => {
    const next = enterMiniDungeon(state, dungeonId);
    saveMiniState(next);
    setState(next);
    Taro.navigateTo({ url: `/pages/dungeon/index?dungeonId=${dungeonId}` });
  };

  const handleAction = (actionId: string) => {
    if (actionId === "continue_hall") {
      enterDungeon("hospital_night_shift");
      return;
    }
    if (actionId === "archive") {
      Taro.navigateTo({ url: "/pages/archive/index" });
      return;
    }
    if (actionId === "settlement") {
      Taro.navigateTo({ url: "/pages/settlement/index" });
    }
  };

  return (
    <View className="page-shell">
      <View className="hero-card">
        <View className="hero-content">
          <Text className="hero-kicker">{presentation.hero.eyebrow}</Text>
          <Text className="page-title">{presentation.hero.title}</Text>
          <View className="page-subtitle">
            {presentation.hero.subtitle}
          </View>

          <View className="hero-actions">
            {presentation.hero.primaryActions.map((action) => (
              <Button
                key={action.id}
                className={`action-button ${action.tone === "primary" ? "primary-button" : "ghost-button"}`}
                disabled={action.disabled}
                onClick={() => handleAction(action.id)}
              >
                {action.label}
              </Button>
            ))}
          </View>

          <View className="hero-panel">
            <Text className="stat-label">{presentation.hero.mood.eyebrow}</Text>
            <Text className="card-title">{presentation.hero.mood.title}</Text>
            <Text className="card-copy">{presentation.hero.mood.description}</Text>
          </View>
        </View>
      </View>

      <View className="status-grid">
        {presentation.statusCards.map((card) => (
          <View key={card.id} className="stat-card">
            <Text className="stat-label">{card.label}</Text>
            <Text className="stat-value">{card.value}</Text>
            <Text className="stat-hint">{card.hint}</Text>
          </View>
        ))}
      </View>

      <Text className="section-eyebrow">{presentation.taskWall.eyebrow}</Text>
      <Text className="section-title">{presentation.taskWall.title}</Text>
      <View className="list-stack">
        {presentation.taskWall.playableDungeons.map((card) => (
          <View key={card.id} className="surface-card">
            <Text className="card-title">{card.title}</Text>
            <Text className="card-copy">{card.subtitle}</Text>
            <View className="tag-row">
              <Text className="tag">{card.statusLabel}</Text>
              <Text className="tag">{card.riskLabel}</Text>
            </View>
            <Text className="card-copy">{card.recommendationNote || card.recommendedStyle}</Text>
            <Button className="action-button" disabled={card.locked} onClick={() => enterDungeon(card.id)}>
              {card.buttonLabel}
            </Button>
          </View>
        ))}
        {presentation.taskWall.blackZone ? (
          <View className="surface-card">
            <Text className="card-title">{presentation.taskWall.blackZone.title}</Text>
            <Text className="card-copy">{presentation.taskWall.blackZone.subtitle}</Text>
            <View className="tag-row">
              <Text className="tag">{presentation.taskWall.blackZone.statusLabel}</Text>
              <Text className="tag">{presentation.taskWall.blackZone.riskLabel}</Text>
            </View>
            <Text className="card-copy">{presentation.taskWall.blackZone.lockReason}</Text>
            <Button className="action-button ghost-button" disabled>
              {presentation.taskWall.blackZone.buttonLabel}
            </Button>
          </View>
        ) : null}
      </View>

      <View className="dock-actions">
        {presentation.quickLinks.map((action) => (
          <Button key={action.id} className="action-button ghost-button" onClick={() => handleAction(action.id)}>
            {action.label}
          </Button>
        ))}
      </View>
    </View>
  );
}
