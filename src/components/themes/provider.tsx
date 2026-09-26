'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThreeDTheme = 'light' | 'dark' | 'system';
export type ThreeDResolvedTheme = 'light' | 'dark';

interface ThreeDThemeContextValue {
  theme: ThreeDTheme;
  resolvedTheme: ThreeDResolvedTheme;
  setTheme: (theme: ThreeDTheme) => void;
}

const THREED_THEME_STORAGE_KEY = 'threed-theme';
const THREED_THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const ThreeDThemeContext = createContext<ThreeDThemeContextValue | null>(null);

function isThreeDTheme(value: string | null): value is ThreeDTheme {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function ThemeProvider({
  children,
  initialTheme = 'dark',
  initialResolvedTheme = 'dark',
}: {
  children: ReactNode;
  initialTheme?: ThreeDTheme;
  initialResolvedTheme?: ThreeDResolvedTheme;
}) {
  const [theme, setThemeState] = useState<ThreeDTheme>(initialTheme);
  const [systemTheme, setSystemTheme] = useState<ThreeDResolvedTheme>(initialResolvedTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const synchronizeSystemTheme = () => {
      setSystemTheme(media.matches ? 'dark' : 'light');
    };
    const storedTheme = window.localStorage.getItem(THREED_THEME_STORAGE_KEY)
      ?? window.localStorage.getItem('theme');

    synchronizeSystemTheme();
    if (isThreeDTheme(storedTheme)) {
      window.localStorage.setItem(THREED_THEME_STORAGE_KEY, storedTheme);
      document.cookie = `${THREED_THEME_STORAGE_KEY}=${storedTheme}; Path=/; Max-Age=${THREED_THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
      setThemeState(storedTheme);
    }
    media.addEventListener('change', synchronizeSystemTheme);
    return () => media.removeEventListener('change', synchronizeSystemTheme);
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.classList.toggle('light', resolvedTheme === 'light');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = (nextTheme: ThreeDTheme) => {
    window.localStorage.setItem(THREED_THEME_STORAGE_KEY, nextTheme);
    document.cookie = `${THREED_THEME_STORAGE_KEY}=${nextTheme}; Path=/; Max-Age=${THREED_THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
    setThemeState(nextTheme);
  };

  const value = useMemo<ThreeDThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    setTheme,
  }), [resolvedTheme, theme]);

  return (
    <ThreeDThemeContext.Provider value={value}>
      {children}
    </ThreeDThemeContext.Provider>
  );
}

export function useTheme(): ThreeDThemeContextValue {
  const context = useContext(ThreeDThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside the ThreeD ThemeProvider');
  }
  return context;
}
