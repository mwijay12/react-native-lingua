import { View } from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

// Original Lingua doodles, drawn on a 100 × 100 grid. The paper backing,
// rounded ink and flat fills keep the set consistent at any screen size.
export type StickerKind = "book" | "globe" | "talk" | "people" | "numbers" | "food" | "palette" | "cup" | "medal" | "review";

const INK = "#193F3B";
const PAPER = "#FFFDF6";
const GOLD = "#F4D487";
const MINT = "#B7DFC9";
const CORAL = "#F1AE97";
const LILAC = "#DDD6EE";

function Artwork({ kind }: { kind: StickerKind }) {
  switch (kind) {
    case "globe":
      return (
        <>
          <Path d="M15 29C21 17 33 12 46 16C57 9 75 17 80 27C91 35 90 48 84 58C88 72 77 82 65 82C54 90 38 86 31 80C17 79 10 68 14 56C8 45 9 37 15 29Z" fill={LILAC} />
          <Circle cx="49" cy="48" r="26" fill={PAPER} />
          <Path d="M49 22C40 29 37 38 37 48C37 59 41 68 49 74M49 22C58 29 61 38 61 48C61 59 57 68 49 74M24 48H74M29 34C40 38 58 38 69 34M29 62C40 58 58 58 69 62" fill="none" />
          <Path d="M39 78H59M44 74V78M54 74V78" fill="none" />
          <Path d="M79 18L81 23L86 25L81 27L79 32L77 27L72 25L77 23Z" fill={GOLD} />
        </>
      );
    case "talk":
      return (
        <>
          <Path d="M13 26C18 15 35 12 45 16C56 11 75 16 79 28C91 34 91 51 84 59C86 72 75 82 63 81C52 89 39 86 31 81C18 81 9 70 13 59C8 46 8 35 13 26Z" fill={MINT} />
          <Path d="M39 43C39 33 47 27 59 27C71 27 79 33 79 43C79 52 71 58 59 58C57 58 55 58 53 57L46 63L47 55C42 52 39 48 39 43Z" fill={GOLD} />
          <Path d="M20 52C20 40 29 33 43 33C56 33 65 40 65 52C65 63 56 70 43 70C40 70 37 69 35 69L26 76L27 66C22 63 20 58 20 52Z" fill={PAPER} />
          <Circle cx="33" cy="52" r="2" fill={INK} stroke="none" /><Circle cx="43" cy="52" r="2" fill={INK} stroke="none" /><Circle cx="53" cy="52" r="2" fill={INK} stroke="none" />
        </>
      );
    case "people":
      return (
        <>
          <Path d="M16 28C22 17 34 14 45 17C57 9 71 16 78 25C91 31 90 47 85 56C88 71 76 80 65 80C53 87 40 87 31 81C18 82 9 70 13 58C9 46 9 36 16 28Z" fill={LILAC} />
          <Circle cx="36" cy="39" r="10" fill={PAPER} />
          <Circle cx="65" cy="40" r="9" fill={GOLD} />
          <Path d="M18 71C19 59 25 53 36 53C47 53 53 59 54 71Z" fill={PAPER} />
          <Path d="M54 69C54 60 58 54 65 54C74 54 79 60 80 69Z" fill={GOLD} />
          <Path d="M78 19L80 24L85 26L80 28L78 33L76 28L71 26L76 24Z" fill={MINT} />
        </>
      );
    case "numbers":
      return (
        <>
          <Path d="M14 28C20 18 33 14 44 17C55 12 72 14 79 25C91 32 91 46 85 57C88 70 78 80 65 80C54 88 39 87 31 81C18 82 10 70 13 58C8 46 9 36 14 28Z" fill={GOLD} />
          <Rect x="18" y="32" width="20" height="30" rx="5" fill={PAPER} transform="rotate(-8 28 47)" />
          <Rect x="39" y="25" width="22" height="36" rx="5" fill={MINT} transform="rotate(3 50 43)" />
          <Rect x="62" y="35" width="20" height="30" rx="5" fill={PAPER} transform="rotate(9 72 50)" />
          <Circle cx="28" cy="47" r="2.5" fill={INK} stroke="none" />
          <Circle cx="47" cy="38" r="2.5" fill={INK} stroke="none" /><Circle cx="53" cy="48" r="2.5" fill={INK} stroke="none" />
          <Circle cx="70" cy="42" r="2.3" fill={INK} stroke="none" /><Circle cx="74" cy="50" r="2.3" fill={INK} stroke="none" /><Circle cx="70" cy="58" r="2.3" fill={INK} stroke="none" />
        </>
      );
    case "food":
      return (
        <>
          <Path d="M16 28C21 17 35 14 45 17C57 10 73 16 79 26C90 32 91 46 86 57C88 70 77 81 65 81C53 87 40 87 31 81C19 81 10 70 14 58C9 45 10 36 16 28Z" fill={CORAL} />
          <Path d="M20 49H78C76 64 68 72 49 72C31 72 23 64 20 49Z" fill={PAPER} />
          <Path d="M26 49C31 44 37 43 43 46C48 41 55 42 59 46C65 43 71 45 74 49" fill={GOLD} />
          <Path d="M42 36C38 32 39 28 42 25M55 36C51 32 52 28 55 25" fill="none" />
          <Path d="M38 76H61" fill="none" />
        </>
      );
    case "palette":
      return (
        <>
          <Path d="M16 27C22 17 34 14 45 17C57 11 73 15 79 27C90 33 91 47 86 58C88 72 76 81 64 80C54 87 40 87 31 81C18 81 10 69 14 57C9 46 10 36 16 27Z" fill={MINT} />
          <Path d="M49 22C31 22 20 33 20 49C20 65 31 76 46 76C53 76 56 73 56 68C56 64 53 62 53 59C53 56 56 54 60 54H66C75 54 79 49 79 42C79 31 66 22 49 22Z" fill={PAPER} />
          <Circle cx="32" cy="43" r="4" fill={CORAL} /><Circle cx="42" cy="33" r="4" fill={GOLD} /><Circle cx="57" cy="33" r="4" fill={LILAC} />
          <Circle cx="34" cy="59" r="4" fill={MINT} />
        </>
      );
    case "cup":
      return (
        <>
          <Path d="M16 28C21 17 34 14 45 17C57 10 73 16 79 26C90 33 91 46 86 57C88 71 77 81 65 81C54 88 39 87 31 81C18 81 10 70 14 58C9 46 10 36 16 28Z" fill={LILAC} />
          <Path d="M25 43H65V61C65 70 58 75 45 75C32 75 25 70 25 61Z" fill={PAPER} />
          <Path d="M65 47H70C79 47 79 62 69 62H65" fill="none" />
          <Path d="M37 35C34 31 35 27 38 24M51 35C48 31 49 27 52 24" fill="none" />
          <Path d="M40 55C43 58 47 58 50 55" fill="none" />
        </>
      );
    case "medal":
      return (
        <>
          <Path d="M16 28C21 17 34 14 45 17C57 10 72 15 79 26C90 32 91 46 86 57C88 71 77 81 65 81C54 88 39 87 31 81C18 81 10 70 14 58C9 46 10 36 16 28Z" fill={MINT} />
          <Path d="M38 58L30 80L43 75L50 83L55 65M58 57L69 80L57 76L50 83L46 64" fill={CORAL} />
          <Circle cx="50" cy="43" r="24" fill={GOLD} />
          <Path d="M50 29L54 38L64 39L56 46L58 56L50 51L42 56L44 46L36 39L46 38Z" fill={PAPER} />
        </>
      );
    case "review":
      return (
        <>
          <Path d="M16 28C22 17 34 14 45 17C57 10 73 16 79 26C90 33 91 47 86 57C88 71 77 81 65 81C53 88 40 87 31 81C18 81 10 70 14 58C9 46 10 36 16 28Z" fill={GOLD} />
          <Circle cx="49" cy="49" r="25" fill={PAPER} />
          <Path d="M32 48C32 38 40 31 50 31C57 31 63 34 66 39M66 31V39H58M66 50C66 60 59 67 49 67C42 67 36 64 32 59M32 67V59H40" fill="none" />
          <Path d="M49 41L51 46L56 48L51 50L49 55L47 50L42 48L47 46Z" fill={CORAL} />
        </>
      );
    case "book":
    default:
      return (
        <>
          <Path d="M15 28C20 17 34 14 45 17C57 10 73 15 79 26C91 32 91 47 85 58C88 71 77 81 65 81C53 88 39 87 31 81C18 81 10 70 14 58C9 46 9 36 15 28Z" fill={GOLD} />
          <Path d="M20 31C31 27 42 29 50 36C58 29 69 27 80 31V69C69 65 58 66 50 73C42 66 31 65 20 69Z" fill={PAPER} />
          <Path d="M50 36V73M27 39C34 38 40 39 44 42M27 47C34 46 40 47 44 50M56 42C61 39 67 38 73 39M56 50C61 47 67 46 73 47" fill="none" />
          <Path d="M77 17L79 22L84 24L79 26L77 31L75 26L70 24L75 22Z" fill={MINT} />
        </>
      );
  }
}

export function LearningSticker({ kind, size = 64 }: { kind: StickerKind; size?: number }) {
  return (
    <View pointerEvents="none" accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
        <G stroke={INK} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <Artwork kind={kind} />
        </G>
      </Svg>
    </View>
  );
}
