# 🚀 Getting Started - Pokédex AI

Quick guide to install, configure, and run the Pokédex AI application.

## ⚡ Quick Install (5 Minutes)

### 1. Clone & Install
```bash
# Clone repository
git clone https://github.com/Thibault-megard1/pokedex-ai-v2.git
cd pokedex-ai-v2

# Install dependencies
npm install

# Download UI assets
node scripts/download-assets.mjs
```

### 2. Configure Environment
```bash
# Copy example environment file
cp .env.example .env.local
```

**Minimal `.env.local` (without AI):**
```env
JWT_SECRET=your-super-secret-jwt-key-here
```

### 3. Run Application
```bash
npm run dev
```

Open browser: **http://localhost:3000**

---

## 🧠 AI Setup (Optional, FREE!)

### Option 1: Ollama (Local AI - FREE)

**Why Ollama?**
- ✅ Completely FREE - no API costs
- ✅ Unlimited usage - no rate limits
- ✅ Privacy - runs locally
- ✅ Works offline

**Installation:**

**Windows:**
1. Download from https://ollama.ai
2. Run installer
3. Verify installation:
```bash
ollama --version
```

**Mac:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Pull a model:**
```bash
# Recommended: Mistral (fast, good French)
ollama pull mistral

# Alternative: Llama 3 (better reasoning)
ollama pull llama3

# Verify
ollama list
```

**Configure `.env.local`:**
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
JWT_SECRET=your-super-secret-jwt-key
```

**Test it works:**
```bash
curl http://localhost:11434/api/tags
```

---

### Option 2: Mistral AI (Cloud - Paid)

1. Get API key: https://console.mistral.ai
2. Configure `.env.local`:
```env
LLM_PROVIDER=mistral
MISTRAL_API_KEY=your_api_key_here
MISTRAL_MODEL=mistral-small-latest
JWT_SECRET=your-super-secret-jwt-key
```

**Pricing:** ~€0.001-0.003 per 1K tokens

---

## 🎮 Using the Game Mode

### Launch Game
```bash
npm run dev
```

Navigate to: **http://localhost:3000/game**

### Controls
```
Arrow Keys  ⬆️⬇️⬅️➡️  Move player
SHIFT                   Run
SPACE                   Interact / Confirm
ESC                     Open menu
I                       Inventory
T                       Team
R                       Run (in battle)
```

### Gameplay
1. Walk through **tall grass** (dark green areas) for wild Pokémon encounters
2. Press **SPACE** near NPCs to talk
3. In battle: Use arrow keys to select moves, SPACE to confirm

---

## 🏗️ Pokédex Features Quick Tour

### Browse Pokédex
- Visit: **http://localhost:3000/pokemon**
- Click any Pokémon for detailed stats
- Use search bar for autocomplete

### View Pokédex Descriptions
1. Go to any Pokémon page (e.g., `/pokemon/25` for Pikachu)
2. See authentic Pokédex description
3. Click "Changer la source" to select game version/generation
4. Preference saved across all Pokémon

### Build a Team
1. Visit: **http://localhost:3000/team**
2. Search and add up to 6 Pokémon
3. Team saved automatically (requires login)

### Compare Pokémon
1. Visit: **http://localhost:3000/compare**
2. Select two Pokémon
3. See visual comparison: stats, height, weight, types

### Battle Simulator
1. Visit: **http://localhost:3000/battle**
2. Choose your team (up to 6)
3. AI builds opponent team
4. Watch simulated battle with evolution mechanics

### AI Quiz (Requires AI)
1. Visit: **http://localhost:3000/quiz**
2. Answer personality questions
3. AI analyzes and suggests your ideal Pokémon partner

---

## 🔍 Verify Installation

### Check AI Status
Visit: **http://localhost:3000/api/ai/health**

Expected response:
```json
{
  "status": "online",
  "provider": "ollama",
  "model": "mistral",
  "pingTime": "145ms"
}
```

### Check Navbar Indicator
- **Green dot** = AI online
- **Gray dot** = AI unavailable (app still works!)

---

## 🐛 Troubleshooting

### Ollama Not Connecting

**Check if Ollama is running:**
```bash
curl http://localhost:11434/api/tags
```

**Start Ollama manually (if needed):**
```bash
ollama serve
```

**Pull missing model:**
```bash
ollama pull mistral
```

---

### Build Errors

**Clear cache and reinstall:**
```bash
rm -rf node_modules .next
npm install
npm run dev
```

---

### AI Features Not Working

1. Check `.env.local` exists and has correct values
2. Visit `/api/ai/health` for detailed status
3. App works WITHOUT AI (quiz disabled gracefully)

---

### Port 3000 Already in Use

**Change port:**
```bash
# Linux/Mac
PORT=3001 npm run dev

# Windows PowerShell
$env:PORT=3001; npm run dev
```

---

## 📁 Project Structure Overview

```
pokedex-ai-v2/
├── app/                    # Next.js pages
│   ├── pokemon/           # Pokédex pages
│   ├── game/              # Game mode
│   ├── battle/            # Battle simulator
│   ├── team/              # Team builder
│   └── api/               # API routes
├── components/             # React components
├── lib/                    # Utilities & game logic
│   ├── llm/               # AI providers (Ollama, Mistral)
│   └── game/              # Phaser game scenes
├── data/                   # Local JSON database
├── public/                 # Static assets
└── docs/                   # Documentation
```

---

## 📚 Next Steps

- **Game Guide**: See [docs/GAME_GUIDE.md](docs/GAME_GUIDE.md) for gameplay details
- **Battle System**: See [docs/BATTLE_SYSTEM.md](docs/BATTLE_SYSTEM.md) for battle mechanics
- **Architecture**: See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details
- **Features**: See [docs/FEATURES.md](docs/FEATURES.md) for complete feature list

---

## 🆘 Need Help?

- Check [docs/DEV_CHECKLIST.md](docs/DEV_CHECKLIST.md) for testing procedures
- Review [docs/git-commands.md](docs/git-commands.md) for Git operations
- Check the AI status indicator in navbar
- Visit `/api/ai/health` for AI diagnostics

---

**Enjoy exploring the Pokémon world! 🎮⚡**
