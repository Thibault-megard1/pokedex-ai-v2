// Utilitaires pour gérer les noms de Pokémon en français

export function getDisplayName(name: string, frenchName?: string | null): string {
  return frenchName || capitalize(name);
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatPokemonName(name: string, frenchName?: string | null): {
  primary: string;
  secondary?: string;
} {
  if (frenchName) {
    return {
      primary: frenchName,
      secondary: capitalize(name)
    };
  }
  return {
    primary: capitalize(name)
  };
}
