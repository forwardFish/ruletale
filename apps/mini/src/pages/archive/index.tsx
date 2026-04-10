import { Text, View } from "@tarojs/components";

import { loadMiniState } from "@/lib/gameState";
import { buildArchivePresentation } from "@game-core/presentation";

export default function ArchivePage() {
  const state = loadMiniState();
  const presentation = buildArchivePresentation(state);

  return (
    <View className="page-shell">
      <Text className="page-title">{presentation.title}</Text>
      <View className="page-subtitle">{presentation.subtitle}</View>

      <View className="surface-card">
        <Text className="card-title">{presentation.rules.title}</Text>
        <View className="list-stack">
          {presentation.rules.items.map((rule) => (
            <View key={rule} className="card-copy">
              {rule}
            </View>
          ))}
          {presentation.rules.items.length === 0 ? <View className="card-copy">{presentation.rules.empty}</View> : null}
        </View>
      </View>

      <View className="surface-card">
        <Text className="card-title">怪物与结局</Text>
        <View className="card-copy">{presentation.monsters.title}: {presentation.monsters.items.join(" / ") || presentation.monsters.empty}</View>
        <View className="card-copy">{presentation.endings.title}: {presentation.endings.items.join(" / ") || presentation.endings.empty}</View>
        <View className="card-copy">{presentation.adminFragments.title}: {presentation.adminFragments.items.join(" / ") || presentation.adminFragments.empty}</View>
      </View>
    </View>
  );
}
