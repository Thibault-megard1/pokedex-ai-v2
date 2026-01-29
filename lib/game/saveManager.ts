// Game save/load manager
import type { GameSave, PlayerPokemon } from './types';

const DEFAULT_SAVE: Omit<GameSave, 'username'> = {
  playerName: 'Trainer',
  position: { x: 5, y: 5, map: 'lab' },
  team: [],
  inventory: [
    { id: 'pokeball', name: 'Poké Ball', quantity: 5, type: 'pokeball' },
    { id: 'potion', name: 'Potion', quantity: 3, type: 'potion' },
  ],
  badges: [],
  money: 3000,
  playTime: 0,
  starterChosen: false,
  flags: {},
  lastSaved: new Date().toISOString(),
};

export class SaveManager {
  private save: GameSave | null = null;

  async loadSave(username: string): Promise<GameSave> {
    if (!username) {
      console.error('[SaveManager] No username provided');
      username = 'guest';
    }
    
    try {
      const response = await fetch(`/api/game/save?username=${username}`);
      if (response.ok) {
        const data = await response.json();
        this.save = data.save;
        console.log('[SaveManager] Loaded save:', data.save);
        return data.save;
      }
    } catch (error) {
      console.error('[SaveManager] Error loading save:', error);
    }

    // Create new save
    console.log('[SaveManager] Creating new save for:', username);
    const newSave: GameSave = { 
      ...DEFAULT_SAVE, 
      username,
      playerName: username.charAt(0).toUpperCase() + username.slice(1),
    };
    this.save = newSave;
    console.log('[SaveManager] New save created:', newSave);
    await this.saveGame(newSave);
    return newSave;
  }

  async saveGame(save: GameSave): Promise<boolean> {
    try {
      if (!save.username) {
        console.error('[SaveManager] Cannot save: username is missing');
        return false;
      }
      
      save.lastSaved = new Date().toISOString();
      console.log('[SaveManager] Saving game for:', save.username);
      
      const response = await fetch('/api/game/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ save }),
      });

      if (response.ok) {
        this.save = save;
        console.log('[SaveManager] Game saved successfully');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[SaveManager] Save failed:', response.status, errorData);
        return false;
      }
    } catch (error) {
      console.error('[SaveManager] Error saving game:', error);
      return false;
    }
  }

  getSave(): GameSave | null {
    return this.save;
  }

  updateSave(updates: Partial<GameSave>): void {
    if (this.save) {
      const username = this.save.username; // Preserve username
      this.save = { ...this.save, ...updates, username };
    }
  }

  async autoSave(): Promise<void> {
    if (this.save) {
      await this.saveGame(this.save);
    }
  }

  addPokemon(pokemon: PlayerPokemon): void {
    if (this.save && this.save.team.length < 6) {
      this.save.team.push(pokemon);
    }
  }

  setFlag(flag: string, value: boolean): void {
    if (this.save) {
      this.save.flags[flag] = value;
    }
  }

  getFlag(flag: string): boolean {
    return this.save?.flags[flag] || false;
  }

  addPlayTime(seconds: number): void {
    if (this.save) {
      this.save.playTime += seconds;
    }
  }
}

// Singleton instance
export const saveManager = new SaveManager();
