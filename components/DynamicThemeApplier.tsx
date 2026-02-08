"use client";

import { useEffect } from "react";

export function DynamicThemeApplier() {
  useEffect(() => {
    async function loadAndApplyTheme() {
      try {
        // Try localStorage first for instant application
        const cached = localStorage.getItem("siteThemeCache");
        if (cached) {
          try {
            const { settings, timestamp } = JSON.parse(cached);
            // Use cache if less than 5 minutes old
            if (Date.now() - timestamp < 5 * 60 * 1000) {
              applyThemeToDOM(settings);
            }
          } catch (e) {
            // Ignore cache errors
          }
        }
        
        // Always fetch latest from server
        const res = await fetch("/api/site-settings");
        if (!res.ok) return;
        
        const { settings } = await res.json();
        
        // Cache for next load
        localStorage.setItem("siteThemeCache", JSON.stringify({
          settings,
          timestamp: Date.now()
        }));
        
        // Apply theme
        applyThemeToDOM(settings);
      } catch (err) {
        console.error("Failed to load theme:", err);
        // Use defaults - do nothing, CSS has defaults
      }
    }
    
    function applyThemeToDOM(settings: any) {
      // Detect current theme mode (light or dark)
      const isDark = document.documentElement.classList.contains("dark");
      const theme = isDark ? settings.dark : settings.light;
      
      // Apply CSS variables that match what globals.css uses
      const root = document.documentElement;
      
      // Map theme colors to CSS variables used throughout the app
      root.style.setProperty("--bg-primary", theme.background);
      root.style.setProperty("--bg-secondary", theme.card);
      root.style.setProperty("--surface", theme.card);
      root.style.setProperty("--text-primary", theme.text);
      root.style.setProperty("--pokedex-red", theme.primary);
      root.style.setProperty("--pokedex-red-dark", theme.primary);
      
      // Also set the legacy --theme-* variables for any custom components
      root.style.setProperty("--theme-background", theme.background);
      root.style.setProperty("--theme-text", theme.text);
      root.style.setProperty("--theme-primary", theme.primary);
      root.style.setProperty("--theme-card", theme.card);
    }
    
    // Load theme immediately
    loadAndApplyTheme();
    
    // Re-apply when dark/light mode toggles
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          loadAndApplyTheme();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });
    
    // Listen for theme update events from admin
    const handleThemeUpdate = () => {
      localStorage.removeItem("siteThemeCache"); // Clear cache
      loadAndApplyTheme();
    };
    
    window.addEventListener("themeUpdated", handleThemeUpdate);
    
    return () => {
      observer.disconnect();
      window.removeEventListener("themeUpdated", handleThemeUpdate);
    };
  }, []);
  
  return null;
}
