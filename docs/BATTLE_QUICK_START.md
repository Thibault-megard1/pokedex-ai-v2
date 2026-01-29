# 🚀 Quick Start - Tester la Nouvelle Scène de Combat

## 🎯 Comment Lancer un Combat

### Option 1 : Via le Jeu Normal
1. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

2. Ouvrez le jeu dans votre navigateur

3. Marchez dans l'herbe haute (Routes 1 ou 2)

4. Un combat aléatoire se déclenchera automatiquement

---

### Option 2 : Test Direct (pour développeurs)

Si vous voulez tester rapidement sans jouer, modifiez temporairement `GameScene.ts` :

```typescript
// Dans GameScene.ts, méthode create()
// Ajoutez cette ligne après la création du joueur :

this.time.delayedCall(1000, () => {
  this.scene.start('BattleScene', {
    enemyId: 19,    // Rattata
    enemyLevel: 5
  });
});
```

Cela lancera automatiquement un combat 1 seconde après le chargement de la carte.

---

## 🎮 Pokémon Disponibles pour les Tests

Voici les IDs des Pokémon que vous pouvez tester (1-25) :

### Starters Kanto
```typescript
{ enemyId: 1, enemyLevel: 5 }  // Bulbizarre
{ enemyId: 4, enemyLevel: 5 }  // Salamèche
{ enemyId: 7, enemyLevel: 5 }  // Carapuce
{ enemyId: 25, enemyLevel: 5 } // Pikachu
```

### Pokémon de Route
```typescript
{ enemyId: 10, enemyLevel: 3 } // Chenipan
{ enemyId: 13, enemyLevel: 3 } // Aspicot
{ enemyId: 16, enemyLevel: 4 } // Roucool
{ enemyId: 19, enemyLevel: 4 } // Rattata
{ enemyId: 21, enemyLevel: 5 } // Piafabec
{ enemyId: 23, enemyLevel: 6 } // Abo
```

---

## 🐛 Debugging / Inspection

### Ouvrir la Console Développeur
- **Chrome/Edge** : `F12` ou `Ctrl + Shift + I`
- **Firefox** : `F12`

### Messages de Log Utiles
```
[BattleScene] Starting battle with enhanced visuals: { enemyId: 19, enemyLevel: 5 }
[BattleScene] Loading Pokémon sprites from PokeAPI...
[BattleScene] Created HUD boxes for player and enemy
```

### Vérifier le Chargement des Sprites
Dans la console, tapez :
```javascript
// Vérifier si un sprite est chargé
game.scene.scenes[0].textures.exists('pokemon_front_19')  // true si chargé
```

---

## 🧪 Scénarios de Test

### Test 1 : Sprites Normaux
```typescript
this.scene.start('BattleScene', { enemyId: 25, enemyLevel: 5 }); // Pikachu
```
✅ Vérifier : Sprite Pikachu visible, animations idle fonctionnent

---

### Test 2 : Combat Complet
1. Lancez un combat (Rattata niveau 5)
2. Cliquez sur "Attack" plusieurs fois
3. Observez :
   - ✅ Animation d'attaque (avance/recule)
   - ✅ Secousse de l'écran
   - ✅ Barre de vie qui descend progressivement
   - ✅ Changement de couleur de la barre (vert → jaune → rouge)
   - ✅ Tour de l'ennemi
4. Continuez jusqu'à la victoire
5. Vérifiez :
   - ✅ Message de victoire
   - ✅ Sprite ennemi qui disparaît (fade-out)
   - ✅ Retour à la carte après 2 secondes

---

### Test 3 : Fuite
1. Lancez un combat
2. Cliquez sur "Run"
3. Vérifier :
   - ✅ Message "You ran away safely!"
   - ✅ Retour immédiat à la carte (1 seconde)

---

### Test 4 : Défaite
1. Modifiez temporairement les stats de l'ennemi pour le rendre très fort :
```typescript
// Dans BattleScene.ts, méthode getPokemonBaseStats()
19: { hp: 100, attack: 200, defense: 50, speed: 72 }, // Rattata ultra fort
```
2. Lancez un combat contre Rattata
3. Attaquez et perdez
4. Vérifier :
   - ✅ Message de défaite
   - ✅ Votre sprite disparaît
   - ✅ Retour à la carte

---

### Test 5 : Responsive
1. Lancez un combat
2. Redimensionnez la fenêtre du navigateur
3. Vérifier :
   - ✅ Sprites restent bien positionnés
   - ✅ HUD boxes suivent les sprites
   - ✅ Boutons restent centrés en bas
   - ✅ Aucun élément ne sort de l'écran

---

