# Pokédex Hero Sprite Panel - Visual Examples & Tweaks

## Quick Visual Guide

### What You'll See

#### Light Mode
```
┌─────────────────────────────┐
│                             │  ← Rounded corners (24px radius)
│     ╔═════════════════╗     │
│     ║                 ║     │  ← Glass-effect inner border
│     ║    [SPRITE]     ║     │  ← Pixel-art sprite with drop shadow
│     ║  (Floating up)  ║ ✨  │  ← Shiny badge (when active)
│     ║                 ║     │
│     ╚═════════════════╝     │
│                             │
└─────────────────────────────┘  ← Red accent glow around frame
   Subtle horizontal scanlines    ← Very faint (3% opacity)
     
   [ ✨ Version Shiny ] ← Shine effect on hover
      Normal / Shiny   ← Status indicator
```

#### Dark Mode
```
┌─────────────────────────────┐
│   (Darker blue background)  │  ← Deep blue gradient
│     ╔═════════════════╗     │
│     ║                 ║     │  ← Brighter glass effect
│     ║    [SPRITE]     ║     │  ← Same sprite display
│     ║  (Floating up)  ║ ✨  │
│     ║                 ║     │
│     ╚═════════════════╝     │
│                             │
└─────────────────────────────┘  ← Red glow more visible
   Darker scanlines               ← More prominent (15% opacity)

   [ 🎨 Version normale ]
      Shiny / Normal
```

---

## Customization Examples

### Example 1: Pokémon Red-Themed Device

Change the frame to iconic red Pokédex colors:

```css
/* In app/globals.css :root */
:root {
  /* Red Pokédex theme */
  --sprite-frame-glow: rgba(220, 20, 60, 0.25);
  --sprite-frame-glow-hover: rgba(220, 20, 60, 0.4);
  --sprite-float-distance: 10px;
  --sprite-float-duration: 3s; /* Faster */
}

/* Override frame gradient in .pokedex-sprite-frame */
.pokedex-sprite-frame {
  background: linear-gradient(135deg, #FFE5E5 0%, #FFD4D4 100%);
  border-color: #DC0A2D; /* Pokédex red */
}

.dark .pokedex-sprite-frame {
  background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
  border-color: #FF1744;
}
```

**Result**: Red-themed device like the original Pokédex

---

### Example 2: Game Boy Classic (Green)

Retro Game Boy aesthetic:

```css
:root {
  --sprite-frame-glow: rgba(34, 139, 34, 0.2); /* Green glow */
  --sprite-frame-glow-hover: rgba(34, 139, 34, 0.3);
}

.pokedex-sprite-frame {
  background: linear-gradient(135deg, #8CBF59 0%, #7AA942 100%);
  border-color: #3A6F2E;
}

.dark .pokedex-sprite-frame {
  background: linear-gradient(135deg, #4A6741 0%, #2D5A1F 100%);
  border-color: #1A3A11;
}

/* Green glow effect for badge */
.pokedex-shiny-badge {
  background: linear-gradient(135deg, #90EE90 0%, #7CCD7C 100%);
  border-color: #228B22;
}
```

**Result**: Classic Game Boy green screen

---

### Example 3: Minimal Zen Mode (No Scanlines, Slow Float)

Clean, minimal appearance:

```css
:root {
  --scanline-opacity: 0;         /* Disable scanlines */
  --scanline-opacity-dark: 0;
  --sprite-float-duration: 6s;   /* Very slow (6s) */
  --sprite-float-distance: 6px;  /* Subtle float */
  --sprite-frame-glow: rgba(220, 20, 60, 0.08); /* Very subtle */
}

/* Optional: Remove border for borderless look */
.pokedex-sprite-frame {
  border-width: 3px; /* Thinner border */
}
```

**Result**: Clean, minimal device frame with subtle motion

---

### Example 4: Maximum Size (Large Display)

Dominate the page with a huge sprite:

