═══════════════════════════════════════════════════════════════════════════════
                    EXPLICATION SIMPLE DE CHAQUE TOOL
═══════════════════════════════════════════════════════════════════════════════


🔧 TEAMBUILDING TOOLS (lib/agents/tools/)
═══════════════════════════════════════════════════════════════════════════════


1️⃣  TypeAnalysisTool
────────────────────────────────────────────────────────────────────────────────

   À QUOI ÇA SERT?
   ───────────────
   Analyser les TYPES de tes Pokémon pour savoir:
   • Quels types tu dois craindre (faiblesses)
   • Quels types tu résistes bien (résistances)
   • Quels types tu couvres avec tes attaques (couverture)

   EXEMPLE CONCRET:
   ───────────────
   Tu as: [Pikachu (Electric), Squirtle (Water)]
   
   TypeAnalysisTool répond:
   ✓ Couverture offensive: Water couvre Fire, Ground, Rock → bon!
   ✗ Faiblesse sévère: Aucun pour Ground, Grass, Dark
   ✓ Résistance: Electric résiste à Flying, Steel, Grass

   ANALOGIE:
   ────────
   C'est comme une table de "qui domine qui":
   • Pierre écrase Ciseaux
   • Ciseaux coupe Papier
   • Papier couvre Pierre
   
   Le Tool dit: "Tu as Pierre et Papier, donc tu manques Ciseaux!"


2️⃣  RoleClassifierTool
────────────────────────────────────────────────────────────────────────────────

   À QUOI ÇA SERT?
   ───────────────
   Classer chaque Pokémon par son RÔLE dans l'équipe:
   • Sweeper (attaque rapide + forte) → finit les ennemis
   • Wall (très défense) → résiste et bloque
   • Tank (HP + défense) → absorbe les coups
   • Pivot (vitesse + spécial attack) → passe les infos
   • Support (boosts allies) → aide l'équipe

   EXEMPLE CONCRET:
   ───────────────
   Alakazam Stats: Speed:135 SpAtk:135 HP:55 Defense:45
   RoleClassifier: → "C'est un SWEEPER" (très rapide + très attaque spéciale)
   
   Blissey Stats: HP:255 SpDef:135 Speed:55 Attack:10
   RoleClassifier: → "C'est un WALL" (énorme HP + défense spéciale)

   ANALOGIE:
   ────────
   Dans une équipe de foot:
   • Sweeper = Attaquant rapide
   • Wall = Défenseur solide
   • Tank = Gardien de but
   • Pivot = Milieu de terrain
   • Support = Entraîneur

   Le Tool dit: "Ce Pokémon joue ce rôle-là dans l'équipe"


