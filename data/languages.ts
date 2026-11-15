import { images } from "@/constants/images";
import { Language, LanguageCode } from "@/types/learning";

// Only launch courses are listed. Existing content for other languages is kept.
export const LANGUAGES: Language[] = [
  {
    code: "sw",
    name: "Kiswahili",
    nativeName: "Swahili",
    flag: images.flagSwahili,
    color: "#21A96B",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: images.flagEnglish,
    color: "#4D88FF",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: images.flagFrench,
    color: "#6C4EF5",
  },
];

export function isAvailableLanguage(code: unknown): code is LanguageCode {
  return LANGUAGES.some((language) => language.code === code);
}
