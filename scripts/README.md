# Scripts de génération de cache Pokémon

## generate-pokemon-cache.mjs

Ce script génère des fichiers de cache JSON pour les Pokémon avec leurs noms français depuis l'API PokeAPI.

### Utilisation

```bash
# Générer le cache pour les 151 premiers Pokémon (Génération 1)
node scripts/generate-pokemon-cache.mjs 1 151

# Générer le cache pour tous les Pokémon (1 à 1025)
node scripts/generate-pokemon-cache.mjs 1 1025

# Générer le cache pour une plage spécifique
node scripts/generate-pokemon-cache.mjs 152 251
```

### Paramètres

- `startId` : ID de départ (par défaut : 1)
- `endId` : ID de fin (par défaut : 1025)

### Format des fichiers générés

Les fichiers sont sauvegardés dans `/data/pokemon-cache/` avec le nom `{id}.json` :

```json
{
  "id": 25,
  "name": "pikachu",
  "frenchName": "Pikachu",
  "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
  "types": ["electric"],
  "stats": {
    "hp": 35,
    "attack": 55,
    "defense": 40,
    "specialAttack": 50,
    "specialDefense": 50,
    "speed": 90
  }
}
```

### Notes

- Le script évite les fichiers qui existent déjà
- Il attend 100ms entre chaque requête pour éviter le rate limiting de l'API
- Les erreurs sont affichées mais n'arrêtent pas le script
- Un résumé final affiche le nombre de succès et d'erreurs

### Fonctionnalités de l'autocomplete

Avec ces fichiers de cache, l'autocomplete permet maintenant de :
- ✅ Chercher des Pokémon par leur nom anglais
- ✅ Chercher des Pokémon par leur nom français (pour les 151 premiers)
- ✅ Éviter les erreurs 404
- ✅ Charger les données en arrière-plan sans bloquer l'interface

### Exemple

Si vous tapez "Dracau" dans la recherche, Dracaufeu (Charizard) apparaîtra dans les suggestions !
