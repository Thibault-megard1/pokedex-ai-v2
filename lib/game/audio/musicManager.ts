/**
 * Music Manager for Zone-based Background Music
 * Manages smooth transitions between zone music tracks
 * Integrates with game settings for volume control
 */

import { SettingsManager } from '../SettingsManager';

// Zone music mapping - each zone has its corresponding music file
const ZONE_MUSIC: Record<string, string> = {
  pallettown: '/game/assets/sfx/music/pallettown.mp3',
  lab: '/game/assets/sfx/music/lab.mp3',
  route1: '/game/assets/sfx/music/route1.mp3',
  viridianforest: '/game/assets/sfx/music/viridianforest.mp3',
  route2: '/game/assets/sfx/music/route2.mp3',
};

export class MusicManager {
  private static currentMusic: HTMLAudioElement | null = null;
  private static currentZone: string | null = null;
  private static fadeInterval: NodeJS.Timeout | null = null;

  /**
   * Play music for a specific zone
   * Handles fade out of previous music and fade in of new music
   * 
   * @param zoneName - Name of the zone (e.g., 'pallettown', 'route1')
   * @param fadeDuration - Duration of fade transition in milliseconds (default: 1000)
   */
  static playZoneMusic(zoneName: string, fadeDuration: number = 1000): void {
    // Don't restart music if we're already in the same zone
    if (this.currentZone === zoneName && this.currentMusic && !this.currentMusic.paused) {
      console.log(`[MusicManager] Already playing music for ${zoneName}`);
      return;
    }

    const musicUrl = ZONE_MUSIC[zoneName];
    
    if (!musicUrl) {
      console.warn(`[MusicManager] No music defined for zone: ${zoneName}`);
      this.stopMusic(fadeDuration);
      return;
    }

    console.log(`[MusicManager] Switching to zone music: ${zoneName}`);

    // Fade out current music if any
    if (this.currentMusic) {
      this.fadeOut(this.currentMusic, fadeDuration, () => {
        this.currentMusic?.pause();
        this.currentMusic = null;
        this.startNewMusic(zoneName, musicUrl, fadeDuration);
      });
    } else {
      this.startNewMusic(zoneName, musicUrl, fadeDuration);
    }
  }

  /**
   * Start playing new music with fade in
   */
  private static startNewMusic(zoneName: string, musicUrl: string, fadeDuration: number): void {
    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0;

    // Get volume from settings
    const settings = SettingsManager.get();
    const targetVolume = settings.musicVolume / 100; // Convert 0-100 to 0-1

    audio.play().catch(err => {
      console.error(`[MusicManager] Failed to play music for ${zoneName}:`, err);
    });

    // Fade in
    this.fadeIn(audio, targetVolume, fadeDuration);

    this.currentMusic = audio;
    this.currentZone = zoneName;
  }

  /**
   * Stop current music with fade out
   * 
   * @param fadeDuration - Duration of fade out in milliseconds
   */
  static stopMusic(fadeDuration: number = 1000): void {
    if (this.currentMusic) {
      console.log('[MusicManager] Stopping music');
      this.fadeOut(this.currentMusic, fadeDuration, () => {
        this.currentMusic?.pause();
        this.currentMusic = null;
        this.currentZone = null;
      });
    }
  }

  /**
   * Update volume based on settings
   * Should be called when user changes volume in settings
   */
  static updateVolume(): void {
    if (this.currentMusic) {
      const settings = SettingsManager.get();
      this.currentMusic.volume = settings.musicVolume / 100;
      console.log(`[MusicManager] Updated volume to ${settings.musicVolume}%`);
    }
  }

  /**
   * Pause current music without stopping it
   */
  static pauseMusic(): void {
    if (this.currentMusic && !this.currentMusic.paused) {
      this.currentMusic.pause();
      console.log('[MusicManager] Music paused');
    }
  }

  /**
   * Resume paused music
   */
  static resumeMusic(): void {
    if (this.currentMusic && this.currentMusic.paused) {
      this.currentMusic.play().catch(err => {
        console.error('[MusicManager] Failed to resume music:', err);
      });
      console.log('[MusicManager] Music resumed');
    }
  }

  /**
   * Fade in audio element
   */
  private static fadeIn(audio: HTMLAudioElement, targetVolume: number, duration: number): void {
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    this.fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(volumeStep * currentStep, targetVolume);

      if (currentStep >= steps) {
        if (this.fadeInterval) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
      }
    }, stepDuration);
  }

  /**
   * Fade out audio element
   */
  private static fadeOut(audio: HTMLAudioElement, duration: number, onComplete?: () => void): void {
    const steps = 20;
    const stepDuration = duration / steps;
    const initialVolume = audio.volume;
    const volumeStep = initialVolume / steps;
    let currentStep = 0;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    this.fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(initialVolume - (volumeStep * currentStep), 0);

      if (currentStep >= steps) {
        if (this.fadeInterval) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
        if (onComplete) {
          onComplete();
        }
      }
    }, stepDuration);
  }

  /**
   * Cleanup - stop all music and clear intervals
   */
  static cleanup(): void {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic = null;
    }

    this.currentZone = null;
    console.log('[MusicManager] Cleaned up');
  }

  /**
   * Get current playing zone
   */
  static getCurrentZone(): string | null {
    return this.currentZone;
  }

  /**
   * Check if music is currently playing
   */
  static isPlaying(): boolean {
    return this.currentMusic !== null && !this.currentMusic.paused;
  }

  /**
   * Preload all zone music (optional - for better performance)
   */
  static preloadAllMusic(): void {
    console.log('[MusicManager] Preloading zone music...');
    Object.entries(ZONE_MUSIC).forEach(([zone, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      console.log(`[MusicManager] Preloaded: ${zone}`);
    });
  }
}
