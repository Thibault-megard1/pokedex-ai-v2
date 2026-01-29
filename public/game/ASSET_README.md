# Game Assets Guide

This folder contains all visual assets for the Pokémon Game feature.

## Folder Structure

```
public/game/assets/
├── player/
│   └── player.png (32x32 spritesheet, 4 frames per direction)
├── npcs/
│   ├── professor.png (32x32)
│   ├── npc_1.png (32x32)
│   └── npc_2.png (32x32)
├── tiles/
│   └── tileset.png (tileset with grass, path, trees, water, etc.)
├── ui/
│   ├── textbox.png (dialogue box background)
│   ├── menu_bg.png (menu background)
│   └── battle_bg.png (battle background)
└── wild/
    └── (Pokémon sprites will be loaded from PokeAPI)
```

## Asset Requirements

### Player Sprite (player/player.png)
- Size: 32x32 pixels per frame
- Format: PNG with transparency
- Layout: 4 directions × 4 frames = 16 frames total
  ```
  Row 1: Down (idle, step1, step2, step3)
  Row 2: Left (idle, step1, step2, step3)
  Row 3: Right (idle, step1, step2, step3)
  Row 4: Up (idle, step1, step2, step3)
  ```
- Style: Pokémon Gen 4/5 trainer sprite style

### NPC Sprites (npcs/*.png)
- Size: 32x32 pixels
- Format: PNG with transparency
- Single frame (no animation needed initially)
- Examples needed:
  - **professor.png**: Lab coat scientist
  - **npc_1.png**: Generic trainer/citizen
  - **npc_2.png**: Shop keeper or other role

### Tileset (tiles/tileset.png)
- Tile size: 16x16 or 32x32 pixels (must be consistent)
- Format: PNG
- Must include:
  - Grass tiles (walkable)
  - Tall grass tiles (encounter zone)
  - Path/road tiles (walkable)
  - Water tiles (non-walkable)
  - Tree tiles (non-walkable)
  - Building walls/floors
  - Doors/entrances
- Recommended: Use Tiled-compatible tileset
- Style: Pokémon Gen 4/5 overworld style

### UI Assets (ui/*.png)
- **textbox.png**: 
  - Recommended size: 400x100px minimum
  - Should have rounded corners and border
  - Semi-transparent background
  
- **menu_bg.png**: 
  - Recommended size: 300x400px
  - Pokédex-style panel design
  
- **battle_bg.png**: 
  - Recommended size: 800x600px
  - Generic grassland or route background

## Where to Get Assets

⚠️ **IMPORTANT: Copyright Notice**

Do not include copyrighted Nintendo/Game Freak assets in this repository.

### Legal Free Options:

1. **Create Your Own**: Use pixel art tools like Aseprite, Piskel, or GraphicsGale
2. **Free Tilesets**: Search for "free RPG tileset" or "free pokemon-style tileset"
3. **Open Source**: Look for CC0 or MIT licensed sprite packs
4. **Commission Artists**: Hire pixel artists on Fiverr or similar

### Useful Resources:
- OpenGameArt.org (CC0 assets)
- itch.io (free/paid asset packs)
- Kenney.nl (free game assets)

## Fallback Behavior

If assets are missing, the game will display:
- **Player**: Blue square (32x32)
- **NPCs**: Green squares (32x32)
- **Tiles**: Colored rectangles based on tile type
  - Grass: Light green
  - Path: Gray
  - Water: Blue
  - Wall: Dark gray
- **UI**: Solid color backgrounds

The game will log warnings to console indicating which assets are missing.

## How to Add Assets

1. Create the required PNG files
2. Place them in the appropriate folders
3. Ensure filenames match exactly (case-sensitive!)
4. Refresh the game page - assets should load automatically

## Attribution

If you use third-party assets, please document attribution here:

```
Asset Name | Author | License | Source URL
-----------|--------|---------|------------
(example)  | (name) | CC0     | (url)
```

---

**Last Updated**: January 2026
