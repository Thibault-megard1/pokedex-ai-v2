/**
 * Quiz System - Questions and Types
 * Personal questions for AI-powered Pokémon matching
 */

// ============================================================================
// TYPES
// ============================================================================

export type QuestionType = "multiple-choice" | "slider" | "text";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple-choice
  min?: number; // For slider
  max?: number; // For slider
  placeholder?: string; // For text
}

export interface QuizAnswers {
  [questionId: string]: string | number;
}

export interface PokemonMatch {
  id: number;
  name: string;
  name_fr?: string;
  sprite_url?: string;
  confidence: number;
  reasons: string[];
}

export interface QuizResult {
  primary: PokemonMatch;
  alternatives: PokemonMatch[];
  traits_inferred: string[];
}

// ============================================================================
// SCORING DIMENSIONS (for algorithmic matching)
// ============================================================================

export interface ScoringDimensions {
  typeAffinity: { [key: string]: number }; // fire, water, grass, etc.
  statPreferences: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  temperament: string[]; // brave, calm, hasty, etc.
  habitat: string[]; // forest, water, mountain, urban, etc.
  personality: string[]; // social, strategic, protective, etc.
}

// ============================================================================
// QUESTIONS (15 comprehensive personality questions)
// ============================================================================

export const quizQuestions: QuizQuestion[] = [
  // 1. Energy & Social Style
  {
    id: "social_energy",
    type: "multiple-choice",
    question: "Comment préférez-vous passer votre temps libre ?",
    options: [
      "Seul(e), dans un endroit calme et paisible",
      "Avec quelques amis proches",
      "En groupe, entouré(e) de monde",
      "En explorant de nouveaux lieux, peu importe avec qui"
    ]
  },

  // 2. Environment Preference
  {
    id: "environment",
    type: "multiple-choice",
    question: "Quel environnement vous attire le plus ?",
    options: [
      "Les forêts luxuriantes et la nature verdoyante",
      "Les océans, lacs et rivières",
      "Les montagnes rocheuses et les grottes",
      "Les plaines ensoleillées et les déserts",
      "Les villes modernes et animées",
      "Les zones mystérieuses et sombres"
    ]
  },

  // 3. Combat Style
  {
    id: "combat_style",
    type: "multiple-choice",
    question: "Face à un défi ou un conflit, vous êtes plutôt :",
    options: [
      "Offensif - j'attaque directement avec force",
      "Défensif - je protège et résiste",
      "Tactique - j'utilise la stratégie et la ruse",
      "Pacifique - j'évite le conflit autant que possible",
      "Rapide - j'agis vite avant que l'adversaire ne réagisse"
    ]
  },

  // 4. Emotional Temperament
  {
    id: "temperament",
    type: "multiple-choice",
    question: "Comment décririez-vous votre tempérament général ?",
    options: [
      "Calme et posé(e) - rien ne me presse",
      "Énergique et passionné(e) - je vis intensément",
      "Timide et prudent(e) - j'observe avant d'agir",
      "Courageux(se) et audacieux(se) - je fonce sans peur",
      "Joyeux(se) et optimiste - je vois le positif partout"
    ]
  },

  // 5. Speed vs Power
  {
    id: "speed_power",
    type: "slider",
    question: "Préférez-vous la vitesse ou la puissance ? (1 = vitesse, 5 = puissance)",
    min: 1,
    max: 5
  },

  // 6. Team Role
  {
    id: "team_role",
    type: "multiple-choice",
    question: "Dans un groupe ou une équipe, quel est votre rôle naturel ?",
    options: [
      "Le leader qui guide et prend les décisions",
      "Le stratège qui planifie et conseille",
      "Le protecteur qui veille sur les autres",
      "Le solitaire qui préfère agir indépendamment",
      "Le médiateur qui maintient l'harmonie",
      "L'explorateur qui découvre de nouvelles voies"
    ]
  },

  // 7. Motivation & Goals
  {
    id: "motivation",
    type: "multiple-choice",
    question: "Qu'est-ce qui vous motive le plus dans la vie ?",
    options: [
      "Devenir le/la meilleur(e) et atteindre l'excellence",
      "Protéger et aider ceux que j'aime",
      "Découvrir et apprendre sans cesse",
      "Trouver la paix et l'harmonie intérieure",
      "Créer et innover",
      "Vivre des aventures excitantes"
    ]
  },

  // 8. Resilience & Defense
  {
    id: "resilience",
    type: "slider",
    question: "Face aux difficultés, comment êtes-vous ? (1 = sensible, 5 = très résistant)",
    min: 1,
    max: 5
  },

  // 9. Intelligence Style
  {
    id: "intelligence",
    type: "multiple-choice",
    question: "Quelle forme d'intelligence vous représente le mieux ?",
    options: [
      "Logique et analytique - j'aime résoudre des problèmes",
      "Intuitive et créative - je me fie à mon instinct",
      "Émotionnelle et empathique - je comprends les autres",
      "Pratique et concrète - j'apprends en faisant",
      "Stratégique et visionnaire - je pense à long terme"
    ]
  },

  // 10. Activity Level
  {
    id: "activity_level",
    type: "slider",
    question: "Quel est votre niveau d'énergie au quotidien ? (1 = calme/repos, 5 = très actif)",
    min: 1,
    max: 5
  },

  // 11. Time of Day
  {
    id: "time_preference",
    type: "multiple-choice",
    question: "À quel moment de la journée vous sentez-vous le mieux ?",
    options: [
      "Tôt le matin au lever du soleil",
      "En pleine journée sous le soleil",
      "Le soir au crépuscule",
      "La nuit sous les étoiles"
    ]
  },

  // 12. Elemental Affinity
  {
    id: "element",
    type: "multiple-choice",
    question: "Quel élément résonne le plus avec votre personnalité ?",
    options: [
      "Feu - passion, énergie, détermination",
      "Eau - calme, adaptabilité, fluidité",
      "Plante - croissance, patience, bienveillance",
      "Électricité - rapidité, innovation, vivacité",
      "Roche - stabilité, solidité, endurance",
      "Glace - contrôle, précision, élégance"
    ]
  },

  // 13. Decision Making
  {
    id: "decision_making",
    type: "multiple-choice",
    question: "Comment prenez-vous vos décisions importantes ?",
    options: [
      "J'analyse tous les faits et données disponibles",
      "Je suis mon instinct et mes émotions",
      "Je demande conseil à mes proches",
      "Je prends des risques et j'improvise",
      "Je réfléchis longuement et prudemment"
    ]
  },

  // 14. Adaptability
  {
    id: "adaptability",
    type: "slider",
    question: "Comment réagissez-vous face au changement ? (1 = besoin de routine, 5 = adore le changement)",
    min: 1,
    max: 5
  },

  // 15. Loyalty vs Independence
  {
    id: "loyalty",
    type: "multiple-choice",
    question: "Dans vos relations, vous êtes plutôt :",
    options: [
      "Très loyal(e) - mes liens sont sacrés",
      "Indépendant(e) - j'aime ma liberté avant tout",
      "Protecteur(trice) - je veille sur mes proches",
      "Sélectif(ve) - peu d'amis mais très proches",
      "Sociable - j'apprécie beaucoup de relations"
    ]
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function validateAnswers(answers: QuizAnswers): boolean {
  // Check that all required questions are answered
  const requiredQuestions = quizQuestions.filter(q => q.type !== "text");
  
  for (const question of requiredQuestions) {
    if (answers[question.id] === undefined || answers[question.id] === "") {
      return false;
    }
  }
  
  return true;
}

export function formatAnswersForAI(answers: QuizAnswers): string {
  let formatted = "";
  
  for (const question of quizQuestions) {
    const answer = answers[question.id];
    if (answer === undefined) continue;
    
    formatted += `\n${question.question}\n`;
    
    if (question.type === "slider") {
      formatted += `Réponse: ${answer}/5\n`;
    } else {
      formatted += `Réponse: ${answer}\n`;
    }
  }
  
  return formatted;
}
