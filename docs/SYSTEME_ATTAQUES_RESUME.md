# Système de Mouvements Pokémon - Guide Rapide

## 🎯 Résumé
Le système de combat a été **complètement refait** pour utiliser les vraies attaques des Pokémon, comme dans les jeux officiels.

---

## ⚡ Nouveautés

### Avant:
- ❌ Bouton "Attack" générique
- ❌ Pas de vraies attaques
- ❌ Dégâts aléatoires

### Maintenant:
- ✅ **4 attaques spécifiques** par Pokémon
- ✅ Attaques basées sur le **niveau** du Pokémon
- ✅ Données officielles de **PokéAPI**
- ✅ **PP** (Points de Pouvoir) qui se vident
- ✅ Dégâts calculés selon la **formule officielle**
- ✅ L'ennemi utilise aussi ses vraies attaques

---

## 🎮 Comment Jouer

### Contrôles Clavier:
- **1, 2, 3, 4** → Utiliser l'attaque 1, 2, 3 ou 4
- **A ou Espace** → Utiliser la 1ère attaque
- **R ou ESC** → Fuir le combat

### Interface:
- **4 boutons d'attaques** (grille 2×2)
- Affiche: Nom + Type + PP
- **Grisé** si PP = 0 (plus de charges)
- Cliquer ou presser 1-4 pour attaquer

---

## 🔥 Exemples Concrets

### Pikachu Niveau 5:
```
1. Thundershock (ELECTRIC | PP: 30/30)
2. Growl (NORMAL | PP: 40/40)
```
→ Seulement 2 attaques (niveau trop bas pour plus)

### Pikachu Niveau 18:
```
1. Thunder Wave (ELECTRIC | PP: 20/20)
2. Quick Attack (NORMAL | PP: 30/30)
3. Electro Ball (ELECTRIC | PP: 10/10)
4. Thundershock (ELECTRIC | PP: 30/30)
```
→ 4 attaques (les 4 dernières apprises)

---

## 📖 Règles du Système

### Sélection des Attaques:
1. Le jeu récupère **toutes les attaques** du Pokémon depuis PokéAPI
2. Ne garde que les attaques **apprises par niveau**
   - ❌ Pas de CT/CS/Œuf/Tuteur
3. Filtre celles **disponibles au niveau actuel**
4. Sélectionne les **4 dernières apprises**

### PP (Points de Pouvoir):
- Chaque attaque a un nombre limité d'utilisations
- **PP diminue de 1** à chaque utilisation
- **Impossible d'utiliser** si PP = 0
- PP restauré après chaque combat

### Dégâts:
- Calculés avec la **formule Pokémon officielle**
- Basés sur:
  - Puissance de l'attaque
  - Niveau du Pokémon
  - Attaque vs Défense
  - Aléatoire (85-100%)

---

## 🤖 Intelligence Artificielle

L'ennemi:
- Utilise **ses 4 vraies attaques** (pas aléatoires)
- Sélectionne une attaque **au hasard** parmi les 4
- Ses attaques ont aussi des **PP**
- Si une attaque est à 0 PP, il en choisit une autre

---

## 🚀 Performance

### Première Bataille:
- **1-2 secondes** pour charger les attaques depuis l'API
- Affiche "Loading..." pendant le chargement
- Ensuite, combat normal

### Batailles Suivantes:
- **Instantané** (attaques en cache)
- Pas de rechargement

### Sans Internet:
- **Fonctionne quand même** (attaques de secours)
- Utilise Tackle et Growl par défaut

---

## ⚠️ Résolution de Problèmes

### Les boutons affichent "Loading..."
**Cause**: API en cours de chargement  
**Solution**: Attendre 2-3 secondes. Si ça persiste, vérifier la connexion internet.

### Un bouton est grisé
**Cause**: PP = 0 pour cette attaque  
**Solution**: Normal ! Utiliser une autre attaque.

### Toutes les attaques sont Tackle/Growl
**Cause**: API indisponible  
**Solution**: Vérifier internet. Le jeu utilise des attaques de secours.

---

## 📊 Fichiers Modifiés

### Créés:
- `lib/game/moveSystem.ts` - Système de gestion des attaques

### Modifiés:
- `lib/game/types.ts` - Ajout du champ `battleMoves`
- `lib/game/scenes/BattleScene.ts` - Intégration complète du système

---

## ✨ Ce Qui Marche Maintenant

✅ 4 attaques maximum par Pokémon  
✅ Attaques officielles depuis PokéAPI  
✅ Sélection basée sur le niveau  
✅ PP qui diminuent  
✅ Dégâts calculés par attaque  
✅ Noms des attaques dans le log  
✅ IA ennemie qui utilise ses vraies attaques  
✅ Contrôles clavier (1-4)  
✅ Gestion des erreurs (pas de crash)  
✅ Cache pour la performance  

---

## 🎮 Testez !

1. **Lancez une bataille** dans le jeu
2. **Regardez les 4 boutons** d'attaques
3. **Cliquez ou pressez 1-4** pour attaquer
4. **Observez le PP** diminuer après chaque utilisation
5. **Lisez le log** pour voir le nom de l'attaque utilisée

**Le système de combat est maintenant identique aux vrais jeux Pokémon !** ⚡🔥💧

---

## 📚 Documentation Complète

Pour plus de détails techniques, voir:
- `docs/MOVE_SYSTEM_COMPLETE.md` (Anglais, très détaillé)
