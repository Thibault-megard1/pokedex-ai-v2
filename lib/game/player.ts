// Player sprite and animation management
import * as Phaser from 'phaser';

/**
 * SPRITE SHEET LAYOUT (male_trainer_dp.png)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Pokémon Diamond & Pearl Male Trainer
 * Frame size: 32x32 pixels
 * 
 * CRITICAL: NOT a continuous grid!
 * Frames are at specific coordinates.
 * 
 * WALKING (base: x=16, y=32):
 * DOWN:  (16,32), (48,32), (80,32)
 * LEFT:  (16,64), (48,64), (80,64)
 * RIGHT: (16,96), (48,96), (80,96)
 * UP:    (16,128), (48,128), (80,128)
 * 
 * RUNNING (base: x=16, y=176):
 * DOWN:  (16,176), (48,176), (80,176)
 * LEFT:  (16,208), (48,208), (80,208)
 * RIGHT: (16,240), (48,240), (80,240)
 * UP:    (16,272), (48,272), (80,272)
 */

export const PLAYER_SPRITE_KEY = 'player_spritesheet';
export const PLAYER_SPRITE_PATH = '/game/assets/player/male_trainer_dp.png';

export type MovementMode = 'walk' | 'run';
export type Direction = 'down' | 'left' | 'right' | 'up';

interface FrameCoordinates {
  x: number;
  y: number;
}

export interface PlayerAnimationConfig {
  frameWidth: number;
  frameHeight: number;
  modes: {
    walk: {
      down: FrameCoordinates[];
      left: FrameCoordinates[];
      right: FrameCoordinates[];
      up: FrameCoordinates[];
    };
    run: {
      down: FrameCoordinates[];
      left: FrameCoordinates[];
      right: FrameCoordinates[];
      up: FrameCoordinates[];
    };
  };
}

export const PLAYER_CONFIG: PlayerAnimationConfig = {
  frameWidth: 32,
  frameHeight: 32,
  modes: {
    walk: {
      down: [
        { x: 16, y: 32 },  // idle
        { x: 48, y: 32 },  // walk1
        { x: 80, y: 32 },  // walk2
      ],
      left: [
        { x: 16, y: 64 },
        { x: 48, y: 64 },
        { x: 80, y: 64 },
      ],
      right: [
        { x: 16, y: 96 },
        { x: 48, y: 96 },
        { x: 80, y: 96 },
      ],
      up: [
        { x: 16, y: 128 },
        { x: 48, y: 128 },
        { x: 80, y: 128 },
      ],
    },
    run: {
      down: [
        { x: 16, y: 176 },
        { x: 48, y: 176 },
        { x: 80, y: 176 },
      ],
      left: [
        { x: 16, y: 208 },
        { x: 48, y: 208 },
        { x: 80, y: 208 },
      ],
      right: [
        { x: 16, y: 240 },
        { x: 48, y: 240 },
        { x: 80, y: 240 },
      ],
      up: [
        { x: 16, y: 272 },
        { x: 48, y: 272 },
        { x: 80, y: 272 },
      ],
    },
  },
};

/**
 * Load player sprite as image (not spritesheet)
 * Frames will be defined manually with exact coordinates
 */
export function loadPlayerSprite(scene: Phaser.Scene): void {
  console.log('[Player] Loading D&P trainer sprite from:', PLAYER_SPRITE_PATH);
  
  // Load as regular image, not spritesheet
  scene.load.image(PLAYER_SPRITE_KEY, PLAYER_SPRITE_PATH);
}

/**
 * Create manual texture frames after image is loaded
 */
export function createPlayerFrames(scene: Phaser.Scene): void {
  if (!scene.textures.exists(PLAYER_SPRITE_KEY)) {
    console.warn('[Player] Sprite texture not found, cannot create frames');
    return;
  }

  const texture = scene.textures.get(PLAYER_SPRITE_KEY);
  const cfg = PLAYER_CONFIG;
  let frameIndex = 0;

  // Create frames for walk mode
  Object.entries(cfg.modes.walk).forEach(([direction, coords]) => {
    coords.forEach((coord, i) => {
      const frameName = `walk_${direction}_${i}`;
      texture.add(frameName, 0, coord.x, coord.y, cfg.frameWidth, cfg.frameHeight);
      frameIndex++;
    });
  });

  // Create frames for run mode
  Object.entries(cfg.modes.run).forEach(([direction, coords]) => {
    coords.forEach((coord, i) => {
      const frameName = `run_${direction}_${i}`;
      texture.add(frameName, 0, coord.x, coord.y, cfg.frameWidth, cfg.frameHeight);
      frameIndex++;
    });
  });

  console.log(`[Player] Created ${frameIndex} manual frames`);
}

/**
 * Create player animations using manually defined frames
 */
