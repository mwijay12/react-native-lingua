import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { LearningSticker } from "@/components/LearningSticker";
import type { RewardBadge } from "@/lib/quickMix";

export function RewardAlbum({ badges }: { badges: readonly RewardBadge[] }) {
  const collected = badges.filter((badge) => badge.unlocked).length;
  return (
    <View className="mt-7" testID="reward-album">
      <View className="flex-row items-end justify-between mb-2">
        <View className="flex-1 pr-2">
          <Text className="font-poppins-semibold text-[10px] tracking-[1px] text-lingua-teal">YOUR COLLECTION</Text>
          <Text className="h3 mt-1">Sticker book</Text>
        </View>
        <Text className="font-poppins-semibold text-sm text-text-primary" testID="reward-count">{collected} / {badges.length} collected</Text>
      </View>
      <Text className="body-sm text-text-secondary mb-4">Little milestones, saved on this device. There is no rush.</Text>
      <View className="flex-row flex-wrap justify-between">
        {badges.map((badge) => (
          <View
            key={badge.id}
            className={`w-[48%] rounded-[20px] border p-3 mb-3 ${badge.unlocked ? "bg-[#F9F4E8] border-[#E6D9B7]" : "bg-white border-border"}`}
            accessible
            accessibilityLabel={`${badge.title}. ${badge.description} ${badge.unlocked ? "Collected." : `${badge.value} of ${badge.target} ${badge.unit}.`}`}
            testID={`reward-${badge.id}`}
          >
            <View className="flex-row items-center justify-between">
              <LearningSticker kind={badge.sticker} size={56} />
              <Ionicons name={badge.unlocked ? "checkmark-circle" : "lock-closed-outline"} size={20} color={badge.unlocked ? "#14675D" : "#526860"} />
            </View>
            <Text className="font-poppins-semibold text-sm text-text-primary mt-2">{badge.title}</Text>
            <Text className="caption mt-1">{badge.description}</Text>
            <Text className="font-poppins-semibold text-xs text-lingua-teal mt-2">
              {badge.unlocked ? "Collected!" : `${badge.value} / ${badge.target} ${badge.unit}`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
