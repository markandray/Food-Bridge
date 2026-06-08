import { createContext, useState, useEffect } from 'react';

// REACT CONCEPT: Context API — same pattern as AuthContext and ToastContext.
// ThemeContext provides { theme, toggleTheme } to any component in the tree.
export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // Initialize from localStorage so the preference survives page refreshes.
  // The function form of useState (lazy initializer) runs only once on mount —
  // avoids reading localStorage on every render.
  const [theme, setTheme] = useState(
    () => localStorage.getItem('fb-theme') || 'light'
  );

  useEffect(() => {
    // Tailwind's dark mode works by checking for the 'dark' class on <html>.
    // We add/remove it here whenever theme changes.
    document.documentElement.classList.toggle('dark', theme === 'dark');
    // Persist the choice so it survives a refresh
    localStorage.setItem('fb-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};