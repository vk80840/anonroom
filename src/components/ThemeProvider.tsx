import { useEffect } from 'react';
import { useThemeStore, themeColors } from '@/stores/themeStore';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme, color } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    
    // Set theme class
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Set color variables
    const colors = themeColors[color];
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--accent', colors.accent);
    
    // Update message colors based on primary
    root.style.setProperty('--message-own', `${colors.primary.split(' ')[0]} 30% 15%`);
    
  }, [theme, color]);

  return <>{children}</>;
};
