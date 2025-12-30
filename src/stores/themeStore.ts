import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeColor = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'red';

interface ThemeState {
  theme: 'dark' | 'light';
  color: ThemeColor;
  setTheme: (theme: 'dark' | 'light') => void;
  setColor: (color: ThemeColor) => void;
}

export const themeColors: Record<ThemeColor, { primary: string; accent: string; name: string }> = {
  purple: { primary: '270 70% 60%', accent: '280 80% 70%', name: 'Purple' },
  blue: { primary: '210 90% 55%', accent: '200 80% 60%', name: 'Blue' },
  green: { primary: '150 70% 45%', accent: '140 60% 55%', name: 'Green' },
  orange: { primary: '25 90% 55%', accent: '35 80% 60%', name: 'Orange' },
  pink: { primary: '330 80% 60%', accent: '340 70% 70%', name: 'Pink' },
  red: { primary: '0 75% 55%', accent: '10 80% 60%', name: 'Red' },
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      color: 'purple',
      setTheme: (theme) => set({ theme }),
      setColor: (color) => set({ color }),
    }),
    {
      name: 'theme-settings',
    }
  )
);
