import { CREATOR_CREDIT } from "@/constants/branding";
import { images } from "@/constants/images";
import { posthog } from "@/lib/posthog";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="flex-1 px-6">
        <View className="flex-row items-center justify-center gap-2 mt-4">
          <Image source={images.mascotLogo} className="w-10 h-10" style={{ width: 40, height: 40 }} />
          <Text className="font-poppins-semibold text-xl text-text-primary">lingua</Text>
        </View>
        <Text className="h1 mt-8">
          {"Start your language\n"}
          <Text className="text-lingua-purple">journey.</Text>
        </Text>
        <Text className="body-md text-text-secondary mt-3">
          Learn Kiswahili, English and French, one lesson at a time.
        </Text>
        <View className="flex-1 mt-4">
          <Image
            source={images.mascotWelcome}
            className="flex-1 w-full"
            style={{ flex: 1, width: "100%", height: "100%" }}
            resizeMode="contain"
          />
          <View className="absolute bg-white rounded-2xl px-4 py-2.5 left-0 top-[35%]" style={styles.shadow}>
            <Text className="font-poppins-medium text-sm text-text-primary">Hello!</Text>
          </View>
          <View className="absolute bg-white rounded-2xl px-4 py-2.5 right-0 top-[10%]" style={styles.shadow}>
            <Text className="font-poppins-medium text-sm text-text-primary">Habari!</Text>
          </View>
          <View className="absolute bg-white rounded-2xl px-4 py-2.5 right-5 top-[60%]" style={styles.shadow}>
            <Text className="font-poppins-medium text-sm text-error">Bonjour!</Text>
          </View>
        </View>
        <TouchableOpacity
          className="bg-lingua-purple rounded-2xl flex-row items-center justify-center mt-2 mb-2 py-4.5"
          activeOpacity={0.85}
          accessibilityRole="button"
          testID="get-started-button"
          onPress={() => {
            posthog.capture("onboarding_get_started_tapped");
            router.push("/(auth)/sign-up");
          }}
        >
          <Text className="font-poppins-semibold text-base text-white">
            Get Started
          </Text>
          <Ionicons name="chevron-forward" size={22} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
        <Text className="font-poppins-medium text-xs text-text-secondary text-center mb-4" testID="onboarding-creator-credit">
          {CREATOR_CREDIT}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});
