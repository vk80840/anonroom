import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  useInAppKeyboard: boolean;
  setUseInAppKeyboard: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      useInAppKeyboard: false, // Default to normal keyboard
      setUseInAppKeyboard: (value) => set({ useInAppKeyboard: value }),
    }),
    {
      name: 'app-settings',
    }
  )
);
