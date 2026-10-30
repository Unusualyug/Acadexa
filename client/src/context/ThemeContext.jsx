import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'acadexa_theme';
const ThemeContext = createContext(null);

const systemTheme = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

/** The preference the user chose: 'light', 'dark' or 'system'. */
export function readThemePreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* storage blocked */
  }
  return 'system';
}

/** Applies the resolved theme to <html> and keeps the browser chrome in step. */
function applyTheme(preference) {
  const resolved = preference === 'system' ? systemTheme() : preference;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0a1020' : '#14532D');
  return resolved;
}

/**
 * Light / dark / follow-system theming.
 *
 * The initial class is set by an inline script in index.html so there is no
 * flash of the wrong theme before React mounts; this provider then takes over
 * and persists explicit choices.
 */
export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readThemePreference);
  const [resolved, setResolved] = useState(() => (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'));

  useEffect(() => {
    setResolved(applyTheme(preference));
  }, [preference]);

  // While following the system, react to the OS switching appearance.
  useEffect(() => {
    if (preference !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolved(applyTheme('system'));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [preference]);

  // Keep other tabs in sync.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setPreference(readThemePreference());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((next) => {
    setPreference(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked: the choice lasts for this page only */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setTheme]);

  const value = useMemo(
    () => ({ theme: resolved, isDark: resolved === 'dark', preference, setTheme, toggle }),
    [resolved, preference, setTheme, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