```css
:root {
  --sprite-size: 520px;        /* Very large on desktop */
  --sprite-size-mobile: 380px; /* Still large on mobile */
}

/* Adjust toggle button to match */
.pokedex-shiny-toggle {
  width: 100%;
  max-width: min(90vw, 520px); /* Match sprite width */
}
```

**Result**: Large, prominent sprite display

---

### Example 5: Fast, Energetic Animation

Snappy, high-energy animation:

```css
:root {
  --sprite-float-distance: 12px; /* Float higher */
  --sprite-float-duration: 2s;   /* Fast bounce */
}

/* Make shiny transition faster */
.pokedex-sprite-img[alt*="shiny"] {
  animation: shinyTransition 0.3s ease-in-out; /* Snap transition */
}

/* Speed up pulse animation */
@keyframes shinyPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); } /* Bigger pulse */
}
```

**Result**: Energetic, bouncy sprite animation

---

### Example 6: Premium Dark Glass Effect

Enhanced glassmorphism for dark mode:

```css
.dark .pokedex-sprite-frame {
  background: linear-gradient(135deg, 
    rgba(15, 52, 96, 0.9) 0%, 
    rgba(26, 84, 144, 0.85) 100%
  );
  backdrop-filter: blur(10px); /* Subtle blur effect */
  border: 6px solid rgba(255, 255, 255, 0.1);
}

.dark .pokedex-sprite-frame:hover {
  border-color: rgba(255, 255, 255, 0.2);
}
```

**Result**: Frosted glass appearance in dark mode

---

## Animation Speed Reference

### Floating Animation Duration Examples

| Value | Feel | Use Case |
|-------|------|----------|
| 2s | Fast, energetic | Action-heavy pages |
| 3s | Moderate | Standard pages |
| 4s | Balanced | Default (current) |
| 5s | Calm, slow | Relaxed/detail view |
| 6s | Meditative | Zen mode |

### Float Distance Examples

| Value | Distance | Visual Effect |
|-------|----------|---------------|
| 4px | Subtle | Barely noticeable |
| 8px | Balanced | Current default |
| 12px | Prominent | Very visible motion |
| 16px | Extreme | Very bouncy |

---

## Toggle Button Customization

### Variant 1: Minimal Toggle (No Text)

```css
.pokedex-shiny-toggle {
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  max-width: fit-content; /* Don't stretch full width */
}

.pokedex-toggle-text {
  display: none; /* Hide text, icon only */
}
```

**Result**: Compact icon-only button

---

### Variant 2: Larger Toggle Button

```css
.pokedex-shiny-toggle {
  padding: 1.25rem 2.5rem;
  font-size: 1.125rem;
  border-radius: 28px;
  gap: 1rem;
}

.pokedex-toggle-icon {
  font-size: 1.5rem;
}
```

**Result**: Large, prominent toggle button

---

### Variant 3: Green Shiny Button

Change button color from gold to green:

```css
.pokedex-shiny-toggle {
  background: linear-gradient(to bottom, #90EE90, #7CCD7C);
  border-color: #228B22;
  color: #1a1a00;
  box-shadow: 
    0 4px 12px rgba(34, 139, 34, 0.3),
    inset 0 2px 0 rgba(255,255,255,0.25);
}

.dark .pokedex-shiny-toggle {
  background: linear-gradient(to bottom, #7CCD7C, #5FAD56);
}
```

**Result**: Green toggle button instead of gold

---

## Scanline Customization

### Option 1: No Scanlines

```css
:root {
  --scanline-opacity: 0;
  --scanline-opacity-dark: 0;
}
```

---

### Option 2: Very Prominent Scanlines

```css
:root {
  --scanline-opacity: 0.08;       /* Much more visible light mode */
  --scanline-opacity-dark: 0.25;  /* Very visible dark mode */
}
```

---

### Option 3: Custom Scanline Pattern

