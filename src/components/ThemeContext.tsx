import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Apply theme immediately to prevent flash
if (typeof window !== 'undefined') {
  // TODO: Get theme preference from Firebase
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = prefersDark ? 'dark' : 'light';
  
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize with system preference
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    
    // TODO: Get theme preference from Firebase
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  // Apply theme to document whenever it changes
  useEffect(() => {
    const root = document.documentElement;
    
    // TODO: Save theme preference to Firebase
    
    // Apply or remove dark class
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Add smooth transition class
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