3️⃣  SynergyTool
────────────────────────────────────────────────────────────────────────────────

   À QUOI ÇA SERT?
   ───────────────
   Vérifier si tes Pokémon travaillent BIEN ENSEMBLE:
   • Est-ce qu'ils se couvrent les uns les autres?
   • Est-ce qu'ils ont des combos puissants?
   • Est-ce qu'ils partagent les faiblesses?

   EXEMPLE CONCRET:
   ───────────────
   Équipe A: [Pikachu (Electric), Lapras (Water/Ice)]
   ✓ BONNE SYNERGIE!
     - Pikachu frappe super-efficace les Flying/Water
     - Lapras couvre les Ground (faiblesse d'Electric)
     - Ensemble: presque tout le jeu est couvert!

   Équipe B: [Pikachu (Electric), Zapdos (Electric/Flying)]
   ✗ MAUVAISE SYNERGIE!
     - Même type (Electric) = doublon inutile
     - Tous les deux faibles à Ground
     - Pas de diversité = facile à counter

   ANALOGIE:
   ────────
   C'est comme les couleurs:
   • BONNE COMBO: Bleu + Orange = couleurs complémentaires (beau!)
   • MAUVAISE COMBO: Bleu + Bleu clair = trop similaire (ennuyeux)

   Le Tool dit: "Ces Pokémon forment une bonne équipe" ou "Attention, trop similaires!"


4️⃣  TeamScorerTool
────────────────────────────────────────────────────────────────────────────────

   À QUOI ÇA SERT?
   ───────────────
   COMBINER tous les autres Tools pour donner un SCORE GLOBAL:
   • Utilise TypeAnalysisTool
   • Utilise RoleClassifierTool
   • Utilise SynergyTool
   • Puis: VOTE → Score final (0-100)

   EXEMPLE CONCRET:
   ───────────────
   Équipe: [Alakazam, Blissey, Dragonite, Gengar, Scizor, Lapras]
   
   TeamScorerTool fait:
   ✓ TypeAnalysis → 85/100 (bonne couverture de types)
   ✓ RoleClassifier → 90/100 (bon équilibre roles)
   ✓ SynergyTool → 78/100 (OK, quelques doublons type)
   ✓ Overall → (85 + 90 + 78) / 3 = 84/100 → GRADE "A"

   ANALOGIE:
   ────────
   C'est comme une note à l'école:
   • Math: 17/20
   • Français: 18/20
   • Sport: 14/20
   • Moyenne = 16.3/20 = Mention Bien!

   Le Tool dit: "Cette équipe est très bonne (Note A)"


═══════════════════════════════════════════════════════════════════════════════


🔧 BATTLE TOOLS (lib/agents/battleEngine/tools/)
═══════════════════════════════════════════════════════════════════════════════


1️⃣  BattleDecisionTool
────────────────────────────────────────────────────────────────────────────────

   À QUOI ÇA SERT?
   ───────────────
   Décider LA MEILLEURE ACTION pendant le combat:
   • Quel move utiliser? (attaque à choisir)
   • Faut-il switch? (changer de Pokémon?)
   • Quelle est ma chance de gagner?

   EXEMPLE CONCRET:
   ───────────────
   Ton Pikachu (Electric) face à Dragonite (Dragon/Flying)
   
   BattleDecisionTool évalue:
   ✓ Thunderbolt (Electric move) → 120 dégâts (super efficace contre Flying!)
   ✓ Prendre le hit → Dragonite fait ~80 dégâts avec Dragon Claw
   ✓ Win chance: 72% (tu es plus rapide + super efficace)
   
   Décision: → "Utilise Thunderbolt!"

   ANALOGIE:
   ────────
   C'est comme aux échecs:
   • "Si je bouge mon cavalier là" → j'ai 80% de chance de gagner
   • "Si je bouge ma tour là" → j'ai 40% de chance
   • Décision: "Bouge le cavalier!" (meilleur pourcentage)

   Le Tool dit: "Fais ça, c'est l'action la plus probablement gagnante"


2️⃣  DamageCalculatorTool
────────────────────────────────────────────────────────────────────────────────

   À QUOI ÇA SERT?
   ───────────────
   Calculer EXACTEMENT combien de dégâts fait une attaque:
   • Base damage (force du move)
   • Multiplicateurs (type efficace?)
   • Stats (ta puissance vs sa défense)
   → Résultat: combien de HP il perd?

   EXEMPLE CONCRET:
   ───────────────
   Pikachu utilise Thunderbolt contre Dragonite
   
   Calcul:
   • Base damage: 90
   • STAB (Same Type Attack Bonus): ×1.5 (Pikachu est Electric)
   • Type effectiveness: ×2 (Electric super-efficace contre Flying)
   • Pikachu SpAtk: 145 vs Dragonite SpDef: 100
   • Variance: +/- un peu aléatoire
   
   Résultat: 120-145 dégâts
   Dragonite: 120/130 HP
   → "Dragonite prend entre 92% et 100% de ses HP en dégâts = KO possible!"

   ANALOGIE:
   ────────
   C'est comme une calculatrice de tir au jeu vidéo:
   • Puissance du fusil: 50
   • Distance: ×0.8
   • Critique: ×1.5
   • Résultat final: 60 dégâts exacts

   Le Tool dit: "Cet attaque fait exactement X dégâts"


3️⃣  SpeedComparatorTool
────────────────────────────────────────────────────────────────────────────────

   À QUOI ÇA SERT?
   ───────────────
   Déterminer QUI ATTAQUE EN PREMIER:
   • Vérifie les stats Speed
   • Applique les multiplicateurs (paralysie ralentit)
   • Prend en compte la priorité des moves
   → Qui gagne le "premier coup"?

   EXEMPLE CONCRET:
   ───────────────
   Tour 1: Pikachu vs Dragonite
   
   Pikachu: Speed 120, move = Thunderbolt (priorité 0)
   Dragonite: Speed 80, move = Extreme Speed (priorité +2)
   
   SpeedComparator:
   ✓ Dragonite a priorité +2 → attaque d'abord MÊME s'il est plus lent!
   → "Dragonite attaque en premier"

   Deuxième exemple:
   Pikachu (Speed 120, Extreme Speed priorité +2) vs Dragonite (80)
   → "Pikachu attaque en premier" (même priorité mais plus rapide)

   ANALOGIE:
   ────────
   C'est comme une course:
   • Pikachu court à 120km/h (priorité 0)
   • Dragonite court à 80km/h MAIS a des rollers (+priorité)
   • Résultat: Dragonite arrive en premier!

   Le Tool dit: "Qui attaque en premier ce tour?"


4️⃣  StatusEffectTool
────────────────────────────────────────────────────────────────────────────────

   À QUOI ÇA SERT?
   ───────────────
   Gérer les MALUS STATUS (burn, poison, paralysis, sleep, freeze):
   • Tu es paralysé? → 25% de chance d'être stuck
   • Tu es en sleep? → -1 tour avant de te réveiller
   • Tu es burned? → perte de HP à chaque tour

   EXEMPLE CONCRET:
   ───────────────
   Ton Pikachu est paralysé (paralyse = 50% ralentissement + 25% chance d'bloquer)
   
   StatusEffectTool:
   ✓ Tour 1: 75% chance d'agir normalement → tu attaques!
   ✓ Tour 2: 25% chance d'être paralysé → tu ne peux rien faire (stuck)
   ✓ Tour 3: 75% chance d'agir → tu attaques!
   
   Résultat: Tu perds des tours aléatoirement

   Autre exemple:
   Tu es en SLEEP (endormi):
   ✓ Tour 1-3: Tu dors (ne peux rien faire)
   ✓ Tour 4: 33% chance de te réveiller → tu réveilles!
   ✓ Après: tu es normal

   ANALOGIE:
   ────────
   C'est comme un jeu avec des malus:
   • Poison: ✗ -2 HP chaque tour
   • Sleep: ✗ -3 tours de repos
   • Paralysis: ✗ -50% vitesse + 25% chance de freeze
   • Burn: ✗ -1/8 HP chaque tour

   Le Tool dit: "Tu as ce malus, voici comment ça t'affecte"


5️⃣  StatModifierTool
────────────────────────────────────────────────────────────────────────────────

   À QUOI ÇA SERT?
   ───────────────
   Gérer les BOOSTS/DEBUFFS temporaires:
   • Swords Dance → +Attack ×2
   • Calm Mind → +SpAtk + SpDef
   • -6 stat → très affaibli

   EXEMPLE CONCRET:
   ───────────────
   Ton Alakazam utilise Calm Mind:
   ✓ SpAtk: 135 → boosted de +1 → 135 × (3/2) = 202
   ✓ SpDef: 95 → boosted de +1 → 95 × (3/2) = 142
   
   Tour suivant:
   ✓ Ton move Psychic fait beaucoup plus de dégâts!
   ✓ Tu encaisses mieux les spéciales!

   Autre exemple (DEBUFF):
   L'adversaire utilise Growl:
   ✗ Ton Attack: 130 → debuff de -1 → 130 × (2/3) = 86
   ✗ Tes physical moves font beaucoup moins mal!

   ANALOGIE:
   ────────
   C'est comme un jeu RPG:
   • Buff: "Double ton attaque ce tour!" → +×2 puissance
   • Debuff: "Réduis sa défense!" → ÷2 résistance
   • Stages: -6 = très mauvais, 0 = normal, +6 = exceptionnel

   Le Tool dit: "Ce stat est modifié, voici le multiplicateur"


═══════════════════════════════════════════════════════════════════════════════
                            RÉSUMÉ SIMPLIFIÉ
═══════════════════════════════════════════════════════════════════════════════

TEAMBUILDING TOOLS:
───────────────────
✓ TypeAnalysisTool ......... "Quels types manquent à mon équipe?"
✓ RoleClassifierTool ....... "Quel est le rôle de ce Pokémon?"
✓ SynergyTool .............. "Est-ce que mes Pokémon travaillent bien ensemble?"
✓ TeamScorerTool ........... "Quelle est la note globale de mon équipe?" (combine tout)


BATTLE TOOLS:
─────────────
✓ BattleDecisionTool ....... "Quelle action je dois faire maintenant?"
✓ DamageCalculatorTool ..... "Combien de dégâts cette attaque fait?"
✓ SpeedComparatorTool ...... "Qui attaque en premier?"
✓ StatusEffectTool ......... "Je suis paralysé, comment ça m'affecte?"
✓ StatModifierTool ......... "Mon attack est boosté/debuffé, de combien?"


═══════════════════════════════════════════════════════════════════════════════
                            FLUX D'UTILISATION
═══════════════════════════════════════════════════════════════════════════════

AVANT LE COMBAT (TeamBuilding):
──────────────────────────────
1. TypeAnalysisTool → "Quels types couvre mon équipe?"
2. RoleClassifierTool → "J'ai quels rôles?"
3. SynergyTool → "Ils se couvrent-ils?"
4. TeamScorerTool → "Note globale?" → Affiche le résultat

PENDANT LE COMBAT (Battle):
────────────────────────────
1. StatusEffectTool → "Suis-je affecté?" → Non = continue
2. SpeedComparatorTool → "Qui attaque?" → Moi en premier
3. BattleDecisionTool → "Quel move?" → Thunderbolt
4. DamageCalculatorTool → "Combien de dégâts?" → 120 HP
5. StatModifierTool → "Est-ce que ma stat change?" → Non
6. Fin du tour → Retour à l'étape 1


═══════════════════════════════════════════════════════════════════════════════