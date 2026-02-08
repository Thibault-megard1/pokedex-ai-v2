# 📚 Documentation Index - Pokédex AI

Welcome to the Pokédex AI documentation. This index will help you find what you need quickly.

---

## 🚀 Getting Started

**Start here if you're new:**
- **[../GETTING_STARTED.md](../GETTING_STARTED.md)** - Installation, configuration, and first steps
- **[../README.md](../README.md)** - Project overview and features

---

## 📖 Core Documentation

### Essential Guides
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and technology stack
- **[FEATURES.md](FEATURES.md)** - Complete feature list and descriptions
- **[GAME_GUIDE.md](GAME_GUIDE.md)** - Pokémon game implementation guide
- **[BATTLE_SYSTEM.md](BATTLE_SYSTEM.md)** - Battle mechanics (Phaser & Team battles)

### Development
- **[DEV_CHECKLIST.md](DEV_CHECKLIST.md)** - Testing and verification procedures
- **[ADMIN_VIEW_MODE.md](ADMIN_VIEW_MODE.md)** - Admin inspection mode (developer tool)
- **[ADMIN_VIEW_QUICK_START.md](ADMIN_VIEW_QUICK_START.md)** - Admin View quick reference
- **[git-commands.md](git-commands.md)** - Common Git operations

### Technical References
- **[POKEMON_CACHE_API_REFERENCE.md](POKEMON_CACHE_API_REFERENCE.md)** - Caching system API
- **[MENU_SYSTEM.md](MENU_SYSTEM.md)** - In-game menu system
- **[QUIZ_REDESIGN.md](QUIZ_REDESIGN.md)** - Quiz feature documentation

---

## 🤖 AI Integration

Located in `docs/ai/`:
- **[llm-integration.md](ai/llm-integration.md)** - Unified AI system documentation
- **[ollama-setup.md](ai/ollama-setup.md)** - Local AI (Ollama) installation guide

---

## 🎨 Design & UI

Located in `docs/design/`:
- **[redesign-guide.md](design/redesign-guide.md)** - UI/UX design system
- **[sprites-guide.md](design/sprites-guide.md)** - Asset management guide
- **[redesign-progress.md](design/redesign-progress.md)** - Design implementation status

---

## ✨ Features

Located in `docs/features/`:
- **[quiz-documentation.md](features/quiz-documentation.md)** - Quiz system details
- **[quiz-setup.md](features/quiz-setup.md)** - Quiz implementation
- **[quiz-update.md](features/quiz-update.md)** - Quiz updates
- **[i18n-guide.md](features/i18n-guide.md)** - Internationalization (i18n)

---

## 📦 Archive

Located in `docs/archive/`:

Historical documentation and completed milestones:
- **[implementation-complete.md](archive/implementation-complete.md)** - Phase 1 completion
- **[phase-2-complete.md](archive/phase-2-complete.md)** - Phase 2 completion
- **[pokedex-plus-ideas.md](archive/pokedex-plus-ideas.md)** - Feature brainstorming
- **[site-restructure-summary.md](archive/site-restructure-summary.md)** - Restructure notes
- **[updates.md](archive/updates.md)** - Historical updates

---

## 📁 Project Structure

```
pokedex-ai-v2/
├── README.md                       ← Project overview
├── GETTING_STARTED.md              ← Quick start guide
│
├── docs/                           ← You are here
│   ├── README.md                   ← This file
│   ├── ARCHITECTURE.md             ← System architecture
│   ├── BATTLE_SYSTEM.md            ← Battle mechanics
│   ├── FEATURES.md                 ← Feature list
│   ├── GAME_GUIDE.md               ← Game implementation
│   ├── DEV_CHECKLIST.md            ← Development workflow
│   ├── MENU_SYSTEM.md              ← Menu system
│   ├── POKEMON_CACHE_API_REFERENCE.md ← Cache API
│   ├── QUIZ_REDESIGN.md            ← Quiz documentation
│   ├── git-commands.md             ← Git reference
│   │
│   ├── ai/                         ← AI integration
│   │   ├── llm-integration.md
│   │   └── ollama-setup.md
│   │
│   ├── design/                     ← UI/UX design
│   │   ├── redesign-guide.md
│   │   ├── sprites-guide.md
│   │   └── redesign-progress.md
│   │
│   ├── features/                   ← Feature-specific docs
│   │   ├── quiz-documentation.md
│   │   ├── quiz-setup.md
│   │   ├── quiz-update.md
│   │   └── i18n-guide.md
│   │
│   └── archive/                    ← Historical docs
│       ├── implementation-complete.md
│       ├── phase-2-complete.md
│       ├── pokedex-plus-ideas.md
│       ├── site-restructure-summary.md
│       └── updates.md
│
├── app/                            ← Next.js pages
├── components/                     ← React components
├── lib/                            ← Utilities & game logic
├── data/                           ← Local database
└── public/                         ← Static assets
```

---

## 🔍 Quick Reference

### Installation
```bash
git clone https://github.com/Thibault-megard1/pokedex-ai-v2.git
cd pokedex-ai-v2
npm install
node scripts/download-assets.mjs
npm run dev
```

### Key URLs
- **Home**: http://localhost:3000
- **Pokédex**: http://localhost:3000/pokemon
- **Game**: http://localhost:3000/game
- **Battle**: http://localhost:3000/battle
- **Team**: http://localhost:3000/team
- **Quiz**: http://localhost:3000/quiz
- **AI Health**: http://localhost:3000/api/ai/health

### Key Technologies
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Game**: Phaser 3
- **AI**: Ollama (local) or Mistral AI (cloud)
- **Data**: PokéAPI + local JSON cache
- **Auth**: JWT sessions

---

## 🆘 Need Help?

1. **Installation issues**: See [GETTING_STARTED.md](../GETTING_STARTED.md#-troubleshooting)
2. **AI not working**: Check [ai/ollama-setup.md](ai/ollama-setup.md)
3. **Game issues**: See [GAME_GUIDE.md](GAME_GUIDE.md)
4. **Battle issues**: See [BATTLE_SYSTEM.md](BATTLE_SYSTEM.md)
5. **Development workflow**: See [DEV_CHECKLIST.md](DEV_CHECKLIST.md)

---

## 📝 Documentation Guidelines

When adding new documentation:
1. Use clear, descriptive filenames
2. Include a table of contents for long documents
3. Add code examples where relevant
4. Update this index (README.md)
5. Keep archived docs in `archive/` folder

---

**Happy coding! 🎮⚡**
