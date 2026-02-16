// Game Settings Management
// Stores and manages user preferences for the game

export interface GameSettings {
  animations: boolean;
  soundEffects: boolean;
  textSpeed: 'slow' | 'normal' | 'fast';
  battleLogVerbosity: 'simple' | 'detailed';
  musicVolume: number; // 0-100
  sfxVolume: number; // 0-100
}

export const DEFAULT_SETTINGS: GameSettings = {
  animations: true,
  soundEffects: true,
  textSpeed: 'normal',
  battleLogVerbosity: 'simple',
  musicVolume: 50,
  sfxVolume: 70,
};

const STORAGE_KEY = 'pokemon_game_settings';

export class SettingsManager {
  private static settings: GameSettings = { ...DEFAULT_SETTINGS };
  private static listeners: Array<(settings: GameSettings) => void> = [];

  /**
   * Load settings from localStorage
   */
  static load(): GameSettings {
    if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (err) {
      console.error('[SettingsManager] Error loading settings:', err);
    }

    return { ...this.settings };
  }

  /**
   * Save settings to localStorage
   */
  static save(settings: Partial<GameSettings>) {
    if (typeof window === 'undefined') return;

    this.settings = { ...this.settings, ...settings };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (err) {
      console.error('[SettingsManager] Error saving settings:', err);
    }
  }

  /**
   * Get current settings
   */
  static get(): GameSettings {
    return { ...this.settings };
  }

  /**
   * Reset settings to default
   */
  static reset() {
    this.settings = { ...DEFAULT_SETTINGS };
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.notifyListeners();
  }

  /**
   * Subscribe to settings changes
   */
  static subscribe(listener: (settings: GameSettings) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.settings }));
  }

  /**
   * Get text delay based on text speed setting
   */
  static getTextDelay(): number {
    const speed = this.settings.textSpeed;
    switch (speed) {
      case 'slow':
        return 80;
      case 'normal':
        return 50;
      case 'fast':
        return 20;
      default:
        return 50;
    }
  }

  /**
   * Check if animations are enabled
   */
  static areAnimationsEnabled(): boolean {
    return this.settings.animations;
  }

  /**
   * Check if sound effects are enabled
   */
  static areSoundEffectsEnabled(): boolean {
    return this.settings.soundEffects;
  }

  /**
   * Get battle log verbosity
   */
  static getBattleLogVerbosity(): 'simple' | 'detailed' {
    return this.settings.battleLogVerbosity;
  }

  /**
   * Get music volume (0-1)
   */
  static getMusicVolume(): number {
    return this.settings.musicVolume / 100;
  }

  /**
   * Get SFX volume (0-1)
   */
  static getSfxVolume(): number {
    return this.settings.sfxVolume / 100;
  }
}

// Initialize settings on module load
if (typeof window !== 'undefined') {
  SettingsManager.load();
}
