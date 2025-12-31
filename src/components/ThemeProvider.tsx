import { useEffect } from 'react';
import { useThemeStore, themeColors } from '@/stores/themeStore';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme, color } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    
    // Set theme class
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Set color variables based on theme
    const colors = themeColors[color];
    const primaryValue = theme === 'light' ? colors.primaryLight : colors.primary;
    const accentValue = theme === 'light' ? colors.accentLight : colors.accent;
    
    root.style.setProperty('--primary', primaryValue);
    root.style.setProperty('--accent', accentValue);
    root.style.setProperty('--ring', primaryValue);
    
    // Update glow effects
    root.style.setProperty('--glow-primary', `0 0 20px hsl(${primaryValue} / 0.3)`);
    root.style.setProperty('--glow-accent', `0 0 20px hsl(${accentValue} / 0.3)`);
    
    // Update message colors based on primary and theme
    if (theme === 'light') {
      root.style.setProperty('--message-own', `${primaryValue.split(' ')[0]} 30% 95%`);
    } else {
      root.style.setProperty('--message-own', `${primaryValue.split(' ')[0]} 30% 15%`);
    }
    
  }, [theme, color]);

  return <>{children}</>;
};
