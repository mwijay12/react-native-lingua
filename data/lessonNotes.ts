import type { LessonNote } from "@/types/learning";

// Short context notes add a reason to use the words, not just a translation.
// New foundation lessons define their own longer explanations.
export const LESSON_NOTES: Record<string, LessonNote[]> = {
  "sw-lesson-1": [
    { title: "A greeting and a reply", body: "Habari can be a greeting or a question about how things are. Nzuri is a common positive reply; add asante to thank the person.", example: "Habari? → Nzuri, asante." },
  ],
  "sw-lesson-2": [
    { title: "Introduce yourself", body: "Use ninaitwa before your name and ninatoka before a place you come from. Replace the example name and place with your own.", example: "Ninaitwa Amina. Ninatoka Tanzania." },
  ],
  "sw-everyday-numbers": [
    { title: "Practise the sequence", body: "Say the numbers in order, then start from a different number. Number words can change form with some nouns; here you are learning to count on their own.", example: "Moja, mbili, tatu = one, two, three." },
  ],
  "sw-everyday-family": [
    { title: "Introducing people", body: "Huyu refers to this person in the example; ni links the person to the description. Yangu means my in these phrases.", example: "Huyu ni mama yangu. = This is my mother." },
  ],
  "sw-everyday-food": [
    { title: "Make a polite request", body: "Ningependa means I would like. Put the item you want after it, and add tafadhali for please.", example: "Ningependa maji, tafadhali. = I would like water, please." },
  ],
  "sw-everyday-conversation": [
    { title: "Ask for help", body: "Samahani can politely get someone's attention or express an apology. Wapi asks where; sielewi is useful when you need an explanation.", example: "Samahani, choo kiko wapi? = Excuse me, where is the toilet?" },
  ],
  "en-lesson-1": [
    { title: "Choose a greeting", body: "Good morning is used in the morning. Hello works at any time; goodbye is for leaving. Please and thank you make requests and replies more polite.", example: "Hello! How are you? → I'm fine, thank you." },
  ],
  "en-lesson-2": [
    { title: "Give your name and origin", body: "Use my name is before a name, and I am from before a place. Nice to meet you is a friendly response when you meet someone.", example: "My name is Amina. I am from Tanzania." },
  ],
  "en-everyday-numbers": [
    { title: "Count and identify", body: "Practise the numbers in order, then choose a number and spell it. The written word and numeral represent the same number.", example: "One, two, three = 1, 2, 3." },
  ],
  "en-everyday-family": [
    { title: "Introduce someone", body: "This is my introduces a person or group. My shows that you are talking about your own family.", example: "This is my mother. This is my family." },
  ],
  "en-everyday-food": [
    { title: "Make a polite request", body: "I would like is a polite way to ask for something. Put the food or drink after it and add please.", example: "I would like water, please." },
  ],
  "en-everyday-conversation": [
    { title: "Get attention and ask", body: "Excuse me is a polite way to get someone's attention. Where asks about a place, and I don't understand tells someone you need more help.", example: "Excuse me, where is the toilet?" },
  ],
  "fr-lesson-1": [
    { title: "Formal and informal greetings", body: "Bonjour is a general daytime greeting; bonsoir is used in the evening. Salut is informal. Comment allez-vous is a polite way to ask how someone is.", example: "Bonjour, comment allez-vous ? → Ça va bien, merci." },
  ],
  "fr-lesson-2": [
    { title: "Names and polite address", body: "Je m'appelle introduces your name. Vous is used when addressing someone politely or addressing more than one person.", example: "Comment vous appelez-vous ? → Je m'appelle Marie." },
  ],
  "fr-lesson-3": [
    { title: "Ask how many", body: "Combien asks how many or how much. Use il y en a before a number to say how many there are in this example.", example: "Combien ? → Il y en a cinq. = How many? → There are five." },
  ],
  "fr-lesson-4": [
    { title: "Describe a colour", body: "C'est means it is or this is. Colour adjectives can change to agree with a noun; these are the basic forms.", example: "De quelle couleur est-ce ? → C'est rouge." },
  ],
  "fr-lesson-5": [
    { title: "Order politely", body: "Je voudrais means I would like. S'il vous plaît adds please, and l'addition is the bill.", example: "Je voudrais un café, s'il vous plaît." },
  ],
  "fr-everyday-numbers": [
    { title: "Build on one to ten", body: "These five words continue the counting sequence from onze to quinze. Practise them in order and then out of order.", example: "Onze, douze, treize = eleven, twelve, thirteen." },
  ],
  "fr-everyday-family": [
    { title: "Articles and family", body: "French nouns have grammatical gender. Learn the article with the word: la mère and le père. Ma means my in these examples.", example: "C'est ma mère. = This is my mother." },
  ],
  "fr-everyday-food": [
    { title: "Ask for a drink", body: "Je voudrais is a polite way to say I would like. In these examples, de l'eau and du thé mean some water and some tea.", example: "Je voudrais de l'eau, s'il vous plaît." },
  ],
  "fr-everyday-conversation": [
    { title: "Get attention and ask", body: "Pardon can mean excuse me or sorry. Où asks where, and je ne comprends pas says that you do not understand.", example: "Pardon, où sont les toilettes ? = Excuse me, where are the toilets?" },
  ],
};
