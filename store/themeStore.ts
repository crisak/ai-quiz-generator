import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeStore {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: 'quiz-ia-theme',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
