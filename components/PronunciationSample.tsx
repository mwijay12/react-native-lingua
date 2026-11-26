import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { PRONUNCIATION_NORMAL_RATE, PRONUNCIATION_SLOW_RATE, type PronunciationSample as Sample } from "@/constants/audio";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";

export function PronunciationSample({ sample }: { sample: Sample }) {
  const { play, stop, error } = useAudioPlayback(sample.source);

  return (
    <View className="rounded-[22px] bg-[#FFF4DD] border border-[#E6D9B7] p-4 mb-5" testID="pronunciation-sample">
      <View className="flex-row items-start">
        <View className="w-11 h-11 rounded-2xl bg-white items-center justify-center mr-3">
          <Ionicons name="volume-medium-outline" size={23} color="#14675D" />
        </View>
        <View className="flex-1">
          <Text className="font-poppins-semibold text-[10px] tracking-[1px] text-lingua-teal">LISTEN & REPEAT</Text>
          <Text className="font-poppins-semibold text-base text-text-primary mt-1">Hear a lesson sample</Text>
          <Text className="body-sm text-text-secondary mt-1">Selected words and phrases, in the order below. No microphone is needed.</Text>
        </View>
      </View>
      <Text className="font-poppins-semibold text-xs text-text-primary mt-4">Read along</Text>
      <Text className="body-sm text-text-secondary mt-1" testID="pronunciation-transcript">{sample.lines.join(" · ")}</Text>
      <View className="flex-row flex-wrap gap-2 mt-4">
        <TouchableOpacity onPress={() => play(PRONUNCIATION_NORMAL_RATE)} className="basis-[128px] grow shrink min-h-11 rounded-xl bg-lingua-teal flex-row items-center justify-center px-2 py-2" accessibilityRole="button" accessibilityLabel="Play pronunciation sample" accessibilityHint="Plays the selected words and phrases from the beginning." testID="play-pronunciation">
          <Ionicons name="play" size={16} color="#FFFFFF" />
          <Text className="font-poppins-semibold text-sm text-white ml-2 shrink text-center">Play sample</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => play(PRONUNCIATION_SLOW_RATE)} className="basis-[128px] grow shrink min-h-11 rounded-xl border border-lingua-teal flex-row items-center justify-center px-2 py-2" accessibilityRole="button" accessibilityLabel="Play pronunciation sample slowly" accessibilityHint="Restarts the sample at a slower speed." testID="play-pronunciation-slow">
          <Ionicons name="play" size={16} color="#14675D" />
          <Text className="font-poppins-semibold text-sm text-lingua-teal ml-2 shrink text-center">Play slowly</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={stop} className="basis-[128px] grow shrink min-h-11 rounded-xl border border-lingua-teal flex-row items-center justify-center px-2 py-2" accessibilityRole="button" accessibilityLabel="Stop pronunciation sample" testID="stop-pronunciation">
          <Ionicons name="stop" size={16} color="#14675D" />
          <Text className="font-poppins-semibold text-sm text-lingua-teal ml-2 shrink text-center">Stop</Text>
        </TouchableOpacity>
      </View>
      {error && <Text className="body-sm text-text-secondary mt-3" accessibilityLiveRegion="polite">The sample could not play. You can still read the words above.</Text>}
    </View>
  );
}
