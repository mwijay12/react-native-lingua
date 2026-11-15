import { LearningSticker, type StickerKind } from "@/components/LearningSticker";

// Map lesson subjects to Lingua's own scalable doodles rather than depending on
// a device's emoji font. The title beside the drawing carries the meaning.
const stickers: Record<string, StickerKind> = {
  "👋": "talk",
  "🙋": "people",
  "🔢": "numbers",
  "👨‍👩‍👧": "people",
  "🍲": "food",
  "💬": "talk",
  "🎨": "palette",
  "☕": "cup",
};

export function LessonIcon({ icon, size = 42 }: { icon?: string; size?: number }) {
  return <LearningSticker kind={(icon && stickers[icon]) || "book"} size={size} />;
}
