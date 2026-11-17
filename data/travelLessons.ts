import type { Lesson } from "@/types/learning";

// Local lessons only. The prompt field is retained for the shared lesson shape;
// it does not enable the AI teacher or start a microphone.
function travelLesson(lesson: Omit<Lesson, "xpReward" | "goals" | "aiTeacherPrompt">): Lesson {
  return {
    ...lesson,
    xpReward: 15,
    goals: [
      { description: "Learn useful places and directions", xpReward: 5 },
      { description: "Complete the practice questions", xpReward: 10 },
    ],
    aiTeacherPrompt: {
      systemPrompt: "Local practice only; live AI teaching is not available in this version.",
      introMessage: "Explore the words and practise at your own pace.",
      topics: [lesson.title],
    },
  };
}

export const TRAVEL_LESSONS: Lesson[] = [
  travelLesson({
    id: "sw-travel-places", unitId: "sw-unit-4", title: "Places around town",
    description: "Name places and ask where the market is in Kiswahili.", icon: "📍",
    notes: [
      { title: "Ask where", body: "Wapi asks where. In this example, liko goes with soko. The location word changes with the noun: kituo uses kiko.", example: "Soko liko wapi? = Where is the market?" },
      { title: "Describe a place", body: "Karibu means nearby in this sentence. Practise the question and answer together, then try it with a different place.", example: "Soko liko karibu. = The market is nearby." },
    ],
    vocabulary: [
      { word: "Soko", translation: "Market", pronunciation: "SOH-koh" },
      { word: "Shule", translation: "School", pronunciation: "SHOO-leh" },
      { word: "Hospitali", translation: "Hospital", pronunciation: "hos-pee-TAH-lee" },
      { word: "Kituo cha basi", translation: "Bus stop", pronunciation: "kee-TOO-oh chah BAH-see" },
      { word: "Choo", translation: "Toilet / restroom", pronunciation: "CHOH-oh" },
    ],
    phrases: [
      { text: "Soko liko wapi?", translation: "Where is the market?", pronunciation: "SOH-koh LEE-koh WAH-pee" },
      { text: "Soko liko karibu.", translation: "The market is nearby.", pronunciation: "SOH-koh LEE-koh kah-REE-boo" },
    ],
    activities: [
      { id: "sw-travel-places-1", type: "multiple-choice", question: 'What does "Soko" mean?', correctAnswer: "Market", options: ["School", "Hospital", "Market", "Bus stop"], explanation: "Soko is a market; shule is a school." },
      { id: "sw-travel-places-2", type: "multiple-choice", question: 'Which word means "Hospital"?', correctAnswer: "Hospitali", options: ["Choo", "Hospitali", "Soko", "Shule"], explanation: "Hospitali means hospital." },
      { id: "sw-travel-places-3", type: "translate", question: 'Type "School" in Kiswahili.', correctAnswer: "Shule", hint: "It starts with Sh.", explanation: "Shule means school." },
      { id: "sw-travel-places-4", type: "multiple-choice", question: "How do you ask where the market is?", correctAnswer: "Soko liko wapi?", options: ["Soko liko karibu.", "Soko liko wapi?", "Kwaheri!", "Ninaitwa Amina."], explanation: "Wapi asks where; liko goes with soko here." },
      { id: "sw-travel-places-5", type: "multiple-choice", question: 'What does "Soko liko karibu" say?', correctAnswer: "The market is nearby", options: ["The market is nearby", "The school is closed", "Turn right", "The bus is leaving"], explanation: "Karibu means nearby in this sentence." },
    ],
  }),
  travelLesson({
    id: "sw-travel-directions", unitId: "sw-unit-4", title: "Finding the way",
    description: "Ask for the bus stop and follow simple directions in Kiswahili.", icon: "🧭",
    notes: [
      { title: "Get someone's attention", body: "Samahani is a polite way to say excuse me. Kituo uses kiko in this question about its location.", example: "Samahani, kituo cha basi kiko wapi? = Excuse me, where is the bus stop?" },
      { title: "Follow two steps", body: "Nenda means go, kisha means then, and geuka means turn. Listen for the order of the steps as well as the direction.", example: "Nenda moja kwa moja, kisha geuka kushoto. = Go straight ahead, then turn left." },
    ],
    vocabulary: [
      { word: "Kushoto", translation: "Left", pronunciation: "koo-SHOH-toh" },
      { word: "Kulia", translation: "Right", pronunciation: "koo-LEE-ah" },
      { word: "Moja kwa moja", translation: "Straight ahead", pronunciation: "MOH-jah kwah MOH-jah" },
      { word: "Geuka", translation: "Turn", pronunciation: "geh-OO-kah" },
      { word: "Simama", translation: "Stop", pronunciation: "see-MAH-mah" },
    ],
    phrases: [
      { text: "Samahani, kituo cha basi kiko wapi?", translation: "Excuse me, where is the bus stop?", pronunciation: "sah-mah-HAH-nee kee-TOO-oh chah BAH-see KEE-koh WAH-pee" },
      { text: "Nenda moja kwa moja, kisha geuka kushoto.", translation: "Go straight ahead, then turn left.", pronunciation: "NEN-dah MOH-jah kwah MOH-jah KEE-shah geh-OO-kah koo-SHOH-toh" },
    ],
    activities: [
      { id: "sw-travel-directions-1", type: "multiple-choice", question: 'What does "Kushoto" mean?', correctAnswer: "Left", options: ["Right", "Left", "Stop", "Straight ahead"], explanation: "Kushoto means left; kulia means right." },
      { id: "sw-travel-directions-2", type: "multiple-choice", question: 'Which word means "Stop"?', correctAnswer: "Simama", options: ["Simama", "Geuka", "Kulia", "Kushoto"], explanation: "Simama means stop." },
      { id: "sw-travel-directions-3", type: "translate", question: 'Type "Right" in Kiswahili.', correctAnswer: "Kulia", hint: "It starts with K.", explanation: "Kulia means right." },
      { id: "sw-travel-directions-4", type: "multiple-choice", question: 'What does "Moja kwa moja" mean in these directions?', correctAnswer: "Straight ahead", options: ["Turn left", "Straight ahead", "Bus stop", "Nearby"], explanation: "Moja kwa moja means straight ahead here." },
      { id: "sw-travel-directions-5", type: "multiple-choice", question: 'After "Nenda moja kwa moja, kisha geuka kushoto", what is the second step?', correctAnswer: "Turn left", options: ["Stop", "Turn right", "Turn left", "Go straight ahead"], explanation: "Kisha means then; geuka kushoto is turn left." },
    ],
  }),
  travelLesson({
    id: "en-travel-places", unitId: "en-unit-4", title: "Places around town",
    description: "Name common places and ask where the market is in English.", icon: "📍",
    notes: [
      { title: "Ask about a place", body: "Where is asks for the location of one place. Add the place after it to make a question.", example: "Where is the market?" },
      { title: "Answer with nearby", body: "Nearby means not far away. The words the market identify the place you are talking about.", example: "The market is nearby." },
    ],
    vocabulary: [
      { word: "Market", translation: "A place to buy and sell things", pronunciation: "MAR-kit" },
      { word: "School", translation: "A place where people learn", pronunciation: "skool" },
      { word: "Hospital", translation: "A place for medical care", pronunciation: "HOS-pi-tuhl" },
      { word: "Bus stop", translation: "A place to wait for a bus", pronunciation: "bus stop" },
      { word: "Toilet", translation: "A restroom", pronunciation: "TOY-let" },
    ],
    phrases: [
      { text: "Where is the market?", translation: "A question asking for the market's location.", pronunciation: "wair iz thuh MAR-kit" },
      { text: "The market is nearby.", translation: "The market is not far away.", pronunciation: "thuh MAR-kit iz NEER-bye" },
    ],
    activities: [
      { id: "en-travel-places-1", type: "multiple-choice", question: "Where do people wait for a bus?", correctAnswer: "Bus stop", options: ["School", "Bus stop", "Hospital", "Market"], explanation: "A bus stop is a place to wait for a bus." },
      { id: "en-travel-places-2", type: "multiple-choice", question: "Which place provides medical care?", correctAnswer: "Hospital", options: ["Market", "School", "Hospital", "Bus stop"], explanation: "A hospital provides medical care." },
      { id: "en-travel-places-3", type: "translate", question: "Type the word for a place where people learn.", correctAnswer: "School", hint: "It starts with S.", explanation: "A school is a place where people learn." },
      { id: "en-travel-places-4", type: "multiple-choice", question: "Which question asks for the market's location?", correctAnswer: "Where is the market?", options: ["The market is nearby.", "Where is the market?", "Good morning!", "I would like water."], explanation: "Where is asks for a location." },
      { id: "en-travel-places-5", type: "multiple-choice", question: 'What does "nearby" mean?', correctAnswer: "Not far away", options: ["Not far away", "Closed today", "On the left", "Very expensive"], explanation: "Nearby means not far away." },
    ],
  }),
  travelLesson({
    id: "en-travel-directions", unitId: "en-unit-4", title: "Finding the way",
    description: "Ask for the bus stop and follow simple directions in English.", icon: "🧭",
    notes: [
      { title: "Ask politely", body: "Excuse me is a polite way to get someone's attention. Where is asks for the location of the bus stop.", example: "Excuse me, where is the bus stop?" },
      { title: "Listen for the order", body: "Straight ahead means continue forward. Then introduces the next step: turn left.", example: "Go straight ahead, then turn left." },
    ],
    vocabulary: [
      { word: "Left", translation: "The direction opposite to right", pronunciation: "left" },
      { word: "Right", translation: "The direction opposite to left", pronunciation: "ryt" },
      { word: "Straight ahead", translation: "Continue forward", pronunciation: "strayt uh-HED" },
      { word: "Turn", translation: "Change direction", pronunciation: "turn" },
      { word: "Stop", translation: "Do not continue", pronunciation: "stop" },
    ],
    phrases: [
      { text: "Excuse me, where is the bus stop?", translation: "A polite question asking for a place.", pronunciation: "ek-SKYOOZ mee wair iz thuh bus stop" },
      { text: "Go straight ahead, then turn left.", translation: "Go forward and after that change direction to the left.", pronunciation: "goh strayt uh-HED then turn left" },
    ],
    activities: [
      { id: "en-travel-directions-1", type: "multiple-choice", question: "Which direction is opposite to left?", correctAnswer: "Right", options: ["Stop", "Straight ahead", "Right", "Nearby"], explanation: "Right is the opposite direction to left." },
      { id: "en-travel-directions-2", type: "multiple-choice", question: "Which word means do not continue?", correctAnswer: "Stop", options: ["Stop", "Turn", "Left", "Nearby"], explanation: "Stop tells you not to continue." },
      { id: "en-travel-directions-3", type: "translate", question: "Type the word that means change direction.", correctAnswer: "Turn", hint: "It starts with T.", explanation: "Turn means change direction." },
      { id: "en-travel-directions-4", type: "multiple-choice", question: 'What does "straight ahead" mean?', correctAnswer: "Continue forward", options: ["Continue forward", "Turn left", "Stop here", "Go back"], explanation: "Straight ahead means continue forward." },
      { id: "en-travel-directions-5", type: "multiple-choice", question: 'In "Go straight ahead, then turn left", what is the second step?', correctAnswer: "Turn left", options: ["Go straight ahead", "Turn right", "Stop", "Turn left"], explanation: "Then introduces the second step: turn left." },
    ],
  }),
  travelLesson({
    id: "fr-travel-places", unitId: "fr-unit-4", title: "Places around town",
    description: "Name places and ask where the market is in French.", icon: "📍",
    notes: [
      { title: "Learn the article", body: "French place names often have an article. Le or la becomes l' before a vowel or silent h; les is plural.", example: "Le marché = the market; l'école = the school; les toilettes = the toilets." },
      { title: "Ask and answer", body: "Où est asks where one place is. Tout près means very nearby. For plural toilettes, use où sont instead.", example: "Où est le marché ? → Le marché est tout près." },
    ],
    vocabulary: [
      { word: "Le marché", translation: "The market", pronunciation: "luh mar-SHAY" },
      { word: "L'école", translation: "The school", pronunciation: "lay-KOL" },
      { word: "L'hôpital", translation: "The hospital", pronunciation: "loh-pee-TAL" },
      { word: "L'arrêt de bus", translation: "The bus stop", pronunciation: "lah-REH duh boos" },
      { word: "Les toilettes", translation: "The toilets / restroom", pronunciation: "lay twah-LET" },
    ],
    phrases: [
      { text: "Où est le marché ?", translation: "Where is the market?", pronunciation: "oo eh luh mar-SHAY" },
      { text: "Le marché est tout près.", translation: "The market is very nearby.", pronunciation: "luh mar-SHAY eh too PREH" },
    ],
    activities: [
      { id: "fr-travel-places-1", type: "multiple-choice", question: 'What does "Le marché" mean?', correctAnswer: "The market", options: ["The school", "The hospital", "The market", "The bus stop"], explanation: "Le marché means the market." },
      { id: "fr-travel-places-2", type: "multiple-choice", question: 'Which phrase means "The hospital"?', correctAnswer: "L'hôpital", options: ["L'école", "L'hôpital", "Le marché", "Les toilettes"], explanation: "L'hôpital means the hospital; its h is silent." },
      { id: "fr-travel-places-3", type: "translate", question: 'Type "The school" in French.', correctAnswer: "L'école", hint: "Start with L'.", explanation: "L'école means the school. The article shortens before a vowel." },
      { id: "fr-travel-places-4", type: "multiple-choice", question: "How do you ask where the market is?", correctAnswer: "Où est le marché ?", options: ["Le marché est tout près.", "Où est le marché ?", "Au revoir !", "Je m'appelle Marie."], explanation: "Où est asks where one place is." },
      { id: "fr-travel-places-5", type: "multiple-choice", question: 'What does "tout près" mean here?', correctAnswer: "Very nearby", options: ["Very nearby", "Closed today", "Turn left", "At school"], explanation: "Tout près means very nearby." },
    ],
  }),
  travelLesson({
    id: "fr-travel-directions", unitId: "fr-unit-4", title: "Finding the way",
    description: "Ask for the bus stop and follow simple directions in French.", icon: "🧭",
    notes: [
      { title: "Ask politely", body: "Excusez-moi politely gets someone's attention. Où est asks for the location of one place, such as l'arrêt de bus.", example: "Excusez-moi, où est l'arrêt de bus ? = Excuse me, where is the bus stop?" },
      { title: "Follow the directions", body: "Allez and tournez are polite or plural command forms. Puis means then; à gauche means to the left.", example: "Allez tout droit, puis tournez à gauche. = Go straight ahead, then turn left." },
    ],
    vocabulary: [
      { word: "À gauche", translation: "To the left", pronunciation: "ah gohsh" },
      { word: "À droite", translation: "To the right", pronunciation: "ah drwaht" },
      { word: "Tout droit", translation: "Straight ahead", pronunciation: "too drwah" },
      { word: "Tournez", translation: "Turn (polite / plural)", pronunciation: "toor-NAY" },
      { word: "Arrêtez", translation: "Stop (polite / plural)", pronunciation: "ah-reh-TAY" },
    ],
    phrases: [
      { text: "Excusez-moi, où est l'arrêt de bus ?", translation: "Excuse me, where is the bus stop?", pronunciation: "eks-koo-ZAY mwah oo eh lah-REH duh boos" },
      { text: "Allez tout droit, puis tournez à gauche.", translation: "Go straight ahead, then turn left.", pronunciation: "ah-LAY too drwah pwee toor-NAY ah gohsh" },
    ],
    activities: [
      { id: "fr-travel-directions-1", type: "multiple-choice", question: 'What does "À gauche" mean?', correctAnswer: "To the left", options: ["To the right", "To the left", "Straight ahead", "Nearby"], explanation: "À gauche means to the left; à droite means to the right." },
      { id: "fr-travel-directions-2", type: "multiple-choice", question: 'Which word is a polite or plural command meaning "Stop"?', correctAnswer: "Arrêtez", options: ["Tournez", "Arrêtez", "Bonjour", "Merci"], explanation: "Arrêtez is a polite or plural way to say stop." },
      { id: "fr-travel-directions-3", type: "translate", question: 'Type "To the right" in French.', correctAnswer: "À droite", hint: "Start with À.", explanation: "À droite means to the right." },
      { id: "fr-travel-directions-4", type: "multiple-choice", question: 'What does "Tout droit" mean?', correctAnswer: "Straight ahead", options: ["Turn left", "Straight ahead", "Bus stop", "Nearby"], explanation: "Tout droit means straight ahead." },
      { id: "fr-travel-directions-5", type: "multiple-choice", question: 'After "Allez tout droit, puis tournez à gauche", what is the second step?', correctAnswer: "Turn left", options: ["Turn right", "Stop", "Turn left", "Go straight ahead"], explanation: "Puis means then; tournez à gauche is turn left." },
    ],
  }),
];
