import { Text } from "react-native";

import { useLearningSaveStatus } from "@/store/learningStore";

// Only say "saved" after the current snapshot has been read or written.
export function LearningSaveMessage({ testID, className = "" }: { testID?: string; className?: string }) {
  const status = useLearningSaveStatus((state) => state.status);
  const message = status === "saved" ? "Your progress is saved on this device."
    : status === "saving" ? "Saving your progress…"
      : status === "error" ? "Your progress is not saved yet. Keep the app open and retry."
        : "Your progress is local to this device.";
  return (
    <Text className={`body-sm text-text-secondary ${className}`} accessibilityLiveRegion="polite" testID={testID}>
      {message}
    </Text>
  );
}
