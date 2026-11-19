import { Text, View } from "react-native";

// The demo has no account and does not contact an authentication service.
export function AccountControls() {
  return (
    <View className="rounded-2xl bg-surface p-4 mt-5">
      <Text className="font-poppins-semibold text-sm text-text-primary">Local access</Text>
      <Text className="body-sm text-text-secondary mt-1">Sign-in is unavailable in this preview. Progress stays on this device.</Text>
    </View>
  );
}
