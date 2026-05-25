import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark' | 'system';

function createThemeStore() {
  const stored = (
    typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null
  ) as Theme | null;
  const initial: Theme = stored ?? 'system';

  const { subscribe, set, update } = writable<Theme>(initial);

  function applyTheme(theme: Theme) {
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;

    document.documentElement.classList.toggle('dark', resolved === 'dark');

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolved === 'dark' ? '#1a1a2e' : '#ffffff');
    }
  }

  function persist(theme: Theme) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }

  return {
    subscribe,
    set(value: Theme) {
      applyTheme(value);
      persist(value);
      set(value);
    },
    toggle() {
      update((current) => {
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next);
        persist(next);
        return next;
      });
    },
    init() {
      const current: Theme = stored ?? 'system';
      applyTheme(current);

      if (current === 'system') {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', () => applyTheme('system'));
      }
    },
  };
}

export const theme = createThemeStore();
