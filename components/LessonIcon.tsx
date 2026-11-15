import { Ionicons } from "@expo/vector-icons";

type IconName = keyof typeof Ionicons.glyphMap;

const icons: Record<string, IconName> = {
  "👋": "hand-left-outline",
  "🙋": "person-outline",
  "🔢": "grid-outline",
  "🎨": "color-palette-outline",
  "☕": "cafe-outline",
};

// Use bundled icons rather than relying on the device having a particular emoji font.
export function LessonIcon({ icon, size = 25 }: { icon?: string; size?: number }) {
  return <Ionicons name={(icon && icons[icon]) || "book-outline"} size={size} color="#6C4EF5" />;
}