export function createPlayerAnimations(scene: Phaser.Scene): void {
  console.log('[Player] Creating D&P trainer animations...');

  if (!scene.textures.exists(PLAYER_SPRITE_KEY)) {
    console.warn('[Player] Sprite texture not found, animations not created');
    return;
  }

  const directions: Direction[] = ['down', 'left', 'right', 'up'];
  let animCount = 0;

  directions.forEach((direction) => {
    // Idle animation (first frame of walk)
    const idleKey = `player-idle-${direction}`;
    if (!scene.anims.exists(idleKey)) {
      scene.anims.create({
        key: idleKey,
        frames: [{ key: PLAYER_SPRITE_KEY, frame: `walk_${direction}_0` }],
        frameRate: 1,
        repeat: 0,
      });
      animCount++;
    }

    // Walk animation
    const walkKey = `player-walk-${direction}`;
    if (!scene.anims.exists(walkKey)) {
      scene.anims.create({
        key: walkKey,
        frames: [
          { key: PLAYER_SPRITE_KEY, frame: `walk_${direction}_0` },
          { key: PLAYER_SPRITE_KEY, frame: `walk_${direction}_1` },
          { key: PLAYER_SPRITE_KEY, frame: `walk_${direction}_2` },
        ],
        frameRate: 8,
        repeat: -1,
      });
      animCount++;
    }

    // Run animation
    const runKey = `player-run-${direction}`;
    if (!scene.anims.exists(runKey)) {
      scene.anims.create({
        key: runKey,
        frames: [
          { key: PLAYER_SPRITE_KEY, frame: `run_${direction}_0` },
          { key: PLAYER_SPRITE_KEY, frame: `run_${direction}_1` },
          { key: PLAYER_SPRITE_KEY, frame: `run_${direction}_2` },
        ],
        frameRate: 12,
        repeat: -1,
      });
      animCount++;
    }
  });

  console.log(`[Player] Created ${animCount} animations (idle + walk + run for 4 directions)`);
}

/**
 * Create player sprite
 */
export function createPlayer(
  scene: Phaser.Scene,
  x: number,
  y: number
): Phaser.GameObjects.Sprite {
  console.log('[Player] Creating player at:', x, y);

  let player: Phaser.GameObjects.Sprite;

  if (scene.textures.exists(PLAYER_SPRITE_KEY)) {
    // Use real sprite sheet
    player = scene.add.sprite(x, y, PLAYER_SPRITE_KEY);
    player.play('player-idle-down'); // Start facing down
    console.log('[Player] Using Pokémon sprite sheet');
  } else {
    // Fallback to colored rectangle
    console.warn('[Player] Sprite sheet not loaded, using fallback');
  const graphics = scene.add.graphics();
  graphics.fillStyle(0x3b82f6, 1);
  graphics.fillRect(0, 0, 32, 32);
  graphics.generateTexture('player_fallback', 32, 32);
  graphics.destroy();
    
    player = scene.add.sprite(x, y, 'player_fallback');
  }

  player.setDepth(10);
  player.setData('lastDirection', 'down');

  return player;
}

/**
 * Update player movement and animations
 */
export function updatePlayer(
  player: Phaser.GameObjects.Sprite,
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
  isMoving: boolean,
  shiftKey?: Phaser.Input.Keyboard.Key
): string | null {
  if (!player || !cursors) return null;

  const lastDirection = player.getData('lastDirection') || 'down';
  let newDirection: string | null = null;
  let shouldMove = false;

  // Determine direction (priority: down > left > right > up)
  if (cursors.down.isDown) {
    newDirection = 'down';
    shouldMove = true;
  } else if (cursors.left.isDown) {
    newDirection = 'left';
    shouldMove = true;
  } else if (cursors.right.isDown) {
    newDirection = 'right';
    shouldMove = true;
  } else if (cursors.up.isDown) {
    newDirection = 'up';
    shouldMove = true;
  }

  // Determine movement mode (run if Shift is held)
  const isRunning = shiftKey?.isDown || false;
  const mode: MovementMode = isRunning ? 'run' : 'walk';

  // Update animation
  if (shouldMove && newDirection) {
    const moveAnim = `player-${mode}-${newDirection}`;
    if (player.anims.currentAnim?.key !== moveAnim) {
      player.play(moveAnim);
    }
    player.setData('lastDirection', newDirection);
  } else {
    // Idle animation
    const idleAnim = `player-idle-${lastDirection}`;
    if (player.anims.currentAnim?.key !== idleAnim) {
      player.play(idleAnim);
    }
  }

  return newDirection;
}

/**
 * Stop player movement and return to idle
 */
export function stopPlayer(player: Phaser.GameObjects.Sprite): void {
  const lastDirection = player.getData('lastDirection') || 'down';
  const idleAnim = `player-idle-${lastDirection}`;
  player.play(idleAnim);
}
