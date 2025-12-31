import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const chatWallpapers = [
  { id: 'none', name: 'None', value: 'none' },
  { id: 'gradient-purple', name: 'Purple Haze', value: 'linear-gradient(135deg, hsl(270 50% 15%) 0%, hsl(280 40% 8%) 100%)' },
  { id: 'gradient-ocean', name: 'Ocean Depth', value: 'linear-gradient(180deg, hsl(200 60% 12%) 0%, hsl(220 50% 8%) 100%)' },
  { id: 'gradient-sunset', name: 'Sunset Glow', value: 'linear-gradient(135deg, hsl(20 50% 12%) 0%, hsl(340 40% 10%) 100%)' },
  { id: 'gradient-forest', name: 'Forest Night', value: 'linear-gradient(180deg, hsl(140 40% 10%) 0%, hsl(160 30% 6%) 100%)' },
  { id: 'gradient-cosmic', name: 'Cosmic', value: 'linear-gradient(135deg, hsl(260 60% 10%) 0%, hsl(300 50% 8%) 50%, hsl(200 50% 10%) 100%)' },
  { id: 'pattern-dots', name: 'Dots', value: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 1px, transparent 1px)', size: '20px 20px' },
  { id: 'pattern-grid', name: 'Grid', value: 'linear-gradient(hsl(var(--border) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.3) 1px, transparent 1px)', size: '24px 24px' },
];

interface SettingsState {
  useInAppKeyboard: boolean;
  chatWallpaper: string;
  chatWallpaperSize?: string;
  setUseInAppKeyboard: (value: boolean) => void;
  setChatWallpaper: (wallpaperId: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      useInAppKeyboard: false,
      chatWallpaper: 'none',
      chatWallpaperSize: undefined,
      setUseInAppKeyboard: (value) => set({ useInAppKeyboard: value }),
      setChatWallpaper: (wallpaperId) => {
        const wallpaper = chatWallpapers.find(w => w.id === wallpaperId);
        set({ 
          chatWallpaper: wallpaperId,
          chatWallpaperSize: wallpaper?.size
        });
      },
    }),
    {
      name: 'app-settings',
    }
  )
);