```css
/* In .pokedex-sprite-inner::after */
background: repeating-linear-gradient(
  0deg,
  rgba(255, 255, 255, var(--scanline-opacity)),
  rgba(255, 255, 255, var(--scanline-opacity)) 2px,  /* Thicker lines */
  transparent 2px,
  transparent 4px  /* Bigger gaps */
);
```

---

## Testing Your Changes

### 1. Light Mode Test
- [ ] Frame colors are visible
- [ ] Sprite is clearly visible inside frame
- [ ] Scanlines are subtle (not distracting)
- [ ] Toggle button stands out
- [ ] Animation is smooth

### 2. Dark Mode Test
- [ ] Frame is visible on dark background
- [ ] Red glow is visible
- [ ] Scanlines are more prominent
- [ ] Text has good contrast
- [ ] Toggle button is still gold/bright

### 3. Animation Test
- [ ] Sprite floats smoothly
- [ ] Shiny transition is smooth
- [ ] Badge pulse is visible
- [ ] No jank or stuttering
- [ ] Button shine works on hover

### 4. Responsive Test
- [ ] Sprite fits mobile screen
- [ ] Toggle button is clickable
- [ ] No overflow on small screens
- [ ] Desktop view looks good
- [ ] Tablet view is proportional

### 5. Accessibility Test
- [ ] Toggle button is keyboard accessible (Tab key)
- [ ] Focus indicator is visible
- [ ] Toggle works with Enter/Space
- [ ] Status text is readable
- [ ] Alt text is present on sprite

---

## Common Issues & Fixes

### Issue: Sprite looks blurry
**Solution**: Ensure `image-rendering: pixelated` is applied
```css
.pokedex-sprite-img {
  image-rendering: pixelated;
  image-rendering: crisp-edges; /* Fallback */
}
```

### Issue: Animation is choppy
**Solution**: Reduce opacity values or disable scanlines
```css
:root {
  --scanline-opacity: 0; /* Disable temporarily */
}
```

### Issue: Colors don't match branding
**Solution**: Update the color values in :root
```css
:root {
  --sprite-frame-glow: rgba(YOUR_R, YOUR_G, YOUR_B, 0.2);
}
```

### Issue: Scanlines too visible
**Solution**: Reduce opacity
```css
:root {
  --scanline-opacity: 0.01; /* Very subtle */
  --scanline-opacity-dark: 0.05;
}
```

### Issue: Animation is too fast/slow
**Solution**: Adjust duration and distance
```css
:root {
  --sprite-float-duration: 5s; /* Slower */
  --sprite-float-distance: 6px; /* Less distance */
}
```

---

## Production Checklist

Before deploying, verify:

- [ ] CSS compiles without errors
- [ ] All animations are smooth (60fps)
- [ ] Tested in light AND dark modes
- [ ] Tested on mobile, tablet, desktop
- [ ] Keyboard navigation works
- [ ] Screen reader announces shiny state
- [ ] Focus indicators are visible
- [ ] No console errors
- [ ] Sprites load quickly
- [ ] No flickering on toggle

---

## Performance Metrics (Expected)

| Metric | Value | Notes |
|--------|-------|-------|
| CSS file size increase | ~2.2 KB | Minified |
| Animation FPS | 60 | Smooth on modern devices |
| CPU usage (idle) | <1% | CSS animations only |
| GPU utilization | Low | Transform-based only |
| Load time impact | Negligible | No blocking assets |

---

## Future Enhancement Ideas

1. **3D Rotation**: Hover to rotate sprite 3D
2. **Custom Themes**: Support brand color variants
3. **Advanced Scanlines**: Animated or patterned
4. **Zoom Animation**: Pinch-zoom on mobile
5. **Glitch Effect**: Occasional visual glitch for retro feel
6. **Holographic Shiny**: Gradient animation for shiny
7. **Sound Effects**: Optional audio feedback

All maintainable through CSS variables and without heavy JavaScript!
