# 🚀 Quick Start Guide - Pokédex AI Pro

## ⚡ Installation & Setup (5 minutes)

### 1. Install Dependencies
```bash
cd "c:\Users\pc\OneDrive\Documents\ISEN\5 eme année\Integration IA\pokedex-ai-v3\pokedex-ai-v2"
npm install --legacy-peer-deps
```

### 2. Configure AI (Optional)
Create `.env.local`:
```bash
MISTRAL_API_KEY=your_key_here
```
Get key: https://console.mistral.ai/

### 3. Run
```bash
npm run dev
```
Visit: http://localhost:3000

---

## 🎯 Feature Quick Access

### New Routes
| Feature | URL | Description |
|---------|-----|-------------|
| **Tools Hub** | `/tools` | All competitive tools |
| **IV/EV Calculator** | `/tools/iv-ev` | Stat calculator |
| **Damage Calculator** | `/tools/damage` | Advanced damage calc |
| **3D Viewer** | `/viewer/3d` | 3D Pokemon viewer |
| **AI Hub** | `/ai` | AI features overview |
| **AI Assistant** | `/assistant` | Chatbot |
| **Team Share** | `/team/share?data=...` | View shared teams |
| **Offline** | `/offline` | Offline fallback |

### Existing Routes (Enhanced)
| Feature | URL | New Features |
|---------|-----|--------------|
| **Team Builder** | `/team` | + Share/Import buttons |
| **Pokédex** | `/pokemon` | Works offline (PWA) |
| **Battle** | `/battle` | AI commentator ready |
| **Quiz** | `/quiz` | AI adaptive mode |

---

## 📱 PWA Features

### Install
- **Desktop:** Click install icon in browser
- **Mobile:** "Add to Home Screen"

### Offline Mode
1. Install PWA
2. Visit pages once (they get cached)
3. Disconnect internet
4. App still works!

**Cached by default:** `/`, `/pokemon`, `/team`, `/battle`

---

## 🤖 AI Features Usage

### Prerequisites
```bash
# .env.local
MISTRAL_API_KEY=your_mistral_key
```

### AI Assistant
1. Visit `/assistant`
2. Type questions about Pokemon
3. Get instant AI responses

**Example questions:**
- "Quels types sont forts contre Dragon ?"
- "Comment calculer les IVs ?"
- "Où trouver le team builder ?"

### Team Builder AI (API Ready)
```bash
POST /api/ai/team-builder
{
  "currentTeam": [{"id": 25, "name": "pikachu"}],
  "evolutionPoints": 0
}
```

### Adaptive Quiz
```bash
POST /api/ai/quiz
{
  "difficulty": "medium",
  "previousAnswers": []
}
```

---

## 🧮 Calculator Quick Reference

### IV/EV Calculator
**Formulas Used:**
```
HP = ((2*Base + IV + EV/4) * Level / 100) + Level + 10
Other = ((2*Base + IV + EV/4) * Level / 100 + 5) * Nature
```

**EV Spreads:**
- Sweeper: 252 Atk / 252 Spe / 4 HP
- Tank: 252 HP / 252 Def / 4 SpD
- Balanced: 252 HP / 128 Def / 128 SpD

### Damage Calculator
**Modifiers:**
- Weather: ×0.5 to ×1.5
- Terrain: ×1.3 (if grounded)
- Screens: ×0.5
- Items: ×1.3 to ×1.5
- STAB: ×1.5

---

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Type check
npm run typecheck

# Build production
npm run build

# Run all checks
npm run smoke-test

# Generate PWA icons
node scripts/generate-pwa-icons.mjs
```

---

## 🧪 Quick Test Checklist

**5-Minute Smoke Test:**
1. ✅ Load homepage
2. ✅ Search Pokemon
3. ✅ Build team (add 3 Pokemon)
4. ✅ Share team (copy URL)
5. ✅ Visit `/tools/iv-ev`
6. ✅ Visit `/assistant` (if AI configured)
7. ✅ Install PWA
8. ✅ Test offline (disconnect & reload)

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `docs/FEATURES.md` | Complete feature list |
| `docs/IMPLEMENTATION_COMPLETE.md` | Full implementation details |
| `docs/DEV_CHECKLIST.md` | Testing procedures |
| `docs/PHASE_2_COMPLETE.md` | Team sharing details |

---

## 🐛 Common Issues

### "MISTRAL_API_KEY non configurée"
**Fix:** Add key to `.env.local` and restart server

### PWA not installing
**Fix:** Use HTTPS or localhost, check manifest in DevTools

### EVs > 510 error
**Fix:** This is intentional - max 510 EVs per Pokemon

### 3D model not loading
**Fix:** Expected - 3D models use sprite fallback (not available via API)

---

## 📊 File Structure Overview

```
pokedex-ai-v2/
├── app/
│   ├── tools/         # 🆕 Calculators & tools
│   ├── ai/            # 🆕 AI features hub
│   ├── assistant/     # 🆕 AI chatbot
│   ├── viewer/        # 🆕 3D viewer
│   ├── team/          # ✨ Enhanced with share
│   └── api/ai/        # 🆕 AI endpoints
├── lib/
│   ├── mistralAI.ts           # 🆕 AI integration
│   ├── ivEvCalculator.ts      # 🆕 IV/EV formulas
│   ├── advancedDamageCalculator.ts  # 🆕 Damage calc
│   ├── teamSharing.ts         # 🆕 Team encode/decode
│   └── qrcode.ts              # 🆕 QR generation
├── public/
│   ├── manifest.json  # 🆕 PWA config
│   ├── sw.js          # 🆕 Service worker
│   └── icons/         # 🆕 PWA icons
└── docs/              # 🆕 Documentation
```

---

## 🎉 What's New

### Phase 1: PWA ✅
- Installable app
- Offline mode
- Service worker caching

### Phase 2: Sharing ✅
- QR codes
- Base64 encoding
- Import/Export teams

### Phase 3: IV/EV Calc ✅
- Official formulas
- Real-time validation
- Common spreads

### Phase 4: Damage Calc Pro ✅
- Advanced modifiers
- Weather/Terrain/Screens
- KO chance

### Phase 5: 3D Viewer ✅
- Sprite fallback
- Ready for Three.js

### Phase 6: AI Features ✅
- Chatbot assistant
- Team builder API
- Adaptive quiz
- Battle commentator

### Phase 7: Navigation ✅
- Tools hub
- AI hub
- Clear structure

### Phase 8: Quality ✅
- Full documentation
- Smoke tests
- Type checking

---

## 🚀 Next Steps

1. **Test locally:** Run `npm run dev`
2. **Configure AI:** Add Mistral key (optional)
3. **Install PWA:** Test offline mode
4. **Explore features:** Try all calculators
5. **Read docs:** Check `docs/FEATURES.md`

---

## 💡 Pro Tips

- **Offline:** Install PWA for full offline support
- **Performance:** Use common EV spreads for quick setup
- **AI:** Ask contextual questions for best results
- **Sharing:** QR codes work great for mobile
- **Calculators:** Try different weather/terrain combos

---

## 📞 Need Help?

1. Check `docs/FEATURES.md` for details
2. Review code comments
3. Test with `npm run smoke-test`
4. Verify no TypeScript errors

---

**Version:** 2.0.0 - Pokédex AI Pro  
**Status:** ✅ Production Ready  
**Last Updated:** January 2026
