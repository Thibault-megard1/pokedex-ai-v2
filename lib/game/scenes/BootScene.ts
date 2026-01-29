// Boot scene - loads assets and initializes game
import * as Phaser from 'phaser';
import { loadPlayerSprite, createPlayerFrames, createPlayerAnimations } from '../player';

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

    // Load assets with fallback handling
    this.loadPlayerSprite();
    this.loadNPCSprites();
    this.loadTileset();
    this.loadUI();
  }

  loadPlayerSprite() {
    // Load Diamond & Pearl male trainer sprite
    loadPlayerSprite(this);

    this.load.on('loaderror', (file: any) => {
      if (file.key === 'player_spritesheet') {
        console.warn('[BootScene] Player sprite sheet not found, fallback will be used');
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

    // Create manual frames from sprite texture
    this.createPlayerFrames();

    // Create player animations
    this.createPlayerAnimations();

    console.log('[BootScene] Assets loaded, starting MenuScene');
    this.scene.start('MenuScene');
  }

  createFallbackAssets() {
    // Create fallback player sprite if needed
    if (!this.textures.exists('player_spritesheet')) {
      console.log('[BootScene] Creating fallback player sprite');
      
      // Create simple texture matching manual frame layout
      const frameSize = 32;
      const canvas = document.createElement('canvas');
      canvas.width = 112;   // 3 frames wide at x=16,48,80
      canvas.height = 304;  // Tall enough for all frames
      const ctx = canvas.getContext('2d')!;
      
      // Fill with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const dirColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']; // Blue, Green, Orange, Red
      const dirLabels = ['D', 'L', 'R', 'U'];
      
      // Walk frames (y=32, 64, 96, 128)
      [32, 64, 96, 128].forEach((y, dirIndex) => {
        [16, 48, 80].forEach((x) => {
          ctx.fillStyle = dirColors[dirIndex];
          ctx.fillRect(x, y, frameSize, frameSize);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(dirLabels[dirIndex], x + 16, y + 16);
        });
      });
      
      // Run frames (y=176, 208, 240, 272)
      [176, 208, 240, 272].forEach((y, dirIndex) => {
        [16, 48, 80].forEach((x) => {
          ctx.fillStyle = dirColors[dirIndex];
          ctx.fillRect(x, y, frameSize, frameSize);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(dirLabels[dirIndex], x + 16, y + 12);
          ctx.font = '10px monospace';
          ctx.fillText('R', x + 16, y + 22);
        });
      });
      
      // Convert canvas to texture using createCanvas
      const canvasTexture = this.textures.createCanvas('player_spritesheet', canvas.width, canvas.height);
      const context = canvasTexture!.getContext();
      context.drawImage(canvas, 0, 0);
      canvasTexture!.refresh();
      console.log('[BootScene] Created fallback player sprite (manual frame layout)');
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

  createPlayerFrames() {
    // Create manual texture frames
    createPlayerFrames(this);
  }

  createPlayerAnimations() {
    // Create Pokémon-style animations using manual frames
    createPlayerAnimations(this);
  }
}
