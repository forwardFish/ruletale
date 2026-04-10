import { Text, View } from "@tarojs/components";

import { loadMiniState } from "@/lib/gameState";

export default function ArchivePage() {
  const state = loadMiniState();

  return (
    <View className="page-shell">
      <Text className="page-title">怪谈档案</Text>
      <View className="page-subtitle">按副本沉淀规则、怪物、结局和管理员碎片。</View>

      <View className="surface-card">
        <Text className="card-title">规则记录</Text>
        <View className="list-stack">
          {state.progress.archive.rules.map((rule) => (
            <View key={rule.id} className="card-copy">
              {rule.text}
            </View>
          ))}
          {state.progress.archive.rules.length === 0 ? <View className="card-copy">暂无已确认规则。</View> : null}
        </View>
      </View>

      <View className="surface-card">
        <Text className="card-title">怪物与结局</Text>
        <View className="card-copy">怪物: {state.progress.archive.monsters.map((monster) => monster.name).join(" / ") || "暂无"}</View>
        <View className="card-copy">结局: {state.progress.archive.endings.join(" / ") || "暂无"}</View>
        <View className="card-copy">管理员碎片: {state.progress.archive.adminFragments.join(" / ") || "暂无"}</View>
      </View>
    </View>
  );
}
