# Quick Reference: Pokédex Feature

## Files Modified/Created

### API Routes
- `app/api/pokedex-metadata/route.ts` - Metadata endpoint
- `app/api/pokemon-species/[id]/route.ts` - Species data endpoint

### Core Libraries
- `lib/pokedexMetadata.ts` - Generation/version metadata system
- `lib/pokedexFlavorText.ts` - Flavor text selection logic

### Components
- `components/PokedexSelector.tsx` - Generation/version selector modal
- `components/PokedexFlavorText.tsx` - Updated flavor text display
- `components/PokedexInfoPanel.tsx` - Additional Pokémon info

### Pages
- `app/pokemon/[name]/page.tsx` - Added PokedexInfoPanel

---

## How It Works

### Generation & Version Selection Flow

1. **User Opens Pokémon Detail Page**
   - Loads preference from `localStorage.getItem('pokedexDisplayPref')`
   - Fetches species data from `/api/pokemon-species/{id}`
   - Fetches metadata from `/api/pokedex-metadata`

2. **User Clicks "Changer la source"**
   - Opens PokedexSelector modal
   - Shows dropdowns for generation and version
   - Live preview updates as user selects

3. **User Clicks "Définir par défaut"**
   - Saves preference to localStorage
   - Updates display immediately
   - Preference persists across all Pokémon pages

### Selection Algorithm

```typescript
function selectBestFlavorText(entries, preference, versionGroups) {
  // 1. Filter by language (fr → en fallback)
  // 2. Deduplicate identical texts
  // 3. Try to match:
  //    - Exact version
  //    - Version group
  //    - Generation
  //    - First available
}
```

---

## All Supported Generations & Versions

| Gen | Region  | Versions |
|-----|---------|----------|
| I   | Kanto   | Rouge, Bleu, Jaune |
| II  | Johto   | Or, Argent, Cristal |
| III | Hoenn   | Rubis, Saphir, Émeraude, Rouge Feu, Vert Feuille |
| IV  | Sinnoh  | Diamant, Perle, Platine, Or HeartGold, Argent SoulSilver |
| V   | Unova   | Noir, Blanc, Noir 2, Blanc 2 |
| VI  | Kalos   | X, Y, Rubis Oméga, Saphir Alpha |
| VII | Alola   | Soleil, Lune, Ultra-Soleil, Ultra-Lune, Let's Go Pikachu, Let's Go Évoli |
| VIII| Galar   | Épée, Bouclier, Diamant Étincelant, Perle Scintillante, Légendes Arceus |
| IX  | Paldea  | Écarlate, Violet |

---

## Testing Checklist

- [ ] Visit `/pokemon/25` (Pikachu) - should load with default preference
- [ ] Click "Changer la source" - modal should open
- [ ] Select "Génération 4" - version dropdown should populate with Gen 4 games
- [ ] Select "Platine" - preview should update
- [ ] Click "Définir par défaut" - preference should save
- [ ] Refresh page - preference should persist
- [ ] Visit `/pokemon/1` (Bulbasaur) - should use saved preference
- [ ] Switch to English - should show English descriptions
- [ ] Check mobile view - modal should be responsive
- [ ] Check dark mode - UI should adapt

---

## Cache Locations

```
data/pokemon-cache/
├── species/
│   ├── 1.json (Bulbasaur)
│   ├── 25.json (Pikachu)
│   └── ...
└── meta/
    ├── generations.json (all 9 generations)
    ├── version-groups.json (all version groups)
    └── versions.json (all individual versions)
```

---

## API Responses

### GET /api/pokedex-metadata
```json
{
  "generations": [
    { "id": 1, "name": "generation-i", "region": "Kanto", "versionGroups": [...] },
    ...
  ],
  "versionGroups": [
    { "name": "red-blue", "generation": "generation-i", "versions": [...], "order": 1 },
    ...
  ],
  "versions": [
    { "name": "red", "url": "..." },
    ...
  ]
}
```

### GET /api/pokemon-species/25
```json
{
  "id": 25,
  "name": "pikachu",
  "names": [
    { "name": "Pikachu", "language": { "name": "fr" } },
    ...
  ],
  "genera": [
    { "genus": "Pokémon Souris", "language": { "name": "fr" } },
    ...
  ],
  "flavor_text_entries": [
    { 
      "flavor_text": "Il élève sa queue...",
      "language": { "name": "fr" },
      "version": { "name": "violet" }
    },
    ...
  ],
  ...
}
```

---

## Common Issues & Solutions

### Issue: Modal not opening
**Solution**: Check browser console for errors. Ensure `/api/pokedex-metadata` is accessible.

### Issue: Descriptions in wrong language
**Solution**: Check localStorage preference. Clear it if corrupted: `localStorage.removeItem('pokedexDisplayPref')`

### Issue: Cache not updating
**Solution**: Delete cache files in `data/pokemon-cache/meta/` and restart server.

### Issue: Version not found
**Solution**: Ensure version name matches PokéAPI format (lowercase, hyphenated).

---

## Future TODOs (Optional)

- [ ] Add version comparison view
- [ ] Sync preferences to user account
- [ ] Add search by description feature
- [ ] Show description evolution across generations
- [ ] Add more regions as PokéAPI expands
