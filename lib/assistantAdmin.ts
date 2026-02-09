// Assistant Admin System - Utilities and Validators

export interface AssistantConfig {
  guardrails: {
    strictAnswerOnly: boolean;
    noRankingsUnlessAsked: boolean;
    alwaysFrench: boolean;
    admitUncertainty: boolean;
    preferBulletLists: boolean;
  };
  systemRules: Array<{
    id: string;
    enabled: boolean;
    name: string;
    description: string;
  }>;
  responseValidator: {
    enabled: boolean;
    removeUnwantedPhrases: boolean;
    detectExtraCommentary: boolean;
    ensureGrammar: boolean;
  };
  bannedPhrases: string[];
  intentDetection: {
    enabled: boolean;
    patterns: {
      list: string[];
      ranking: string[];
      explanation: string[];
      comparison: string[];
    };
  };
}

export interface KnowledgePatch {
  id: string;
  enabled: boolean;
  trigger: string;
  triggerType: 'regex' | 'keyword';
  scope: string;
  correctedAnswer: string;
  behavior: 'replace' | 'prepend';
  notes?: string;
}

export interface KnowledgePatches {
  patches: KnowledgePatch[];
}

// Default configuration
export const DEFAULT_CONFIG: AssistantConfig = {
  guardrails: {
    strictAnswerOnly: true,
    noRankingsUnlessAsked: true,
    alwaysFrench: true,
    admitUncertainty: true,
    preferBulletLists: true,
  },
  systemRules: [
    {
      id: 'rule-1',
      enabled: true,
      name: 'Répondre uniquement à ce qui est demandé',
      description: 'Ne pas ajouter de commentaires, résumés ou classements non sollicités',
    },
    {
      id: 'rule-2',
      enabled: true,
      name: 'Pas de classements sans demande explicite',
      description: "Ne pas dire 'le meilleur', 'le plus fort' sauf si demandé",
    },
    {
      id: 'rule-3',
      enabled: true,
      name: 'Toujours en français',
      description: 'Toutes les réponses doivent être en français',
    },
    {
      id: 'rule-4',
      enabled: true,
      name: "Admettre l'incertitude",
      description: "Si incertain, dire 'Je ne suis pas sûr' plutôt qu'inventer",
    },
    {
      id: 'rule-5',
      enabled: true,
      name: 'Préférer les listes à puces',
      description: 'Pour les matchups de types, utiliser des bullet points',
    },
  ],
  responseValidator: {
    enabled: true,
    removeUnwantedPhrases: true,
    detectExtraCommentary: true,
    ensureGrammar: true,
  },
  bannedPhrases: [
    'le type le plus fort',
    'le meilleur type',
    'en résumé',
    'donc',
    'à retenir',
    'suivi du',
    'suivi de',
  ],
  intentDetection: {
    enabled: true,
    patterns: {
      list: ['quels types', 'liste', 'types super efficaces', 'types forts'],
      ranking: ['meilleur', 'le plus', 'classement', 'top'],
      explanation: ['comment', 'pourquoi', 'explique'],
      comparison: ['différence', 'comparer', 'versus', 'vs'],
    },
  },
};

// Intent detection
export type UserIntent = 'list' | 'ranking' | 'explanation' | 'comparison' | 'unknown';

export function detectIntent(userMessage: string, config: AssistantConfig): UserIntent {
  if (!config.intentDetection.enabled) return 'unknown';

  const lowerMessage = userMessage.toLowerCase();

  // Check ranking patterns first (more specific)
  for (const pattern of config.intentDetection.patterns.ranking) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return 'ranking';
    }
  }

  // Check list patterns
  for (const pattern of config.intentDetection.patterns.list) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return 'list';
    }
  }

  // Check explanation patterns
  for (const pattern of config.intentDetection.patterns.explanation) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return 'explanation';
    }
  }

  // Check comparison patterns
  for (const pattern of config.intentDetection.patterns.comparison) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return 'comparison';
    }
  }

  return 'unknown';
}

// Check if message matches a knowledge patch
export function findMatchingPatch(
  userMessage: string,
  patches: KnowledgePatches
): KnowledgePatch | null {
  const lowerMessage = userMessage.toLowerCase();

  for (const patch of patches.patches) {
    if (!patch.enabled) continue;

    if (patch.triggerType === 'regex') {
      try {
        const regex = new RegExp(patch.trigger, 'i');
        if (regex.test(lowerMessage)) {
          return patch;
        }
      } catch (e) {
        console.error(`Invalid regex in patch ${patch.id}:`, e);
      }
    } else if (patch.triggerType === 'keyword') {
      if (lowerMessage.includes(patch.trigger.toLowerCase())) {
        return patch;
      }
    }
  }

  return null;
}