### Test 6 : Plusieurs Pokémon Différents
Testez avec différents IDs pour vérifier que les sprites changent :
```typescript
// Test rapide de 5 Pokémon différents
const testPokemon = [1, 4, 7, 16, 25];
let index = 0;

setInterval(() => {
  this.scene.start('BattleScene', {
    enemyId: testPokemon[index],
    enemyLevel: 5
  });
  index = (index + 1) % testPokemon.length;
}, 10000); // Nouveau combat toutes les 10 secondes
```

---

## 📊 Checklist de Test Complet

### Visuel
- [ ] Fond dégradé bleu-vert s'affiche
- [ ] Ombres (plateformes) visibles sous les sprites
- [ ] Sprite ennemi (face) affiché en haut à droite
- [ ] Sprite joueur (dos) affiché en bas à gauche
- [ ] Les deux sprites ont la bonne échelle (3x)
- [ ] HUD ennemi en haut à gauche (boîte blanche)
- [ ] HUD joueur en bas à droite (boîte blanche)
- [ ] Barres de vie colorées (vert/jaune/rouge)
- [ ] PV numériques affichés pour le joueur
- [ ] Log de combat visible en bas
- [ ] Boutons "Attack" et "Run" visibles

### Animations d'Entrée
- [ ] Ennemi glisse depuis la droite (600ms)
- [ ] Joueur rebondit depuis le bas (500ms)
- [ ] HUD ennemi apparaît en fondu
- [ ] HUD joueur apparaît en fondu
- [ ] Timing séquencé (pas tout en même temps)

### Animations Idle
- [ ] Sprite ennemi oscille doucement haut/bas
- [ ] Sprite joueur oscille doucement haut/bas
- [ ] Mouvements continus (boucle infinie)
- [ ] Légèrement désynchronisés (naturel)

### Combat
- [ ] Clic sur "Attack" fonctionne
- [ ] Sprite joueur avance puis recule
- [ ] Écran tremble pendant l'attaque
- [ ] Barre de vie ennemi descend progressivement (500ms)
- [ ] Message de dégâts s'affiche
- [ ] Tour de l'ennemi se déclenche automatiquement
- [ ] Sprite ennemi avance puis recule
- [ ] Barre de vie joueur descend progressivement
- [ ] PV numériques se mettent à jour
- [ ] Boutons se désactivent pendant les animations
- [ ] Boutons se réactivent après le tour ennemi

### Victoire/Défaite
- [ ] Message de victoire quand ennemi K.O.
- [ ] Sprite ennemi disparaît en fondu
- [ ] EXP gagnée affichée (dans les logs console)
- [ ] Retour à la carte après 2 secondes
- [ ] Message de défaite quand joueur K.O.
- [ ] Sprite joueur disparaît en fondu

### Fuite
- [ ] Clic sur "Run" fonctionne
- [ ] Message "You ran away safely!"
- [ ] Retour immédiat à la carte

### Responsive
- [ ] Redimensionnement de fenêtre : sprites suivent
- [ ] HUD boxes restent bien positionnées
- [ ] Boutons restent centrés
- [ ] Aucun débordement visuel

### Performance
- [ ] Premier combat : chargement des sprites (~1-2s)
- [ ] Combats suivants : instantané (cache)
- [ ] Animations fluides (60 FPS)
- [ ] Pas de lag lors des tweens
- [ ] Pas de fuite mémoire (console propre)

---

## 🔧 Dépannage

### Les sprites ne s'affichent pas
**Cause** : Connexion Internet ou API PokeAPI indisponible

**Solution** :
1. Vérifiez votre connexion Internet
2. Testez manuellement : ouvrez `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png`
3. Si l'URL ne fonctionne pas, attendez que l'API soit de nouveau disponible
4. En fallback : des rectangles colorés s'affichent automatiquement

---

### Animations saccadées
**Cause** : Premier chargement des sprites

**Solution** :
- C'est normal lors du **premier combat** (téléchargement)
- Les combats suivants seront **fluides** (sprites en cache)

---

### Sprites trop petits/grands
**Cause** : Échelle incorrecte

**Solution** :
Modifiez l'échelle dans `createPokemonSprites()` :
```typescript
this.enemySprite.setScale(3); // Changez 3 en 2 ou 4
this.playerSprite.setScale(3); // Changez 3 en 2 ou 4
```

---

### Erreurs de compilation TypeScript
**Cause** : Cache TypeScript obsolète

**Solution** :
```bash
# Arrêtez le serveur (Ctrl+C)
# Supprimez le cache
rm -rf .next
rm -rf node_modules/.cache

# Relancez
npm run dev
```

---

## 🎉 Vous êtes prêt !

Lancez `npm run dev` et profitez de votre nouveau système de combat amélioré ! 🎮✨
