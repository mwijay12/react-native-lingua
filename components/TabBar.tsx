import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fontFamily } from "@/constants/theme";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";

const INDICATOR_WIDTH = 58;
const TAB_HEIGHT = 66;
const MAX_BAR_WIDTH = 720;

type TabConfig = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

const TABS: TabConfig[] = [
  { label: "Home", icon: "home-outline", activeIcon: "home" },
  { label: "Learn", icon: "book-outline", activeIcon: "book" },
  { label: "AI Teacher", icon: "sparkles-outline", activeIcon: "sparkles" },
  { label: "Chat", icon: "chatbubbles-outline", activeIcon: "chatbubbles" },
  { label: "Profile", icon: "person-outline", activeIcon: "person" },
];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotionPreference();
  const tabWidth = Math.min(width, MAX_BAR_WIDTH) / TABS.length;
  const indicatorX = useSharedValue(state.index * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2);

  useEffect(() => {
    const position = state.index * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;
    indicatorX.value = reducedMotion ? position : withSpring(position, { damping: 18, stiffness: 160, overshootClamping: true });
  }, [state.index, indicatorX, tabWidth, reducedMotion]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: indicatorX.value }] }));

  return (
    <View style={[styles.frame, { paddingBottom: insets.bottom || 8 }]}>
      <View style={styles.container}>
        <Animated.View pointerEvents="none" accessible={false} aria-hidden style={[styles.indicator, indicatorStyle]} />
        {state.routes.map((route, index) => {
          const tab = TABS[index];
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isFocused }}
              testID={`tab-${route.name}`}
            >
              <Ionicons name={isFocused ? tab.activeIcon : tab.icon} size={21} color={isFocused ? colors.primary.teal : colors.neutral.textSecondary} />
              <Text style={[styles.label, isFocused && styles.activeLabel]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: "#FFFDF8",
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  container: {
    width: "100%",
    maxWidth: MAX_BAR_WIDTH,
    alignSelf: "center",
    flexDirection: "row",
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    top: 7,
    left: 0,
    width: INDICATOR_WIDTH,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#E5F3ED",
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", height: TAB_HEIGHT },
  label: { fontFamily: fontFamily.medium, fontSize: 10, color: colors.neutral.textSecondary, marginTop: 3 },
  activeLabel: { color: colors.primary.teal, fontFamily: fontFamily.semiBold },
});
