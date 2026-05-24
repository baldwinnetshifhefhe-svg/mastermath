// Theme store. The actual color values live in styles.css under the
// [data-theme="..."] selectors — this module just toggles the data attribute
// on <html>, persists the choice, and lets components subscribe.
export const MODES = ['light', 'dark', 'heritage'];
export const THEME_ICONS  = { light: '☀️', dark: '🌙', heritage: '🌅' };
export const THEME_LABELS = { light: 'Light', dark: 'Dark', heritage: 'Heritage' };

const KEY = 'theme_mode';
const listeners = new Set();

function readMode() {
  const v = localStorage.getItem(KEY);
  return MODES.includes(v) ? v : 'light';
}

let currentMode = readMode();

// Kept for code that still asks for the palette by name. The actual color
// values come from CSS variables, but a few legacy spots use this to read
// `theme.mode` for branching (e.g. dark-mode color tweaks inside iframes).
const PALETTE_SHAPE = (mode) => ({ mode });

export function getTheme() { return PALETTE_SHAPE(currentMode); }
export function getMode()  { return currentMode; }

export function setMode(mode) {
  if (!MODES.includes(mode)) return;
  currentMode = mode;
  try { localStorage.setItem(KEY, mode); } catch {}
  applyThemeToDocument();
  listeners.forEach(fn => fn(getTheme()));
}

export function toggleMode() {
  setMode(MODES[(MODES.indexOf(currentMode) + 1) % MODES.length]);
}

export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function applyThemeToDocument() {
  document.documentElement.setAttribute('data-theme', currentMode);
}
