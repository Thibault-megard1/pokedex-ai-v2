# 🎮 Quick Start - Pokémon Game

## Launch the Game (3 Steps)

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open Browser
Navigate to: **http://localhost:3000/game**

### 3. Play!
- Press **SPACE** to start
- Use **Arrow Keys** to move
- Press **SPACE** near NPCs to talk
- Walk through **tall grass** for wild encounters

---

## Controls

```
⬆️⬇️⬅️➡️  Move Player
SPACE    Interact / Confirm
ESC      Menu
I        Inventory
T        Team
R        Run (in battle)
```

---

## First Time Setup (Optional)

### Add Game Assets
See: `public/game/ASSET_README.md`

**Not required** - game includes fallback graphics (colored shapes).

### Setup AI NPCs (Optional)
1. Install Ollama: https://ollama.ai
2. Run: `ollama pull llama2`
3. Set environment variable (optional):
   ```bash
   OLLAMA_API_URL=http://localhost:11434
   ```

**Not required** - NPCs use fallback dialogues if Ollama unavailable.

---

## Gameplay Tips

🌱 **Tall Grass**: Walk through dark green patches to encounter wild Pokémon
👨‍🔬 **NPCs**: Stand next to them and press SPACE to talk
⚔️ **Battles**: Choose Attack or Run, watch HP bars
💾 **Saving**: Press ESC → "Save Game" (or auto-saves every 30s)
📍 **Maps**: Exit the lab through the bottom door to reach Route 1

---

## Troubleshooting

**Game won't load?**
- Check console for errors (F12)
- Ensure Phaser installed: `npm list phaser`

**Black screen?**
- Wait 5-10 seconds for assets to load
- Check network tab for 404s

**Navbar still showing?**
- Refresh page
- Clear browser cache

---

## Full Documentation

📖 **Complete Guide**: `docs/GAME_GUIDE.md`
📋 **Implementation Summary**: `docs/GAME_IMPLEMENTATION_SUMMARY.md`
🎨 **Asset Guide**: `public/game/ASSET_README.md`

---

**Enjoy your Pokémon adventure!** ✨
