// Light by default; the choice is remembered per browser. index.html applies
// the saved theme before first paint so there's no flash.
const KEY = 'theme'

export const getTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0a0b' : '#fafaf9')
  try { localStorage.setItem(KEY, theme) } catch { /* storage blocked */ }
  window.dispatchEvent(new Event('theme-change'))
}

export const toggleTheme = () => setTheme(getTheme() === 'dark' ? 'light' : 'dark')
