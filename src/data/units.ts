import type { LanguageCode, Unit } from "@/types/learning";

/**
 * Units group lessons into a learning path. `lessonIds` reference lessons in
 * data/lessons.ts and define the order the user works through them.
 *
 * Naming convention for ids: "<lang>-<unit-slug>".
 */
export const units: Unit[] = [
  // ─── Spanish ───
  {
    id: "es-basics",
    languageCode: "es",
    order: 1,
    title: "Basics",
    description: "Greetings and your first numbers.",
    level: "beginner",
    lessonIds: ["es-basics-greetings", "es-basics-numbers"],
  },
  {
    id: "es-greetings",
    languageCode: "es",
    order: 2,
    title: "First Conversation",
    description: "Introduce yourself with your AI tutor.",
    level: "beginner",
    lessonIds: ["es-greetings-meet-tutor"],
  },
  {
    id: "es-daily",
    languageCode: "es",
    order: 3,
    title: "Daily Life",
    description: "Navigate everyday situations in Spanish.",
    level: "beginner",
    lessonIds: [
      "es-daily-introductions",
      "es-daily-life",
      "es-daily-cafe",
      "es-daily-travel",
      "es-daily-shopping",
      "es-daily-family",
    ],
  },

  // ─── French ───
  {
    id: "fr-basics",
    languageCode: "fr",
    order: 1,
    title: "Basics",
    description: "Your first French greetings.",
    level: "beginner",
    lessonIds: ["fr-basics-greetings"],
  },
  {
    id: "fr-daily",
    languageCode: "fr",
    order: 2,
    title: "Daily Life",
    description: "Navigate everyday situations in French.",
    level: "beginner",
    lessonIds: [
      "fr-daily-introductions",
      "fr-daily-life",
      "fr-daily-cafe",
      "fr-daily-travel",
      "fr-daily-shopping",
      "fr-daily-family",
    ],
  },

  // ─── German ───
  {
    id: "de-basics",
    languageCode: "de",
    order: 1,
    title: "Basics",
    description: "Your first German greetings.",
    level: "beginner",
    lessonIds: ["de-basics-greetings"],
  },
  {
    id: "de-daily",
    languageCode: "de",
    order: 2,
    title: "Daily Life",
    description: "Navigate everyday situations in German.",
    level: "beginner",
    lessonIds: [
      "de-daily-introductions",
      "de-daily-life",
      "de-daily-cafe",
      "de-daily-travel",
      "de-daily-shopping",
      "de-daily-family",
    ],
  },
];

/** Find a unit by its id. */
export function getUnit(id: string): Unit | undefined {
  return units.find((unit) => unit.id === id);
}

/** All units for a language, sorted by their display order. */
export function getUnitsByLanguage(code: LanguageCode): Unit[] {
  return units
    .filter((unit) => unit.languageCode === code)
    .sort((a, b) => a.order - b.order);
}
