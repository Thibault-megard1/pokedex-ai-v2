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
// QUESTIONS (10-15 personal, non-sensitive questions)
// ============================================================================

export const quizQuestions: QuizQuestion[] = [
  // Social Energy
  {
    id: "social_energy",
    type: "multiple-choice",
    question: "Comment rechargez-vous votre énergie ?",
    options: [
      "En passant du temps seul(e) dans un endroit calme",
      "En sortant avec des amis et en rencontrant de nouvelles personnes",
      "Un équilibre entre moments sociaux et temps seul(e)",
      "En explorant de nouveaux endroits, peu importe avec qui"
    ]
  },

  // Environment Preference
  {
    id: "environment",
    type: "multiple-choice",
    question: "Quel environnement vous attire le plus ?",
    options: [
      "Les montagnes et les hauts sommets",
      "La mer et les océans",
      "Les forêts denses et mystérieuses",
      "Les villes animées et modernes",
      "Les déserts ou plaines ouvertes",
      "Les grottes et espaces souterrains"
    ]
  },

  // Conflict Style
  {
    id: "conflict_style",
    type: "multiple-choice",
    question: "Face à un conflit, vous préférez généralement :",
    options: [
      "Éviter la confrontation et trouver une solution pacifique",
      "Affronter directement le problème avec courage",
      "Utiliser la stratégie et la réflexion pour résoudre",
      "Protéger les autres avant tout",
      "Chercher un compromis créatif"
    ]
  },

  // Planning Style
  {
    id: "planning",
    type: "slider",
    question: "Entre organisation et spontanéité, où vous situez-vous ?",
    min: 1,
    max: 5
  },

  // Motivation
  {
    id: "motivation",
    type: "multiple-choice",
    question: "Qu'est-ce qui vous motive le plus dans la vie ?",
    options: [
      "Atteindre l'excellence et être le/la meilleur(e)",
      "Aider et protéger les autres",
      "Explorer et découvrir de nouvelles choses",
      "Créer et innover",
      "Trouver l'équilibre et l'harmonie",
      "Relever des défis excitants"
    ]
  },

  // Pace
  {
    id: "pace",
    type: "slider",
    question: "À quel rythme préférez-vous vivre ? (1 = calme et réfléchi, 5 = rapide et intense)",
    min: 1,
    max: 5
  },

  // Values
  {
    id: "values",
    type: "multiple-choice",
    question: "Quelle valeur est la plus importante pour vous ?",
    options: [
      "La loyauté et la fidélité",
      "La liberté et l'indépendance",
      "La curiosité et l'apprentissage",
      "La force et le courage",
      "La sagesse et la réflexion",
      "La créativité et l'originalité"
    ]
  },

  // Leadership
  {
    id: "leadership",
    type: "multiple-choice",
    question: "Dans un groupe, vous êtes plutôt :",
    options: [
      "Le leader qui prend les décisions",
      "Le conseiller stratégique",
      "Le protecteur du groupe",
      "L'explorateur qui ouvre la voie",
      "Le médiateur qui maintient l'harmonie",
      "L'indépendant qui préfère agir seul"
    ]
  },

  // Adaptability
  {
    id: "adaptability",
    type: "slider",
    question: "Face au changement, comment réagissez-vous ? (1 = j'ai besoin de stabilité, 5 = j'adore le changement)",
    min: 1,
    max: 5
  },

  // Element Affinity
  {
    id: "element",
    type: "multiple-choice",
    question: "Quel élément vous représente le mieux ?",
    options: [
      "Le feu - passion et énergie",
      "L'eau - calme et adaptabilité",
      "La terre - stabilité et force",
      "L'air - liberté et légèreté",
      "L'électricité - vivacité et innovation",
      "La glace - contrôle et précision"
    ]
  },

  // Emotional Expression
  {
    id: "emotions",
    type: "slider",
    question: "Exprimez-vous facilement vos émotions ? (1 = réservé(e), 5 = très expressif/ve)",
    min: 1,
    max: 5
  },

  // Problem Solving
  {
    id: "problem_solving",
    type: "multiple-choice",
    question: "Face à un problème complexe :",
    options: [
      "J'analyse méthodiquement toutes les options",
      "Je fonce et j'apprends en faisant",
      "Je demande conseil aux autres",
      "J'utilise mon intuition",
      "Je cherche une solution créative et originale"
    ]
  },

  // Time of Day
  {
    id: "time_preference",
    type: "multiple-choice",
    question: "À quel moment êtes-vous le/la plus productif/ve ?",
    options: [
      "Tôt le matin",
      "En pleine journée",
      "Le soir ou la nuit",
      "Ça dépend de mon humeur"
    ]
  },

  // Free Text - Personal Trait
  {
    id: "personal_trait",
    type: "text",
    question: "Décrivez-vous en 3-5 mots (adjectifs de personnalité) :",
    placeholder: "Ex: curieux, loyal, calme..."
  },

  // Free Text - Ideal Day
  {
    id: "ideal_day",
    type: "text",
    question: "Décrivez brièvement votre journée idéale :",
    placeholder: "Ex: commencer par une balade en forêt, puis..."
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
