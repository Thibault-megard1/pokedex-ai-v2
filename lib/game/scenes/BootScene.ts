// Boot scene - loads assets and initializes game
import * as Phaser from 'phaser';
import { preloadPlayerSprites } from '../player';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: { font: '20px monospace', color: '#ffffff' },
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load assets
    this.loadPlayerSprite();
    this.loadNPCSprites();
    this.loadTileset();
    this.loadUI();
  }

  loadPlayerSprite() {
    console.log('[BootScene] Loading player SVG sprites...');
    
    // Preload all SVG player sprites (marcher + courir)
    preloadPlayerSprites(this);

    this.load.on('loaderror', (file: any) => {
      if (file.key?.startsWith('player_')) {
        console.warn('[BootScene] Player sprite failed to load:', file.key);
      }
    });
  }

  loadNPCSprites() {
    const npcSprites = ['professor', 'npc_1', 'npc_2'];
    npcSprites.forEach((sprite) => {
      this.load.image(sprite, `/game/assets/npcs/${sprite}.png`);
    });
  }

  loadTileset() {
    this.load.image('tileset', '/game/assets/tiles/tileset.png');
  }

  loadUI() {
    this.load.image('textbox', '/game/assets/ui/textbox.png');
    this.load.image('menu_bg', '/game/assets/ui/menu_bg.png');
    this.load.image('battle_bg', '/game/assets/ui/battle_bg.png');
  }

  create() {
    // Create fallback graphics if assets failed to load
    this.createFallbackAssets();

    console.log('[BootScene] Assets loaded, starting MenuScene');
    this.scene.start('MenuScene');
  }

  createFallbackAssets() {
    // Create fallback player sprite if needed (simple colored circle)
    if (!this.textures.exists('player_fallback')) {
      console.log('[BootScene] Creating fallback player sprite');
      
      const graphics = this.add.graphics();
      graphics.fillStyle(0x3b82f6, 1);
      graphics.fillCircle(16, 24, 12);
      graphics.fillStyle(0x1e3a8a, 1);
      graphics.fillCircle(16, 16, 10);
      graphics.generateTexture('player_fallback', 32, 32);
      graphics.destroy();
    }

    // Create fallback NPC sprites
    ['professor', 'npc_1', 'npc_2'].forEach((key, index) => {
      if (!this.textures.exists(key)) {
        const graphics = this.add.graphics();
        const colors = [0x10b981, 0xf59e0b, 0xef4444];
        graphics.fillStyle(colors[index], 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
      }
    });

    // Create fallback UI elements
    if (!this.textures.exists('textbox')) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x1f2937, 0.95);
      graphics.fillRoundedRect(0, 0, 400, 100, 10);
      graphics.lineStyle(2, 0xffffff, 1);
      graphics.strokeRoundedRect(0, 0, 400, 100, 10);
      graphics.generateTexture('textbox', 400, 100);
      graphics.destroy();
    }
  }
}