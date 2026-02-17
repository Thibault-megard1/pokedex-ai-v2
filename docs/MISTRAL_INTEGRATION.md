# Intégration Mistral AI dans le MasterAgent

## Configuration

Le MasterAgent supporte maintenant **Mistral AI** comme fournisseur LLM en plus d'Ollama.

### Variables d'environnement (.env.local)

```env
# LLM Provider
LLM_PROVIDER=mistral

# Mistral AI Configuration
MISTRAL_API_KEY=vwYRT1yJWMUOUUCh95LH75EwWI41pTvk
MISTRAL_MODEL=mistral-small-latest
```

### Alternative: Ollama (local)

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

---

## Utilisation

### 1. Utilisation par défaut (avec variables d'environnement)

```typescript
import { MasterAgent } from "@/lib/agents/MasterAgent";

// Crée automatiquement le client selon LLM_PROVIDER dans .env.local
const agent = new MasterAgent({ enableReflection: true });

// Génération d'équipe
const teamResult = await agent.process({
  task: "team-building",
  context: {
    mode: "generate",
    theme: "rain",
    tier: "OU"
  }
});

console.log(teamResult.team);
```

### 2. Utilisation avec un client Mistral explicite

```typescript
import { MasterAgent } from "@/lib/agents/MasterAgent";
import { MistralClient } from "@/lib/llm/mistral-client";

// Créer un client Mistral explicitement
const mistralClient = new MistralClient(
  "vwYRT1yJWMUOUUCh95LH75EwWI41pTvk",
  "mistral-small-latest"
);

// Passer le client au MasterAgent
const agent = new MasterAgent({ 
  enableReflection: true,
  llmClient: mistralClient 
});

const battleResult = await agent.process({
  task: "battle",
  context: {
    battleState: {
      playerActive: { name: "Pikachu", types: ["electric"], stats: [...] },
      opponentActive: { name: "Charizard", types: ["fire", "flying"], stats: [...] },
      playerTeam: [...],
      opponentTeam: [...],
      turn: 1,
      weather: null
    }
  }
});

console.log(battleResult.action);
```

### 3. Sans réflexion LLM (mode rapide)

```typescript
const agent = new MasterAgent({ enableReflection: false });

// Utilise uniquement l'inférence locale (pas d'appel API)
const result = await agent.process({
  task: "battle",
  context: { battleState: {...} }
});
```

---

## Comparaison Ollama vs Mistral

| **Aspect**           | **Ollama**                 | **Mistral AI**               |
|-----------------------|----------------------------|------------------------------|
| **Installation**      | Locale (requiert téléchargement) | Cloud (API uniquement)       |
| **Coût**              | Gratuit                    | Payant (par token)           |
| **Vitesse**           | Variable (CPU/GPU local)   | Rapide (serveurs Mistral)    |
| **Confidentialité**   | Données restent locales    | Données envoyées à l'API     |
| **Disponibilité**     | Nécessite Ollama installé  | Toujours disponible avec clé |

---

## Architecture

```
MasterAgent
├── LLMClient (Ollama OU Mistral)
│   ├── OllamaClient (localhost:11434)
│   └── MistralClient (api.mistral.ai/v1)
│
├── TeamBuildingAgent
│   ├── OurTeamAgent
│   └── OpponentTeamAgent
│
└── BattleAgent
    └── BattleOrchestrator
```

---

## Exemple complet: Combat automatique 6v6

```typescript
import { MasterAgent } from "@/lib/agents/MasterAgent";

const agent = new MasterAgent({ enableReflection: true });

// Génération de notre équipe
const ourTeam = await agent.process({
  task: "team-building",
  context: {
    mode: "generate",
    theme: "offense",
    tier: "OU"
  }
});

// Génération de l'équipe adverse
const opponentTeam = await agent.process({
  task: "team-building",
  context: {
    mode: "counter",
    existingTeam: ourTeam.team
  }
});

// Combat automatique 6v6
const battleResult = await agent.process({
  task: "battle",
  context: {
    autoBattle: true,
    playerTeam: ourTeam.team,
    opponentTeam: opponentTeam.team
  }
});

console.log("Gagnant:", battleResult.winner);
console.log("Tours:", battleResult.turnCount);
console.log("Historique:", battleResult.log);
```

---

## Vérification de la santé de l'API

```typescript
import { MistralClient } from "@/lib/llm/mistral-client";

const mistral = new MistralClient(
  process.env.MISTRAL_API_KEY!,
  "mistral-small-latest"
);

const health = await mistral.healthCheck();
console.log(health.healthy ? "✅ Mistral OK" : "❌ Erreur:", health.error);
```

---

## Dépannage

### Erreur: "MISTRAL_API_KEY not found"
- Vérifiez que `.env.local` existe à la racine du projet
- Vérifiez que `MISTRAL_API_KEY` est défini correctement
- Redémarrez le serveur Next.js pour recharger les variables d'environnement

### Erreur: "Invalid API key"
- Vérifiez que la clé API est correcte sur [console.mistral.ai](https://console.mistral.ai)
- Vérifiez qu'il n'y a pas d'espaces ou caractères invisibles

### Erreur: "Rate limit exceeded"
- Mistral a des limites de requêtes par minute
- Réduisez la fréquence d'appels ou passez à un plan supérieur
- Utilisez `enableReflection: false` pour désactiver les appels LLM

---

## Modèles Mistral disponibles

- `mistral-small-latest` (recommandé, rapide et économique)
- `mistral-medium-latest` (plus puissant)
- `mistral-large-latest` (meilleure qualité, plus cher)
- `open-mistral-7b` (modèle open-source)

Pour changer de modèle, modifiez `MISTRAL_MODEL` dans `.env.local`.
