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
