"use client";

import { useEffect } from "react";

export function DynamicThemeApplier() {
  useEffect(() => {
    async function loadTheme() {
      try {
        const res = await fetch("/api/site-settings");
        if (!res.ok) return;
        
        const { settings } = await res.json();
        
        // Detect current theme (light or dark)
        const isDark = document.documentElement.classList.contains("dark");
        const theme = isDark ? settings.dark : settings.light;
        
        // Apply CSS variables
        const root = document.documentElement;
        root.style.setProperty("--theme-background", theme.background);
        root.style.setProperty("--theme-text", theme.text);
        root.style.setProperty("--theme-primary", theme.primary);
        root.style.setProperty("--theme-card", theme.card);
      } catch (err) {
        // Ignore - use defaults
      }
    }
    
    loadTheme();
    
    // Re-apply when theme changes (dark/light toggle)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          loadTheme();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });
    
    return () => observer.disconnect();
  }, []);
  
  return null;
}
