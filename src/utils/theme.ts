export const THEME_PRESETS: { name: string; color: string }[] = [
  { name: 'Purple', color: '#6d4aff' },
  { name: 'Berry', color: '#c0398f' },
  { name: 'Ocean', color: '#2f72c7' },
  { name: 'Forest', color: '#2f7d5b' },
  { name: 'Sunset', color: '#d97334' },
  { name: 'Coffee', color: '#5b4636' },
];

export function applyTheme(color: string, darkMode: boolean): void {
  const root = document.documentElement;
  root.style.setProperty('--brand', color);
  root.dataset.theme = darkMode ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', darkMode ? '#16141c' : color);
}
