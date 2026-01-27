# Pokédex AI - Architecture Overview

## 🏗️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Custom Pokémon Theme** - Official Pokémon aesthetic

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **File-based Database** - JSON storage in `/data`
- **PokéAPI Integration** - Official Pokémon data source

### AI Integration
- **Ollama** (Local) - FREE unlimited AI features
- **Mistral AI** (Cloud) - Optional cloud-based AI
- **Unified LLM System** - Provider-agnostic architecture

## 📁 Project Structure

```
pokedex-ai-v2/
├── app/                      # Next.js App Router
│   ├── api/                  # API endpoints
│   │   ├── ai/              # AI-powered features
│   │   ├── auth/            # Authentication
│   │   ├── battle/          # Battle system
│   │   ├── favorites/       # User favorites
│   │   ├── pokemon/         # Pokémon data
│   │   ├── quiz/            # Personality quiz
│   │   └── team/            # Team management
│   ├── auth/                # Auth pages (login/register)
│   ├── battle/              # Battle page
│   ├── compare/             # Pokémon comparison
│   ├── favorites/           # Favorites page
│   ├── pokemon/             # Pokédex pages
│   │   └── [name]/         # Dynamic Pokémon detail
│   ├── quiz/                # Quiz page
│   ├── stats/               # Statistics page
│   ├── team/                # Team builder page
│   ├── tournament/          # Tournament mode
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/               # Reusable React components
│   ├── NavBar.tsx           # Navigation
│   ├── PokemonCard.tsx      # Pokémon card
│   ├── TypeBadge.tsx        # Type badges
│   ├── EvolutionTree.tsx    # Evolution display
│   └── ...
├── lib/                      # Utility libraries
│   ├── llm/                 # LLM integration
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── ollama.ts        # Ollama client
│   │   ├── mistral-client.ts # Mistral client
│   │   └── index.ts         # Unified LLM router
│   ├── auth.ts              # Authentication logic
│   ├── battle.ts            # Battle mechanics
│   ├── db.ts                # Database utilities
│   ├── pokeapi.ts           # PokéAPI integration
│   ├── rateLimit.ts         # API rate limiting
│   └── types.ts             # Type definitions
├── data/                     # Local JSON database
│   ├── users.json           # User accounts
│   ├── sessions.json        # Active sessions
│   ├── teams.json           # User teams
│   ├── favorites.json       # User favorites
│   ├── notes.json           # Pokémon notes
│   └── pokemon-cache/       # Cached PokéAPI data
├── public/                   # Static assets
│   ├── icons/               # UI icons
│   │   ├── types/          # Type icons
│   │   ├── types-badges/   # Type badges
│   │   └── ui/             # UI icons
│   └── backgrounds/         # Background images
├── docs/                     # Documentation
│   ├── ai/                  # AI-related docs
│   ├── design/              # Design docs
│   ├── features/            # Feature docs
│   ├── archive/             # Historical docs
│   ├── FEATURES.md          # Feature list
│   ├── DEV_CHECKLIST.md     # Development checklist
│   └── ...
└── scripts/                  # Utility scripts
```

## 🔄 Data Flow

### 1. Pokémon Data
```
User Request → Next.js API → PokéAPI → Cache → Response
                                ↓
                           pokemon-cache/
```

### 2. User Authentication
```
Login → POST /api/auth/login → Validate → Create Session → Cookie
                                    ↓
                                users.json
                                sessions.json
```

### 3. AI Features
```
User Input → API Endpoint → Rate Limiter → LLM Router → Provider
                                              ↓
                                        Ollama (local)
                                        OR
                                        Mistral (cloud)
```

## 🎨 Component Architecture

### Page Components
- Server Components by default
- Client Components marked with `"use client"`
- Fetch data in Server Components when possible

### Shared Components
- Located in `/components`
- Reusable across pages
- Props-based configuration

### Style System
- Tailwind utility classes
- Custom `.pokedex-*` classes in `globals.css`
- CSS variables for theming
- Dark mode support via `dark:` prefix

## 🔐 Authentication System

- **Session-based** authentication
- No external auth providers
- Local user storage in `users.json`
- BCrypt password hashing
- HTTP-only cookies for session tokens

## 🤖 AI System

### Unified LLM Architecture
```typescript
interface LLMProvider {
  ollama: OllamaClient;
  mistral: MistralClient;
  openai?: OpenAIClient;
}
```

### Features
- ✅ **Provider Selection** - Auto-detect via env var
- ✅ **Health Checking** - Verify provider availability
- ✅ **Rate Limiting** - Prevent abuse
- ✅ **Error Handling** - Graceful fallbacks
- ✅ **Logging** - Track usage and performance

## 📊 Database Structure

### users.json
```json
[
  {
    "id": "uuid",
    "username": "string",
    "password": "bcrypt-hash",
    "createdAt": "ISO-8601"
  }
]
```

### teams.json
```json
[
  {
    "userId": "uuid",
    "teamId": "uuid",
    "name": "string",
    "pokemon": ["pokemon-id"],
    "createdAt": "ISO-8601"
  }
]
```

### favorites.json
```json
{
  "user-id": ["pokemon-1", "pokemon-2", ...]
}
```

## 🚀 Performance Optimizations

1. **Caching**
   - PokéAPI responses cached in `pokemon-cache/`
   - Reduces API calls and improves speed

2. **Static Assets**
   - Images served from `/public`
   - Type icons and badges pre-loaded

3. **Code Splitting**
   - Next.js automatic code splitting
   - Dynamic imports for heavy components

4. **Server Components**
   - Reduce client-side JavaScript
   - Faster initial page loads

## 🔧 Configuration

### Environment Variables
```bash
# LLM Configuration
LLM_PROVIDER=ollama              # ollama | mistral | openai
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# Optional Cloud AI
MISTRAL_API_KEY=your-key-here

# Security
JWT_SECRET=your-secret-here
```

## 📝 Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Build for Production**
   ```bash
   npm run build
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

## 🧪 Testing Strategy

- Manual testing for features
- Type checking with TypeScript
- Build verification before deployment
- See [DEV_CHECKLIST.md](DEV_CHECKLIST.md) for details

## 🔗 Key Dependencies

- **next** - React framework
- **react** / **react-dom** - UI library
- **typescript** - Type safety
- **tailwindcss** - Styling
- **bcrypt** - Password hashing
- **uuid** - Unique ID generation

## 📚 Further Reading

- [Features](FEATURES.md) - Complete feature list
- [AI Integration](ai/llm-integration.md) - LLM system details
- [Quick Start](quick-start.md) - Setup instructions
- [Dev Checklist](DEV_CHECKLIST.md) - Testing guide
