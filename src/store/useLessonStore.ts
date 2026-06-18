import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type LessonProgressState = {
  /** IDs of lessons the user has fully completed. */
  completedLessons: string[];
  /** ID of the lesson currently in progress, or null. */
  inProgressLessonId: string | null;
  markCompleted: (id: string) => void;
  setInProgress: (id: string | null) => void;
  isCompleted: (id: string) => boolean;
};

export const useLessonStore = create<LessonProgressState>()(
  persist(
    (set, get) => ({
      // Mock initial state matching the design: first 2 lessons completed,
      // third lesson in progress. Lesson IDs use the fr-daily unit so the
      // French course shows a realistic lesson list out of the box.
      completedLessons: ["fr-daily-introductions", "fr-daily-life"],
      inProgressLessonId: "fr-daily-cafe",
      markCompleted: (id) =>
        set((state) => ({
          completedLessons: state.completedLessons.includes(id)
            ? state.completedLessons
            : [...state.completedLessons, id],
          inProgressLessonId:
            state.inProgressLessonId === id ? null : state.inProgressLessonId,
        })),
      setInProgress: (id) => set({ inProgressLessonId: id }),
      isCompleted: (id) => get().completedLessons.includes(id),
    }),
    {
      name: "lingua-lesson-progress",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
