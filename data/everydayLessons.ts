import { Lesson } from "@/types/learning";

// These lessons are intentionally local, text-based practice. The prompt field
// remains in the shared lesson shape, but no AI service is started by them.
function everydayLesson(lesson: Omit<Lesson, "xpReward" | "goals" | "aiTeacherPrompt">): Lesson {
  return {
    ...lesson,
    xpReward: 10,
    goals: [
      { description: "Review everyday words and phrases", xpReward: 5 },
      { description: "Complete the practice questions", xpReward: 5 },
    ],
    aiTeacherPrompt: {
      systemPrompt: "Local text practice only; AI teaching is not available in this version.",
      introMessage: "Review the words and practise at your own pace.",
      topics: [lesson.title],
    },
  };
}

export const EVERYDAY_LESSONS: Lesson[] = [
  everydayLesson({
    id: "sw-everyday-numbers", unitId: "sw-unit-2", title: "Numbers 1–10",
    description: "Count from one to ten in Kiswahili.", icon: "🔢",
    vocabulary: [
      { word: "Moja", translation: "One", pronunciation: "MOH-jah" },
      { word: "Mbili", translation: "Two", pronunciation: "m-BEE-lee" },
      { word: "Tatu", translation: "Three", pronunciation: "TAH-too" },
      { word: "Nne", translation: "Four", pronunciation: "N-neh" },
      { word: "Tano", translation: "Five", pronunciation: "TAH-noh" },
      { word: "Sita", translation: "Six", pronunciation: "SEE-tah" },
      { word: "Saba", translation: "Seven", pronunciation: "SAH-bah" },
      { word: "Nane", translation: "Eight", pronunciation: "NAH-neh" },
      { word: "Tisa", translation: "Nine", pronunciation: "TEE-sah" },
      { word: "Kumi", translation: "Ten", pronunciation: "KOO-mee" },
    ],
    phrases: [
      { text: "Moja, mbili, tatu.", translation: "One, two, three.", pronunciation: "MOH-jah m-BEE-lee TAH-too" },
      { text: "Namba kumi.", translation: "Number ten.", pronunciation: "NAHM-bah KOO-mee" },
    ],
    activities: [
      { id: "sw-numbers-1", type: "multiple-choice", question: 'What does "Mbili" mean?', correctAnswer: "Two", options: ["One", "Two", "Three", "Five"] },
      { id: "sw-numbers-2", type: "multiple-choice", question: 'Which word means "Five"?', correctAnswer: "Tano", options: ["Nne", "Moja", "Tano", "Tatu"] },
      { id: "sw-numbers-3", type: "translate", question: 'Type "Three" in Kiswahili.', correctAnswer: "Tatu", hint: "It starts with T." },
      { id: "sw-numbers-4", type: "multiple-choice", question: 'What comes after "Tisa" when counting?', correctAnswer: "Kumi", options: ["Tano", "Nane", "Kumi", "Saba"] },
      { id: "sw-numbers-5", type: "multiple-choice", question: 'Which word means "Eight"?', correctAnswer: "Nane", options: ["Sita", "Nane", "Tisa", "Kumi"] },
    ],
  }),
  everydayLesson({
    id: "sw-everyday-family", unitId: "sw-unit-2", title: "Family",
    description: "Talk about the people in your family.", icon: "👨‍👩‍👧",
    vocabulary: [
      { word: "Mama", translation: "Mother", pronunciation: "MAH-mah" },
      { word: "Baba", translation: "Father", pronunciation: "BAH-bah" },
      { word: "Dada", translation: "Sister (often older)", pronunciation: "DAH-dah" },
      { word: "Kaka", translation: "Brother (often older)", pronunciation: "KAH-kah" },
      { word: "Familia", translation: "Family", pronunciation: "fah-MEE-lee-ah" },
    ],
    phrases: [
      { text: "Huyu ni mama yangu.", translation: "This is my mother.", pronunciation: "HOO-yoo nee MAH-mah YAH-ngoo" },
      { text: "Hii ni familia yangu.", translation: "This is my family.", pronunciation: "HEE-ee nee fah-MEE-lee-ah YAH-ngoo" },
    ],
    activities: [
      { id: "sw-family-1", type: "multiple-choice", question: 'What does "Mama" mean?', correctAnswer: "Mother", options: ["Mother", "Father", "Family", "Brother"] },
      { id: "sw-family-2", type: "multiple-choice", question: 'Which word means "Father"?', correctAnswer: "Baba", options: ["Kaka", "Dada", "Baba", "Mama"] },
      { id: "sw-family-3", type: "translate", question: 'Type "Family" in Kiswahili.', correctAnswer: "Familia", hint: "It starts with F." },
      { id: "sw-family-4", type: "multiple-choice", question: 'What does "Huyu ni mama yangu" mean?', correctAnswer: "This is my mother", options: ["This is my mother", "This is my father", "This is my sister", "This is my brother"] },
    ],
  }),
  everydayLesson({
    id: "sw-everyday-food", unitId: "sw-unit-2", title: "Food & drinks",
    description: "Name familiar foods and ask for a drink.", icon: "🍲",
    vocabulary: [
      { word: "Maji", translation: "Water", pronunciation: "MAH-jee" },
      { word: "Chai", translation: "Tea", pronunciation: "CHAI" },
      { word: "Wali", translation: "Cooked rice", pronunciation: "WAH-lee" },
      { word: "Mkate", translation: "Bread", pronunciation: "m-KAH-teh" },
      { word: "Matunda", translation: "Fruit", pronunciation: "mah-TOON-dah" },
    ],
    phrases: [
      { text: "Ningependa maji, tafadhali.", translation: "I would like water, please.", pronunciation: "neen-geh-PEN-dah MAH-jee tah-fah-DHAH-lee" },
      { text: "Ningependa chai, tafadhali.", translation: "I would like tea, please.", pronunciation: "neen-geh-PEN-dah CHAI tah-fah-DHAH-lee" },
    ],
    activities: [
      { id: "sw-food-1", type: "multiple-choice", question: 'What does "Maji" mean?', correctAnswer: "Water", options: ["Bread", "Water", "Tea", "Fruit"] },
      { id: "sw-food-2", type: "multiple-choice", question: 'Which word means "Cooked rice"?', correctAnswer: "Wali", options: ["Wali", "Chai", "Mkate", "Maji"] },
      { id: "sw-food-3", type: "translate", question: 'Type "Tea" in Kiswahili.', correctAnswer: "Chai", hint: "It starts with Ch." },
      { id: "sw-food-4", type: "multiple-choice", question: 'What are you asking for in "Ningependa maji, tafadhali"?', correctAnswer: "Water", options: ["Rice", "Tea", "Bread", "Water"] },
    ],
  }),
  everydayLesson({
    id: "sw-everyday-conversation", unitId: "sw-unit-2", title: "Everyday conversation",
    description: "Ask for help and respond in simple conversations.", icon: "💬",
    vocabulary: [
      { word: "Ndiyo", translation: "Yes", pronunciation: "n-DEE-yoh" },
      { word: "Hapana", translation: "No", pronunciation: "hah-PAH-nah" },
      { word: "Samahani", translation: "Excuse me / sorry", pronunciation: "sah-mah-HAH-nee" },
      { word: "Wapi?", translation: "Where?", pronunciation: "WAH-pee" },
      { word: "Sielewi", translation: "I do not understand", pronunciation: "see-eh-LEH-wee" },
    ],
    phrases: [
      { text: "Samahani, choo kiko wapi?", translation: "Excuse me, where is the toilet?", pronunciation: "sah-mah-HAH-nee CHOH-oh KEE-koh WAH-pee" },
      { text: "Sielewi.", translation: "I do not understand.", pronunciation: "see-eh-LEH-wee" },
    ],
    activities: [
      { id: "sw-conversation-1", type: "multiple-choice", question: 'What does "Hapana" mean?', correctAnswer: "No", options: ["Where?", "Yes", "No", "Please"] },
      { id: "sw-conversation-2", type: "multiple-choice", question: 'Which word can mean "Excuse me"?', correctAnswer: "Samahani", options: ["Ndiyo", "Samahani", "Wapi", "Hapana"] },
      { id: "sw-conversation-3", type: "translate", question: 'Type "Yes" in Kiswahili.', correctAnswer: "Ndiyo", hint: "It starts with Nd." },
      { id: "sw-conversation-4", type: "multiple-choice", question: "What can you say if you do not understand?", correctAnswer: "Sielewi", options: ["Ndiyo", "Asante", "Sielewi", "Kwaheri"] },
    ],
  }),

  everydayLesson({
    id: "en-everyday-numbers", unitId: "en-unit-2", title: "Numbers 1–10",
    description: "Recognise and use the first ten numbers in English.", icon: "🔢",
    vocabulary: [
      { word: "One", translation: "The number 1", pronunciation: "wun" },
      { word: "Two", translation: "The number 2", pronunciation: "too" },
      { word: "Three", translation: "The number 3", pronunciation: "three" },
      { word: "Four", translation: "The number 4", pronunciation: "for" },
      { word: "Five", translation: "The number 5", pronunciation: "fyv" },
      { word: "Six", translation: "The number 6", pronunciation: "siks" },
      { word: "Seven", translation: "The number 7", pronunciation: "SEV-en" },
      { word: "Eight", translation: "The number 8", pronunciation: "ayt" },
      { word: "Nine", translation: "The number 9", pronunciation: "nyn" },
      { word: "Ten", translation: "The number 10", pronunciation: "ten" },
    ],
    phrases: [
      { text: "One, two, three.", translation: "Counting from 1 to 3.", pronunciation: "wun too three" },
      { text: "Number ten.", translation: "A way to refer to 10.", pronunciation: "NUM-ber ten" },
    ],
    activities: [
      { id: "en-numbers-1", type: "multiple-choice", question: "Which word is the number 2?", correctAnswer: "Two", options: ["One", "Two", "Three", "Five"] },
      { id: "en-numbers-2", type: "multiple-choice", question: "What comes after three when counting?", correctAnswer: "Four", options: ["One", "Two", "Four", "Five"] },
      { id: "en-numbers-3", type: "translate", question: "Type the number 5 in words.", correctAnswer: "Five", hint: "It starts with F." },
      { id: "en-numbers-4", type: "multiple-choice", question: "What comes after nine when counting?", correctAnswer: "Ten", options: ["Six", "Eight", "Seven", "Ten"] },
      { id: "en-numbers-5", type: "multiple-choice", question: "Which word is the number 8?", correctAnswer: "Eight", options: ["Six", "Eight", "Nine", "Ten"] },
    ],
  }),
  everydayLesson({
    id: "en-everyday-family", unitId: "en-unit-2", title: "Family",
    description: "Talk about the people in your family in English.", icon: "👨‍👩‍👧",
    vocabulary: [
      { word: "Mother", translation: "A female parent", pronunciation: "MUH-ther" },
      { word: "Father", translation: "A male parent", pronunciation: "FAH-ther" },
      { word: "Sister", translation: "A female sibling", pronunciation: "SIS-ter" },
      { word: "Brother", translation: "A male sibling", pronunciation: "BRUH-ther" },
      { word: "Family", translation: "People related to one another", pronunciation: "FAM-uh-lee" },
    ],
    phrases: [
      { text: "This is my mother.", translation: "A way to introduce your mother.", pronunciation: "this iz my MUH-ther" },
      { text: "This is my family.", translation: "A way to introduce your family.", pronunciation: "this iz my FAM-uh-lee" },
    ],
    activities: [
      { id: "en-family-1", type: "multiple-choice", question: "Which word means a male parent?", correctAnswer: "Father", options: ["Sister", "Mother", "Father", "Family"] },
      { id: "en-family-2", type: "multiple-choice", question: "Which word means a female sibling?", correctAnswer: "Sister", options: ["Brother", "Sister", "Father", "Mother"] },
      { id: "en-family-3", type: "translate", question: "Type the word for people related to one another.", correctAnswer: "Family", hint: "It starts with F." },
      { id: "en-family-4", type: "multiple-choice", question: "How can you introduce your mother?", correctAnswer: "This is my mother.", options: ["This is my mother.", "Goodbye, mother.", "Where is the tea?", "I am fine."] },
    ],
  }),
  everydayLesson({
    id: "en-everyday-food", unitId: "en-unit-2", title: "Food & drinks",
    description: "Name familiar foods and politely ask for a drink.", icon: "🍲",
    vocabulary: [
      { word: "Water", translation: "A drink", pronunciation: "WAW-ter" },
      { word: "Tea", translation: "A drink made with tea leaves", pronunciation: "tee" },
      { word: "Rice", translation: "A food made from small grains", pronunciation: "rys" },
      { word: "Bread", translation: "A baked food made from flour", pronunciation: "bred" },
      { word: "Fruit", translation: "Food such as a mango or banana", pronunciation: "froot" },
    ],
    phrases: [
      { text: "I would like water, please.", translation: "A polite way to ask for water.", pronunciation: "eye wood lyk WAW-ter pleez" },
      { text: "I would like tea, please.", translation: "A polite way to ask for tea.", pronunciation: "eye wood lyk tee pleez" },
    ],
    activities: [
      { id: "en-food-1", type: "multiple-choice", question: "Which word is a drink?", correctAnswer: "Tea", options: ["Bread", "Rice", "Tea", "Fruit"] },
      { id: "en-food-2", type: "multiple-choice", question: "Which word names a baked food made from flour?", correctAnswer: "Bread", options: ["Tea", "Bread", "Water", "Fruit"] },
      { id: "en-food-3", type: "translate", question: "Type the word for the food made from small grains.", correctAnswer: "Rice", hint: "It starts with R." },
      { id: "en-food-4", type: "multiple-choice", question: "How can you politely ask for water?", correctAnswer: "I would like water, please.", options: ["This is my family.", "Where is the bread?", "I would like water, please.", "Goodbye!"] },
    ],
  }),
  everydayLesson({
    id: "en-everyday-conversation", unitId: "en-unit-2", title: "Everyday conversation",
    description: "Ask for help and respond in simple conversations.", icon: "💬",
    vocabulary: [
      { word: "Yes", translation: "An affirmative answer", pronunciation: "yes" },
      { word: "No", translation: "A negative answer", pronunciation: "noh" },
      { word: "Excuse me", translation: "A polite way to get someone's attention", pronunciation: "ek-SKYOOZ mee" },
      { word: "Where?", translation: "A question about a place", pronunciation: "wair" },
      { word: "I don't understand", translation: "A way to say something is not clear", pronunciation: "eye dont un-der-STAND" },
    ],
    phrases: [
      { text: "Excuse me, where is the toilet?", translation: "A polite question asking for a place.", pronunciation: "ek-SKYOOZ mee wair iz the TOY-let" },
      { text: "I don't understand.", translation: "A way to say you need an explanation.", pronunciation: "eye dont un-der-STAND" },
    ],
    activities: [
      { id: "en-conversation-1", type: "multiple-choice", question: "Which word is an affirmative answer?", correctAnswer: "Yes", options: ["No", "Yes", "Where", "Goodbye"] },
      { id: "en-conversation-2", type: "multiple-choice", question: "Which word asks about a place?", correctAnswer: "Where", options: ["Please", "Thank you", "Where", "Yes"] },
      { id: "en-conversation-3", type: "translate", question: "Type a polite way to get someone's attention.", correctAnswer: "Excuse me", hint: "It starts with Excuse." },
      { id: "en-conversation-4", type: "multiple-choice", question: "What can you say if something is not clear?", correctAnswer: "I don't understand", options: ["Good morning", "I don't understand", "Nice to meet you", "Goodbye"] },
    ],
  }),

  everydayLesson({
    id: "fr-everyday-numbers", unitId: "fr-unit-2", title: "Numbers 11–15",
    description: "Continue counting in French, from eleven to fifteen.", icon: "🔢",
    vocabulary: [
      { word: "Onze", translation: "Eleven", pronunciation: "ohnz (nasal)" },
      { word: "Douze", translation: "Twelve", pronunciation: "dooz" },
      { word: "Treize", translation: "Thirteen", pronunciation: "trehz" },
      { word: "Quatorze", translation: "Fourteen", pronunciation: "kah-TORZ" },
      { word: "Quinze", translation: "Fifteen", pronunciation: "kanz (nasal)" },
    ],
    phrases: [
      { text: "Onze, douze, treize.", translation: "Eleven, twelve, thirteen.", pronunciation: "ohnz dooz trehz" },
      { text: "Numéro quinze.", translation: "Number fifteen.", pronunciation: "noo-may-ROH kanz" },
    ],
    activities: [
      { id: "fr-numbers-1", type: "multiple-choice", question: 'What does "Onze" mean?', correctAnswer: "Eleven", options: ["Eleven", "Twelve", "Thirteen", "Fifteen"] },
      { id: "fr-numbers-2", type: "multiple-choice", question: 'Which word means "Fourteen"?', correctAnswer: "Quatorze", options: ["Quinze", "Douze", "Treize", "Quatorze"] },
      { id: "fr-numbers-3", type: "translate", question: 'Type "Thirteen" in French.', correctAnswer: "Treize", hint: "It starts with T." },
      { id: "fr-numbers-4", type: "multiple-choice", question: 'What comes after "Quatorze" when counting?', correctAnswer: "Quinze", options: ["Onze", "Quinze", "Douze", "Treize"] },
    ],
  }),
  everydayLesson({
    id: "fr-everyday-family", unitId: "fr-unit-2", title: "Family",
    description: "Talk about the people in your family in French.", icon: "👨‍👩‍👧",
    vocabulary: [
      { word: "La mère", translation: "Mother", pronunciation: "lah mehr" },
      { word: "Le père", translation: "Father", pronunciation: "luh pehr" },
      { word: "La sœur", translation: "Sister", pronunciation: "lah suhr" },
      { word: "Le frère", translation: "Brother", pronunciation: "luh frehr" },
      { word: "La famille", translation: "Family", pronunciation: "lah fah-MEE-yuh" },
    ],
    phrases: [
      { text: "C'est ma mère.", translation: "This is my mother.", pronunciation: "seh mah mehr" },
      { text: "Voici ma famille.", translation: "Here is my family.", pronunciation: "vwah-SEE mah fah-MEE-yuh" },
    ],
    activities: [
      { id: "fr-family-1", type: "multiple-choice", question: 'What does "La mère" mean?', correctAnswer: "Mother", options: ["Sister", "Mother", "Father", "Brother"] },
      { id: "fr-family-2", type: "multiple-choice", question: 'Which phrase means "The father"?', correctAnswer: "Le père", options: ["La sœur", "Le frère", "La mère", "Le père"] },
      { id: "fr-family-3", type: "translate", question: 'Type "The family" in French.', correctAnswer: "La famille", hint: "Start with La." },
      { id: "fr-family-4", type: "multiple-choice", question: 'What does "Voici ma famille" mean?', correctAnswer: "Here is my family", options: ["Here is my family", "Where is my mother?", "I would like tea", "Goodbye, father"] },
    ],
  }),
  everydayLesson({
    id: "fr-everyday-food", unitId: "fr-unit-2", title: "Food & drinks",
    description: "Name familiar foods and ask for a drink in French.", icon: "🍲",
    vocabulary: [
      { word: "L'eau", translation: "Water", pronunciation: "loh" },
      { word: "Le thé", translation: "Tea", pronunciation: "luh tay" },
      { word: "Le riz", translation: "Rice", pronunciation: "luh ree" },
      { word: "Le pain", translation: "Bread", pronunciation: "luh pan (nasal)" },
      { word: "Le fruit", translation: "Fruit", pronunciation: "luh frwee" },
    ],
    phrases: [
      { text: "Je voudrais de l'eau, s'il vous plaît.", translation: "I would like some water, please.", pronunciation: "zhuh voo-DREH duh loh seel voo pleh" },
      { text: "Je voudrais du thé, s'il vous plaît.", translation: "I would like some tea, please.", pronunciation: "zhuh voo-DREH doo tay seel voo pleh" },
    ],
    activities: [
      { id: "fr-food-1", type: "multiple-choice", question: 'What does "L\'eau" mean?', correctAnswer: "Water", options: ["Bread", "Fruit", "Tea", "Water"] },
      { id: "fr-food-2", type: "multiple-choice", question: 'Which phrase means "The bread"?', correctAnswer: "Le pain", options: ["Le riz", "Le pain", "Le thé", "Le fruit"] },
      { id: "fr-food-3", type: "translate", question: 'Type "The rice" in French.', correctAnswer: "Le riz", hint: "Start with Le." },
      { id: "fr-food-4", type: "multiple-choice", question: 'What are you asking for in "Je voudrais du thé"?', correctAnswer: "Tea", options: ["Water", "Rice", "Tea", "Bread"] },
    ],
  }),
  everydayLesson({
    id: "fr-everyday-conversation", unitId: "fr-unit-2", title: "Everyday conversation",
    description: "Ask for help and respond in simple French conversations.", icon: "💬",
    vocabulary: [
      { word: "Oui", translation: "Yes", pronunciation: "wee" },
      { word: "Non", translation: "No", pronunciation: "nohn (nasal)" },
      { word: "Pardon", translation: "Excuse me / sorry", pronunciation: "par-DOHN" },
      { word: "Où?", translation: "Where?", pronunciation: "oo" },
      { word: "Je ne comprends pas", translation: "I do not understand", pronunciation: "zhuh nuh kohm-PRAHN pah" },
    ],
    phrases: [
      { text: "Pardon, où sont les toilettes?", translation: "Excuse me, where are the toilets?", pronunciation: "par-DOHN oo sohn lay twah-LET" },
      { text: "Je ne comprends pas.", translation: "I do not understand.", pronunciation: "zhuh nuh kohm-PRAHN pah" },
    ],
    activities: [
      { id: "fr-conversation-1", type: "multiple-choice", question: 'What does "Non" mean?', correctAnswer: "No", options: ["Where?", "Yes", "Please", "No"] },
      { id: "fr-conversation-2", type: "multiple-choice", question: 'Which word can mean "Excuse me"?', correctAnswer: "Pardon", options: ["Oui", "Pardon", "Où", "Non"] },
      { id: "fr-conversation-3", type: "translate", question: 'Type "Yes" in French.', correctAnswer: "Oui", hint: "It starts with O." },
      { id: "fr-conversation-4", type: "multiple-choice", question: "What can you say if you do not understand?", correctAnswer: "Je ne comprends pas", options: ["Je ne comprends pas", "Au revoir", "Bonjour", "Merci"] },
    ],
  }),
];
