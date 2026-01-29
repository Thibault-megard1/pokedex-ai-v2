# 🎮 Battle Scene Layout - Visual Reference

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       POKÉMON BATTLE SCENE                                │
│                                                                            │
│  ╔═══════════════════╗                                                   │
│  ║ RATTATA      Lv7  ║                         🐭                        │
│  ║ HP: ████████░░░   ║                     (Enemy Sprite)                │
│  ╚═══════════════════╝                        ◯ Shadow                   │
│                                                                            │
│                                                                            │
│                                                                            │
│          ◯ Shadow                                   ╔════════════════════╗│
│       (Player Sprite)                               ║ PIKACHU      Lv5   ║│
│            ⚡                                        ║ HP: ███████░░░     ║│
│                                                     ║     35 / 45         ║│
│                                                     ╚════════════════════╝│
│                                                                            │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ A wild RATTATA appeared!                                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│           ╔══════════╗                    ╔══════════╗                   │
│           ║  Attack  ║                    ║   Run    ║                   │
│           ╚══════════╝                    ╚══════════╝                   │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

## 📐 Layout Specifications

### Sprite Positions
```typescript
Enemy Sprite:
  - Position: { x: width * 0.70, y: height * 0.30 }
  - Scale: 3x
  - Type: Front sprite (pokemon/{id}.png)
  
Player Sprite:
  - Position: { x: width * 0.30, y: height * 0.65 }
  - Scale: 3x
  - Type: Back sprite (pokemon/back/{id}.png)
```

### HUD Box Dimensions
```typescript
Enemy HUD (Top-Left):
  - Position: { x: width * 0.15, y: height * 0.15 }
  - Size: 200 x 70 pixels
  - Contents:
    * Name (uppercase, bold)
    * Level (top-right)
    * HP label
    * HP bar (155px wide)
    
Player HUD (Bottom-Right):
  - Position: { x: width * 0.55, y: height * 0.75 }
  - Size: 240 x 80 pixels
  - Contents:
    * Name (uppercase, bold)
    * Level (top-right)
    * HP label
    * HP bar (195px wide)
    * HP text (numerical: "35 / 45")
```

### Battle UI
```typescript
Battle Log:
  - Position: { x: width / 2, y: height - 130 }
  - Background: Dark gray (#1f2937)
  - Text: White, centered
  - Max width: 80% of screen width

Action Buttons:
  - Position Y: height - 60
  - Attack Button X: width / 2 - 100
  - Run Button X: width / 2 + 100
  - Background: Blue (#3b82f6)
  - Hover: Darker blue (#2563eb)
```

## 🎨 Color Palette

### HP Bar Colors
```css
HP > 50%:  #10b981 (Green)
HP 25-50%: #fbbf24 (Yellow)
HP < 25%:  #ef4444 (Red)
```

### UI Colors
```css
HUD Background:    #ffffff (White, 90% opacity)
HUD Border:        #000000 (Black)
Battle Log BG:     #1f2937 (Dark Gray)
Button BG:         #3b82f6 (Blue)
Button Hover:      #2563eb (Darker Blue)
Platform Shadow:   #000000 (Black, 30% opacity)
```

### Background Gradient
```css
Top:    #87ceeb (Sky Blue)
Bottom: #90ee90 (Light Green)
```

## 🎬 Animation Timeline

### Entrance (Total: ~1.1 seconds)
```
0ms    : Background appears
0ms    : Platforms appear
0ms    : Enemy sprite starts sliding from right →
300ms  : Enemy HUD starts fading in
600ms  : Enemy sprite reaches final position
200ms  : Player sprite starts bouncing in ↑
500ms  : Enemy HUD fully visible
700ms  : Player sprite reaches final position
500ms  : Player HUD starts fading in
900ms  : Player HUD fully visible
1000ms : Idle animations start
```

### Attack Sequence (Total: ~2.5 seconds)
```
0ms    : Attacker moves forward (150ms)
150ms  : Attacker returns to position (150ms)
300ms  : Screen shake (200ms)
300ms  : HP bar starts decreasing
800ms  : HP bar animation complete
1000ms : Battle log updates
2500ms : Next turn begins (if battle continues)
```

### Idle Animation (Continuous)
```
Player Sprite:
  - Cycle: 1600ms
  - Movement: Y ± 8 pixels
  - Easing: Sine.easeInOut
  - Repeat: Infinite
  
Enemy Sprite:
  - Cycle: 1500ms
  - Movement: Y ± 8 pixels
  - Easing: Sine.easeInOut
  - Repeat: Infinite
  - Offset: 500ms from player
```

## 📊 Responsive Breakpoints

The layout automatically adjusts for different screen sizes:

### Mobile (< 768px)
- HUD boxes scale down slightly
- Button text size reduces
- Sprite scale adjusts to 2.5x

### Tablet (768px - 1024px)
- Default layout
- Sprite scale: 3x
- Full HUD boxes

### Desktop (> 1024px)
- Default layout
- Maximum screen usage
- Sprite scale: 3x

## 🔢 Mathematical Calculations

### HP Bar Width
```typescript
barWidth = maxBarWidth * (currentHP / maxHP)
```

### HP Bar Color
```typescript
hpPercent = hp / maxHp
color = hpPercent < 0.25 ? RED : hpPercent < 0.5 ? YELLOW : GREEN
```

### Damage Calculation
```typescript
baseDamage = (attacker.attack / defender.defense) * 10
variance = random(1, 5)
finalDamage = max(1, baseDamage + variance)
```

### Sprite Position (Responsive)
```typescript
// Player
x = screenWidth * 0.30
y = screenHeight * 0.65

// Enemy
x = screenWidth * 0.70
y = screenHeight * 0.30
```

## 📱 Touch/Click Targets

### Button Sizes
```typescript
Width: Auto (based on text + padding)
Height: Auto (based on text + padding)
Padding: { x: 30px, y: 15px }
Font Size: 20px
```

### Interactive Elements
1. **Attack Button** - Triggers player attack
2. **Run Button** - Escape from battle
3. **Hover effects** - Visual feedback on all buttons

## 🎯 Performance Optimizations

### Sprite Loading Strategy
```typescript
// Preload only early-game Pokémon (IDs 1-25)
// ~50 sprite files total (25 front + 25 back)
// Average size per sprite: ~3-5 KB
// Total preload: ~150-250 KB

// Sprites cached by Phaser after first load
// Subsequent battles use cached sprites (instant)
```

### Animation Efficiency
```typescript
// Graphics objects reused (not recreated)
// Tweens use Phaser's optimized engine
// No requestAnimationFrame loops
// Event-driven updates only
```

---

## 🎮 Example Combat Flow

### Turn 1: Player Attacks
```
1. Player clicks "Attack" button
2. Player sprite moves forward (150ms)
3. Screen shakes (200ms)
4. Enemy HP: 40 → 28 (animated 500ms)
5. Message: "PIKACHU dealt 12 damage!"
6. Enemy turn begins
```

### Turn 2: Enemy Attacks
```
1. Enemy sprite moves forward (150ms)
2. Screen shakes (200ms)
3. Player HP: 35 → 27 (animated 500ms)
4. HP text updates: "27 / 45"
5. Message: "RATTATA dealt 8 damage!"
6. Buttons re-enable
```

### Victory
```
1. Enemy HP reaches 0
2. Message: "RATTATA fainted! You won!"
3. Enemy sprite fades out (500ms)
4. EXP awarded: +70
5. Save game
6. Return to GameScene (2000ms delay)
```

---

**This visual reference helps developers understand the exact layout and behavior of the new battle system!**
