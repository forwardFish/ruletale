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
  const playableDungeons = dungeonCards.filter((card) => card.id !== "black_zone_entry");
  const blackZoneCard = dungeonCards.find((card) => card.id === "black_zone_entry");

  const enterDungeon = (dungeonId: string) => {
    const next = enterMiniDungeon(state, dungeonId);
    saveMiniState(next);
    setState(next);
    Taro.navigateTo({ url: `/pages/dungeon/index?dungeonId=${dungeonId}` });
  };

  return (
    <View className="page-shell">
      <View className="hero-card">
        <View className="hero-content">
          <Text className="hero-kicker">Ruletale Hall</Text>
          <Text className="page-title">规则之外，才是大厅真正的入口。</Text>
          <View className="page-subtitle">
            这里不是菜单，而是一处会持续记录你判断方式的外层空间。你带回来的理解、污染、物品与错误，都会在这里留下痕迹。真正危险的从来不是没有规则，而是你开始分不清哪些规则在保护你，哪些规则想把你引向更深处。
          </View>

          <View className="hero-actions">
            <Button className="action-button primary-button" onClick={() => enterDungeon("hospital_night_shift")}>
              继续进入大厅
            </Button>
            <Button className="action-button ghost-button" onClick={() => Taro.navigateTo({ url: "/pages/settlement/index" })}>
              查看上次结算
            </Button>
          </View>

          <View className="hero-panel">
            <Text className="stat-label">Hall Mood</Text>
            <Text className="card-title">深红压迫感作为背景，而不是单独画卡片</Text>
            <Text className="card-copy">
              背景改为整块 Hero 氛围底图，文字与状态悬浮在其上，让画面更像真正的首页背景，而不是右侧单独摆了一张图。
            </Text>
          </View>
        </View>
      </View>

      <View className="status-grid">
        <View className="stat-card">
          <Text className="stat-label">理解度</Text>
          <Text className="stat-value">{state.player.understanding}</Text>
          <Text className="stat-hint">窥界者，更容易发现规则冲突。</Text>
        </View>
        <View className="stat-card">
          <Text className="stat-label">污染值</Text>
          <Text className="stat-value">{String(state.player.contamination).padStart(2, "0")}</Text>
          <Text className="stat-hint">处于可控范围，但镜面异常更容易靠近。</Text>
        </View>
        <View className="stat-card">
          <Text className="stat-label">完成副本</Text>
          <Text className="stat-value">{state.progress.completedDungeons.length}</Text>
          <Text className="stat-hint">完成正式副本后，大厅会记录新的奖励与档案。</Text>
        </View>
      </View>

      <Text className="section-eyebrow">Task Wall</Text>
      <Text className="section-title">可进入副本</Text>
      <View className="list-stack">
        {playableDungeons.map((card) => (
          <View key={card.id} className="surface-card">
            <Text className="card-title">{card.title}</Text>
            <Text className="card-copy">{card.subtitle}</Text>
            <View className="tag-row">
              <Text className="tag">{card.statusLabel || "副本入口"}</Text>
              <Text className="tag">{card.riskLabel}</Text>
            </View>
            <Text className="card-copy">{card.recommendationNote || card.recommendedStyle}</Text>
            <Button className="action-button" disabled={card.locked || card.id === "black_zone_entry"} onClick={() => enterDungeon(card.id)}>
              {card.locked ? card.lockReason || "未解锁" : "进入副本"}
            </Button>
          </View>
        ))}
        {blackZoneCard ? (
          <View className="surface-card">
            <Text className="card-title">{blackZoneCard.title}</Text>
            <Text className="card-copy">需要更高理解度与关键物品后才可进入。</Text>
            <View className="tag-row">
              <Text className="tag">{blackZoneCard.statusLabel || "尚未开放"}</Text>
              <Text className="tag">{blackZoneCard.riskLabel}</Text>
            </View>
            <Text className="card-copy">{blackZoneCard.lockReason || state.lobby.blackZone.summary}</Text>
            <Button className="action-button ghost-button" disabled>
              尚未开放
            </Button>
          </View>
        ) : null}
      </View>

      <View className="dock-actions">
        <Button className="action-button ghost-button" onClick={() => Taro.navigateTo({ url: "/pages/archive/index" })}>
          打开档案
        </Button>
        <Button className="action-button ghost-button" onClick={() => Taro.navigateTo({ url: "/pages/settlement/index" })}>
          最近结算
        </Button>
      </View>
    </View>
  );
}
