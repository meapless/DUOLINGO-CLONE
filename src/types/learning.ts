/**
 * Learning content types.
 *
 * These describe the hardcoded curriculum that powers the app:
 * languages -> units -> lessons -> activities. Everything is typed so the
 * data files stay safe to edit and easy to extend with new content.
 */

/** Languages the app can teach. Add a code here to support a new language. */
export type LanguageCode = "es" | "fr" | "ja" | "ko" | "de" | "zh";

/** Difficulty level for a unit or lesson. */
export type Level = "beginner" | "intermediate" | "advanced";

/** A language the user can choose to learn. */
export interface Language {
  code: LanguageCode;
  /** English name, e.g. "Spanish". */
  name: string;
  /** Name in the language itself, e.g. "Español". */
  nativeName: string;
  /** Flag image URL shown in the language picker. */
  flag: string;
  /** Short, friendly description shown on the language card. */
  description: string;
  /** Display-ready learner count for the picker, e.g. "28.4M". */
  learners: string;
  /** Whether the content is ready. Lets us list "coming soon" languages. */
  available: boolean;
}

/** A single word the user learns and reviews. */
export interface Vocabulary {
  id: string;
  /** The word in the language being learned. */
  word: string;
  /** English translation. */
  translation: string;
  /** Simple phonetic hint, e.g. "OH-lah". */
  pronunciation?: string;
  /** Example sentence using the word. */
  example?: string;
}

/** A short, useful phrase (greetings, ordering food, etc.). */
export interface Phrase {
  id: string;
  /** The phrase in the language being learned. */
  text: string;
  /** English translation. */
  translation: string;
  /** Simple phonetic hint. */
  pronunciation?: string;
}

/** All supported interactive activity kinds. */
export type ActivityType =
  | "multipleChoice"
  | "translate"
  | "match"
  | "listen";

interface BaseActivity {
  id: string;
  type: ActivityType;
}

/** Pick the correct answer from a list of options. */
export interface MultipleChoiceActivity extends BaseActivity {
  type: "multipleChoice";
  prompt: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  correctIndex: number;
  explanation?: string;
}

/** Type the translation of the given text. */
export interface TranslateActivity extends BaseActivity {
  type: "translate";
  prompt: string;
  /** Accepted answer. */
  answer: string;
  hint?: string;
}

/** Match words on the left to their translations on the right. */
export interface MatchActivity extends BaseActivity {
  type: "match";
  pairs: { left: string; right: string }[];
}

/** Listen to spoken text, then choose or type what was said. */
export interface ListenActivity extends BaseActivity {
  type: "listen";
  /** Text that gets spoken aloud (TTS for now). */
  audioText: string;
  answer: string;
  options?: string[];
}

/** Any interactive question inside a lesson. */
export type Activity =
  | MultipleChoiceActivity
  | TranslateActivity
  | MatchActivity
  | ListenActivity;

/**
 * Instructions for the AI teacher in future audio-based Vision Agent lessons.
 * Not used by interactive lessons yet — kept here so content authors can write
 * the teaching prompt alongside the rest of the lesson.
 */
export interface AITeacherPrompt {
  /** System prompt describing who the AI teacher is and how it should behave. */
  persona: string;
  /** What the learner should be able to do by the end of the conversation. */
  objective: string;
  /** Opening lines the teacher can use to start the conversation. */
  conversationStarters: string[];
  /** Vocabulary ids (from the lesson) the teacher should focus on. */
  focusVocabularyIds: string[];
}

/** What kind of lesson this is, used to pick the right screen/flow. */
export type LessonType = "vocabulary" | "phrases" | "practice" | "aiTeacher";

/** A single lesson the user completes to earn XP. */
export interface Lesson {
  id: string;
  /** Unit this lesson belongs to. */
  unitId: string;
  title: string;
  description: string;
  type: LessonType;
  /** XP awarded on completion. */
  xpReward: number;
  /** Plain-language goals shown to the learner before starting. */
  goals: string[];
  vocabulary: Vocabulary[];
  phrases: Phrase[];
  activities: Activity[];
  /** Thumbnail image URI shown on the lesson card. */
  image?: string;
  /** Present on AI teacher lessons (audio Vision Agent). */
  aiTeacherPrompt?: AITeacherPrompt;
}

/** A themed group of lessons (e.g. "Basics", "Greetings"). */
export interface Unit {
  id: string;
  languageCode: LanguageCode;
  /** Display order within the language. */
  order: number;
  title: string;
  description: string;
  level: Level;
  /** Lesson ids in the order they should be completed. */
  lessonIds: string[];
}
