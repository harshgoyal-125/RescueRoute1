import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('rr_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('rr_theme', theme);
    } catch (e) {
      console.warn('Could not persist theme preference:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback for components rendered outside ThemeProvider
    const currentAttr = typeof document !== 'undefined' ? (document.documentElement.getAttribute('data-theme') || 'light') : 'light';
    return {
      theme: currentAttr,
      setTheme: (newTheme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', newTheme);
          try {
            localStorage.setItem('rr_theme', newTheme);
          } catch {
            // ignore
          }
        }
      },
      toggleTheme: () => {
        if (typeof document !== 'undefined') {
          const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          try {
            localStorage.setItem('rr_theme', next);
          } catch {
            // ignore
          }
        }
      }
    };
  }
  return context;
}
