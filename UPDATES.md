# Nouveautés implémentées

## 1. Navigation étendue (1-10325)

### Cycle de navigation
- **Ancien** : 1 → 1025 → 1 (boucle simple)
- **Nouveau** : 1 → 1025 → 10001 → 10325 → 1

Le système saute automatiquement de 1025 à 10001 et revient à 1 après 10325.

**Fichier modifié** : [lib/pokeapi.ts](lib/pokeapi.ts#L432-L447)

```typescript
export async function getAdjacentPokemonId(id: number, dir: "prev" | "next") {
  const MIN = 1;
  const MAX = 10325;

  if (dir === "next") {
    if (id === 1025) return 10001; // Saut vers les formes spéciales
    if (id >= MAX) return MIN;
    return id + 1;
  }

  if (id === 10001) return 1025;
  if (id <= MIN) return MAX;
  return id - 1;
}
```

---

## 2. Noms français

### Affichage bilingue
Les noms français sont maintenant affichés partout :

**Pages concernées** :
- [pokemon/[name]/page.tsx](app/pokemon/[name]/page.tsx) - Page détail avec nom français sous le nom anglais
- [components/PokemonCard.tsx](components/PokemonCard.tsx) - Cartes avec nom français en petit
- [components/PokemonAutocomplete.tsx](components/PokemonAutocomplete.tsx) - Recherche avec noms français

### Recherche multilingue
L'autocomplétion recherche maintenant dans les noms anglais ET français :
- Taper "bulb" → trouve "bulbasaur"
- Taper "bulbi" → trouve "bulbasaur" (via "Bulbizarre")
- Les deux noms s'affichent dans la liste déroulante

**Type ajouté** : [lib/types.ts](lib/types.ts#L25)
```typescript
export type PokemonBasic = {
  id: number;
  name: string;
  frenchName?: string | null; // ⭐ NOUVEAU
  sprite: string | null;
  // ...
}
```

**Récupération** : [lib/pokeapi.ts](lib/pokeapi.ts#L222)
```typescript
const frenchName = species.names?.find((n: any) => n.language?.name === "fr")?.name ?? null;
```

---

## 3. Formes alternatives (Mega, Gigamax, Régionales)

### Types de formes supportées

✅ **Méga-Évolutions** : Charizard-Mega-X, Blastoise-Mega, etc.
✅ **Gigamax** : Charizard-Gmax, Pikachu-Gmax, etc.
✅ **Formes régionales** : Raichu-Alola, Ponyta-Galar, Typhlosion-Hisui, Tauros-Paldea, etc.
✅ **Autres formes** : Castform météo, Deoxys formes, etc.

### Composant d'affichage

**Nouveau composant** : [components/PokemonForms.tsx](components/PokemonForms.tsx)

Fonctionnalités :
- Groupement par catégorie (Mega / Gigamax / Régionales / Autres)
- Grille responsive avec cartes cliquables
- Modal avec stats complètes de la forme
- Lien vers la page dédiée de la forme

### Type de données

**Type ajouté** : [lib/types.ts](lib/types.ts#L40-L50)
```typescript
export type PokemonForm = {
  id: number;
  name: string;
  frenchName?: string | null;
  formName: string; // "Méga-Évolution", "Gigamax", "Forme d'Alola", etc.
  sprite: string | null;
  types: string[];
  stats: { name: string; value: number }[];
  isMega?: boolean;
  isGmax?: boolean;
  isRegionalForm?: boolean;
};
```

### Récupération des formes

[lib/pokeapi.ts](lib/pokeapi.ts#L225-L280)

Le système :
1. Récupère `species.varieties` depuis PokéAPI
2. Filtre la forme par défaut (déjà affichée)
3. Fetch les données de chaque variété
4. Détermine automatiquement le type de forme
5. Traduit le nom de la forme en français

### Intégration dans la page

[app/pokemon/[name]/page.tsx](app/pokemon/[name]/page.tsx#L143-L149)

```tsx
{p.forms && p.forms.length > 0 && (
  <div className="card p-5">
    <PokemonForms forms={p.forms} pokemonName={p.name} />
  </div>
)}
```

---

## 4. Validation du cache

Le cache vérifie maintenant la présence des nouveaux champs :

[lib/pokeapi.ts](lib/pokeapi.ts#L119-L129)

```typescript
if (cached.moves !== undefined && 
    cached.natures !== undefined && 
    cached.shinySprite !== undefined &&
    cached.frenchName !== undefined &&    // ⭐ NOUVEAU
    cached.forms !== undefined) {         // ⭐ NOUVEAU
  return cached;
}
```

Si un champ manque, le cache est invalidé et les données sont rechargées depuis l'API.

---

## Utilisation

### Navigation
```
Pokémon 1 → 2 → ... → 1025 → 10001 → 10002 → ... → 10325 → 1
```

### Recherche
```
"pika" → Pikachu (25)
"cara" → Carabaffe (8) via nom français
"bulbi" → Bulbizarre (1)
```

### Formes alternatives

Exemples de Pokémon avec formes :
- **Charizard** (6) : Mega-X, Mega-Y, Gigamax
- **Mewtwo** (150) : Mega-X, Mega-Y
- **Raichu** (26) : Forme d'Alola
- **Darmanitan** (555) : Mode Zen, Forme de Galar
- **Castform** (351) : Soleil, Pluie, Neige

---

## Fichiers créés

1. [components/PokemonForms.tsx](components/PokemonForms.tsx) - Composant d'affichage des formes
2. [SPRITES_GUIDE.md](SPRITES_GUIDE.md) - Guide pour les sprites
3. [lib/spriteUtils.ts](lib/spriteUtils.ts) - Utilitaires sprites
4. [components/PokemonSprite.tsx](components/PokemonSprite.tsx) - Composant sprite avec fallback

## Fichiers modifiés

1. [lib/types.ts](lib/types.ts) - Ajout de `frenchName` et `PokemonForm`
2. [lib/pokeapi.ts](lib/pokeapi.ts) - Récupération des noms français et formes
3. [lib/typeStyle.ts](lib/typeStyle.ts) - Export de `typeColors`
4. [app/pokemon/[name]/page.tsx](app/pokemon/[name]/page.tsx) - Affichage des formes
5. [components/PokemonCard.tsx](components/PokemonCard.tsx) - Affichage nom français
6. [components/PokemonAutocomplete.tsx](components/PokemonAutocomplete.tsx) - Recherche multilingue

---

## Actions à faire

### 1. Vider le cache
```powershell
Remove-Item "data\pokemon-cache\*.json"
```

### 2. Tester la navigation
- Aller sur Pokémon #1025 → Suivant → devrait afficher #10001
- Aller sur Pokémon #10325 → Suivant → devrait afficher #1
- Aller sur Pokémon #10001 → Précédent → devrait afficher #1025

### 3. Tester la recherche française
- Taper "cara" → devrait trouver Carabaffe
- Taper "salame" → devrait trouver Salamèche

### 4. Tester les formes
- Aller sur Charizard (#6) → voir Mega-X, Mega-Y, Gigamax
- Cliquer sur une forme → voir les stats
- Cliquer "Voir la page complète" → accéder à la forme

---

## Performance

⚠️ **Note** : La récupération des formes alternatives peut prendre quelques secondes lors du premier chargement (appels API multiples). Les données sont ensuite mises en cache.

Pour améliorer les performances, les formes sont :
- Chargées en parallèle autant que possible
- Mises en cache localement
- Affichées uniquement si disponibles (pas d'erreur si une forme manque)

---

## Compatibilité

✅ Tous les Pokémon existants (1-1025)
✅ Toutes les formes spéciales (10001-10325)
✅ Noms français pour tous les Pokémon
✅ Fallback vers nom anglais si français indisponible
✅ Gestion des erreurs API
