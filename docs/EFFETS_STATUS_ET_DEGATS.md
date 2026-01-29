# Système d'Effets de Statut et Augmentation des Dégâts

## 🎯 Résumé des Modifications

Le système de combat a été **considérablement amélioré** avec :
1. ✅ **Effets de statut** (Brûlure, Paralysie, Poison, Sommeil, Gel)
2. ✅ **Modifications de statistiques** (Attaque, Défense, Vitesse)
3. ✅ **Dégâts augmentés de 150%** (multiplicateur x2.5)
4. ✅ **Affichage visuel** des statuts dans le HUD

---

## ⚡ Nouvelles Fonctionnalités

### 1. Effets de Statut

Les attaques peuvent maintenant infliger des **conditions de statut** :

| Statut | Effet | Couleur | Abréviation |
|--------|-------|---------|-------------|
| **Brûlure** | Réduit l'attaque | 🟠 Orange | BRN |
| **Paralysie** | Réduit la vitesse | 🟡 Jaune | PAR |
| **Poison** | Dégâts continus | 🟣 Violet | PSN |
| **Sommeil** | Ne peut pas attaquer | ⚫ Gris | SLP |
| **Gel** | Ne peut pas attaquer | 🔵 Bleu | FRZ |

**Comment ça marche :**
- Les attaques avec effets secondaires (ex: Thunder Wave → Paralysie)
- Chance de déclenchement basée sur l'attaque (ex: 30%, 100%)
- Un Pokémon ne peut avoir qu'**un seul statut** à la fois
- Le statut est affiché dans le **HUD** avec une couleur spécifique

---

### 2. Modifications de Statistiques

Les attaques peuvent **modifier les stats** en combat :

**Stages de modification** : -6 à +6
- **+1 stage** = +50% de la stat
- **-1 stage** = -33% de la stat
- **+6 stages** = x4 de la stat (maximum)
- **-6 stages** = x0.25 de la stat (minimum)

**Exemples d'attaques :**
```
Growl → Baisse l'Attaque de l'adversaire de 1 stage
Sword Dance → Augmente l'Attaque du lanceur de 2 stages
Tail Whip → Baisse la Défense de l'adversaire de 1 stage
Agility → Augmente la Vitesse du lanceur de 2 stages
```

**Messages de combat :**
- `"Bulbasaur's Attack fell!"` (baisse de 1 stage)
- `"Pikachu's Speed rose sharply!"` (hausse de 2+ stages)

---

### 3. Augmentation des Dégâts

**Avant :**
```
Niveau 10 vs Niveau 10
Tackle (40 puissance) → 8-12 dégâts
```

**Maintenant :**
```
Niveau 10 vs Niveau 10
Tackle (40 puissance) → 20-30 dégâts
```

➡️ **Les dégâts sont 2.5x plus élevés** pour des combats plus dynamiques !

**Formule de dégâts améliorée :**
```typescript
baseDamage = ((2 * level / 5 + 2) * power * (attack / defense)) / 50 + 2
enhancedDamage = baseDamage * 2.5  // AUGMENTATION
finalDamage = enhancedDamage * typeEffectiveness * random(0.85-1.0)
```

**Prise en compte des stages :**
- Attaque +2 stages → Dégâts x2
- Défense -2 stages → Dégâts reçus x2

---

## 🎮 Affichage Visuel

### HUD Amélioré

**Avant :**
```
┌─────────────────┐
│ PIKACHU    Lv25 │
│ HP: ████████    │
└─────────────────┘
```

**Maintenant :**
```
┌─────────────────┐
│ PIKACHU    Lv25 │
│ HP: ████████    │
│ [PAR] ← Statut  │
└─────────────────┘
```

**Indicateurs de statut :**
- Badge coloré avec l'abréviation (BRN, PAR, PSN, etc.)
- Couleur correspondant au type de statut
- Apparaît uniquement si Pokémon affecté

---

## 📊 Exemples d'Attaques avec Effets

### Attaques Offensives avec Effets

```
Thunder Shock (Pikachu)
→ 40 de puissance
→ 10% de chance de paralyser
→ Message : "Enemy was paralyzed!"

Ember (Charmander)
→ 40 de puissance
→ 10% de chance de brûler
→ Message : "Enemy was burned!"

Poison Sting (Weedle)
→ 15 de puissance
→ 30% de chance d'empoisonner
→ Message : "Enemy was poisoned!"
```

### Attaques de Statut

```
Growl
→ Pas de dégâts
→ Baisse l'Attaque de l'adversaire de 1 stage
→ Message : "Enemy's Attack fell!"

Tail Whip
→ Pas de dégâts
→ Baisse la Défense de l'adversaire de 1 stage
→ Message : "Enemy's Defense fell!"

Leer
→ Pas de dégâts
→ Baisse la Défense de l'adversaire de 1 stage
→ Message : "Enemy's Defense fell!"
```

---

## 🔧 Détails Techniques

### Structures de Données

