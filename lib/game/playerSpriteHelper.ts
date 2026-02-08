/**
 * Player Sprite Helper - SVG Animation System
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Centralizes sprite path resolution and animation logic
 * for the new SVG-based player movement system.
 */

export type MovementMode = 'marcher' | 'courir';
export type Direction = 'front' | 'back' | 'left' | 'right';
export type AnimationStep = 'idle' | 'left' | 'right';

/**
 * Get the sprite path for a given movement state
 * @param mode - Movement mode (marcher = walk, courir = run)
 * @param direction - Facing direction
 * @param step - Animation step (idle uses base frame, left/right for animation loop)
 * @returns Full path to the SVG sprite
 */
export function getPlayerSpritePath(
  mode: MovementMode,
  direction: Direction,
  step: AnimationStep
): string {
  const base = `/game/assets/player/${mode}`;
  
  if (step === 'idle') {
    // Idle uses base frame: front.svg, back.svg, left.svg, right.svg
    return `${base}/${direction}.svg`;
  } else {
    // Animation uses left/right variants: front-left.svg, front-right.svg, etc.
    return `${base}/${direction}-${step}.svg`;
  }
}

/**
 * Generate a unique texture key for caching
 */
export function getTextureKey(
  mode: MovementMode,
  direction: Direction,
  step: AnimationStep
): string {
  return `player_${mode}_${direction}_${step}`;
}

/**
 * Get all possible sprite paths for preloading
 * @returns Array of {key, path} pairs for all sprites
 */
export function getAllPlayerSprites(): Array<{ key: string; path: string }> {
  const modes: MovementMode[] = ['marcher', 'courir'];
  const directions: Direction[] = ['front', 'back', 'left', 'right'];
  const steps: AnimationStep[] = ['idle', 'left', 'right'];
  
  const sprites: Array<{ key: string; path: string }> = [];
  
  modes.forEach((mode) => {
    directions.forEach((direction) => {
      steps.forEach((step) => {
        sprites.push({
          key: getTextureKey(mode, direction, step),
          path: getPlayerSpritePath(mode, direction, step),
        });
      });
    });
  });
  
  return sprites;
}

/**
 * Convert arrow key direction to sprite direction
 * Front = down, Back = up, Left = left, Right = right
 */
export function getDirectionFromInput(
  cursors: Phaser.Types.Input.Keyboard.CursorKeys
): Direction | null {
  if (cursors.down.isDown) return 'front';
  if (cursors.up.isDown) return 'back';
  if (cursors.left.isDown) return 'left';
  if (cursors.right.isDown) return 'right';
  return null;
}

/**
 * Animation frame sequencer
 * Cycles through: idle → left → idle → right → idle ...
 */
export class AnimationSequencer {
  private frameIndex: number = 0;
  private frameDuration: number;
  private elapsedTime: number = 0;
  private sequence: AnimationStep[] = ['idle', 'left', 'idle', 'right'];
  
  constructor(framesPerSecond: number = 8) {
    this.frameDuration = 1000 / framesPerSecond;
  }
  
  /**
   * Update the sequencer and return current step
   * @param deltaMs - Time elapsed since last update in milliseconds
   * @param isMoving - Whether player is currently moving
   * @param mode - Movement mode affects animation speed
   * @returns Current animation step
   */
  update(deltaMs: number, isMoving: boolean, mode: MovementMode): AnimationStep {
    if (!isMoving) {
      // Reset to idle when not moving
      this.frameIndex = 0;
      this.elapsedTime = 0;
      return 'idle';
    }
    
    // Adjust speed based on mode
    const speedMultiplier = mode === 'courir' ? 1.5 : 1.0;
    const adjustedDuration = this.frameDuration / speedMultiplier;
    
    this.elapsedTime += deltaMs;
    
    if (this.elapsedTime >= adjustedDuration) {
      this.elapsedTime = 0;
      this.frameIndex = (this.frameIndex + 1) % this.sequence.length;
    }
    
    return this.sequence[this.frameIndex];
  }
  
  /**
   * Reset sequencer to idle state
   */
  reset(): void {
    this.frameIndex = 0;
    this.elapsedTime = 0;
  }
  
  /**
   * Set animation speed
   */
  setSpeed(framesPerSecond: number): void {
    this.frameDuration = 1000 / framesPerSecond;
  }
}
