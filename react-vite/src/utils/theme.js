// Aura theme — dark (default) / light, persisted to localStorage and applied
// to <html data-theme>. index.css defines the light overrides under
// :root[data-theme="light"].
const KEY = "aura_theme";

export function getTheme() {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme) {
  const t = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
  return t;
}

// Call once at startup (before first paint) so there's no flash of the wrong theme.
export function initTheme() {
  return applyTheme(getTheme());
}

export function toggleTheme() {
  return applyTheme(getTheme() === "light" ? "dark" : "light");
}
