# Project Structure - Pokédex AI

Complete technical documentation of the application structure for developers and teachers.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Frontend Pages](#frontend-pages)
3. [API Routes](#api-routes)
4. [Components](#components)
5. [Libraries](#libraries)
6. [Game Engine](#game-engine)
7. [Data Storage](#data-storage)
8. [Assets](#assets)
9. [AI Integration](#ai-integration)
10. [Admin Features](#admin-features)

---

## Overview

**Pokédex AI** is a Next.js 14 application with:
- **App Router** architecture
- **Server-side** and **client-side** rendering
- **File-based JSON** database
- **Phaser 3** game engine integration
- **Multi-provider AI system** (Ollama/Mistral)

**Tech Stack:**
- Next.js 14 (React 18, TypeScript)
- Tailwind CSS
- Phaser 3 (game engine)
- PokéAPI integration
- Ollama/Mistral LLM

---

## Frontend Pages

All pages are located in `/app` using the Next.js App Router.

### Public Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Home page with search and features overview |
| `/pokemon` | `app/pokemon/page.tsx` | Pokédex list (browse all Pokémon) |
| `/pokemon/[name]` | `app/pokemon/[name]/page.tsx` | Dynamic Pokémon detail page with stats, types, evolutions |
| `/auth/login` | `app/auth/login/page.tsx` | User login form |
| `/auth/register` | `app/auth/register/page.tsx` | User registration form |

### Authenticated Pages

Require login to access:

| Route | File | Purpose |
|-------|------|---------|
| `/team` | `app/team/page.tsx` | Team builder (max 6 Pokémon) with evolution allocation |
| `/team/share` | `app/team/share/page.tsx` | View shared teams via URL/QR code |
| `/battle` | `app/battle/page.tsx` | 6v6 team battle simulator |
| `/quiz` | `app/quiz/page.tsx` | AI-powered personality quiz |
| `/favorites` | `app/favorites/page.tsx` | User's favorite Pokémon list |
| `/stats` | `app/stats/page.tsx` | User statistics and progress tracking |
| `/game` | `app/game/page.tsx` | Top-down Pokémon adventure game (Phaser 3) |

### Utility Pages

| Route | File | Purpose |
|-------|------|---------|
| `/compare` | `app/compare/page.tsx` | Compare two Pokémon side-by-side |
| `/damage-calculator` | `app/damage-calculator/page.tsx` | Basic damage calculator |
| `/tools` | `app/tools/page.tsx` | Competitive tools hub |
| `/tools/iv-ev` | `app/tools/iv-ev/page.tsx` | IV/EV calculator |
| `/tools/damage` | `app/tools/damage/page.tsx` | Advanced damage calculator |
| `/viewer/3d` | `app/viewer/3d/page.tsx` | 3D Pokémon model viewer |
| `/tournament` | `app/tournament/page.tsx` | Tournament mode (6v6 battles) |
| `/offline` | `app/offline/page.tsx` | PWA offline fallback |

### Special Routes

| Route | File | Purpose |
|-------|------|---------|
| `/assistant` | `app/assistant/page.tsx` | AI assistant chat interface |
| `/admin` | `app/admin/page.tsx` | Admin dashboard (admin users only) |

---

## API Routes

All API routes are in `/app/api` (Next.js serverless functions).

### Authentication

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | User login, returns JWT token |
| `/api/auth/register` | POST | Create new user account |
| `/api/auth/logout` | POST | Destroy session |
| `/api/me` | GET | Get current user info |

**Implementation:** `app/api/auth/*/route.ts`  
**Library:** `lib/auth.ts` - Session management, JWT validation

### Pokémon Data

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/pokemon` | GET | Get Pokémon list |
| `/api/pokemon/[id]` | GET | Get Pokémon by ID |
| `/api/pokemon/cache` | GET | Get from local cache (by ID/name) |
| `/api/autocomplete/pokemon` | GET | Autocomplete suggestions |

**Implementation:** `app/api/pokemon/*/route.ts`  
**Library:** `lib/pokeapi.ts` - PokéAPI integration, caching

### Team Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/team` | GET | Get user's team |
| `/api/team` | PUT | Save user's team |
| `/api/team/validate` | POST | Validate team composition |

**Implementation:** `app/api/team/route.ts`  
**Library:** `lib/db.ts` - Team storage in JSON

### Battle System

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/battle` | POST | Simulate 6v6 team battle |
| `/api/battle/simulate` | POST | Quick battle simulation |

**Implementation:** `app/api/battle/route.ts`  
**Library:** `lib/battle/` - Battle mechanics

### AI Features

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/health` | GET | AI system status check |
| `/api/ai/assistant` | POST | Chat with Pokédex assistant |
| `/api/ai/npc` | POST | NPC dialogue (game integration) |
| `/api/quiz/analyze` | POST | Analyze quiz answers with AI |

**Implementation:** `app/api/ai/*/route.ts`  
**Library:** `lib/llm/` - Unified LLM system

### User Data

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/favorites` | GET | Get user favorites |
| `/api/favorites` | POST | Add/remove favorite |
| `/api/notes` | GET/POST | Pokémon notes |
| `/api/history` | GET | User history |

**Implementation:** `app/api/*/route.ts`  
**Storage:** `data/*.json`

### Game System

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/game/save` | GET | Load game save |
| `/api/game/save` | POST | Save game state |

**Implementation:** `app/api/game/save/route.ts`  
**Library:** `lib/game/saveManager.ts`  
**Storage:** `data/game-saves/`

### Admin

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/assistant-config` | GET/PUT | Assistant configuration |
| `/api/admin/assistant-patches` | GET/PUT | Knowledge patches |
| `/api/admin/users` | GET | List all users |

**Implementation:** `app/api/admin/*/route.ts`  
**Library:** `lib/assistantAdmin.ts`

---

## Components

Reusable React components in `/components`.

### Core UI Components

| Component | File | Purpose |
|-----------|------|---------|
| `NavBar` | `NavBar.tsx` | Navigation bar with AI status |
| `ThemeProvider` | `ThemeProvider.tsx` | Dark/light mode toggle |
| `LanguageProvider` | `LanguageProvider.tsx` | i18n language switching |
| `LanguageSwitcher` | `LanguageSwitcher.tsx` | Language selector UI |

### Pokémon Display

| Component | File | Purpose |
|-----------|------|---------|
| `PokemonCard` | `PokemonCard.tsx` | Pokémon card with sprite, types, stats |
| `PokemonSprite` | `PokemonSprite.tsx` | Animated sprite display |
| `PokemonSpriteDisplay` | `PokemonSpriteDisplay.tsx` | Sprite viewer with forms |
| `PokemonForms` | `PokemonForms.tsx` | Form switcher (Mega, Alola, etc.) |
| `PokemonAutocomplete` | `PokemonAutocomplete.tsx` | Search autocomplete |

### Pokédex Features

| Component | File | Purpose |
|-----------|------|---------|
| `PokedexSearchBar` | `PokedexSearchBar.tsx` | Main search interface |
| `PokedexInfoPanel` | `PokedexInfoPanel.tsx` | Detailed info display |
| `PokedexFlavorText` | `PokedexFlavorText.tsx` | Pokédex descriptions |
| `PokedexSelector` | `PokedexSelector.tsx` | Generation/region selector |

### Type System

| Component | File | Purpose |
|-----------|------|---------|
| `TypeBadge` | `TypeBadge.tsx` | Type badge with icon and color |
| `TypeIcon` | `TypeIcon.tsx` | Type icon only |
| `TypeLogo` | `TypeLogo.tsx` | Large type logo |
| `TypeRelations` | `TypeRelations.tsx` | Type effectiveness chart |

### Evolution & Forms

| Component | File | Purpose |
|-----------|------|---------|
| `EvolutionDisplay` | `EvolutionDisplay.tsx` | Evolution chain display |
| `EvolutionTree` | `EvolutionTree.tsx` | Tree view of evolutions |

### Battle & Stats

| Component | File | Purpose |
|-----------|------|---------|
| `MovesList` | `MovesList.tsx` | Move list with details |
| `MoveDetailModal` | `MoveDetailModal.tsx` | Move detail popup |
| `MoveCategoryBadge` | `MoveCategoryBadge.tsx` | Physical/Special/Status badge |
| `NaturesList` | `NaturesList.tsx` | Nature selector |
| `HeightScale` | `HeightScale.tsx` | Height comparison visual |
| `WeightBalance` | `WeightBalance.tsx` | Weight comparison visual |

### Team Management

| Component | File | Purpose |
|-----------|------|---------|
| `TeamShareModal` | `TeamShareModal.tsx` | QR code sharing modal |
| `TeamStrategyBuilder` | `TeamStrategyBuilder.tsx` | Team strategy planner |

### Admin Tools

| Component | File | Purpose |
|-----------|------|---------|
| `AdminViewProvider` | `AdminViewProvider.tsx` | Admin view context |
| `AdminDebugComponents` | `AdminDebugComponents.tsx` | Debug UI components |
| `AssistantAdminPanel` | `AssistantAdminPanel.tsx` | Assistant config panel |

### Game Components

| Component | Directory | Purpose |
|-----------|-----------|---------|
| Game components | `components/game/` | Phaser game React wrappers |

### Utilities

| Component | File | Purpose |
|-----------|------|---------|
| `RecentPokemon` | `RecentPokemon.tsx` | Recently viewed Pokémon |
| `FavoriteButton` | `FavoriteButton.tsx` | Add to favorites button |
| `PokemonNotes` | `PokemonNotes.tsx` | User notes editor |
| `HistoryTracker` | `HistoryTracker.tsx` | Track user navigation |
| `PWAComponents` | `PWAComponents.tsx` | PWA install banner |
| `AIStatusIndicator` | `AIStatusIndicator.tsx` | AI online/offline indicator |
| `SectionMenu` | `SectionMenu.tsx` | Section navigation menu |
| `MenuGroup` | `MenuGroup.tsx` | Grouped menu items |

---

## Libraries

Utility libraries in `/lib`.

### Core Libraries

| File | Purpose |
|------|---------|
| `auth.ts` | Authentication, session management, JWT |
| `db.ts` | File-based database operations (JSON) |
| `pokeapi.ts` | PokéAPI integration, caching, data fetching |
| `types.ts` | Global TypeScript type definitions |
| `rateLimit.ts` | API rate limiting (in-memory) |
| `i18n.ts` | Internationalization utilities |

### Battle System

| File | Purpose |
|------|---------|
| `battle.ts` | Legacy battle simulator |
| `battle/index.ts` | Modern 6v6 battle system |
| `battle/moves.ts` | Move database and logic |
| `battle/types.ts` | Type effectiveness chart |
| `battle/simulator.ts` | Battle simulation engine |
| `battle/README.md` | Battle system documentation |
| `damageCalculator.ts` | Basic damage calculation |
| `advancedDamageCalculator.ts` | Advanced damage with items, weather, terrain |
| `ivEvCalculator.ts` | IV/EV stat calculator |

### AI System

Located in `lib/llm/`:

| File | Purpose |
|------|---------|
| `index.ts` | Unified LLM router (provider selection) |
| `types.ts` | LLM TypeScript interfaces |
| `ollama.ts` | Ollama client (local, FREE) |
| `mistral-client.ts` | Mistral API client (cloud, paid) |

**How it works:**
1. `index.ts` reads `LLM_PROVIDER` env variable
2. Routes requests to appropriate provider
3. Handles errors gracefully (app works without AI)
4. Supports structured JSON output

### Game Engine

Located in `lib/game/`:

| File | Purpose |
|------|---------|
| `types.ts` | Game TypeScript types |
| `saveManager.ts` | Save/load game state |
| `maps.ts` | Map definitions, encounter tables |
| `scenes/BootScene.ts` | Asset loading scene |
| `scenes/MenuScene.ts` | Title screen |
| `scenes/GameScene.ts` | Main gameplay (movement, NPCs, world) |
| `scenes/BattleScene.ts` | Wild Pokémon battles |
| `MenuManager.ts` | In-game menu system (ESC, Team, Inventory) |

**Phaser 3 Integration:**
- Canvas rendered in React via `components/game/GameCanvas.tsx`
- Scenes communicate via Phaser events
- State persisted in `data/game-saves/{username}.json`

### Specialized Utilities

| File | Purpose |
|------|---------|
| `assistantAdmin.ts` | AI assistant admin controls |
| `backgrounds.ts` | Background image utilities |
| `mistral.ts` | Legacy Mistral integration |
| `qrcode.ts` | QR code generation |
| `teamSharing.ts` | Team encode/decode for sharing |
| `pokedex/` | Pokédex-specific utilities |

---

## Game Engine

The Phaser 3 game is a complete top-down Pokémon-style adventure.

### Game Structure

```
lib/game/
├── types.ts              # Game data types
├── saveManager.ts        # Save/load system
├── maps.ts              # World maps, encounter tables
├── MenuManager.ts       # Menu system (Team, Bag, Pause)
└── scenes/
    ├── BootScene.ts     # Load assets
    ├── MenuScene.ts     # Title screen
    ├── GameScene.ts     # Overworld gameplay
    └── BattleScene.ts   # Wild Pokémon battles
```

### Game Features

**Overworld (GameScene):**
- Keyboard-controlled player movement (arrow keys)
- Tilemap-based world (Tiled JSON format)
- NPC interactions (SPACE key)
- AI-powered NPC dialogue (Ollama integration)
- Wild encounters in tall grass
- Item pickups
- Warp zones (doors, caves)

**Battle System (BattleScene):**
- Turn-based combat
- 4-move selection (1-4 keys)
- Run option (R key)
- Type effectiveness
- XP and leveling
- Move learning
- Animated sprites

**Menu System (MenuManager):**
- Pause menu (ESC)
- Team screen (T)
- Inventory (I)
- On-screen UI buttons

**Save System:**
- Auto-save on actions
- Per-user save files: `data/game-saves/{username}.json`
- Saves: position, team, inventory, flags, progress

### Game Assets

Located in `public/game/`:

```
public/game/
├── ASSET_README.md      # Asset guide
└── assets/
    ├── player/          # Player sprites
    ├── npcs/            # NPC sprites
    ├── tiles/           # Tilemap assets
    ├── ui/              # UI elements (textbox, menu)
    ├── battle/
    │   ├── backgrounds/ # Battle backgrounds
    │   └── pokemon/     # Pokémon sprites (loaded from PokéAPI)
    └── audio/           # Music and SFX
```

### Game Integration

**React → Phaser:**
- `app/game/page.tsx` renders `GameCanvas.tsx`
- Canvas mounts Phaser game instance
- User data passed as props

**Phaser → API:**
- NPC dialogue: `POST /api/ai/npc`
- Save game: `POST /api/game/save`
- Load game: `GET /api/game/save?username={user}`

---

## Data Storage

File-based JSON database in `/data`.

### User Data

| File | Purpose | Structure |
|------|---------|-----------|
| `users.json` | User accounts | `{ username, password (bcrypt), isAdmin }` |
| `sessions.json` | Active sessions | `{ token, username, expiresAt }` |

### Pokémon Data

| File/Folder | Purpose | Structure |
|-------------|---------|-----------|
| `pokemon-names.json` | All Pokémon names (EN + FR) | `{ id, name, frenchName }[]` |
| `pokemon-cache/` | Cached PokéAPI data | `{id}.json` per Pokémon |
| `pokemon-cache/{id}.json` | Individual cache | `{ id, name, types, stats, sprite, ... }` |

### User-Specific Data

| File | Purpose | Structure |
|------|---------|-----------|
| `teams.json` | User teams | `{ username: { pokemon: [], evolutionPoints: 0 } }` |
| `favorites.json` | Favorite Pokémon | `{ username: [pokemonIds] }` |
| `notes.json` | Pokémon notes | `{ username: { pokemonId: "note text" } }` |

### Game Saves

| Folder | Purpose | Structure |
|--------|---------|-----------|
| `game-saves/` | Game save files | `{username}.json` per user |
| `game-saves/{username}.json` | Individual save | `{ position, team, inventory, flags, progress }` |

### Admin Configuration

| File | Purpose |
|------|---------|
| `admin/assistant-config.json` | AI assistant guardrails |
| `admin/assistant-patches.json` | Knowledge corrections |
| `admin/site-settings.json` | Global site settings |

### Data Management

**Read/Write:**
- All data operations in `lib/db.ts`
- Atomic writes (temp file + rename)
- Error handling for corrupted JSON

**Caching Strategy:**
- PokéAPI data cached indefinitely
- User sessions expire after 7 days
- Teams/favorites saved on every update

---

## Assets

Static files in `/public`.

### UI Assets

```
public/
├── icons/
│   ├── types/          # Type icons (fire.svg, water.svg, etc.)
│   ├── types-badges/   # Type badge icons
│   └── ui/             # UI icons (pokeball, star, etc.)
├── backgrounds/        # Page background images
└── manifest.json       # PWA manifest
```

### Type Icons

18 Pokémon types:
- Normal, Fire, Water, Electric, Grass, Ice
- Fighting, Poison, Ground, Flying, Psychic
- Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy

**Formats:**
- SVG (vector, preferred)
- PNG fallback (generated by `scripts/download-assets.mjs`)

### Game Assets

```
public/game/
├── assets/
│   ├── player/         # Player spritesheet (32x32, 4 directions)
│   ├── npcs/           # NPC sprites
│   ├── tiles/          # Tileset (16x16 or 32x32)
│   ├── ui/             # Textbox, menu backgrounds
│   ├── battle/         # Battle backgrounds
│   │   └── backgrounds/  # Grass, cave, water, etc.
│   └── audio/          # Music and sound effects
└── ASSET_README.md     # Asset guide and requirements
```

### PWA Assets

```
public/
├── manifest.json       # PWA configuration
├── sw.js              # Service Worker
├── icon-72x72.png     # PWA icons (72, 96, 128, 144, 152, 192, 384, 512)
└── icon-512x512.png
```

---

## AI Integration

Multi-provider AI system supporting Ollama (local, FREE) and Mistral (cloud, paid).

### Architecture

```
User Request
    ↓
API Route (/api/ai/*)
    ↓
lib/llm/index.ts (Router)
    ↓
    ├─→ lib/llm/ollama.ts (Local)
    └─→ lib/llm/mistral-client.ts (Cloud)
```

### Provider Configuration

**Environment variables:**
```env
# Ollama (FREE, local)
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# OR Mistral (paid, cloud)
LLM_PROVIDER=mistral
MISTRAL_API_KEY=sk-...
MISTRAL_MODEL=mistral-small-latest
```

### AI Features

| Feature | Endpoint | Model Used |
|---------|----------|------------|
| Personality Quiz | `/api/quiz/analyze` | Ollama/Mistral |
| Pokédex Assistant | `/api/ai/assistant` | Ollama/Mistral |
| NPC Dialogue | `/api/ai/npc` | Ollama/Mistral |
| Team Suggestions | `/api/team/suggest` | Ollama/Mistral |

### Ollama Integration

**Setup:**
1. Install Ollama: https://ollama.ai
2. Pull model: `ollama pull mistral`
3. Start service: `ollama serve` (auto-starts on Windows/Mac)
4. Configure `.env.local`

**Benefits:**
- ✅ 100% FREE
- ✅ No API limits
- ✅ Works offline
- ✅ Private (local inference)

### Rate Limiting

Implemented in `lib/rateLimit.ts`:
- **Quiz:** 5 requests/minute per IP
- **General AI:** 20 requests/minute per IP
- In-memory storage (resets on server restart)

### AI Health Check

**Endpoint:** `GET /api/ai/health`

**Response:**
```json
{
  "status": "online",
  "provider": "ollama",
  "model": "mistral",
  "latency": 45,
  "features": ["quiz", "assistant", "npc"]
}
```

**UI Indicator:**
- Green dot: AI online
- Red dot: AI offline
- Located in navbar (top-right)

### Graceful Degradation

App works WITHOUT AI:
- Quiz page shows "AI unavailable" message
- Assistant redirects to manual search
- NPC dialogue uses fallback text
- No crashes or errors

---

## Admin Features

Admin-only tools for debugging and configuration.

### Admin View Mode

**Purpose:** Read-only inspection mode for developers

**Features:**
- Debug overlays on pages
- API response inspection
- Component state visualization
- Performance metrics
- Non-intrusive (collapsible panels)

**Activation:**
1. Login as admin user (`isAdmin: true` in `users.json`)
2. Toggle via "Admin View" button in navbar
3. State saved in localStorage

**Implementation:**
- Provider: `components/AdminViewProvider.tsx`
- Components: `components/AdminDebugComponents.tsx`
- Styling: `.admin-debug-*` classes in `globals.css`

### Assistant Admin Control

**Purpose:** Configure AI assistant behavior

**Features:**
- Guardrails (response filtering)
- Knowledge patches (correct wrong info)
- Intent detection rules
- Response validation

**UI:** `components/AssistantAdminPanel.tsx`

**Configuration files:**
- `data/admin/assistant-config.json`
- `data/admin/assistant-patches.json`

**API:**
- `GET/PUT /api/admin/assistant-config`
- `GET/PUT /api/admin/assistant-patches`

### Admin Pages

| Route | File | Purpose |
|-------|------|---------|
| `/admin` | `app/admin/page.tsx` | Admin dashboard |
| `/admin/users` | (future) | User management |
| `/admin/logs` | (future) | System logs |

---

## Data Flow Examples

### Example 1: User Login

```
1. User submits form at /auth/login
2. POST /api/auth/login { username, password }
3. lib/auth.ts → verifyLogin()
4. lib/db.ts → read data/users.json
5. BCrypt password check
6. lib/auth.ts → createSession()
7. lib/db.ts → write data/sessions.json
8. Return JWT token in cookie
9. Redirect to /team
```

### Example 2: View Pokémon Details

```
1. User clicks Pokémon card
2. Navigate to /pokemon/pikachu
3. Server Component: getPokemonDetail("pikachu")
4. lib/pokeapi.ts → check data/pokemon-cache/pikachu.json
5. If cached: return immediately
6. If not: fetch from PokéAPI
7. Save to cache: data/pokemon-cache/25.json
8. Render page with data
```

### Example 3: AI Quiz

```
1. User completes quiz at /quiz
2. POST /api/quiz/analyze { answers: [...] }
3. lib/rateLimit.ts → check limits
4. lib/llm/index.ts → route to provider
5a. Ollama: POST http://localhost:11434/api/generate
5b. Mistral: POST https://api.mistral.ai/v1/chat/completions
6. Parse structured JSON response
7. Return Pokémon match with reasoning
8. Display result to user
```

### Example 4: Save Team

```
1. User adds Pokémon at /team
2. PUT /api/team { pokemon: [...] }
3. Verify authentication (JWT cookie)
4. lib/db.ts → read data/teams.json
5. Update user's team
6. lib/db.ts → write data/teams.json (atomic)
7. Return success
8. UI updates
```

### Example 5: Wild Battle (Game)

```
1. Player walks in tall grass (GameScene)
2. Random encounter triggered
3. GameScene → scene.start("BattleScene", { enemyId: 25, enemyLevel: 5 })
4. BattleScene → fetch Pokémon data from PokéAPI
5. Render battle UI
6. User selects move (1-4 keys)
7. Damage calculation (lib/damageCalculator.ts)
8. Enemy AI selects move
9. Repeat until win/loss
10. Award XP, return to GameScene
11. POST /api/game/save (auto-save)
```

---

## Environment Variables

Required in `.env.local`:

```env
# Authentication (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key

# AI Provider (OPTIONAL - choose one)
LLM_PROVIDER=ollama               # or "mistral"
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# OR
MISTRAL_API_KEY=sk-your-key
MISTRAL_MODEL=mistral-small-latest

# Development (OPTIONAL)
NODE_ENV=development
```

---

## Dependencies

**Core:**
- `next` - Next.js framework
- `react` - React library
- `typescript` - Type safety
- `tailwindcss` - Styling

**Game:**
- `phaser` - Game engine

**Utilities:**
- `bcryptjs` - Password hashing
- `jose` - JWT tokens
- `clsx` - Conditional classes

**AI:**
- `@mistralai/mistralai` - Mistral SDK
- (Ollama: no SDK, uses fetch)

---

## Scripts

Located in `/scripts`.

| Script | Command | Purpose |
|--------|---------|---------|
| `generate-pokemon-cache.mjs` | `node scripts/generate-pokemon-cache.mjs 1 1025` | Pre-cache Pokémon data from PokéAPI |
| `download-assets.mjs` | `node scripts/download-assets.mjs` | Download UI assets (type icons, etc.) |

---

## Build & Deployment

**Development:**
```bash
npm install
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

**Static Export (optional):**
```bash
npm run build
npm run export
```

**Docker (future):**
```bash
docker build -t pokedex-ai .
docker run -p 3000:3000 pokedex-ai
```

---

## Key Architectural Decisions

1. **File-based database** - Simple, no DB server needed, easy deployment
2. **Unified LLM system** - Swap AI providers without changing app code
3. **PokéAPI caching** - Reduce API calls, improve performance
4. **Server Components first** - Fetch data server-side when possible
5. **Phaser in React** - Canvas-based game engine integrated with Next.js
6. **PWA support** - Offline-first, installable web app
7. **Admin View** - Read-only debug mode for developers
8. **Type-safe** - TypeScript everywhere for reliability

---

## Documentation Links

- [README.md](README.md) - Project overview and setup
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical architecture
- [docs/FEATURES.md](docs/FEATURES.md) - Feature list
- [docs/BATTLE_SYSTEM.md](docs/BATTLE_SYSTEM.md) - Battle mechanics
- [docs/GAME_GUIDE.md](docs/GAME_GUIDE.md) - Game implementation
- [docs/ai/llm-integration.md](docs/ai/llm-integration.md) - AI system
- [docs/ai/ollama-setup.md](docs/ai/ollama-setup.md) - Ollama installation

---

**Last Updated:** February 2026  
**Version:** 2.0  
**Maintainer:** Development Team