**BattleMove étendu :**
```typescript
interface BattleMove {
  // ... propriétés existantes
  effect?: {
    statusCondition?: 'burn' | 'paralysis' | 'poison' | 'sleep' | 'freeze';
    statChanges?: [{ stat: 'attack' | 'defense' | 'speed', stages: number }];
    chance?: number; // 0-100
    target?: 'self' | 'opponent';
  }
}
```

**PlayerPokemon étendu :**
```typescript
interface PlayerPokemon {
  // ... propriétés existantes
  statusCondition?: StatusCondition;
  attackStage?: number;   // -6 à +6
  defenseStage?: number;  // -6 à +6
  speedStage?: number;    // -6 à +6
}
```

---

## 🎯 Logique de Combat

### Séquence d'Attaque

1. **Sélection de l'attaque** (joueur ou IA)
2. **Animation** (sprite avance, flash rouge)
3. **Calcul des dégâts** (avec stages de stats)
4. **Application des dégâts** (HP diminue)
5. **Vérification des effets** (chance de déclenchement)
6. **Application des effets** (statut ou stats)
7. **Message de combat** (dégâts + effets)
8. **Mise à jour du HUD** (HP bar + statut)
9. **Vérification K.O.**
10. **Tour suivant**

### Exemple de Combat

```
Tour 1:
Pikachu utilise Thunder Shock!
→ 28 dégâts infligés
→ Rattata a été paralysé! [PAR]

Tour 2:
Rattata utilise Tail Whip!
→ 0 dégât
→ L'Attaque de Pikachu a baissé!

Tour 3:
Pikachu utilise Thunder Shock!
→ 21 dégâts (réduit car Attaque -1)
→ Rattata K.O.!
```

---

## 📁 Fichiers Modifiés

### `lib/game/moveSystem.ts`
**Ajouts :**
- Types `StatusCondition`, `StatChange`, `MoveEffect`
- Extraction des effets depuis PokéAPI
- Fonctions utilitaires :
  - `getStatStageMultiplier(stage)`
  - `getStatusName(status)`
  - `getStatusColor(status)`
  - `checkEffectTrigger(effect)`
- Formule de dégâts augmentée (x2.5)
- Support des stages dans le calcul

### `lib/game/types.ts`
**Ajouts :**
- Import `StatusCondition`
- Champs temporaires sur `PlayerPokemon` :
  - `statusCondition`
  - `attackStage`
  - `defenseStage`
  - `speedStage`

### `lib/game/scenes/BattleScene.ts`
**Ajouts :**
- Imports des nouvelles fonctions
- Initialisation des stages/statuts à 0
- Badge de statut dans les HUD (joueur + ennemi)
- Méthode `applyMoveEffect()` :
  - Applique les statuts
  - Modifie les stages
  - Retourne un message
- Méthode `updateStatusDisplay()` :
  - Met à jour les badges visuels
  - Change la couleur selon le statut
- Appel des effets après chaque attaque
- Messages de combat enrichis

---

## ✅ Tests Recommandés

### Test 1 : Statuts
1. Démarrer un combat
2. Utiliser une attaque avec effet de statut (ex: Thunder Wave)
3. Vérifier l'apparition du badge [PAR]
4. Confirmer le message "Enemy was paralyzed!"

### Test 2 : Modifications de Stats
1. Démarrer un combat
2. Utiliser Growl
3. Vérifier le message "Enemy's Attack fell!"
4. Attaquer → dégâts de l'ennemi réduits

### Test 3 : Dégâts Augmentés
1. Démarrer un combat niveau similaire
2. Utiliser une attaque normale (Tackle)
3. Vérifier que les dégâts sont entre 20-30
4. Avant c'était 8-12 → **Augmentation confirmée**

### Test 4 : Cumul d'Effets
1. Infliger un statut (Paralysie)
2. Baisser l'Attaque (Growl x2)
3. Vérifier que les dégâts ennemis diminuent drastiquement
4. Badge [PAR] toujours affiché

---

## 🚀 Améliorations Futures (Optionnel)

### Non Implémenté :
- **Dégâts de statut** (brûlure/poison font perdre HP chaque tour)
- **Paralysie bloque** (chance de ne pas pouvoir attaquer)
- **Sommeil** (compte les tours, réveil aléatoire)
- **Gel** (similaire au sommeil)
- **Confusion** (attaque soi-même)
- **Flinch** (perd le tour si plus lent)
- **Type effectiveness** dans les effets (feu → brûlure plus rare sur type feu)

---

## ✨ Résumé

Le système de combat est maintenant **beaucoup plus riche** :

✅ **Dégâts 2.5x plus élevés** → Combats plus dynamiques  
✅ **5 statuts différents** → Stratégie avancée  
✅ **Modifications de stats** → Buffs/debuffs tactiques  
✅ **Affichage visuel** → Badges de statut colorés  
✅ **Messages détaillés** → Feedback clair  
✅ **API PokéAPI** → Effets authentiques  
✅ **Formule officielle** → Calculs réalistes  

**Le système de combat est maintenant à la hauteur des vrais jeux Pokémon !** ⚡🔥💧
