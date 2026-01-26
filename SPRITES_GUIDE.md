# Gestion des Sprites Pokémon

## Problème
Certains Pokémon n'ont pas de sprites disponibles dans l'API de base.

## Solutions implémentées

### 1. Fallback automatique côté serveur (lib/pokeapi.ts)
Le système essaie automatiquement plusieurs sources dans l'ordre :
- `sprites.front_default` (défaut PokéAPI)
- `sprites.other.official-artwork.front_default` (artwork officiel)
- `sprites.other.home.front_default` (sprites Home)
- `sprites.other.dream_world.front_default` (Dream World)
- `sprites.other.showdown.front_default` (Showdown compétitif)
- Repository GitHub PokéAPI (URL directe)

### 2. Composant React avec fallback (components/PokemonSprite.tsx)
Utilise le composant `PokemonSprite` pour afficher un sprite avec fallback automatique côté client :

```tsx
import PokemonSprite from "@/components/PokemonSprite";

<PokemonSprite
  src={pokemon.sprite}
  alt={pokemon.name}
  pokemonId={pokemon.id}
  pokemonName={pokemon.name}
  width={96}
  height={96}
/>
```

Le composant :
- Essaie plusieurs sources automatiquement
- Affiche un placeholder SVG si aucune source ne fonctionne
- Gère les erreurs de chargement d'images

### 3. Sources alternatives disponibles

#### Repository GitHub officiel (toujours disponible)
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/{id}.png
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/{id}.png
```

#### Official Artwork (haute qualité)
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png
```

#### Home Sprites
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/{id}.png
```

#### Showdown Sprites (animés GIF)
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/{id}.gif
```

### 4. Ajouter manuellement des sprites personnalisés

Si vous voulez ajouter vos propres sprites :

1. Créez un dossier `public/custom-sprites/`
2. Ajoutez vos images : `{pokemon-name}.png`
3. Modifiez le fallback dans `lib/pokeapi.ts` :

```typescript
const sprite = 
  pokemon.sprites?.front_default ??
  `/custom-sprites/${pokemon.name}.png` ??
  // ... autres fallbacks
```

### 5. Vider le cache pour forcer le reload

Si vous avez ajouté de nouvelles sources, videz le cache :

```powershell
Remove-Item "data/pokemon-cache/*.json"
```

## Utilisation dans les composants existants

### PokemonCard.tsx
```tsx
import PokemonSprite from "@/components/PokemonSprite";

// Remplacer Image par PokemonSprite
<PokemonSprite
  src={pokemon.sprite}
  alt={pokemon.name}
  pokemonId={pokemon.id}
  pokemonName={pokemon.name}
  width={80}
  height={80}
/>
```

### Page Pokémon detail
```tsx
<PokemonSprite
  src={pokemon.sprite}
  alt={pokemon.name}
  pokemonId={pokemon.id}
  pokemonName={pokemon.name}
  width={200}
  height={200}
  priority={true}
/>
```

## Avantages

✅ **Aucun Pokémon sans sprite** : Le système garantit toujours un visuel
✅ **Haute qualité** : Utilise official-artwork quand disponible
✅ **Fallback automatique** : Pas besoin de gérer manuellement
✅ **Performance** : Cache côté serveur + lazy loading côté client
✅ **Personnalisable** : Facile d'ajouter vos propres sources

## Sources de sprites externes (alternatives)

Si les sources GitHub ne fonctionnent pas, voici d'autres options :

1. **PokéSprite** : https://github.com/msikma/pokesprite
2. **Serebii.net** : https://www.serebii.net/pokemon/
3. **Bulbapedia** : https://bulbapedia.bulbagarden.net/
4. **Project Pokémon** : https://projectpokemon.org/home/docs/spriteindex/

**Note** : Vérifiez les licences avant d'utiliser des sprites externes !
