import type { Lesson } from "@/types/learning";

// These lessons are bundled for offline practice; they do not start an AI call.
function planningLesson(lesson: Omit<Lesson, "xpReward" | "goals" | "aiTeacherPrompt">): Lesson {
  return {
    ...lesson,
    xpReward: 15,
    goals: [
      { description: "Learn useful words for days and plans", xpReward: 5 },
      { description: "Complete the practice questions", xpReward: 10 },
    ],
    aiTeacherPrompt: {
      systemPrompt: "Local practice only; live AI teaching is not available in this version.",
      introMessage: "Explore the words and practise at your own pace.",
      topics: [lesson.title],
    },
  };
}

export const PLANNING_LESSONS: Lesson[] = [
  planningLesson({
    id: "sw-planning-days", unitId: "sw-unit-5", title: "Days of the week",
    description: "Name the days and talk about a day in Kiswahili.", icon: "📅",
    notes: [
      { title: "Days and their names", body: "Jumamosi is Saturday and Jumapili is Sunday. The names from Jumamosi through Jumatano reflect a sequence beginning on Saturday; Alhamisi and Ijumaa have different names.", example: "Jumamosi → Jumapili → Jumatatu" },
      { title: "Talk about a day", body: "Leo ni means today is. Tutaonana means we will see each other, so you can use it when making a plan.", example: "Leo ni Jumatatu. = Today is Monday." },
    ],
    vocabulary: [
      { word: "Jumatatu", translation: "Monday", pronunciation: "joo-mah-TAH-too" },
      { word: "Jumanne", translation: "Tuesday", pronunciation: "joo-MAH-nneh" },
      { word: "Jumatano", translation: "Wednesday", pronunciation: "joo-mah-TAH-noh" },
      { word: "Alhamisi", translation: "Thursday", pronunciation: "al-hah-MEE-see" },
      { word: "Ijumaa", translation: "Friday", pronunciation: "ee-joo-MAA" },
      { word: "Jumamosi", translation: "Saturday", pronunciation: "joo-mah-MOH-see" },
      { word: "Jumapili", translation: "Sunday", pronunciation: "joo-mah-PEE-lee" },
    ],
    phrases: [
      { text: "Leo ni Jumatatu.", translation: "Today is Monday.", pronunciation: "LEH-oh nee joo-mah-TAH-too" },
      { text: "Tutaonana Ijumaa.", translation: "We will see each other on Friday.", pronunciation: "too-tah-oh-NAH-nah ee-joo-MAA" },
    ],
    activities: [
      { id: "sw-planning-days-1", type: "multiple-choice", question: 'What does "Jumatatu" mean?', correctAnswer: "Monday", options: ["Tuesday", "Monday", "Friday", "Sunday"], explanation: "Jumatatu is Monday." },
      { id: "sw-planning-days-2", type: "multiple-choice", question: 'Which word means "Friday"?', correctAnswer: "Ijumaa", options: ["Alhamisi", "Jumatano", "Ijumaa", "Jumamosi"], explanation: "Ijumaa is Friday; Alhamisi is Thursday." },
      { id: "sw-planning-days-3", type: "translate", question: 'Type "Sunday" in Kiswahili.', correctAnswer: "Jumapili", hint: "It starts with Juma.", explanation: "Jumapili is Sunday." },
      { id: "sw-planning-days-4", type: "multiple-choice", question: 'Which day follows "Jumamosi"?', correctAnswer: "Jumapili", options: ["Jumatatu", "Jumapili", "Jumanne", "Ijumaa"], explanation: "Jumamosi is Saturday; the following day is Jumapili, Sunday." },
      { id: "sw-planning-days-5", type: "multiple-choice", question: 'What does "Tutaonana Ijumaa" mean?', correctAnswer: "We will see each other on Friday", options: ["Today is Monday", "We will see each other on Friday", "The market is nearby", "See you tomorrow"], explanation: "Tutaonana means we will see each other; Ijumaa is Friday." },
      { id: "sw-planning-days-6", type: "multiple-choice", question: 'If today is "Jumanne", which day is tomorrow?', correctAnswer: "Jumatano", options: ["Jumatatu", "Jumatano", "Jumapili", "Ijumaa"], explanation: "Jumanne is Tuesday; Jumatano is Wednesday." },
      { id: "sw-planning-days-7", type: "translate", question: 'Type "Thursday" in Kiswahili.', correctAnswer: "Alhamisi", hint: "It starts with A.", explanation: "Alhamisi is Thursday." },
      { id: "sw-planning-days-8", type: "multiple-choice", question: 'What does "Leo ni Jumatatu" mean?', correctAnswer: "Today is Monday", options: ["Today is Monday", "See you on Friday", "Tomorrow is Tuesday", "Today is Sunday"], explanation: "Leo ni means today is; Jumatatu is Monday." },
    ],
  }),
  planningLesson({
    id: "sw-planning-meet", unitId: "sw-unit-5", title: "Making a plan",
    description: "Use today and tomorrow to make a simple plan in Kiswahili.", icon: "💬",
    notes: [
      { title: "Place a plan in time", body: "Leo is today, kesho is tomorrow, and jana is yesterday. Sasa means now; baadaye means later.", example: "Tuonane kesho. = Let's see each other tomorrow." },
      { title: "Ask to meet", body: "Unaweza asks whether the person can do something, and kukutana means to meet. Tuonane is an invitation for us to see each other.", example: "Unaweza kukutana kesho? → Ndiyo, tuonane kesho." },
    ],
    vocabulary: [
      { word: "Leo", translation: "Today", pronunciation: "LEH-oh" },
      { word: "Kesho", translation: "Tomorrow", pronunciation: "KEH-shoh" },
      { word: "Jana", translation: "Yesterday", pronunciation: "JAH-nah" },
      { word: "Sasa", translation: "Now", pronunciation: "SAH-sah" },
      { word: "Baadaye", translation: "Later", pronunciation: "bah-ah-DAH-yeh" },
    ],
    phrases: [
      { text: "Unaweza kukutana kesho?", translation: "Can you meet tomorrow?", pronunciation: "oo-nah-WEH-zah koo-koo-TAH-nah KEH-shoh" },
      { text: "Ndiyo, tuonane kesho.", translation: "Yes, let's see each other tomorrow.", pronunciation: "n-DEE-yoh too-oh-NAH-neh KEH-shoh" },
    ],
    activities: [
      { id: "sw-planning-meet-1", type: "multiple-choice", question: 'What does "Kesho" mean?', correctAnswer: "Tomorrow", options: ["Yesterday", "Tomorrow", "Now", "Later"], explanation: "Kesho means tomorrow; jana means yesterday." },
      { id: "sw-planning-meet-2", type: "multiple-choice", question: 'Which word means "Yesterday"?', correctAnswer: "Jana", options: ["Leo", "Baadaye", "Jana", "Kesho"], explanation: "Jana means yesterday." },
      { id: "sw-planning-meet-3", type: "translate", question: 'Type "Now" in Kiswahili.', correctAnswer: "Sasa", hint: "It starts with S.", explanation: "Sasa means now." },
      { id: "sw-planning-meet-4", type: "multiple-choice", question: 'What does "Unaweza kukutana kesho?" ask?', correctAnswer: "Can you meet tomorrow?", options: ["Can you meet tomorrow?", "Where is the market?", "Is today Monday?", "Did you meet yesterday?"], explanation: "Unaweza asks can you, kukutana means meet, and kesho means tomorrow." },
      { id: "sw-planning-meet-5", type: "multiple-choice", question: 'What does "Ndiyo, tuonane kesho" mean?', correctAnswer: "Yes, let's see each other tomorrow", options: ["No, not today", "Yes, let's see each other tomorrow", "The bus stop is nearby", "I do not understand"], explanation: "Ndiyo means yes; tuonane kesho suggests seeing each other tomorrow." },
      { id: "sw-planning-meet-6", type: "multiple-choice", question: 'A friend suggests meeting after now. Which word means "later"?', correctAnswer: "Baadaye", options: ["Sasa", "Baadaye", "Jana", "Leo"], explanation: "Baadaye means later; sasa means now." },
      { id: "sw-planning-meet-7", type: "translate", question: 'Type "Today" in Kiswahili.', correctAnswer: "Leo", hint: "It starts with L.", explanation: "Leo means today, the current day." },
    ],
  }),

  planningLesson({
    id: "en-planning-days", unitId: "en-unit-5", title: "Days of the week",
    description: "Name the days and talk about a day in English.", icon: "📅",
    notes: [
      { title: "Write the days", body: "English names for the days of the week begin with capital letters. Monday to Sunday is one common display order; calendars can start on a different day.", example: "Monday, Tuesday, Wednesday" },
      { title: "Talk about a day", body: "Today is introduces the current day. Use on before a named day when saying when you will meet.", example: "Today is Monday. See you on Friday." },
    ],
    vocabulary: [
      { word: "Monday", translation: "The day after Sunday", pronunciation: "MUN-day" },
      { word: "Tuesday", translation: "The day after Monday", pronunciation: "TYOOZ-day" },
      { word: "Wednesday", translation: "The day after Tuesday", pronunciation: "WENZ-day" },
      { word: "Thursday", translation: "The day after Wednesday", pronunciation: "THURZ-day" },
      { word: "Friday", translation: "The day after Thursday", pronunciation: "FRY-day" },
      { word: "Saturday", translation: "The day after Friday", pronunciation: "SAT-er-day" },
      { word: "Sunday", translation: "The day after Saturday", pronunciation: "SUN-day" },
    ],
    phrases: [
      { text: "Today is Monday.", translation: "A statement about the current day.", pronunciation: "tuh-DAY iz MUN-day" },
      { text: "See you on Friday.", translation: "A way to say you will meet on Friday.", pronunciation: "see yoo on FRY-day" },
    ],
    activities: [
      { id: "en-planning-days-1", type: "multiple-choice", question: "Which day comes after Monday?", correctAnswer: "Tuesday", options: ["Sunday", "Tuesday", "Friday", "Saturday"], explanation: "Tuesday follows Monday." },
      { id: "en-planning-days-2", type: "multiple-choice", question: "Which day comes directly before Sunday?", correctAnswer: "Saturday", options: ["Friday", "Thursday", "Monday", "Saturday"], explanation: "Saturday comes immediately before Sunday." },
      { id: "en-planning-days-3", type: "translate", question: "Type the day that comes after Thursday.", correctAnswer: "Friday", hint: "It starts with F.", explanation: "Friday follows Thursday." },
      { id: "en-planning-days-4", type: "multiple-choice", question: 'In "See you on Friday", when will you meet?', correctAnswer: "Friday", options: ["Monday", "Wednesday", "Friday", "Sunday"], explanation: "On Friday names the day of the plan." },
      { id: "en-planning-days-5", type: "multiple-choice", question: 'Which sentence says that Monday is the current day?', correctAnswer: "Today is Monday.", options: ["Today is Monday.", "See you on Friday.", "The market is nearby.", "I would like water."], explanation: "Today refers to the current day." },
      { id: "en-planning-days-6", type: "multiple-choice", question: "If today is Tuesday, which day is tomorrow?", correctAnswer: "Wednesday", options: ["Monday", "Wednesday", "Sunday", "Friday"], explanation: "Wednesday comes after Tuesday." },
      { id: "en-planning-days-7", type: "translate", question: "Type the day that comes between Wednesday and Friday.", correctAnswer: "Thursday", hint: "It starts with Th.", explanation: "Thursday follows Wednesday and comes before Friday." },
    ],
  }),
  planningLesson({
    id: "en-planning-meet", unitId: "en-unit-5", title: "Making a plan",
    description: "Use today and tomorrow to make a simple plan in English.", icon: "💬",
    notes: [
      { title: "Place a plan in time", body: "Today is the current day, tomorrow is the next day, and yesterday was the previous day. Now means at this moment; later means after now.", example: "See you tomorrow." },
      { title: "Ask about availability", body: "Are you free tomorrow? asks whether someone is available the next day. An answer can confirm the plan.", example: "Are you free tomorrow? → Yes, see you tomorrow." },
    ],
    vocabulary: [
      { word: "Today", translation: "The current day", pronunciation: "tuh-DAY" },
      { word: "Tomorrow", translation: "The next day", pronunciation: "tuh-MOR-oh" },
      { word: "Yesterday", translation: "The previous day", pronunciation: "YES-ter-day" },
      { word: "Now", translation: "At this moment", pronunciation: "now" },
      { word: "Later", translation: "After now", pronunciation: "LAY-ter" },
    ],
    phrases: [
      { text: "Are you free tomorrow?", translation: "A question asking about availability the next day.", pronunciation: "ar yoo free tuh-MOR-oh" },
      { text: "Yes, see you tomorrow.", translation: "A way to agree to meet the next day.", pronunciation: "yes see yoo tuh-MOR-oh" },
    ],
    activities: [
      { id: "en-planning-meet-1", type: "multiple-choice", question: "Which word means the next day?", correctAnswer: "Tomorrow", options: ["Yesterday", "Tomorrow", "Now", "Today"], explanation: "Tomorrow is the next day." },
      { id: "en-planning-meet-2", type: "multiple-choice", question: "Which word means the previous day?", correctAnswer: "Yesterday", options: ["Today", "Later", "Yesterday", "Tomorrow"], explanation: "Yesterday is the day before today." },
      { id: "en-planning-meet-3", type: "translate", question: "Type the word that means after now.", correctAnswer: "Later", hint: "It starts with L.", explanation: "Later means after now." },
      { id: "en-planning-meet-4", type: "multiple-choice", question: 'What does "Are you free tomorrow?" ask?', correctAnswer: "Whether someone is available tomorrow", options: ["Where the market is", "Whether someone is available tomorrow", "What day yesterday was", "Whether the bus is nearby"], explanation: "Free means available in this question." },
      { id: "en-planning-meet-5", type: "multiple-choice", question: "Which answer agrees to meet tomorrow?", correctAnswer: "Yes, see you tomorrow.", options: ["Yes, see you tomorrow.", "The market is nearby.", "I am reading a book.", "No, I cannot meet."], explanation: "Yes, see you tomorrow confirms the plan." },
      { id: "en-planning-meet-6", type: "multiple-choice", question: "A friend wants to meet at this moment. Which word means at this moment?", correctAnswer: "Now", options: ["Now", "Later", "Yesterday", "Tomorrow"], explanation: "Now means at this moment; later means after now." },
      { id: "en-planning-meet-7", type: "translate", question: "Type the word for the current day.", correctAnswer: "Today", hint: "It starts with T.", explanation: "Today is the current day." },
    ],
  }),

  planningLesson({
    id: "fr-planning-days", unitId: "fr-unit-5", title: "Days of the week",
    description: "Name the days and talk about a day in French.", icon: "📅",
    notes: [
      { title: "Write the days", body: "French names for days are normally lowercase within a sentence. Monday to Sunday is one common display order; calendars can start on a different day.", example: "Aujourd'hui, c'est lundi. = Today is Monday." },
      { title: "Make a simple plan", body: "À followed by a day can be a short way to say see you then. Vendredi means Friday.", example: "À vendredi. = See you on Friday." },
    ],
    vocabulary: [
      { word: "Lundi", translation: "Monday", pronunciation: "luhn-DEE (nasal)" },
      { word: "Mardi", translation: "Tuesday", pronunciation: "mar-DEE" },
      { word: "Mercredi", translation: "Wednesday", pronunciation: "mehr-kruh-DEE" },
      { word: "Jeudi", translation: "Thursday", pronunciation: "zhuh-DEE" },
      { word: "Vendredi", translation: "Friday", pronunciation: "vahn-druh-DEE (nasal)" },
      { word: "Samedi", translation: "Saturday", pronunciation: "sahm-DEE" },
      { word: "Dimanche", translation: "Sunday", pronunciation: "dee-MAHNSH (nasal)" },
    ],
    phrases: [
      { text: "Aujourd'hui, c'est lundi.", translation: "Today is Monday.", pronunciation: "oh-zhoor-DWEE seh luhn-DEE" },
      { text: "À vendredi.", translation: "See you on Friday.", pronunciation: "ah vahn-druh-DEE" },
    ],
    activities: [
      { id: "fr-planning-days-1", type: "multiple-choice", question: 'What does "Lundi" mean?', correctAnswer: "Monday", options: ["Tuesday", "Monday", "Friday", "Sunday"], explanation: "Lundi means Monday." },
      { id: "fr-planning-days-2", type: "multiple-choice", question: 'Which word means "Friday"?', correctAnswer: "Vendredi", options: ["Jeudi", "Mercredi", "Vendredi", "Samedi"], explanation: "Vendredi is Friday; jeudi is Thursday." },
      { id: "fr-planning-days-3", type: "translate", question: 'Type "Sunday" in French.', correctAnswer: "Dimanche", hint: "It starts with D.", explanation: "Dimanche means Sunday." },
      { id: "fr-planning-days-4", type: "multiple-choice", question: 'Which day follows "Samedi"?', correctAnswer: "Dimanche", options: ["Lundi", "Dimanche", "Mardi", "Vendredi"], explanation: "Samedi is Saturday; dimanche is Sunday." },
      { id: "fr-planning-days-5", type: "multiple-choice", question: 'What does "À vendredi" mean?', correctAnswer: "See you on Friday", options: ["Today is Monday", "See you on Friday", "The market is nearby", "See you tomorrow"], explanation: "À vendredi is a short way to say see you on Friday." },
      { id: "fr-planning-days-6", type: "multiple-choice", question: 'If today is "mardi", which day is tomorrow?', correctAnswer: "Mercredi", options: ["Lundi", "Mercredi", "Dimanche", "Vendredi"], explanation: "Mardi is Tuesday; mercredi is Wednesday." },
      { id: "fr-planning-days-7", type: "translate", question: 'Type "Thursday" in French.', correctAnswer: "Jeudi", hint: "It starts with J.", explanation: "Jeudi is Thursday." },
      { id: "fr-planning-days-8", type: "multiple-choice", question: "What does \"Aujourd'hui, c'est lundi\" mean?", correctAnswer: "Today is Monday", options: ["Today is Monday", "See you on Friday", "Tomorrow is Tuesday", "Today is Sunday"], explanation: "Aujourd'hui is today; lundi is Monday." },
    ],
  }),
  planningLesson({
    id: "fr-planning-meet", unitId: "fr-unit-5", title: "Making a plan",
    description: "Use today and tomorrow to make a simple plan in French.", icon: "💬",
    notes: [
      { title: "Place a plan in time", body: "Aujourd'hui is today, demain is tomorrow, and hier is yesterday. Maintenant means now; plus tard means later.", example: "À demain ! = See you tomorrow!" },
      { title: "Ask about a plan", body: "Tu es libre demain ? asks a familiar person if they are free tomorrow. Oui means yes; à demain confirms you will see each other then.", example: "Tu es libre demain ? → Oui, à demain !" },
    ],
    vocabulary: [
      { word: "Aujourd'hui", translation: "Today", pronunciation: "oh-zhoor-DWEE" },
      { word: "Demain", translation: "Tomorrow", pronunciation: "duh-MAN (nasal)" },
      { word: "Hier", translation: "Yesterday", pronunciation: "yehr" },
      { word: "Maintenant", translation: "Now", pronunciation: "mant-NAHN (nasal)" },
      { word: "Plus tard", translation: "Later", pronunciation: "ploo tar" },
    ],
    phrases: [
      { text: "Tu es libre demain ?", translation: "Are you free tomorrow? (informal)", pronunciation: "too eh leebr duh-MAN" },
      { text: "Oui, à demain !", translation: "Yes, see you tomorrow!", pronunciation: "wee ah duh-MAN" },
    ],
    activities: [
      { id: "fr-planning-meet-1", type: "multiple-choice", question: 'What does "Demain" mean?', correctAnswer: "Tomorrow", options: ["Yesterday", "Tomorrow", "Now", "Later"], explanation: "Demain means tomorrow; hier means yesterday." },
      { id: "fr-planning-meet-2", type: "multiple-choice", question: 'Which word means "Yesterday"?', correctAnswer: "Hier", options: ["Aujourd'hui", "Plus tard", "Hier", "Demain"], explanation: "Hier means yesterday." },
      { id: "fr-planning-meet-3", type: "translate", question: 'Type "Now" in French.', correctAnswer: "Maintenant", hint: "It starts with M.", explanation: "Maintenant means now." },
      { id: "fr-planning-meet-4", type: "multiple-choice", question: 'What does "Tu es libre demain ?" ask?', correctAnswer: "Are you free tomorrow?", options: ["Are you free tomorrow?", "Where is the market?", "Is today Monday?", "Did you meet yesterday?"], explanation: "Tu es libre asks if a familiar person is free; demain means tomorrow." },
      { id: "fr-planning-meet-5", type: "multiple-choice", question: 'What does "Oui, à demain !" mean?', correctAnswer: "Yes, see you tomorrow!", options: ["No, not today", "Yes, see you tomorrow!", "The bus stop is nearby", "I do not understand"], explanation: "Oui means yes; à demain means see you tomorrow." },
      { id: "fr-planning-meet-6", type: "multiple-choice", question: 'A friend suggests meeting after now. Which phrase means "later"?', correctAnswer: "Plus tard", options: ["Maintenant", "Plus tard", "Hier", "Demain"], explanation: "Plus tard means later; maintenant means now." },
      { id: "fr-planning-meet-7", type: "translate", question: 'Type "Today" in French.', correctAnswer: "Aujourd'hui", hint: "It starts with A.", explanation: "Aujourd'hui means today, the current day." },
    ],
  }),
];
