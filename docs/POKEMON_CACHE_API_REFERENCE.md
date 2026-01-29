# Quick Reference: Pokemon Cache API

## Client-Side Usage

### ❌ OLD (Don't do this - causes 404)
```tsx
// Direct file access - DOESN'T WORK
const response = await fetch(`/data/pokemon-cache/${id}.json`);
```

### ✅ NEW (Correct way)
```tsx
// Use API endpoint
const response = await fetch(`/api/pokemon/cache?id=${id}`);
const data = await response.json();
// data = { id, name, frenchName, sprite, types }
```

## API Endpoints

### Get Pokemon by ID
```
GET /api/pokemon/cache?id=1
```

### Get Pokemon by Name
```
GET /api/pokemon/cache?name=bulbasaur
```

### Response Format
```json
{
  "id": 1,
  "name": "bulbasaur",
  "frenchName": "Bulbizarre",
  "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
  "types": ["grass", "poison"]
}
```

## Server-Side Usage

### In API Routes or Server Components
```tsx
import { getPokemonFromCache } from '@/lib/server/pokemonCache';

// Get single Pokemon
const pokemon = await getPokemonFromCache(1);
// or
const pokemon = await getPokemonFromCache('bulbasaur');

// Get multiple Pokemon
import { getMultiplePokemonFromCache } from '@/lib/server/pokemonCache';
const pokemons = await getMultiplePokemonFromCache([1, 2, 3]);

// Check if cached
import { isPokemonCached } from '@/lib/server/pokemonCache';
const isCached = await isPokemonCached(1);
```

## Error Handling

```tsx
try {
  const response = await fetch('/api/pokemon/cache?id=1');
  
  if (!response.ok) {
    if (response.status === 404) {
      console.error('Pokemon not found');
    } else if (response.status === 400) {
      console.error('Invalid parameters');
    }
    throw new Error('Failed to fetch pokemon');
  }
  
  const data = await response.json();
  // Use data...
} catch (error) {
  console.error('Error fetching pokemon:', error);
}
```

## Common Patterns

### Autocomplete/Search Component
```tsx
const loadPokemonNames = async () => {
  const promises = pokemonIds.map(id => 
    fetch(`/api/pokemon/cache?id=${id}`)
      .then(r => r.json())
      .catch(() => null)
  );
  const results = await Promise.all(promises);
  const validResults = results.filter(Boolean);
  // Use validResults...
};
```

### Pokemon Detail Page
```tsx
// Server Component
import { getPokemonFromCache } from '@/lib/server/pokemonCache';

export default async function PokemonPage({ params }) {
  const pokemon = await getPokemonFromCache(params.name);
  return <div>{pokemon.name}</div>;
}
```

## Important Notes

⚠️ **NEVER import `lib/server/pokemonCache.ts` in Client Components**
- Use API routes instead (`/api/pokemon/cache`)
- Server utilities are for API routes and Server Components only

✅ **Cache location remains private**
- Physical path: `./data/pokemon-cache/`
- Not in `/public` directory
- Accessed via Node.js `fs` module server-side only

✅ **No changes to cache structure**
- Files still stored as `<id>.json` or `<name>.json`
- Format unchanged
- Existing cache files work as-is
