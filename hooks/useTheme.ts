import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

/**
 * Syncs the user's theme preference with the <html> element class.
 * - 'dark'   → adds class="dark"
 * - 'light'  → removes class="dark"
 * - 'system' → follows OS prefers-color-scheme, updates on change
 *
 * Call once at the root of the app (App.tsx).
 */
export function useTheme(): void {
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    const root = document.documentElement;

    const applyDark = (dark: boolean) => {
      if (dark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (preference === 'dark') {
      applyDark(true);
      return;
    }

    if (preference === 'light') {
      applyDark(false);
      return;
    }

    // 'system' — follow OS and listen for changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    applyDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => applyDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);
}
