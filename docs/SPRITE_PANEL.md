# Pokédex Hero Sprite Panel - Implementation Guide

## Overview

The Pokédex-style hero sprite panel is a device-like frame around the Pokémon sprite on the detail page, featuring:

- **Pokédex device aesthetic** with glass-effect highlights and shadows
- **Subtle floating animation** for visual interest
- **Retro scanline overlay** for authenticity
- **Shiny toggle** with smooth fade/scale transition
- **Red accent glow** for Pokédex branding
- **Full light/dark mode support**
- **Pure CSS animations** (no JavaScript libraries)
- **Keyboard accessible** with focus indicators

---

## Modified Files

### 1. **app/globals.css** (Primary styling)
- **Lines 16-28**: Added CSS custom properties for sprite panel customization
- **Lines 1140-1180**: Enhanced `.pokedex-sprite-frame` with floating animation and red glow
- **Lines 1181-1210**: Dark mode styling for sprite frame
- **Lines 1212-1240**: Updated `.pokedex-sprite-inner` with scanline overlay
- **Lines 1242-1275**: Enhanced `.pokedex-sprite-img` with shiny transition animation
- **Lines 1285-1320**: Improved `.pokedex-shiny-badge` with enhanced glow
- **Lines 1330-1380**: Enhanced `.pokedex-shiny-toggle` with shine effect and accessibility

### 2. **components/PokemonSpriteDisplay.tsx** (Component improvements)
- Added `aria-label` and `aria-pressed` for accessibility
- Added `aria-hidden` to decorative icons
- Improved component comments
- Added loading="eager" for faster sprite display
- Added status indicator below toggle ("Normal" / "Shiny")
- Wrapped toggle with wrapper div for better spacing

---

## Key Features & Customization

### CSS Custom Properties (Easy Tweaks)

Located at the top of `app/globals.css` `:root` selector:

```css
/* Pokédex Sprite Panel Customization */
--sprite-frame-glow: rgba(220, 20, 60, 0.15);      /* Red accent glow color */
--sprite-frame-glow-hover: rgba(220, 20, 60, 0.25); /* Hover glow intensity */
--sprite-float-distance: 8px;                        /* Float animation height */
--sprite-float-duration: 4s;                         /* Animation speed */
--scanline-opacity: 0.03;                            /* Scanline visibility (light) */
--scanline-opacity-dark: 0.15;                       /* Scanline visibility (dark) */
```

### How to Customize

#### 1. Change Frame Colors
```css
:root {
  --sprite-frame-glow: rgba(255, 100, 0, 0.2);  /* Change to orange glow */
}
```

#### 2. Adjust Sprite Size
```css
:root {
  --sprite-size: 400px;          /* Increase desktop size */
  --sprite-size-mobile: 280px;   /* Increase mobile size */
}
```

#### 3. Modify Animation Speed
```css
:root {
  --sprite-float-duration: 6s;   /* Slower floating (6s) */
  --sprite-float-distance: 12px; /* Float farther (12px) */
}
```

#### 4. Adjust Scanlines
```css
:root {
  --scanline-opacity: 0.05;      /* More visible scanlines (light mode) */
  --scanline-opacity-dark: 0.20; /* More visible scanlines (dark mode) */
}
```

---

## Animation Details

### 1. Floating Animation
- **Duration**: Controlled by `--sprite-float-duration` (default: 4s)
- **Distance**: Controlled by `--sprite-float-distance` (default: 8px)
- **Easing**: `ease-in-out` for smooth, natural motion
- **Trigger**: Applied by default; always active
- **Performance**: GPU-accelerated with `transform: translateZ(0)`

```css
@keyframes floatingSprite {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(calc(var(--sprite-float-distance) * -1)); }
}
```

### 2. Shiny Transition
- **Duration**: 0.6s fade + scale
- **Effect**: Image fades in/out with golden glow
- **Scale**: 0.95 → 1.0 (subtle grow effect)
- **Glow**: Golden drop-shadow during transition

```css
@keyframes shinyTransition {
  0% { opacity: 0; transform: scale(0.95) translateZ(0); }
  50% { filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6)); }
  100% { opacity: 1; transform: scale(1) translateZ(0); }
}
```

### 3. Shiny Badge Pulse
- **Duration**: 2s pulse animation (infinite)
- **Scale**: 1.0 → 1.05 (subtle pop)
- **Glow**: Enhanced during peak pulse
- **Applies to**: Gold "Shiny" indicator badge

### 4. Button Shine Effect
- **Duration**: 0.5s linear shine sweep
- **Trigger**: On hover
- **Effect**: Gradient sweep across button surface
- **Performance**: CPU-friendly, uses single gradient

```css
.pokedex-shiny-toggle::before {
  animation: shine 0.5s ease on hover;
}
```

---

## Light Mode vs Dark Mode

