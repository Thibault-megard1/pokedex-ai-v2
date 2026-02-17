/**
 * Exemple d'utilisation du MasterAgent avec Mistral API
 * 
 * Configuration: .env.local
 * LLM_PROVIDER=mistral
 * MISTRAL_API_KEY=vwYRT1yJWMUOUUCh95LH75EwWI41pTvk
 * MISTRAL_MODEL=mistral-small-latest
 */

import { MasterAgent } from "@/lib/agents/MasterAgent";
import { MistralClient } from "@/lib/llm/mistral-client";

// ============================================================================
// Exemple 1: Utilisation par défaut (avec variables d'environnement)
// ============================================================================

async function exemple1_DefaultMistral() {
  console.log("=== Exemple 1: Configuration par défaut ===");
  
  // Crée automatiquement un MistralClient si LLM_PROVIDER=mistral
  const agent = new MasterAgent({ enableReflection: true });
  
  // Vérifier la santé de l'API
  const health = await agent.checkLLMHealth();
  console.log("Mistral API Status:", health.healthy ? "✅ OK" : "❌ Error");
  
  if (!health.healthy) {
    console.error("Erreur Mistral:", health.error);
    return;
  }
  
  // Génération d'une équipe
  const result = await agent.process({
    message: "Crée-moi une équipe offensive pour OU",
    context: {},
  });
  
  console.log("Réflexion:", result.reflection?.reasoning);
  console.log("Confiance:", result.reflection?.confidence);
  console.log("Équipe générée:", result.teamBuildingResponse?.team);
}

// ============================================================================
// Exemple 2: Utilisation avec un client Mistral explicite
// ============================================================================

async function exemple2_ExplicitMistral() {
  console.log("\n=== Exemple 2: Client Mistral explicite ===");
  
  // Créer manuellement le client Mistral
  const mistralClient = new MistralClient(
    "vwYRT1yJWMUOUUCh95LH75EwWI41pTvk",
    "mistral-small-latest"
  );
  
  // Le passer au MasterAgent
  const agent = new MasterAgent({ 
    enableReflection: true,
    llmClient: mistralClient 
  });
  
  // Requête de combat
  const battleResult = await agent.process({
    task: "battle", // Task explicite
    context: {
      battleState: {
        playerActive: {
          id: 25,
          name: "Pikachu",
          types: ["electric"],
          stats: [
            { name: "hp", value: 35 },
            { name: "attack", value: 55 },
            { name: "defense", value: 40 },
            { name: "special-attack", value: 50 },
            { name: "special-defense", value: 50 },
            { name: "speed", value: 90 }
          ]
        },
        opponentActive: {
          id: 6,
          name: "Charizard",
          types: ["fire", "flying"],
          stats: [
            { name: "hp", value: 78 },
            { name: "attack", value: 84 },
            { name: "defense", value: 78 },
            { name: "special-attack", value: 109 },
            { name: "special-defense", value: 85 },
            { name: "speed", value: 100 }
          ]
        },
        playerTeam: [],
        opponentTeam: [],
        turn: 1,
        weather: null
      }
    }
  });
  
  console.log("Décision de combat:", battleResult.battleResponse?.action);
  console.log("Confiance:", battleResult.reflection?.confidence);
}

// ============================================================================
// Exemple 3: Combat automatique 6v6 complet
// ============================================================================

async function exemple3_FullBattle6v6() {
  console.log("\n=== Exemple 3: Combat automatique 6v6 ===");
  
  const agent = new MasterAgent({ enableReflection: true });
  
  // 1. Générer notre équipe
  const ourTeamResult = await agent.process({
    task: "team_building",
    teamBuildingRequest: {
      mode: "generate",
      currentTeam: [],
      theme: "rain",
      tier: "OU"
    }
  });
  
  console.log("Notre équipe:", ourTeamResult.teamBuildingResponse?.team?.length, "Pokémon");
  
  // 2. Générer l'équipe adverse (counter)
  const opponentTeamResult = await agent.process({
    task: "team_building",
    teamBuildingRequest: {
      mode: "counter",
      currentTeam: [],
      opponentTeam: ourTeamResult.teamBuildingResponse?.team
    }
  });
  
  console.log("Équipe adverse:", opponentTeamResult.teamBuildingResponse?.team?.length, "Pokémon");
  
  // 3. Lancer le combat auto 6v6
  // NOTE: Cette fonctionnalité nécessite BattleAgent.autoBattle()
  if (ourTeamResult.teamBuildingResponse?.team && opponentTeamResult.teamBuildingResponse?.team) {
    const battleResult = await agent.process({
      task: "battle",
      battleRequest: {
        battleState: {
          playerActive: ourTeamResult.teamBuildingResponse.team[0],
          opponentActive: opponentTeamResult.teamBuildingResponse.team[0],
          playerTeam: ourTeamResult.teamBuildingResponse.team,
          opponentTeam: opponentTeamResult.teamBuildingResponse.team,
          turn: 1,
          weather: null
        },
        ourTeam: ourTeamResult.teamBuildingResponse.team,
        opponentTeam: opponentTeamResult.teamBuildingResponse.team
      }
    });
    
    console.log("Gagnant:", battleResult.battleResponse?.winner);
    console.log("Tours:", battleResult.battleResponse?.turnCount);
  }
}

