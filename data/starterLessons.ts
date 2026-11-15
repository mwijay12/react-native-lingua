import { Lesson } from "@/types/learning";

// Small starter courses. French lessons remain in lessons.ts.
export const STARTER_LESSONS: Lesson[] = [
  {
    id: "sw-lesson-1",
    unitId: "sw-unit-1",
    title: "Kiswahili Greetings",
    description: "Learn useful Kiswahili greetings and polite words.",
    icon: "👋",
    xpReward: 10,
    goals: [
      { description: "Learn five everyday words", xpReward: 5 },
      { description: "Complete the practice questions", xpReward: 5 },
    ],
    vocabulary: [
      { word: "Habari", translation: "Hello / How are things?", pronunciation: "hah-BAH-ree" },
      { word: "Nzuri", translation: "Good / fine", pronunciation: "n-ZOO-ree" },
      { word: "Asante", translation: "Thank you", pronunciation: "ah-SAHN-teh" },
      { word: "Tafadhali", translation: "Please", pronunciation: "tah-fah-DHAH-lee" },
      { word: "Kwaheri", translation: "Goodbye", pronunciation: "kwah-HEH-ree" },
    ],
    phrases: [
      { text: "Habari?", translation: "Hello / How are things?", pronunciation: "hah-BAH-ree" },
      { text: "Nzuri, asante.", translation: "Fine, thank you.", pronunciation: "n-ZOO-ree ah-SAHN-teh" },
      { text: "Kwaheri!", translation: "Goodbye!", pronunciation: "kwah-HEH-ree" },
    ],
    activities: [
      {
        id: "sw-lesson-1-act-1", type: "multiple-choice",
        question: 'What does "Asante" mean?', correctAnswer: "Thank you",
        options: ["Goodbye", "Thank you", "Please", "Good morning"],
      },
      {
        id: "sw-lesson-1-act-2", type: "multiple-choice",
        question: 'Which word means "Goodbye"?', correctAnswer: "Kwaheri",
        options: ["Habari", "Nzuri", "Kwaheri", "Asante"],
      },
      {
        id: "sw-lesson-1-act-3", type: "translate",
        question: 'Type "Thank you" in Kiswahili.', correctAnswer: "Asante",
        hint: "It starts with A.",
      },
    ],
    aiTeacherPrompt: {
      systemPrompt: "Help the learner practise basic Kiswahili greetings, one phrase at a time.",
      introMessage: "Habari! Let's practise a few Kiswahili greetings.",
      topics: ["greetings", "polite words"],
    },
  },
  {
    id: "sw-lesson-2",
    unitId: "sw-unit-1",
    title: "Kiswahili Introductions",
    description: "Say your name and where you are from in Kiswahili.",
    icon: "🙋",
    xpReward: 10,
    goals: [
      { description: "Introduce yourself", xpReward: 5 },
      { description: "Complete the practice questions", xpReward: 5 },
    ],
    vocabulary: [
      { word: "Ninaitwa", translation: "My name is", pronunciation: "nee-nah-EET-wah" },
      { word: "Jina", translation: "Name", pronunciation: "JEE-nah" },
      { word: "Ninatoka", translation: "I come from", pronunciation: "nee-nah-TOH-kah" },
      { word: "Nimefurahi kukutana nawe", translation: "Nice to meet you", pronunciation: "nee-meh-foo-RAH-hee koo-koo-TAH-nah NAH-weh" },
    ],
    phrases: [
      { text: "Ninaitwa Amina.", translation: "My name is Amina.", pronunciation: "nee-nah-EET-wah ah-MEE-nah" },
      { text: "Ninatoka Tanzania.", translation: "I come from Tanzania.", pronunciation: "nee-nah-TOH-kah tan-zah-NEE-ah" },
    ],
    activities: [
      {
        id: "sw-lesson-2-act-1", type: "multiple-choice",
        question: 'Which word means "My name is"?', correctAnswer: "Ninaitwa",
        options: ["Ninatoka", "Ninaitwa", "Jina", "Asante"],
      },
      {
        id: "sw-lesson-2-act-2", type: "multiple-choice",
        question: 'What does "Ninatoka" mean?', correctAnswer: "I come from",
        options: ["Thank you", "My name is", "I come from", "Goodbye"],
      },
      {
        id: "sw-lesson-2-act-3", type: "translate",
        question: 'Type "Name" in Kiswahili.', correctAnswer: "Jina",
        hint: "It starts with J.",
      },
    ],
    aiTeacherPrompt: {
      systemPrompt: "Help the learner practise simple introductions in Kiswahili, one phrase at a time.",
      introMessage: "Let's practise introducing ourselves in Kiswahili.",
      topics: ["names", "introductions"],
    },
  },
  {
    id: "en-lesson-1",
    unitId: "en-unit-1",
    title: "English Greetings",
    description: "Practise simple English greetings and polite words.",
    icon: "👋",
    xpReward: 10,
    goals: [
      { description: "Learn five everyday expressions", xpReward: 5 },
      { description: "Complete the practice questions", xpReward: 5 },
    ],
    vocabulary: [
      { word: "Hello", translation: "A friendly greeting", pronunciation: "heh-LOH" },
      { word: "Good morning", translation: "A greeting used in the morning", pronunciation: "good MOR-ning" },
      { word: "Please", translation: "A polite word for a request", pronunciation: "pleez" },
      { word: "Thank you", translation: "Words used to show gratitude", pronunciation: "thank yoo" },
      { word: "Goodbye", translation: "A word used when leaving", pronunciation: "good-BYE" },
    ],
    phrases: [
      { text: "Hello! How are you?", translation: "A greeting and a question about someone.", pronunciation: "heh-LOH how ar yoo" },
      { text: "I'm fine, thank you.", translation: "A polite answer to a greeting.", pronunciation: "aim fyn thank yoo" },
    ],
    activities: [
      {
        id: "en-lesson-1-act-1", type: "multiple-choice",
        question: "Which greeting is used in the morning?", correctAnswer: "Good morning",
        options: ["Goodbye", "Please", "Good morning", "Thank you"],
      },
      {
        id: "en-lesson-1-act-2", type: "multiple-choice",
        question: "What can you say to thank someone?", correctAnswer: "Thank you",
        options: ["Hello", "Thank you", "Goodbye", "Please"],
      },
      {
        id: "en-lesson-1-act-3", type: "translate",
        question: "Type the polite word used in a request.", correctAnswer: "Please",
        hint: "It starts with P.",
      },
    ],
    aiTeacherPrompt: {
      systemPrompt: "Help the learner practise simple English greetings and polite words.",
      introMessage: "Hello! Let's practise some everyday English.",
      topics: ["greetings", "polite words"],
    },
  },
  {
    id: "en-lesson-2",
    unitId: "en-unit-1",
    title: "English Introductions",
    description: "Practise introducing yourself in English.",
    icon: "🙋",
    xpReward: 10,
    goals: [
      { description: "Introduce yourself", xpReward: 5 },
      { description: "Complete the practice questions", xpReward: 5 },
    ],
    vocabulary: [
      { word: "My name is", translation: "A way to say your name", pronunciation: "my naym iz" },
      { word: "I am", translation: "Words used to describe yourself", pronunciation: "eye am" },
      { word: "I am from", translation: "Words used to say where you come from", pronunciation: "eye am from" },
      { word: "Nice to meet you", translation: "A polite greeting when meeting someone", pronunciation: "nys too meet yoo" },
    ],
    phrases: [
      { text: "My name is Amina.", translation: "A way to introduce your name.", pronunciation: "my naym iz ah-MEE-nah" },
      { text: "I am from Tanzania.", translation: "A way to say where you come from.", pronunciation: "eye am from tan-zah-NEE-ah" },
    ],
    activities: [
      {
        id: "en-lesson-2-act-1", type: "multiple-choice",
        question: "Which phrase introduces your name?", correctAnswer: "My name is",
        options: ["My name is", "Thank you", "Goodbye", "Please"],
      },
      {
        id: "en-lesson-2-act-2", type: "multiple-choice",
        question: "Which phrase says where you come from?", correctAnswer: "I am from",
        options: ["Nice to meet you", "I am from", "Good morning", "My name is"],
      },
      {
        id: "en-lesson-2-act-3", type: "translate",
        question: "Type the polite phrase used when meeting someone.", correctAnswer: "Nice to meet you",
        hint: "It starts with Nice.",
      },
    ],
    aiTeacherPrompt: {
      systemPrompt: "Help the learner practise introducing themselves in simple English.",
      introMessage: "Let's practise introducing ourselves in English.",
      topics: ["names", "introductions"],
    },
  },
];
