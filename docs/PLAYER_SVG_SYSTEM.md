# Player SVG Sprite System - Implementation Complete

## ✅ DELIVERABLES SUMMARY

### **Files Modified**
1. **[lib/game/player.ts](c:/Users/titou/OneDrive/Documents/ISEN/5 eme année/Integration IA/pokedex-ai-v3/pokedex-ai-v2/lib/game/player.ts)** - Complete rewrite for SVG system
2. **[lib/game/scenes/BootScene.ts](c:/Users/titou/OneDrive/Documents/ISEN/5 eme année/Integration IA/pokedex-ai-v3/pokedex-ai-v2/lib/game/scenes/BootScene.ts)** - Updated preloading
3. **[lib/game/scenes/GameScene.ts](c:/Users/titou/OneDrive/Documents/ISEN/5 eme année/Integration IA/pokedex-ai-v3/pokedex-ai-v2/lib/game/scenes/GameScene.ts)** - Updated update loop

### **Files Created**
4. **[lib/game/playerSpriteHelper.ts](c:/Users/titou/OneDrive/Documents/ISEN/5 eme année/Integration IA/pokedex-ai-v3/pokedex-ai-v2/lib/game/playerSpriteHelper.ts)** - NEW: Sprite path resolution & animation logic
5. **[lib/game/constants.ts](c:/Users/titou/OneDrive/Documents/ISEN/5 eme année/Integration IA/pokedex-ai-v3/pokedex-ai-v2/lib/game/constants.ts)** - NEW: Centralized TILE_SIZE constant

---

## 📋 PART 1: TILE SIZE CONSTANT

**Centralized Constant:**
```typescript
// lib/game/constants.ts
export const TILE_SIZE = 32; // pixels
```

All sprite scaling, positioning, and size calculations reference this constant.

**Usage:**
- SVG loading: `{ width: TILE_SIZE, height: TILE_SIZE }`
- Sprite display: `setDisplaySize(TILE_SIZE, TILE_SIZE)`
- No magic numbers anywhere

---

## 📐 PART 2: SPRITE SCALING SOLUTION

### **Three-Layer Scaling Strategy**

**1. Load-Time Constraint:**
```typescript
scene.load.svg(key, path, { width: TILE_SIZE, height: TILE_SIZE });
```
SVG is rasterized at 32×32 pixels during load, preventing oversized textures.

**2. Display-Time Constraint:**
```typescript
player.setDisplaySize(TILE_SIZE, TILE_SIZE);
```
Forces sprite to render at exactly 32×32 pixels, matching tile grid.

**3. Re-application After Texture Changes:**
```typescript
player.setTexture(textureKey);
player.setDisplaySize(TILE_SIZE, TILE_SIZE); // Re-apply after texture swap
```
Ensures size remains consistent across all animation frames.

### **Why This Works**

- **Load constraint** prevents GPU memory waste
- **Display constraint** guarantees visual accuracy
- **Re-application** handles Phaser texture swap behavior
- **Mode changes** (marcher ↔ courir) do NOT affect size

---

## 🎯 PART 3: SPRITE ORIGIN & ALIGNMENT

**Origin Settings:**
```typescript
player.setOrigin(0.5, 1.0);
```

**Explanation:**
- `originX = 0.5` → Sprite centered horizontally on tile
- `originY = 1.0` → Sprite's feet aligned to tile bottom

**Result:**
- Character appears to stand ON the ground
- No floating or clipping into floor
- Works for all directions and animation frames

---

## 🚶 PART 4: MOVEMENT ANIMATION USING -LEFT / -RIGHT FRAMES

### **Frame Structure**

Each direction has 3 frames:
```
front.svg       ← Idle frame
front-left.svg  ← Left step
front-right.svg ← Right step
```

### **Animation Sequence**

**AnimationSequencer Class:**
```typescript
private sequence: AnimationStep[] = ['idle', 'left', 'idle', 'right'];
```

**Loop Behavior:**
1. **Start:** `idle` (base frame)
2. **Step 1:** `left` (left foot forward)
3. **Return:** `idle` (both feet together)
4. **Step 2:** `right` (right foot forward)
5. **Repeat** from step 1

### **Frame Selection Logic**

```typescript
export function getPlayerSpritePath(
  mode: MovementMode,
  direction: Direction,
  step: AnimationStep
): string {
  const base = `/game/assets/player/${mode}`;
  
  if (step === 'idle') {
    return `${base}/${direction}.svg`;          // front.svg
  } else {
    return `${base}/${direction}-${step}.svg`;  // front-left.svg
  }
}
```

### **Animation Triggers**

**When NOT moving (`isMoving = false`):**
- Sequencer resets to index 0
- Returns `'idle'`
- Shows base frame: `front.svg`, `back.svg`, etc.

**When moving (`isMoving = true`):**
- Sequencer advances based on delta time
- Cycles through: `idle` → `left` → `idle` → `right`
- Speed adjusted by mode:
  - `marcher`: 1.0x (8 fps)
  - `courir`: 1.5x (12 fps)

---

## 🔄 PART 5: CENTRALIZED LOGIC

### **Single Source of Truth**

**All sprite logic in `playerSpriteHelper.ts`:**
- `getPlayerSpritePath()` - Path resolution
- `getTextureKey()` - Cache key generation
- `getAllPlayerSprites()` - Preload list
- `AnimationSequencer` - Frame timing

**Player entity (`player.ts`) only:**
- Calls helper functions
- Manages sprite object
- Applies display constraints

**No duplicated logic:**
- Filenames never hardcoded in GameScene
- Animation timing centralized in AnimationSequencer
- Texture caching handled by Phaser
