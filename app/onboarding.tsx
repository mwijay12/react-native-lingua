import { CREATOR_CREDIT } from "@/constants/branding";
import { images } from "@/constants/images";
import { posthog } from "@/lib/posthog";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const { height } = useWindowDimensions();
  const illustrationHeight = Math.max(135, Math.min(285, Math.round(height * 0.27 + Math.max(0, height - 600) * 0.2)));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View className="flex-row items-center mt-2">
          <Image source={images.brandLogo} style={styles.logo} />
          <View className="ml-2.5">
            <Text className="font-poppins-bold text-xl text-text-primary">lingua</Text>
            <Text className="font-poppins-medium text-[9px] text-text-secondary tracking-[1px]">LANGUAGE FOR LIFE</Text>
          </View>
        </View>

        <View className="mt-5">
          <Text className="font-poppins-semibold text-[11px] tracking-[1.5px] text-lingua-teal">A LITTLE EACH DAY</Text>
          <Text className="h1 mt-2">
            {"Words for\n"}
            <Text className="text-lingua-teal">real life.</Text>
          </Text>
          <Text className="body-md text-text-secondary mt-2">
            Learn Kiswahili, English and French through everyday moments.
          </Text>
        </View>

        <View className="rounded-[28px] bg-lingua-sand overflow-hidden mt-4" style={{ height: illustrationHeight }}>
          <View className="absolute w-40 h-40 rounded-full bg-[#F6D48E] left-5 bottom-[-40px]" />
          <View className="absolute w-32 h-32 rounded-full bg-[#C9E7D9] right-3 top-[-25px]" />
          <Image source={images.mascotCat} resizeMode="contain" style={styles.cat} />
          <Image source={images.mascotParrot} resizeMode="contain" style={styles.parrot} />
          <View className="absolute left-3 top-3 rounded-2xl bg-white px-3 py-1.5">
            <Text className="font-poppins-semibold text-xs text-lingua-teal">Habari!</Text>
          </View>
          <View className="absolute right-3 bottom-3 rounded-2xl bg-white px-3 py-1.5">
            <Text className="font-poppins-semibold text-xs text-[#C45F4B]">Bonjour!</Text>
          </View>
        </View>

        <View className="flex-1" />
        <TouchableOpacity
          className="bg-lingua-teal rounded-2xl flex-row items-center justify-center mt-4 py-4"
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
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 9 }} />
        </TouchableOpacity>
        <Text className="font-poppins-medium text-xs text-text-secondary text-center mt-3 mb-1" testID="onboarding-creator-credit">
          {CREATOR_CREDIT}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 12 },
  logo: { width: 44, height: 44, borderRadius: 14 },
  cat: { position: "absolute", bottom: 0, left: "16%", width: "43%", height: "94%" },
  parrot: { position: "absolute", bottom: 0, right: "10%", width: "42%", height: "78%" },
});
