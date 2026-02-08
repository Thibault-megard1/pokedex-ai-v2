# 🚀 Pokédex Feature - Quick Start Guide

## For Users

### How to Use

1. **Visit any Pokémon page**
   ```
   http://localhost:3000/pokemon/25  (Pikachu)
   http://localhost:3000/pokemon/1   (Bulbasaur)
   ```

2. **View the Pokédex description**
   - Displayed in a retro Pokédex screen
   - Shows game version source
   - French by default

3. **Change the source**
   - Click "Changer la source" button
   - Select your preferred generation (1-9)
   - Select a specific game version
   - See live preview
   - Click "Définir par défaut" to save your choice

4. **Your preference is saved**
   - Applies to all Pokémon
   - Persists across sessions
   - Can be changed anytime

---

## For Developers

### Running the Project

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Open browser
http://localhost:3000/pokemon/25
```

### Testing the Feature

**Browser Console Test:**
```javascript
// Run automated tests
testPokedexFeature()
```

**Manual Test:**
1. Visit `/pokemon/25`
2. Check console for errors
3. Click "Changer la source"
4. Select "Génération 4" → "Platine"
5. Verify preview updates
6. Click "Définir par défaut"
7. Refresh page
8. Verify preference persists

### API Endpoints

```bash
# Get all metadata (generations, versions)
GET /api/pokedex-metadata

# Get species data for Pikachu
GET /api/pokemon-species/25

# Get species data for Bulbasaur
GET /api/pokemon-species/1
```

### File Structure

```
📁 lib/
  ├── pokedexMetadata.ts        (metadata management)
  └── pokedexFlavorText.ts      (selection logic)

📁 app/api/
  ├── pokedex-metadata/route.ts (metadata API)
  └── pokemon-species/[id]/route.ts (species API)

📁 components/
  ├── PokedexSelector.tsx       (modal component)
  ├── PokedexFlavorText.tsx     (main display)
  └── PokedexInfoPanel.tsx      (info panel)

📁 data/pokemon-cache/
  ├── species/                  (cached species data)
  └── meta/                     (cached metadata)
```

---

## Common Tasks

### Clear Cache
```bash
# Clear metadata cache (will refetch from PokéAPI)
rm -rf data/pokemon-cache/meta/

# Clear species cache
rm -rf data/pokemon-cache/species/

# Restart server to rebuild
npm run dev
```

### Clear User Preference
```javascript
// In browser console
localStorage.removeItem('pokedexDisplayPref')
// Refresh page
```

### Check Preference
```javascript
// In browser console
JSON.parse(localStorage.getItem('pokedexDisplayPref'))
```

### Add New Version Name Translation
```typescript
// In lib/pokedexMetadata.ts
const VERSION_DISPLAY_NAMES: Record<string, string> = {
  // ... existing entries
  "new-version": "Nouveau Jeu",  // Add here
};
```

---

## Supported Generations & Regions

| Gen | Region | Example Pokémon |
|-----|--------|-----------------|
| I   | Kanto  | Pikachu (#25), Bulbasaur (#1) |
| II  | Johto  | Chikorita (#152), Cyndaquil (#155) |
| III | Hoenn  | Treecko (#252), Torchic (#255) |
| IV  | Sinnoh | Turtwig (#387), Piplup (#393) |
| V   | Unova  | Snivy (#495), Tepig (#498) |
| VI  | Kalos  | Chespin (#650), Fennekin (#653) |
| VII | Alola  | Rowlet (#722), Litten (#725) |
| VIII| Galar  | Grookey (#810), Scorbunny (#813) |
| IX  | Paldea | Sprigatito (#906), Fuecoco (#909) |

---

## Troubleshooting

### Problem: Modal doesn't open
**Solution**: Check browser console for errors. Verify API is running.

### Problem: Descriptions in wrong language
**Solution**: 
```javascript
localStorage.removeItem('pokedexDisplayPref')
```

### Problem: Version not showing
**Solution**: That Pokémon may not exist in that generation. Try a different version.

### Problem: "Description indisponible"
**Solution**: 
1. Check internet connection (first fetch needs PokéAPI)
2. Check if species data exists
3. Check browser console for errors

### Problem: Cache not updating
**Solution**:
```bash
rm -rf data/pokemon-cache/meta/
npm run dev
```

---

## Examples

### Example 1: Pikachu from Platinum
```
URL: /pokemon/25
Preference: Generation IV, Platine
Result: French description from Pokémon Platinum
```

### Example 2: Bulbasaur from Red
```
URL: /pokemon/1
Preference: Generation I, Rouge
Result: French description from Pokémon Red (if available)
```

### Example 3: Greninja from X
```
URL: /pokemon/658
Preference: Generation VI, X
Result: French description from Pokémon X
```

---

## Performance Tips

### First Load
- Metadata fetched once (~2s)
- Species data fetched once per Pokémon (~500ms)
- Total: ~2.5s on first visit

### Cached Load
- Metadata from disk (<50ms)
- Species from disk (<50ms)
- Total: ~100ms on subsequent visits

### Optimization
- Server-side caching (automatic)
- No client-side refetching
- Parallel API calls where possible

---

## Best Practices

### For Users
1. Set your preferred generation once
2. Explore different versions for fun
3. French preferred, English fallback automatic

### For Developers
1. Never delete cache files in production
2. Test with multiple Pokémon IDs
3. Test on mobile devices
4. Check dark mode rendering
5. Verify accessibility

---

## Additional Resources

- **Full Documentation**: `POKEDEX_IMPLEMENTATION_SUMMARY.md`
- **Quick Reference**: `docs/POKEDEX_QUICK_REFERENCE.md`
- **Feature Spec**: `docs/POKEDEX_FEATURE_COMPLETE.md`
- **PokéAPI Docs**: https://pokeapi.co/docs/v2

---

## Support

### Need Help?
1. Check this guide first
2. Review the main summary document
3. Check browser console for errors
4. Verify API endpoints are accessible

### Feature Requests
This implementation covers all current PokéAPI data. Future enhancements could include:
- Side-by-side version comparison
- Search by description
- Evolution of descriptions over time
- More languages

---

**Ready to explore?** Visit `/pokemon/25` and start discovering Pokédex entries! 🎮