### Light Mode (Default)
- **Frame**: Cyan-blue gradient (#98D8E8 → #7BC4D8)
- **Border**: Dark blue (#2C5282)
- **Scanlines**: White overlay at 3% opacity
- **Glass Effect**: White highlight inset
- **Glow**: Red accent at 15% opacity

### Dark Mode
- **Frame**: Deep blue gradient (#0f3460 → #1a5490)
- **Border**: Very dark blue (#0d1f3c)
- **Scanlines**: Black overlay at 15% opacity (more visible)
- **Glass Effect**: White highlight at 10% opacity
- **Glow**: Red accent at same intensity, more visible on dark

---

## Accessibility Features

1. **Keyboard Navigation**
   - Toggle button is fully keyboard accessible
   - Focus indicator: 3px outline in `var(--pokedex-red)`
   - `:focus-visible` pseudo-selector for keyboard-only focus

2. **ARIA Labels**
   - `aria-label` on toggle button (French translations)
   - `aria-pressed` state updates with toggle state
   - `aria-hidden="true"` on decorative emoji icons

3. **Status Indicator**
   - Small text label below toggle ("Normal" / "Shiny")
   - High contrast text color
   - Helps screen reader users understand current state

4. **Image Alt Text**
   - Includes sprite name and shiny status
   - Properly describes visual content

---

## Performance Optimization

### CSS Animation Benefits
- Pure CSS animations (no JavaScript)
- GPU-accelerated with `transform` properties
- No layout reflows or repaints during animation
- Smooth 60fps motion on modern devices

### Image Optimization
- `loading="eager"` for hero sprite (important image)
- `image-rendering: pixelated` for crisp upscaling
- `object-fit: contain` prevents distortion
- Drop shadow via filter (not box-shadow)

### No External Dependencies
- Uses Tailwind classes where possible
- Pure CSS for animations
- No JavaScript animation libraries
- Minimal CSS file size increase

---

## File Size Impact

- **CSS additions**: ~2.2 KB (minified)
- **Component changes**: Negligible (added accessibility attributes)
- **JavaScript impact**: None (no new libraries)

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Animations | ✅ | ✅ | ✅ | ✅ |
| CSS Variables | ✅ | ✅ | ✅ | ✅ |
| `image-rendering` | ✅ | ✅ | ✅ | ✅ |
| `:focus-visible` | ✅ | ✅ | ✅ | ✅ |
| Gradients | ✅ | ✅ | ✅ | ✅ |
| Box-shadow | ✅ | ✅ | ✅ | ✅ |

---

## Common Customizations

### Make it Pokémon Red Themed
```css
:root {
  /* Light mode */
  --sprite-frame-glow: rgba(220, 20, 60, 0.2);
  --sprite-frame-glow-hover: rgba(220, 20, 60, 0.35);
}

/* In .pokedex-sprite-frame */
background: linear-gradient(135deg, #FFE5E5 0%, #FFCCCC 100%);
border-color: #DC0A2D;
```

### Disable Scanlines
```css
:root {
  --scanline-opacity: 0;
  --scanline-opacity-dark: 0;
}
```

### Faster Animation
```css
:root {
  --sprite-float-duration: 2s;    /* Twice as fast */
  --sprite-float-distance: 12px;  /* Float higher */
}
```

### Larger Sprites
```css
:root {
  --sprite-size: 480px;        /* Desktop: 480px */
  --sprite-size-mobile: 320px; /* Mobile: 320px */
}

/* Also adjust toggle button width in .pokedex-shiny-toggle max-width */
```

---

## Troubleshooting

### Animation is choppy
- Check browser DevTools Performance tab for locked frames
- Disable scanline opacity temporarily (`--scanline-opacity: 0`)
- Increase `--sprite-float-duration` for slower animation

### Scanlines too prominent
- Reduce `--scanline-opacity` (0.01 is very subtle)
- Remove scanline overlay entirely (set to 0)

### Shiny transition is jarring
- Adjust animation duration in `@keyframes shinyTransition` (currently 0.6s)
- Modify scale range (currently 0.95 to 1.0)

### Colors don't match theme
- Use CSS variables in custom properties
- Check dark mode is enabled (`darkMode: 'class'` in tailwind.config.js)
- Test in both light/dark modes

---

## Future Enhancements

Possible future improvements without breaking current functionality:

1. **Advanced Scanline Options**
   - Diagonal scanlines
   - Curved scanline pattern
   - Animated scanlines

2. **Additional Animations**
   - Subtle sprite rotation on hover
   - Glow pulse on load
   - Flip animation for shiny toggle

3. **Theme Variants**
   - Pokédex Red version
   - Game Boy classic green
   - Custom brand colors

4. **Interactive Features**
   - Click-to-rotate sprite 3D style
   - Zoom on hover
   - Fullscreen sprite view

---

## Questions & Support

For implementation questions:
1. Check this document first
2. Review the CSS comments in `app/globals.css`
3. Inspect elements in browser DevTools
4. Reference accessibility standards in `components/PokemonSpriteDisplay.tsx`
