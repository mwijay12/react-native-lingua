import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import { Alert, Text, TouchableOpacity } from "react-native";

// The standalone demo replaces this account-only control with a local-mode note.
export function AccountControls() {
  const { signOut } = useAuth();

  return (
    <TouchableOpacity
      className="rounded-2xl border border-border items-center py-4 mt-5"
      accessibilityRole="button"
      onPress={async () => {
        try {
          await signOut();
          router.replace("/");
        } catch {
          Alert.alert("Could not sign out", "Please try again.");
        }
      }}
    >
      <Text className="font-poppins-semibold text-sm text-text-primary">Sign out</Text>
    </TouchableOpacity>
  );
}