// ============================================================================
// Exemple 4: Sans réflexion LLM (mode rapide/économique)
// ============================================================================

async function exemple4_NoReflection() {
  console.log("\n=== Exemple 4: Sans réflexion LLM (mode rapide) ===");
  
  // Désactiver la réflexion = pas d'appel API
  const agent = new MasterAgent({ enableReflection: false });
  
  // L'agent utilisera l'inférence locale pour déterminer la tâche
  const result = await agent.process({
    message: "Suggère-moi un Pokémon pour ma team",
    context: {
      currentTeam: [
        { name: "Pikachu", types: ["electric"] },
        { name: "Charizard", types: ["fire", "flying"] }
      ]
    }
  });
  
  console.log("Tâche inférée:", result.task);
  console.log("Suggestion:", result.teamBuildingResponse?.suggestion);
}

// ============================================================================
// Exemple 5: Test de santé Mistral
// ============================================================================

async function exemple5_HealthCheck() {
  console.log("\n=== Exemple 5: Test de santé Mistral ===");
  
  const mistral = new MistralClient(
    process.env.MISTRAL_API_KEY!,
    "mistral-small-latest"
  );
  
  const health = await mistral.healthCheck();
  
  if (health.healthy) {
    console.log("✅ Mistral API fonctionne correctement");
    
    // Test d'appel simple
    const response = await mistral.chat([
      { role: "user", content: "Réponds juste 'OK'" }
    ], { temperature: 0 });
    
    console.log("Réponse de test:", response.content);
  } else {
    console.error("❌ Erreur Mistral:", health.error);
  }
}

// ============================================================================
// Exemple 6: Analyse d'équipe
// ============================================================================

async function exemple6_TeamAnalysis() {
  console.log("\n=== Exemple 6: Analyse d'équipe ===");
  
  const agent = new MasterAgent({ enableReflection: true });
  
  const result = await agent.process({
    task: "analysis",
    context: {
      currentTeam: [
        { name: "Pikachu", types: ["electric"] },
        { name: "Charizard", types: ["fire", "flying"] },
        { name: "Blastoise", types: ["water"] },
        { name: "Venusaur", types: ["grass", "poison"] }
      ]
    }
  });
  
  console.log("Analyse:", result.teamBuildingResponse?.analysis);
}

// ============================================================================
// Exécution de tous les exemples
// ============================================================================

async function runAll() {
  try {
    // Vérifier les variables d'environnement
    if (!process.env.MISTRAL_API_KEY) {
      console.error("❌ MISTRAL_API_KEY not found in environment");
      console.log("Please set it in .env.local:");
      console.log("MISTRAL_API_KEY=vwYRT1yJWMUOUUCh95LH75EwWI41pTvk");
      return;
    }
    
    await exemple1_DefaultMistral();
    await exemple2_ExplicitMistral();
    await exemple3_FullBattle6v6();
    await exemple4_NoReflection();
    await exemple5_HealthCheck();
    await exemple6_TeamAnalysis();
    
    console.log("\n✅ Tous les exemples ont été exécutés avec succès");
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

// Exécuter si lancé directement
if (require.main === module) {
  runAll();
}

export {
  exemple1_DefaultMistral,
  exemple2_ExplicitMistral,
  exemple3_FullBattle6v6,
  exemple4_NoReflection,
  exemple5_HealthCheck,
  exemple6_TeamAnalysis
};
