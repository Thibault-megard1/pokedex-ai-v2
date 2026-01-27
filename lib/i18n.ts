export const SUPPORTED_LANGS = ["fr", "en", "es"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

type TranslationDict = {
  [key: string]: {
    fr: string;
    en: string;
    es: string;
  };
};

export const dict: TranslationDict = {
  // Navbar
  "nav.home": { fr: "Accueil", en: "Home", es: "Inicio" },
  "nav.pokedex": { fr: "Pokédex", en: "Pokédex", es: "Pokédex" },
  "nav.list": { fr: "Liste", en: "List", es: "Lista" },
  "nav.favorites": { fr: "Favoris", en: "Favorites", es: "Favoritos" },
  "nav.compare": { fr: "Comparer", en: "Compare", es: "Comparar" },
  "nav.stats": { fr: "Statistiques", en: "Statistics", es: "Estadísticas" },
  "nav.battle": { fr: "Combat", en: "Battle", es: "Combate" },
  "nav.battle.1v1": { fr: "1v1", en: "1v1", es: "1v1" },
  "nav.battle.tournament": { fr: "Tournoi 6v6", en: "6v6 Tournament", es: "Torneo 6v6" },
  "nav.battle.calculator": { fr: "Calculateur", en: "Calculator", es: "Calculador" },
  "nav.trainer": { fr: "Dresseur", en: "Trainer", es: "Entrenador" },
  "nav.team": { fr: "Mon Équipe", en: "My Team", es: "Mi Equipo" },
  "nav.quiz": { fr: "Quiz", en: "Quiz", es: "Quiz" },
  "nav.login": { fr: "Connexion", en: "Login", es: "Iniciar sesión" },
  "nav.logout": { fr: "Déconnexion", en: "Logout", es: "Cerrar sesión" },
  "nav.register": { fr: "Inscription", en: "Sign up", es: "Registrarse" },
  "nav.trainer.label": { fr: "Dresseur:", en: "Trainer:", es: "Entrenador:" },

  // Home page
  "home.title": { fr: "POKÉDEX", en: "POKÉDEX", es: "POKÉDEX" },
  "home.pokedex.label": { fr: "POKÉDEX", en: "POKÉDEX", es: "POKÉDEX" },
  "home.pokedex.desc": { fr: "Explorer tous les Pokémon", en: "Explore all Pokémon", es: "Explorar todos los Pokémon" },
  "home.team.label": { fr: "ÉQUIPE", en: "TEAM", es: "EQUIPO" },
  "home.team.desc": { fr: "Créer et gérer votre équipe", en: "Create and manage your team", es: "Crear y gestionar tu equipo" },
  "home.battle.label": { fr: "COMBAT", en: "BATTLE", es: "COMBATE" },
  "home.battle.desc": { fr: "Affronter l'IA en combat 1v1", en: "Battle AI in 1v1 combat", es: "Batalla contra IA en combate 1v1" },
  "home.battle.features": { fr: "Fonctionnalités de Combat", en: "Battle Features", es: "Funciones de Combate" },
  "home.battle.6v6": { fr: "Combat 6v6", en: "6v6 Battle", es: "Batalla 6v6" },
  "home.battle.6v6.desc": { fr: "Équipes complètes avec points d'évolution", en: "Full teams with evolution points", es: "Equipos completos con puntos de evolución" },
  "home.battle.tournament": { fr: "Tournoi", en: "Tournament", es: "Torneo" },
  "home.battle.tournament.desc": { fr: "Compétitions avec IA avancée", en: "Competitions with advanced AI", es: "Competiciones con IA avanzada" },
  "home.battle.calculator": { fr: "Calculateur de Dégâts", en: "Damage Calculator", es: "Calculador de Daño" },
  "home.battle.calculator.desc": { fr: "Planifier votre stratégie de combat", en: "Plan your battle strategy", es: "Planifica tu estrategia de batalla" },
  "home.tools": { fr: "Outils & Fonctionnalités", en: "Tools & Features", es: "Herramientas y Funciones" },
  "home.tools.team": { fr: "Constructeur d'Équipe", en: "Team Builder", es: "Constructor de Equipo" },
  "home.tools.team.desc": { fr: "Créez votre équipe parfaite", en: "Build your perfect team", es: "Crea tu equipo perfecto" },
  "home.tools.compare": { fr: "Comparateur", en: "Comparator", es: "Comparador" },
  "home.tools.compare.desc": { fr: "Comparez les statistiques des Pokémon", en: "Compare Pokémon stats", es: "Compara estadísticas de Pokémon" },
  "home.tools.quiz": { fr: "Quiz Pokémon", en: "Pokémon Quiz", es: "Quiz Pokémon" },
  "home.tools.quiz.desc": { fr: "Testez vos connaissances", en: "Test your knowledge", es: "Pon a prueba tus conocimientos" },
  "home.tools.favorites": { fr: "Favoris", en: "Favorites", es: "Favoritos" },
  "home.tools.favorites.desc": { fr: "Vos Pokémon préférés", en: "Your favorite Pokémon", es: "Tus Pokémon favoritos" },
  "home.auth.required": { fr: "Connexion requise pour accéder à cette fonctionnalité", en: "Login required to access this feature", es: "Se requiere iniciar sesión para acceder a esta función" },
  "home.get.started": { fr: "Commencez Votre Aventure", en: "Start Your Adventure", es: "Comienza Tu Aventura" },
  "home.join": { fr: "Rejoignez des milliers de dresseurs dans votre quête pour tous les attraper!", en: "Join thousands of trainers in your quest to catch 'em all!", es: "¡Únete a miles de entrenadores en tu búsqueda para atraparlos a todos!" },

  // Auth
  "auth.login.title": { fr: "Connexion", en: "Login", es: "Iniciar sesión" },
  "auth.register.title": { fr: "Inscription", en: "Sign up", es: "Registrarse" },
  "auth.username": { fr: "Nom d'utilisateur", en: "Username", es: "Nombre de usuario" },
  "auth.password": { fr: "Mot de passe", en: "Password", es: "Contraseña" },
  "auth.submit": { fr: "Se connecter", en: "Log in", es: "Iniciar sesión" },
  "auth.register.submit": { fr: "S'inscrire", en: "Sign up", es: "Registrarse" },
  "auth.no.account": { fr: "Pas de compte ?", en: "No account?", es: "¿No tienes cuenta?" },
  "auth.have.account": { fr: "Déjà un compte ?", en: "Already have an account?", es: "¿Ya tienes cuenta?" },

  // Common UI
  "common.search": { fr: "Rechercher", en: "Search", es: "Buscar" },
  "common.filter": { fr: "Filtrer", en: "Filter", es: "Filtrar" },
  "common.apply": { fr: "Appliquer", en: "Apply", es: "Aplicar" },
  "common.reset": { fr: "Réinitialiser", en: "Reset", es: "Reiniciar" },
  "common.next": { fr: "Suivant", en: "Next", es: "Siguiente" },
  "common.previous": { fr: "Précédent", en: "Previous", es: "Anterior" },
  "common.cancel": { fr: "Annuler", en: "Cancel", es: "Cancelar" },
  "common.save": { fr: "Sauvegarder", en: "Save", es: "Guardar" },
  "common.delete": { fr: "Supprimer", en: "Delete", es: "Eliminar" },
  "common.edit": { fr: "Modifier", en: "Edit", es: "Editar" },
  "common.close": { fr: "Fermer", en: "Close", es: "Cerrar" },
  "common.loading": { fr: "Chargement...", en: "Loading...", es: "Cargando..." },
  "common.error": { fr: "Erreur", en: "Error", es: "Error" },

  // Battle
  "battle.start": { fr: "Lancer le combat", en: "Start battle", es: "Iniciar combate" },
  "battle.select.pokemon": { fr: "Sélectionner un Pokémon", en: "Select a Pokémon", es: "Seleccionar un Pokémon" },
  "battle.team.1": { fr: "Équipe 1", en: "Team 1", es: "Equipo 1" },
  "battle.team.2": { fr: "Équipe 2", en: "Team 2", es: "Equipo 2" },
  "battle.winner": { fr: "Vainqueur", en: "Winner", es: "Ganador" },
  "battle.round": { fr: "Manche", en: "Round", es: "Ronda" },
  "battle.evolution.points": { fr: "Points d'évolution", en: "Evolution points", es: "Puntos de evolución" },
  "battle.unlock.legendary": { fr: "Débloquer un légendaire", en: "Unlock a legendary", es: "Desbloquear un legendario" },

  // Team
  "team.title": { fr: "Mon Équipe", en: "My Team", es: "Mi Equipo" },
  "team.create": { fr: "Créer une équipe", en: "Create team", es: "Crear equipo" },
  "team.add.pokemon": { fr: "Ajouter un Pokémon", en: "Add Pokémon", es: "Añadir Pokémon" },
  "team.remove": { fr: "Retirer", en: "Remove", es: "Eliminar" },
  "team.empty": { fr: "Votre équipe est vide", en: "Your team is empty", es: "Tu equipo está vacío" },

  // Quiz
  "quiz.start": { fr: "Démarrer le quiz", en: "Start quiz", es: "Iniciar quiz" },
  "quiz.submit": { fr: "Soumettre", en: "Submit", es: "Enviar" },
  "quiz.results": { fr: "Résultats", en: "Results", es: "Resultados" },
  "quiz.score": { fr: "Score", en: "Score", es: "Puntuación" },
  "quiz.question": { fr: "Question", en: "Question", es: "Pregunta" },

  // Pokémon details
  "pokemon.details": { fr: "Détails", en: "Details", es: "Detalles" },
  "pokemon.stats": { fr: "Statistiques", en: "Stats", es: "Estadísticas" },
  "pokemon.abilities": { fr: "Capacités", en: "Abilities", es: "Habilidades" },
  "pokemon.evolutions": { fr: "Évolutions", en: "Evolutions", es: "Evoluciones" },
  "pokemon.moves": { fr: "Attaques", en: "Moves", es: "Movimientos" },
  "pokemon.type": { fr: "Type", en: "Type", es: "Tipo" },
  "pokemon.height": { fr: "Taille", en: "Height", es: "Altura" },
  "pokemon.weight": { fr: "Poids", en: "Weight", es: "Peso" },
};

export function t(lang: Lang, key: string): string {
  const translation = dict[key];
  if (!translation) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  return translation[lang] || translation.fr || key;
}

export function getBrowserLang(): Lang {
  if (typeof window === "undefined") return "fr";
  
  const browserLang = navigator.language.split("-")[0].toLowerCase();
  
  if (SUPPORTED_LANGS.includes(browserLang as Lang)) {
    return browserLang as Lang;
  }
  
  return "fr";
}
