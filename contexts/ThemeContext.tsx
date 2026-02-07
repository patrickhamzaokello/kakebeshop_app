import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme, ColorSchemeName } from 'react-native';
import { lightColors, darkColors, ThemeColors } from '@/constants/theme';

// Theme mode type
export type ThemeMode = 'light' | 'dark' | 'system';

// Theme context value type
interface ThemeContextValue {
  // Current resolved theme (light or dark)
  theme: 'light' | 'dark';
  // User's theme preference (can be system)
  themeMode: ThemeMode;
  // Set the theme mode
  setThemeMode: (mode: ThemeMode) => void;
  // Current theme colors
  colors: ThemeColors;
  // Whether dark mode is active
  isDark: boolean;
}

// Create the context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode;
  // Optional initial theme mode (defaults to 'system')
  initialThemeMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialThemeMode = 'system',
}) => {
  // Get the device's color scheme
  const deviceColorScheme = useColorScheme();

  // Store the user's theme preference
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialThemeMode);

  // Resolve the actual theme based on preference
  const resolvedTheme = useMemo((): 'light' | 'dark' => {
    if (themeMode === 'system') {
      return deviceColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, deviceColorScheme]);

  // Get the colors for the current theme
  const colors = useMemo((): ThemeColors => {
    return resolvedTheme === 'dark' ? darkColors : lightColors;
  }, [resolvedTheme]);

  // Memoized context value
  const contextValue = useMemo((): ThemeContextValue => ({
    theme: resolvedTheme,
    themeMode,
    setThemeMode,
    colors,
    isDark: resolvedTheme === 'dark',
  }), [resolvedTheme, themeMode, colors]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

// Hook to get just the colors (convenience hook)
export const useThemeColors = (): ThemeColors => {
  const { colors } = useTheme();
  return colors;
};

// Hook to check if dark mode
export const useIsDarkMode = (): boolean => {
  const { isDark } = useTheme();
  return isDark;
};

export default ThemeContext;
