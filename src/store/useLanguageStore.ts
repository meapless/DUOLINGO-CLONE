import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { LanguageCode } from "@/types/learning";

type LanguageState = {
  /** The language the user is learning, or null if they haven't chosen yet. */
  selectedLanguage: LanguageCode | null;
  /** True once the persisted value has been loaded from AsyncStorage. */
  hasHydrated: boolean;
  setLanguage: (code: LanguageCode) => void;
  clearLanguage: () => void;
  setHasHydrated: (value: boolean) => void;
};

/**
 * Stores the user's selected language and persists it to AsyncStorage so the
 * choice survives app restarts. Routing in app/index.tsx reads this to decide
 * whether to send the user to the language picker or the home screen.
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      selectedLanguage: null,
      hasHydrated: false,
      setLanguage: (code) => set({ selectedLanguage: code }),
      clearLanguage: () => set({ selectedLanguage: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "lingua-selected-language",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the choice itself, not the transient hydration flag.
      partialize: (state) => ({ selectedLanguage: state.selectedLanguage }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