// Response validator - removes unwanted extra commentary
export function validateAndCleanResponse(
  response: string,
  userIntent: UserIntent,
  config: AssistantConfig
): string {
  if (!config.responseValidator.enabled) return response;

  let cleaned = response;

  // If user asked for a list, not a ranking, remove ranking sentences
  if (userIntent === 'list' && config.guardrails.noRankingsUnlessAsked) {
    // Remove sentences containing banned phrases
    const lines = cleaned.split('\n');
    const filteredLines: string[] = [];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      let shouldRemove = false;

      for (const bannedPhrase of config.bannedPhrases) {
        if (lowerLine.includes(bannedPhrase.toLowerCase())) {
          shouldRemove = true;
          break;
        }
      }

      if (!shouldRemove) {
        filteredLines.push(line);
      }
    }

    cleaned = filteredLines.join('\n');
  }

  // Remove trailing empty lines
  cleaned = cleaned.trim();

  // Ensure we don't end with a period if it's a list
  if (userIntent === 'list' && cleaned.endsWith('.')) {
    const lastLineIsNotBullet = !cleaned.split('\n').pop()?.trim().startsWith('•');
    if (lastLineIsNotBullet) {
      // This might be an extra commentary sentence - check if previous line is a bullet
      const lines = cleaned.split('\n');
      if (lines.length > 1 && lines[lines.length - 2].trim().startsWith('•')) {
        // Remove the last line (likely extra commentary)
        cleaned = lines.slice(0, -1).join('\n');
      }
    }
  }

  return cleaned;
}

// Build enhanced system prompt from config
export function buildSystemPrompt(config: AssistantConfig, userIntent: UserIntent): string {
  const basePrompt = `Tu es un assistant Pokémon expert et PRÉCIS. Tu dois ABSOLUMENT respecter les règles officielles de Pokémon.

⚠️ ATTENTION: Les informations suivantes sont EXACTES et OFFICIELLES. Ne JAMAIS les contredire ou inventer d'autres relations.`;

  const typeChart = `
TYPES SUPER EFFICACES (×2 dégâts) - TABLE COMPLÈTE ET OFFICIELLE:

Contre le type DRAGON 🐉:
- Glace, Dragon, Fée sont super efficaces (×2)

Contre le type EAU 💧:
- Plante, Électrique sont super efficaces (×2)

Contre le type FEU 🔥:
- Eau, Sol, Roche sont super efficaces (×2)

Contre le type PLANTE 🌿:
- Feu, Glace, Poison, Vol, Insecte sont super efficaces (×2)

Contre le type ÉLECTRIQUE ⚡:
- Sol est super efficace (×2)

Contre le type GLACE ❄️:
- Feu, Combat, Roche, Acier sont super efficaces (×2)

Contre le type COMBAT 🥊:
- Vol, Psy, Fée sont super efficaces (×2)

Contre le type POISON ☠️:
- Sol, Psy sont super efficaces (×2)

Contre le type SOL 🏜️:
- Eau, Plante, Glace sont super efficaces (×2)

Contre le type VOL 🦅:
- Électrique, Glace, Roche sont super efficaces (×2)

Contre le type PSY 🔮:
- Insecte, Spectre, Ténèbres sont super efficaces (×2)

Contre le type INSECTE 🐛:
- Feu, Vol, Roche sont super efficaces (×2)

Contre le type ROCHE 🪨:
- Eau, Plante, Combat, Sol, Acier sont super efficaces (×2)

Contre le type SPECTRE 👻:
- Spectre, Ténèbres sont super efficaces (×2)

Contre le type TÉNÈBRES 🌑:
- Combat, Insecte, Fée sont super efficaces (×2)

Contre le type ACIER 🔩:
- Feu, Combat, Sol sont super efficaces (×2)

Contre le type FÉE 🧚:
- Poison, Acier sont super efficaces (×2)

MULTIPLICATEURS OFFICIELS:
- Super efficace: ×2 (ou ×4 si double faiblesse)
- Normal: ×1
- Peu efficace: ×0.5 (ou ×0.25 si double résistance)
- Aucun effet: ×0

❌ Il n'existe PAS de multiplicateur ×1.6, ×1.5 ou autre valeur intermédiaire!

IMMUNITÉS (×0 dégâts, aucun effet):
- Normal/Combat → Spectre
- Électrique → Sol
- Poison → Acier
- Sol → Vol
- Psy → Ténèbres
- Spectre → Normal
- Dragon → Fée`;

  // Add guardrails based on config
  let guardrails = '\n\nRÈGLES ABSOLUES:\n';
  let ruleNum = 1;

  for (const rule of config.systemRules) {
    if (rule.enabled) {
      guardrails += `${ruleNum}. ${rule.name}: ${rule.description}\n`;
      ruleNum++;
    }
  }

  // Add intent-specific instructions
  let intentInstructions = '\n\nINSTRUCTIONS POUR CETTE RÉPONSE:\n';

  if (userIntent === 'list') {
    intentInstructions += `- L'utilisateur demande une LISTE simple
- Réponds UNIQUEMENT avec la liste demandée, en format bullet points (•)
- NE PAS ajouter de commentaire final ou de classement
- NE PAS dire "le plus fort", "le meilleur", "suivi de", etc.
- Format attendu:
  Contre le type X, les types super efficaces sont :
  • Type 1
  • Type 2
  • Type 3`;
  } else if (userIntent === 'ranking') {
    intentInstructions += `- L'utilisateur demande un CLASSEMENT ou une RECOMMANDATION
- Tu peux utiliser des termes comme "le meilleur", "le plus efficace"
- Justifie ton classement`;
  } else if (userIntent === 'explanation') {
    intentInstructions += `- L'utilisateur demande une EXPLICATION
- Réponds de manière pédagogique
- Utilise des exemples si utile`;
  }

  if (config.guardrails.admitUncertainty) {
    intentInstructions += `\n- Si tu n'es pas certain, dis "Je ne suis pas sûr" plutôt que d'inventer`;
  }

  return basePrompt + typeChart + guardrails + intentInstructions;
}
