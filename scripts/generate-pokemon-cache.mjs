import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '..', 'data', 'pokemon-cache');
const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// Delay helper to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPokemonData(id) {
  try {
    console.log(`Fetching Pokemon #${id}...`);
    
    // Fetch Pokemon data
    const pokemonRes = await fetch(`${POKEAPI_BASE}/pokemon/${id}`);
    if (!pokemonRes.ok) {
      console.error(`Failed to fetch Pokemon #${id}: ${pokemonRes.status}`);
      return null;
    }
    const pokemonData = await pokemonRes.json();
    
    // Fetch species data for French name
    const speciesRes = await fetch(`${POKEAPI_BASE}/pokemon-species/${id}`);
    if (!speciesRes.ok) {
      console.error(`Failed to fetch species #${id}: ${speciesRes.status}`);
      return null;
    }
    const speciesData = await speciesRes.json();
    
    // Extract French name
    const frenchName = speciesData.names.find(n => n.language.name === 'fr')?.name || pokemonData.name;
    
    // Build cache object
    const cacheData = {
      id: pokemonData.id,
      name: pokemonData.name,
      frenchName: frenchName,
      sprite: pokemonData.sprites.front_default,
      types: pokemonData.types.map(t => t.type.name),
      stats: {
        hp: pokemonData.stats[0].base_stat,
        attack: pokemonData.stats[1].base_stat,
        defense: pokemonData.stats[2].base_stat,
        specialAttack: pokemonData.stats[3].base_stat,
        specialDefense: pokemonData.stats[4].base_stat,
        speed: pokemonData.stats[5].base_stat,
      }
    };
    
    return cacheData;
  } catch (error) {
    console.error(`Error fetching Pokemon #${id}:`, error.message);
    return null;
  }
}

async function generateCache(startId = 1, endId = 1025) {
  // Create cache directory if it doesn't exist
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  
  console.log(`Starting cache generation from #${startId} to #${endId}...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let id = startId; id <= endId; id++) {
    const cacheFilePath = path.join(CACHE_DIR, `${id}.json`);
    
    // Skip if already exists
    if (fs.existsSync(cacheFilePath)) {
      console.log(`Cache #${id} already exists, skipping...`);
      continue;
    }
    
    // Fetch and save
    const data = await fetchPokemonData(id);
    
    if (data) {
      fs.writeFileSync(cacheFilePath, JSON.stringify(data, null, 2));
      console.log(`✓ Created cache #${id}: ${data.frenchName}`);
      successCount++;
    } else {
      console.log(`✗ Failed to create cache #${id}`);
      errorCount++;
    }
    
    // Wait 100ms between requests to avoid rate limiting
    await delay(100);
  }
  
  console.log(`\n=== Cache Generation Complete ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${successCount + errorCount}`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const startId = args[0] ? parseInt(args[0]) : 1;
const endId = args[1] ? parseInt(args[1]) : 1025;

generateCache(startId, endId).catch(console.error);
