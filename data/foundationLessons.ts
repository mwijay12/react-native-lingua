import { Lesson } from "@/types/learning";

// Foundation lessons explain a pattern before asking the learner to use it.
function foundationLesson(lesson: Omit<Lesson, "xpReward" | "goals" | "aiTeacherPrompt">): Lesson {
  return {
    ...lesson,
    xpReward: 15,
    goals: [
      { description: "Understand the language pattern", xpReward: 8 },
      { description: "Apply it in practice", xpReward: 7 },
    ],
    aiTeacherPrompt: {
      systemPrompt: "Local text practice only; AI teaching is not available in this version.",
      introMessage: "Read the explanation, then practise the pattern.",
      topics: [lesson.title],
    },
  };
}

export const FOUNDATION_LESSONS: Lesson[] = [
  foundationLesson({
    id: "sw-foundation-present", unitId: "sw-unit-3", title: "People and the present",
    description: "See how a Kiswahili verb tells you who is doing an action.", icon: "📖",
    notes: [
      { title: "A verb carries the subject", body: "For these examples, ni- means I, u- means you, and a- means he or she. The -na- part marks the present; -soma is the verb for read or study.", example: "ni + na + soma → ninasoma: I read / I am reading" },
      { title: "Pronouns are optional", body: "Mimi, wewe and yeye can make the subject clear or add emphasis, but the verb prefix already identifies the person.", example: "Wewe unasoma. = You are reading." },
    ],
    vocabulary: [
      { word: "Mimi", translation: "I / me", pronunciation: "MEE-mee" },
      { word: "Wewe", translation: "You (one person)", pronunciation: "WEH-weh" },
      { word: "Yeye", translation: "He / she", pronunciation: "YEH-yeh" },
      { word: "Ninasoma", translation: "I read / I am reading", pronunciation: "nee-nah-SOH-mah" },
      { word: "Unasoma", translation: "You read / you are reading", pronunciation: "oo-nah-SOH-mah" },
      { word: "Anasoma", translation: "He or she reads / is reading", pronunciation: "ah-nah-SOH-mah" },
    ],
    phrases: [
      { text: "Ninasoma kitabu.", translation: "I am reading a book.", pronunciation: "nee-nah-SOH-mah kee-TAH-boo" },
      { text: "Yeye anasoma.", translation: "He or she is reading.", pronunciation: "YEH-yeh ah-nah-SOH-mah" },
    ],
    activities: [
      { id: "sw-present-1", type: "multiple-choice", question: 'Which form means "I am reading"?', correctAnswer: "Ninasoma", options: ["Unasoma", "Anasoma", "Ninasoma", "Yeye"], explanation: "Ni- identifies I, and -na- marks the present." },
      { id: "sw-present-2", type: "multiple-choice", question: 'Complete: "Wewe ___" (You are reading).', correctAnswer: "unasoma", options: ["ninasoma", "unasoma", "anasoma", "mimi"], explanation: "The subject prefix u- goes with wewe (you)." },
      { id: "sw-present-3", type: "translate", question: 'Type the form for "He or she is reading".', correctAnswer: "Anasoma", hint: "It starts with A.", explanation: "A- identifies the person; -na- marks the present." },
      { id: "sw-present-4", type: "multiple-choice", question: 'In "ninasoma", what does -na- mark?', correctAnswer: "Present tense", options: ["A question", "Present tense", "A place", "Plural nouns"], explanation: "In these examples -na- marks the present." },
      { id: "sw-present-5", type: "multiple-choice", question: 'What does "Ninasoma kitabu" mean?', correctAnswer: "I am reading a book", options: ["I am reading a book", "You are reading a book", "I want water", "She is at home"], explanation: "Ninasoma means I am reading; kitabu is a book." },
    ],
  }),
  foundationLesson({
    id: "sw-foundation-questions", unitId: "sw-unit-3", title: "Asking useful questions",
    description: "Ask about a person, place or need in Kiswahili.", icon: "❓",
    notes: [
      { title: "Listen for the question word", body: "Nani asks who, nini asks what, and wapi asks where. In these examples the question word comes near the end of the sentence.", example: "Unaishi wapi? = Where do you live?" },
      { title: "Turn a question into an answer", body: "The question may address you with u-; a personal answer can begin with ni- for I.", example: "Unatoka wapi? → Ninatoka Tanzania." },
    ],
    vocabulary: [
      { word: "Nani?", translation: "Who?", pronunciation: "NAH-nee" },
      { word: "Nini?", translation: "What?", pronunciation: "NEE-nee" },
      { word: "Wapi?", translation: "Where?", pronunciation: "WAH-pee" },
      { word: "Unaishi wapi?", translation: "Where do you live?", pronunciation: "oo-nah-EE-shee WAH-pee" },
      { word: "Unaweza kunisaidia?", translation: "Can you help me?", pronunciation: "oo-nah-WEH-zah koo-nee-sah-ee-DEE-ah" },
    ],
    phrases: [
      { text: "Unatoka wapi?", translation: "Where are you from?", pronunciation: "oo-nah-TOH-kah WAH-pee" },
      { text: "Ninatoka Tanzania.", translation: "I am from Tanzania.", pronunciation: "nee-nah-TOH-kah tan-zah-NEE-ah" },
      { text: "Ninaishi Dar es Salaam.", translation: "I live in Dar es Salaam.", pronunciation: "nee-nah-EE-shee dar es sah-LAAM" },
    ],
    activities: [
      { id: "sw-questions-1", type: "multiple-choice", question: 'Which question asks "Where do you live?"', correctAnswer: "Unaishi wapi?", options: ["Unaishi wapi?", "Unatoka wapi?", "Unataka nini?", "Unaitwa nani?"], explanation: "Unaishi is you live, and wapi asks where." },
      { id: "sw-questions-2", type: "multiple-choice", question: 'What does "Unatoka wapi?" ask?', correctAnswer: "Where are you from?", options: ["What is your name?", "Where are you from?", "Can you help me?", "What do you want?"], explanation: "-toka means come from, and wapi asks where." },
      { id: "sw-questions-3", type: "translate", question: 'Type the question word for "What?"', correctAnswer: "Nini", hint: "It starts with N.", explanation: "Nini asks what; nani asks who." },
      { id: "sw-questions-4", type: "multiple-choice", question: 'Which reply tells someone where you live?', correctAnswer: "Ninaishi Dar es Salaam.", options: ["Ninatoka Tanzania.", "Ninaishi Dar es Salaam.", "Asante.", "Unatoka wapi?"], explanation: "Ninaishi means I live." },
      { id: "sw-questions-5", type: "multiple-choice", question: 'Which question asks for help?', correctAnswer: "Unaweza kunisaidia?", options: ["Unaweza kunisaidia?", "Unaishi wapi?", "Unaitwa nani?", "Unatoka wapi?"], explanation: "Unaweza kunisaidia? means Can you help me?" },
    ],
  }),

  foundationLesson({
    id: "en-foundation-be", unitId: "en-unit-3", title: "I am, you are, she is",
    description: "Choose the right form of the verb ‘be’ for the subject.", icon: "📖",
    notes: [
      { title: "Match the subject", body: "Use am with I; is with he, she and it; and are with you, we and they.", example: "I am ready. She is here. They are at home." },
      { title: "Short forms are common", body: "In everyday English, I am can become I'm, she is can become she's, and they are can become they're. Both full and short forms are correct.", example: "I am ready. = I'm ready." },
    ],
    vocabulary: [
      { word: "I am", translation: "Use with I", pronunciation: "eye am" },
      { word: "You are", translation: "Use with you", pronunciation: "yoo ar" },
      { word: "She is", translation: "Use with she", pronunciation: "shee iz" },
      { word: "He is", translation: "Use with he", pronunciation: "hee iz" },
      { word: "We are", translation: "Use with we", pronunciation: "wee ar" },
      { word: "They are", translation: "Use with they", pronunciation: "thay ar" },
    ],
    phrases: [
      { text: "I am a student.", translation: "A statement about yourself.", pronunciation: "eye am uh STOO-dent" },
      { text: "She is at home.", translation: "A statement about where she is.", pronunciation: "shee iz at hohm" },
      { text: "They are ready.", translation: "A statement about a group.", pronunciation: "thay ar RED-ee" },
    ],
    activities: [
      { id: "en-be-1", type: "multiple-choice", question: 'Complete: "She ___ at home."', correctAnswer: "is", options: ["am", "are", "is", "be"], explanation: "Use is with she, he and it." },
      { id: "en-be-2", type: "multiple-choice", question: 'Complete: "They ___ ready."', correctAnswer: "are", options: ["is", "are", "am", "be"], explanation: "Use are with they, we and you." },
      { id: "en-be-3", type: "translate", question: 'Type the missing word: "I ___ a student."', correctAnswer: "am", hint: "Two letters, starting with a.", explanation: "I goes with am." },
      { id: "en-be-4", type: "multiple-choice", question: 'Which sentence is correct?', correctAnswer: "He is here.", options: ["He am here.", "He are here.", "He is here.", "He be here."], explanation: "Use is with he." },
      { id: "en-be-5", type: "multiple-choice", question: 'What is a short form of "I am"?', correctAnswer: "I'm", options: ["He's", "I'm", "They're", "You're"], explanation: "I'm is the contraction of I am." },
    ],
  }),
  foundationLesson({
    id: "en-foundation-present", unitId: "en-unit-3", title: "Present simple habits",
    description: "Describe regular actions and ask a simple question.", icon: "⏱️",
    notes: [
      { title: "Talk about routines", body: "Use the present simple for habits and regular actions. With he, she or it, many verbs add -s.", example: "I work every day. She works every day." },
      { title: "Questions with does", body: "For a he or she question, use does followed by the base verb, without -s. The same applies after does not.", example: "Does she work? She does not work on Sunday." },
    ],
    vocabulary: [
      { word: "I work", translation: "A regular action by me", pronunciation: "eye werk" },
      { word: "You work", translation: "A regular action by you", pronunciation: "yoo werk" },
      { word: "She works", translation: "A regular action by her", pronunciation: "shee werks" },
      { word: "They work", translation: "A regular action by them", pronunciation: "thay werk" },
      { word: "Does she work?", translation: "A question about her routine", pronunciation: "duhz shee werk" },
    ],
    phrases: [
      { text: "She works in a shop.", translation: "A statement about her regular work.", pronunciation: "shee werks in uh shop" },
      { text: "Does she work on Sunday?", translation: "A question about her routine.", pronunciation: "duhz shee werk on SUN-day" },
      { text: "She does not work on Sunday.", translation: "A negative statement about her routine.", pronunciation: "shee duhz not werk on SUN-day" },
    ],
    activities: [
      { id: "en-present-1", type: "multiple-choice", question: 'Complete: "She ___ in a shop."', correctAnswer: "works", options: ["work", "works", "working", "are"], explanation: "With she in a positive present-simple sentence, work becomes works." },
      { id: "en-present-2", type: "multiple-choice", question: 'Complete: "They ___ every day."', correctAnswer: "work", options: ["works", "is", "work", "does"], explanation: "Use the base form work with they." },
      { id: "en-present-3", type: "translate", question: 'Type the missing verb: "Does she ___ here?"', correctAnswer: "work", hint: "Use the base form, without -s.", explanation: "After does, use the base verb work." },
      { id: "en-present-4", type: "multiple-choice", question: 'Which question is correct?', correctAnswer: "Does she work?", options: ["Does she works?", "Does she work?", "She does works?", "Is she work?"], explanation: "Does carries the question; the main verb stays in its base form." },
      { id: "en-present-5", type: "multiple-choice", question: 'What is the present simple useful for here?', correctAnswer: "Regular actions", options: ["Regular actions", "A person's name", "A colour", "A number"], explanation: "Use it for habits and routines, such as working every day." },
    ],
  }),

  foundationLesson({
    id: "fr-foundation-etre", unitId: "fr-unit-3", title: "People and être",
    description: "Use the French verb être to say who or where someone is.", icon: "📖",
    notes: [
      { title: "One verb, several forms", body: "Être means to be. Its form changes with the subject: je suis, tu es, il or elle est, nous sommes, vous êtes, ils or elles sont.", example: "Je suis ici. = I am here. Nous sommes ici. = We are here." },
      { title: "Choosing tu or vous", body: "Tu addresses one person informally. Vous addresses one person politely or more than one person; both use êtes.", example: "Vous êtes ici. = You are here." },
    ],
    vocabulary: [
      { word: "Je suis", translation: "I am", pronunciation: "zhuh swee" },
      { word: "Tu es", translation: "You are (informal, singular)", pronunciation: "too eh" },
      { word: "Il est / Elle est", translation: "He is / She is", pronunciation: "eel eh / el eh" },
      { word: "Nous sommes", translation: "We are", pronunciation: "noo som" },
      { word: "Vous êtes", translation: "You are (polite or plural)", pronunciation: "voo zet" },
      { word: "Ils sont / Elles sont", translation: "They are", pronunciation: "eel sohn / el sohn" },
    ],
    phrases: [
      { text: "Je suis à la maison.", translation: "I am at home.", pronunciation: "zhuh swee ah lah meh-ZOHN" },
      { text: "Nous sommes ici.", translation: "We are here.", pronunciation: "noo som ee-SEE" },
      { text: "Vous êtes ici.", translation: "You are here.", pronunciation: "voo zet ee-SEE" },
    ],
    activities: [
      { id: "fr-etre-1", type: "multiple-choice", question: 'Which phrase means "We are"?', correctAnswer: "Nous sommes", options: ["Je suis", "Tu es", "Nous sommes", "Vous êtes"], explanation: "Nous means we, and sommes is its form of être." },
      { id: "fr-etre-2", type: "multiple-choice", question: 'Complete: "Ils ___ ici."', correctAnswer: "sont", options: ["suis", "sont", "es", "sommes"], explanation: "Ils and elles go with sont." },
      { id: "fr-etre-3", type: "translate", question: 'Type the missing word: "Je ___ ici."', correctAnswer: "suis", hint: "It starts with s.", explanation: "Je goes with suis: je suis means I am." },
      { id: "fr-etre-4", type: "multiple-choice", question: 'Which form can politely address one person?', correctAnswer: "Vous êtes", options: ["Tu es", "Vous êtes", "Ils sont", "Nous sommes"], explanation: "Vous is used for polite singular or plural you." },
      { id: "fr-etre-5", type: "multiple-choice", question: 'Complete: "Tu ___ ici."', correctAnswer: "es", options: ["est", "suis", "es", "sont"], explanation: "Tu goes with es." },
    ],
  }),
  foundationLesson({
    id: "fr-foundation-articles", unitId: "fr-unit-3", title: "Nouns and articles",
    description: "Use a and the with familiar French nouns.", icon: "📚",
    notes: [
      { title: "Learn the article with the noun", body: "French nouns have grammatical gender. For singular nouns, un and le are masculine; une and la are feminine. Learn each noun with its article.", example: "un livre / le livre = a book / the book; une table / la table = a table / the table" },
      { title: "Plural and vowels", body: "Les means the for plural nouns. Before a vowel or silent h, le or la usually becomes l'. Many written plurals add -s, often silent.", example: "les livres = the books; l'eau = the water" },
    ],
    vocabulary: [
      { word: "Un livre", translation: "A book", pronunciation: "uhn leevr" },
      { word: "Une table", translation: "A table", pronunciation: "oon tahbl" },
      { word: "Le livre", translation: "The book", pronunciation: "luh leevr" },
      { word: "La table", translation: "The table", pronunciation: "lah tahbl" },
      { word: "Les livres", translation: "The books", pronunciation: "lay leevr" },
      { word: "L'eau", translation: "The water / water", pronunciation: "loh" },
    ],
    phrases: [
      { text: "Il y a un livre.", translation: "There is a book.", pronunciation: "eel ee ah uhn leevr" },
      { text: "La table est ici.", translation: "The table is here.", pronunciation: "lah tahbl eh ee-SEE" },
    ],
    activities: [
      { id: "fr-articles-1", type: "multiple-choice", question: 'Complete "___ table" for "a table".', correctAnswer: "une", options: ["un", "une", "le", "les"], explanation: "Table is feminine, so a table is une table." },
      { id: "fr-articles-2", type: "multiple-choice", question: 'Which phrase means "the books"?', correctAnswer: "les livres", options: ["le livre", "une table", "les livres", "un livre"], explanation: "Les is the definite article for plural nouns." },
      { id: "fr-articles-3", type: "translate", question: 'Type the article for "the book": "___ livre".', correctAnswer: "le", hint: "Two letters, starting with l.", explanation: "Livre is masculine: le livre." },
      { id: "fr-articles-4", type: "multiple-choice", question: 'Why is it "l\'eau" rather than "la eau"?', correctAnswer: "The article shortens before a vowel", options: ["The article shortens before a vowel", "Eau is plural", "There is no article", "Eau is a verb"], explanation: "La becomes l' before the vowel in eau." },
      { id: "fr-articles-5", type: "multiple-choice", question: 'What does "Il y a un livre" mean?', correctAnswer: "There is a book", options: ["There is a table", "There is a book", "The books are here", "I am at home"], explanation: "Il y a means there is or there are; un livre means a book." },
    ],
  }),
];
