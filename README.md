# pokedex-ai-v2
## Description
Pokedex AI is a web application that allows users to explore Pokémon data, including details about Pokémon, their evolutions, and more.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation
1. Clone the repository:
	```bash
	git clone https://github.com/Thibault-megard1/pokedex-ai-v2.git
	cd pokedex-ai-v2
	```
2. Install the dependencies:
	```bash
	npm install
	```

### Running the Application
To start the development server, run:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production
To build the application for production, run:
```bash
npm run build
npm start
```

### Directory Structure
- **app/**: Contains the main application files, including pages and styles.
- **components/**: Contains reusable React components like `NavBar` and `PokemonCard`.
- **lib/**: Contains utility functions and API handling.
- **public/**: Contains static assets like images and backgrounds.

### Mermaid Diagram
```mermaid
graph TB
    subgraph "Endpoints API"
        LOGIN["/auth/login<br/>POST"]
        LOGOUT["/auth/logout<br/>POST"]
        REGISTER["/auth/register<br/>POST"]
        ME["/me<br/>GET"]
        AUTOCOMPLETE["/autocomplete/pokemon<br/>GET"]
        BATTLE["/battle<br/>POST"]
        COMPARE["/compare<br/>POST"]
        TEAM_GET["/team<br/>GET"]
        TEAM_PUT["/team<br/>PUT"]
    end

    subgraph "Lib Auth"
        AUTH["lib/auth.ts<br/>verifyLogin()<br/>registerUser()<br/>createSession()<br/>destroySession()<br/>getCurrentSession()"]
    end

    subgraph "Lib Database"
        DB["lib/db.ts<br/>getTeam()<br/>setTeam()"]
    end

    subgraph "Lib PokéAPI"
        POKEAPI["lib/pokeapi.ts<br/>getPokemonDetail()<br/>queryPokemon()<br/>getAdjacentPokemonId()"]
    end

    subgraph "Lib Battle"
        BATTLE_LIB["lib/battle.ts<br/>fight()<br/>estimateWinChance()"]
    end

    subgraph "Data Files"
        USERS["data/users.json<br/>(stockage utilisateurs)"]
        SESSIONS["data/sessions.json<br/>(sessions actives)"]
        TEAMS["data/teams.json<br/>(équipes sauvegardées)"]
        CACHE["data/pokemon-cache/<br/>*.json<br/>(cache local)"]
        NAMES["data/pokemon-names.json<br/>(liste noms)"]
    end

    subgraph "External API"
        POKEAPI_EXT["PokéAPI<br/>https://pokeapi.co"]
    end

    LOGIN --> AUTH
    LOGOUT --> AUTH
    REGISTER --> AUTH
    ME --> AUTH
    
    AUTH --> USERS
    AUTH --> SESSIONS
    
    AUTOCOMPLETE --> NAMES
    AUTOCOMPLETE --> POKEAPI_EXT
    
    BATTLE --> POKEAPI
    BATTLE --> BATTLE_LIB
    
    COMPARE --> POKEAPI
    
    TEAM_GET --> ME
    TEAM_GET --> DB
    TEAM_PUT --> ME
    TEAM_PUT --> DB
    TEAM_PUT --> POKEAPI
    
    POKEAPI --> CACHE
    POKEAPI --> POKEAPI_EXT
    
    DB --> TEAMS
    DB --> SESSIONS
```

## Acknowledgments
- Thanks to the Pokémon API for providing the data.
- Inspired by various Pokémon applications and communities.