import type { LanguageCode, Lesson } from "@/types/learning";

/**
 * Sample beginner lessons. Each lesson belongs to a unit (see data/units.ts)
 * via `unitId`. Keep ids stable — progress/XP will reference them later.
 *
 * Naming convention for ids: "<lang>-<unit-slug>-<lesson-slug>".
 */
export const lessons: Lesson[] = [
  // ────────────────────────────── Spanish ──────────────────────────────
  {
    id: "es-basics-greetings",
    unitId: "es-basics",
    title: "Greetings",
    description: "Say hello and goodbye like a local.",
    type: "vocabulary",
    xpReward: 10,
    goals: ["Greet someone", "Say goodbye", "Ask how someone is"],
    vocabulary: [
      {
        id: "es-vocab-hola",
        word: "Hola",
        translation: "Hello",
        pronunciation: "OH-lah",
        example: "¡Hola! ¿Cómo estás?",
      },
      {
        id: "es-vocab-adios",
        word: "Adiós",
        translation: "Goodbye",
        pronunciation: "ah-DYOHS",
        example: "Adiós, hasta mañana.",
      },
      {
        id: "es-vocab-gracias",
        word: "Gracias",
        translation: "Thank you",
        pronunciation: "GRAH-syahs",
        example: "Gracias por tu ayuda.",
      },
    ],
    phrases: [
      {
        id: "es-phrase-como-estas",
        text: "¿Cómo estás?",
        translation: "How are you?",
        pronunciation: "KOH-moh ehs-TAHS",
      },
      {
        id: "es-phrase-buenos-dias",
        text: "Buenos días",
        translation: "Good morning",
        pronunciation: "BWEH-nohs DEE-ahs",
      },
    ],
    activities: [
      {
        id: "es-basics-greetings-a1",
        type: "multipleChoice",
        prompt: 'How do you say "Hello" in Spanish?',
        options: ["Adiós", "Hola", "Gracias", "Buenos días"],
        correctIndex: 1,
        explanation: '"Hola" is the most common greeting in Spanish.',
      },
      {
        id: "es-basics-greetings-a2",
        type: "translate",
        prompt: "Thank you",
        answer: "Gracias",
        hint: "Starts with the letter G.",
      },
      {
        id: "es-basics-greetings-a3",
        type: "match",
        pairs: [
          { left: "Hola", right: "Hello" },
          { left: "Adiós", right: "Goodbye" },
          { left: "Gracias", right: "Thank you" },
        ],
      },
    ],
  },
  {
    id: "es-basics-numbers",
    unitId: "es-basics",
    title: "Numbers 1–5",
    description: "Count from one to five.",
    type: "vocabulary",
    xpReward: 10,
    goals: ["Count from 1 to 5", "Recognize written numbers"],
    vocabulary: [
      { id: "es-vocab-uno", word: "Uno", translation: "One", pronunciation: "OO-noh" },
      { id: "es-vocab-dos", word: "Dos", translation: "Two", pronunciation: "dohs" },
      { id: "es-vocab-tres", word: "Tres", translation: "Three", pronunciation: "trehs" },
      { id: "es-vocab-cuatro", word: "Cuatro", translation: "Four", pronunciation: "KWAH-troh" },
      { id: "es-vocab-cinco", word: "Cinco", translation: "Five", pronunciation: "SEEN-koh" },
    ],
    phrases: [],
    activities: [
      {
        id: "es-basics-numbers-a1",
        type: "multipleChoice",
        prompt: 'Which word means "Three"?',
        options: ["Dos", "Cinco", "Tres", "Uno"],
        correctIndex: 2,
      },
      {
        id: "es-basics-numbers-a2",
        type: "listen",
        audioText: "Cuatro",
        answer: "Four",
        options: ["Two", "Four", "Five", "One"],
      },
    ],
  },
  {
    id: "es-greetings-meet-tutor",
    unitId: "es-greetings",
    title: "Meet your AI tutor",
    description: "Practice a short greeting conversation out loud.",
    type: "aiTeacher",
    xpReward: 20,
    goals: ["Introduce yourself", "Respond to a greeting", "Say where you are from"],
    vocabulary: [
      {
        id: "es-vocab-me-llamo",
        word: "Me llamo",
        translation: "My name is",
        pronunciation: "meh YAH-moh",
        example: "Me llamo Ana.",
      },
      {
        id: "es-vocab-soy-de",
        word: "Soy de",
        translation: "I am from",
        pronunciation: "soy deh",
        example: "Soy de México.",
      },
    ],
    phrases: [
      {
        id: "es-phrase-mucho-gusto",
        text: "Mucho gusto",
        translation: "Nice to meet you",
        pronunciation: "MOO-choh GOOS-toh",
      },
    ],
    activities: [],
    aiTeacherPrompt: {
      persona:
        "You are a warm, patient Spanish tutor for absolute beginners. Speak slowly, use simple words, and gently correct mistakes with encouragement.",
      objective:
        "Help the learner introduce themselves in Spanish and respond to a basic greeting.",
      conversationStarters: ["¡Hola! ¿Cómo te llamas?", "Mucho gusto. ¿De dónde eres?"],
      focusVocabularyIds: ["es-vocab-me-llamo", "es-vocab-soy-de"],
    },
  },

  // ────────────────────────────── French ───────────────────────────────
  {
    id: "fr-basics-greetings",
    unitId: "fr-basics",
    title: "Greetings",
    description: "Your first French words.",
    type: "vocabulary",
    xpReward: 10,
    goals: ["Greet someone", "Say thank you", "Say goodbye"],
    vocabulary: [
      {
        id: "fr-vocab-bonjour",
        word: "Bonjour",
        translation: "Hello / Good day",
        pronunciation: "bohn-ZHOOR",
        example: "Bonjour, ça va ?",
      },
      {
        id: "fr-vocab-merci",
        word: "Merci",
        translation: "Thank you",
        pronunciation: "mehr-SEE",
      },
      {
        id: "fr-vocab-au-revoir",
        word: "Au revoir",
        translation: "Goodbye",
        pronunciation: "oh ruh-VWAR",
      },
    ],
    phrases: [
      {
        id: "fr-phrase-ca-va",
        text: "Ça va ?",
        translation: "How's it going?",
        pronunciation: "sah VAH",
      },
    ],
    activities: [
      {
        id: "fr-basics-greetings-a1",
        type: "multipleChoice",
        prompt: 'How do you say "Thank you" in French?',
        options: ["Bonjour", "Au revoir", "Merci", "Ça va"],
        correctIndex: 2,
      },
      {
        id: "fr-basics-greetings-a2",
        type: "translate",
        prompt: "Hello",
        answer: "Bonjour",
      },
    ],
  },

  // ────────────────────────────── German ───────────────────────────────
  {
    id: "de-basics-greetings",
    unitId: "de-basics",
    title: "Greetings",
    description: "Start speaking German today.",
    type: "vocabulary",
    xpReward: 10,
    goals: ["Greet someone", "Say thank you", "Say goodbye"],
    vocabulary: [
      {
        id: "de-vocab-hallo",
        word: "Hallo",
        translation: "Hello",
        pronunciation: "HAH-loh",
      },
      {
        id: "de-vocab-danke",
        word: "Danke",
        translation: "Thank you",
        pronunciation: "DAHN-kuh",
      },
      {
        id: "de-vocab-tschuss",
        word: "Tschüss",
        translation: "Bye",
        pronunciation: "chooss",
      },
    ],
    phrases: [
      {
        id: "de-phrase-wie-gehts",
        text: "Wie geht's?",
        translation: "How are you?",
        pronunciation: "vee gayts",
      },
    ],
    activities: [
      {
        id: "de-basics-greetings-a1",
        type: "multipleChoice",
        prompt: 'How do you say "Hello" in German?',
        options: ["Danke", "Hallo", "Tschüss", "Wie geht's"],
        correctIndex: 1,
      },
      {
        id: "de-basics-greetings-a2",
        type: "match",
        pairs: [
          { left: "Hallo", right: "Hello" },
          { left: "Danke", right: "Thank you" },
          { left: "Tschüss", right: "Bye" },
        ],
      },
    ],
  },
];

/** Find a lesson by its id. */
export function getLesson(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

/** All lessons in a unit, in their stored order. */
export function getLessonsByUnit(unitId: string): Lesson[] {
  return lessons.filter((lesson) => lesson.unitId === unitId);
}

/** All lessons for a language. */
export function getLessonsByLanguage(code: LanguageCode): Lesson[] {
  return lessons.filter((lesson) => lesson.id.startsWith(`${code}-`));
}
