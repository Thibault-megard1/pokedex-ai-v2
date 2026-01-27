# Internationalization (i18n) Implementation

## Overview

This Pokédex application now supports **3 languages**:
- 🇫🇷 **French (fr)** - Default
- 🇬🇧 **English (en)**
- 🇪🇸 **Spanish (es)**

The language switcher is located in the navbar, next to the theme toggle.

## Features

✅ **Automatic Language Detection**: Detects browser language on first visit  
✅ **Persistent Storage**: Language choice saved in localStorage  
✅ **No Flash on Load**: Language initialized before first render  
✅ **Type-Safe**: Full TypeScript support  
✅ **Lightweight**: No heavy i18n frameworks - simple dictionary-based system  

## Architecture

### Core Files

#### 1. **`lib/i18n.ts`** - Translation System
- `SUPPORTED_LANGS`: Array of supported language codes
- `Lang`: TypeScript type for language codes
- `dict`: Translation dictionary object
- `t(lang, key)`: Translation function
- `getBrowserLang()`: Browser language detection

```typescript
import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";

// In component
const { lang } = useLanguage();
const text = t(lang, "nav.home"); // Returns "Accueil", "Home", or "Inicio"
```

#### 2. **`components/LanguageProvider.tsx`** - React Context
- Provides global language state
- Handles localStorage persistence
- Prevents flash of wrong language
- Must wrap entire app in `app/layout.tsx`

```tsx
<LanguageProvider>
  <YourApp />
</LanguageProvider>
```

#### 3. **`components/LanguageSwitcher.tsx`** - UI Component
- Compact button with language icon
- Cycles through FR → EN → ES → FR
- Displays current language code
- Integrated in navbar

### Translation Keys Structure

Keys are organized by section:

```typescript
"nav.home"              // Navbar items
"auth.login.title"      // Authentication pages
"home.pokedex.desc"     // Home page content
"battle.start"          // Battle system
"common.search"         // Common UI elements
"pokemon.stats"         // Pokémon details
```

## Usage in Components

### 1. Import Dependencies
```tsx
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
```

### 2. Get Current Language
```tsx
const { lang } = useLanguage();
```

### 3. Translate Strings
```tsx
<button>{t(lang, "common.save")}</button>
<h1>{t(lang, "nav.pokedex")}</h1>
```

## Adding New Translations

### Step 1: Add to Dictionary
Edit `lib/i18n.ts`:

```typescript
export const dict = {
  // ... existing keys
  "my.new.key": {
    fr: "Texte en français",
    en: "Text in English",
    es: "Texto en español"
  }
};
```

### Step 2: Use in Component
```tsx
const text = t(lang, "my.new.key");
```

## Current Translation Coverage

### ✅ Fully Translated Pages
- **Navbar**: All menu items and buttons
- **Home Page**: Hero section, features, actions
- **Login/Register**: Forms and labels
- **Battle Page**: Teams, buttons, evolution points

### 🔄 Partially Translated
- **Pokémon Details**: Type names, stats (uses English by default)
- **Quiz**: Questions remain in French (content-dependent)
- **Team Builder**: Some dynamic text

### 📝 Not Translated
- **Pokémon Names**: Kept as-is (no official translations for all)
- **API Error Messages**: Technical messages
- **Console Logs**: Developer messages

## Language Switching Behavior

### On First Visit
1. Check localStorage for saved language
2. If none, detect browser language
3. If browser language not supported, fallback to French
4. Save choice to localStorage

### On Language Switch
1. User clicks language button
2. State updates immediately
3. All UI re-renders with new language
4. Choice saved to localStorage
5. Persists across sessions

## Browser Compatibility

The i18n system uses:
- `localStorage` (supported in all modern browsers)
- `navigator.language` (supported in all browsers)
- React Context (React 16.3+)

No polyfills needed for target browsers (Chrome, Firefox, Safari, Edge).

## Performance

### Load Time Impact
- **Dictionary Size**: ~100 keys, negligible impact
- **Initial Load**: <1ms to parse dictionary
- **Switching**: Instant (no API calls)
- **No Network**: All translations bundled

### Memory Usage
- Dictionary: ~5KB uncompressed
- Provider overhead: <1KB
- Total impact: <10KB

## Accessibility

The language switcher includes:
- `aria-label="Switch language"`
- `title` attribute showing current language
- Keyboard accessible (standard button)
- Clear visual feedback on hover/focus

## Future Enhancements

### Potential Additions
- [ ] RTL (Right-to-Left) support for Arabic/Hebrew
- [ ] Dynamic translation loading (code splitting)
- [ ] Translation management UI
- [ ] Crowdsourced translations
- [ ] Pokémon name translations (requires PokeAPI integration)
- [ ] Move/ability translations

### Adding More Languages

To add a new language (e.g., German):

1. Update `lib/i18n.ts`:
```typescript
export const SUPPORTED_LANGS = ["fr", "en", "es", "de"] as const;
```

2. Add translations to dictionary:
```typescript
"nav.home": {
  fr: "Accueil",
  en: "Home",
  es: "Inicio",
  de: "Startseite"
}
```

3. Update `LanguageSwitcher.tsx` labels:
```typescript
const langLabels: Record<Lang, string> = {
  fr: "FR",
  en: "EN",
  es: "ES",
  de: "DE"
};
```

## Troubleshooting

### Language Not Changing
- Clear localStorage: `localStorage.removeItem('pokedex-lang')`
- Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
- Check browser console for errors

### Missing Translations
- Fallback: Returns key itself if translation missing
- Console warning: "Translation key not found: {key}"
- Fix: Add key to `dict` in `lib/i18n.ts`

### Flash of Wrong Language
- Ensure `LanguageProvider` wraps entire app
- Check that initial localStorage read happens before render
- Provider includes `mounted` state to prevent premature rendering

## Testing

### Manual Testing Checklist
- [ ] Switch language in navbar
- [ ] Refresh page - language persists
- [ ] Clear localStorage - detects browser language
- [ ] Test all 3 languages on each page
- [ ] Check mobile menu translations
- [ ] Verify keyboard navigation works

### Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Credits

**Implementation**: Custom lightweight i18n system  
**No external dependencies**: Pure React + TypeScript  
**Inspiration**: Next.js i18n patterns, react-i18next concepts  

---

For questions or issues, please check the component files or console warnings.
