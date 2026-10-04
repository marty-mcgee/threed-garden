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

function persistTheme(theme: ThreeDTheme): void {
  // Browser persistence is optional; either store can be unavailable independently.
  try {
    window.localStorage.setItem(THREED_THEME_STORAGE_KEY, theme);
  } catch { /* Keep the current-session theme when browser storage is unavailable. */ }
  try {
    document.cookie = `${THREED_THEME_STORAGE_KEY}=${theme}; Path=/; Max-Age=${THREED_THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch { /* Cookie restrictions must not prevent localStorage or in-memory use. */ }
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
    let storedTheme: string | null = null;
    try {
      storedTheme = window.localStorage.getItem(THREED_THEME_STORAGE_KEY)
        ?? window.localStorage.getItem('theme');
    } catch { /* Retain the server-provided theme if browser storage cannot be read. */ }

    synchronizeSystemTheme();
    if (isThreeDTheme(storedTheme)) {
      persistTheme(storedTheme);
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
    setThemeState(nextTheme);
    persistTheme(nextTheme);
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
