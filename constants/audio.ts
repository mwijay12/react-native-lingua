// Bundled recordings are deliberately short samples, not a recording for every
// word in every lesson. The visible transcript is the exact spoken selection.
export interface PronunciationSample {
  source: number;
  lines: readonly string[];
}

export const pronunciationSamples: Readonly<Partial<Record<string, PronunciationSample>>> = {
  "sw-lesson-1": {
    source: require("../assets/audio/pronunciation/sw-greetings.mp3"),
    lines: ["Habari", "Nzuri", "Asante", "Tafadhali", "Kwaheri", "Habari?", "Nzuri, asante.", "Kwaheri!"],
  },
  "sw-travel-places": {
    source: require("../assets/audio/pronunciation/sw-places.mp3"),
    lines: ["Soko", "Shule", "Hospitali", "Kituo cha basi", "Choo", "Soko liko wapi?", "Soko liko karibu."],
  },
  "sw-travel-directions": {
    source: require("../assets/audio/pronunciation/sw-directions.mp3"),
    lines: ["Kushoto", "Kulia", "Moja kwa moja", "Geuka", "Simama", "Samahani, kituo cha basi kiko wapi?", "Nenda moja kwa moja, kisha geuka kushoto."],
  },
  "en-lesson-1": {
    source: require("../assets/audio/pronunciation/en-greetings.mp3"),
    lines: ["Hello", "Good morning", "Please", "Thank you", "Goodbye", "Hello! How are you?", "I'm fine, thank you."],
  },
  "en-travel-places": {
    source: require("../assets/audio/pronunciation/en-places.mp3"),
    lines: ["Market", "School", "Hospital", "Bus stop", "Toilet", "Where is the market?", "The market is nearby."],
  },
  "en-travel-directions": {
    source: require("../assets/audio/pronunciation/en-directions.mp3"),
    lines: ["Left", "Right", "Straight ahead", "Turn", "Stop", "Excuse me, where is the bus stop?", "Go straight ahead, then turn left."],
  },
  "fr-lesson-1": {
    source: require("../assets/audio/pronunciation/fr-greetings.mp3"),
    lines: ["Bonjour", "Bonsoir", "Au revoir", "Salut", "Merci", "Comment allez-vous ?", "Ça va bien, merci."],
  },
  "fr-travel-places": {
    source: require("../assets/audio/pronunciation/fr-places.mp3"),
    lines: ["Le marché", "L'école", "L'hôpital", "L'arrêt de bus", "Les toilettes", "Où est le marché ?", "Le marché est tout près."],
  },
  "fr-travel-directions": {
    source: require("../assets/audio/pronunciation/fr-directions.mp3"),
    lines: ["À gauche", "À droite", "Tout droit", "Tournez", "Arrêtez", "Excusez-moi, où est l'arrêt de bus ?", "Allez tout droit, puis tournez à gauche."],
  },
};

export const soundEffects = {
  correct: require("../assets/audio/effects/correct.wav"),
  celebration: require("../assets/audio/effects/celebration.wav"),
} as const;
