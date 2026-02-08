/**
 * Player Entity - SVG Animation System
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Handles player sprite creation, movement, and animation
 * using SVG assets (PNG system removed)
 */
import * as Phaser from 'phaser';
import { TILE_SIZE } from './constants';
import {
  type MovementMode,
  type Direction,
  type AnimationStep,
  getPlayerSpritePath,
  getTextureKey,
  getAllPlayerSprites,
  getDirectionFromInput,
  AnimationSequencer,
} from './playerSpriteHelper';

/**
 * Preload all player SVG sprites
 * Called during BootScene to ensure zero lag during gameplay
 */
export function preloadPlayerSprites(scene: Phaser.Scene): void {
  console.log('[Player] Preloading all SVG sprites...');
  
  const sprites = getAllPlayerSprites();
  let loadCount = 0;
  
  sprites.forEach(({ key, path }) => {
    if (!scene.textures.exists(key)) {
      // Load SVG with width/height constraints to match TILE_SIZE
      scene.load.svg(key, path, { width: TILE_SIZE, height: TILE_SIZE });
      loadCount++;
    }
  });
  
  console.log(`[Player] Queued ${loadCount} SVG sprites for loading (${TILE_SIZE}x${TILE_SIZE})`);
}

/**
 * Create player sprite with animation system
 */
export function createPlayer(
  scene: Phaser.Scene,
  x: number,
  y: number
): Phaser.GameObjects.Sprite {
  console.log('[Player] Creating player sprite at:', x, y);
  
  // Create sprite with initial idle texture
  const initialKey = getTextureKey('marcher', 'front', 'idle');
  
  if (!scene.textures.exists(initialKey)) {
    console.warn('[Player] Texture not found, creating fallback');
    createFallbackTexture(scene);
  }
  
  const player = scene.add.sprite(
    x,
    y,
    scene.textures.exists(initialKey) ? initialKey : 'player_fallback'
  );
  
  // Set sprite properties
  // Force sprite to display at exactly TILE_SIZE to fit within one tile
  player.setDisplaySize(TILE_SIZE, TILE_SIZE);
  // Origin at (0.5, 1.0) aligns feet to tile bottom for proper ground contact
  player.setOrigin(0.5, 1.0);
  player.setDepth(10);
  
  // Initialize player data
  player.setData('lastDirection', 'front');
  player.setData('movementMode', 'marcher');
  player.setData('animSequencer', new AnimationSequencer(8));
  player.setData('isMoving', false);
  
  console.log('[Player] Player sprite created successfully');
  return player;
}

/**
 * Update player movement, animation, and sprite
 */
export function updatePlayer(
  player: Phaser.GameObjects.Sprite,
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
  isMoving: boolean,
  shiftKey?: Phaser.Input.Keyboard.Key,
  deltaMs: number = 16
): Direction | null {
  if (!player || !cursors) return null;
  
  // Get current state
  const lastDirection: Direction = player.getData('lastDirection') || 'front';
  const currentMode: MovementMode = player.getData('movementMode') || 'marcher';
  const sequencer: AnimationSequencer = player.getData('animSequencer');
  
  // Determine movement mode (Shift = run/courir)
  const newMode: MovementMode = (shiftKey?.isDown) ? 'courir' : 'marcher';
  
  // Update mode if changed
  if (newMode !== currentMode) {
    player.setData('movementMode', newMode);
    sequencer.reset();
  }
  
  // Determine direction from input
  const inputDirection = getDirectionFromInput(cursors);
  const newDirection = inputDirection || lastDirection;
  
  // Update direction if changed
  if (inputDirection && inputDirection !== lastDirection) {
    player.setData('lastDirection', inputDirection);
    sequencer.reset();
  }
  
  // Update animation sequencer
  const step: AnimationStep = sequencer.update(deltaMs, isMoving, newMode);
  
  // Get texture key and update sprite
  const textureKey = getTextureKey(newMode, newDirection, step);
  
  if (player.texture.key !== textureKey && player.scene.textures.exists(textureKey)) {
    player.setTexture(textureKey);
    // Re-apply display size after texture change to maintain tile-sized sprite
    player.setDisplaySize(TILE_SIZE, TILE_SIZE);
    
    // Optional debug logging (enable in localStorage: debugPlayerAnimation = "true")
    if (typeof window !== 'undefined' && window.localStorage?.getItem('debugPlayerAnimation') === 'true') {
      console.log(`[Player] Animation: ${newMode} ${newDirection} ${step} -> ${textureKey}`);
    }
  }
  
  // Store moving state
  player.setData('isMoving', isMoving);
  
  return inputDirection;
}

/**
 * Stop player movement and return to idle
 */
export function stopPlayer(player: Phaser.GameObjects.Sprite): void {
  if (!player) return;
  
  const lastDirection: Direction = player.getData('lastDirection') || 'front';
  const currentMode: MovementMode = player.getData('movementMode') || 'marcher';
  const sequencer: AnimationSequencer = player.getData('animSequencer');
  
  // Reset animation to idle
  sequencer.reset();
  player.setData('isMoving', false);
  
  // Set idle texture
  const idleKey = getTextureKey(currentMode, lastDirection, 'idle');
  if (player.scene.textures.exists(idleKey)) {
    player.setTexture(idleKey);
    // Re-apply display size to maintain tile-sized sprite
    player.setDisplaySize(TILE_SIZE, TILE_SIZE);
  }
}

/**
 * Create fallback texture if SVG assets fail to load
 */
function createFallbackTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('player_fallback')) return;
  
  console.warn('[Player] Creating fallback texture');
  
  const graphics = scene.add.graphics();
  graphics.fillStyle(0x3b82f6, 1);
  graphics.fillCircle(16, 24, 12);
  graphics.fillStyle(0x1e3a8a, 1);
  graphics.fillCircle(16, 16, 10);
  graphics.generateTexture('player_fallback', 32, 32);
  graphics.destroy();
}

