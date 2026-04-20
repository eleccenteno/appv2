'use client';

import { useAppStore } from '@/lib/store';
import { useEffect } from 'react';

export default function ThemeInitializer() {
  const { currentTheme, darkMode, fontSizeLevel } = useAppStore();

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Apply font size level
  useEffect(() => {
    document.documentElement.classList.remove('font-size-normal', 'font-size-large', 'font-size-xlarge');
    document.documentElement.classList.add(`font-size-${fontSizeLevel}`);
  }, [fontSizeLevel]);

  return null;
}
