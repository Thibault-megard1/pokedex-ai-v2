// Menu scene - shown before game starts
import * as Phaser from 'phaser';
import { saveManager } from '../saveManager';

export class MenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private startText!: Phaser.GameObjects.Text;
  private loadingText!: Phaser.GameObjects.Text;
  private username: string = '';

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1e3a8a);

    // Title
    this.titleText = this.add.text(width / 2, height / 3, 'POKÉMON\nADVENTURE', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#fbbf24',
      align: 'center',
      fontStyle: 'bold',
    });
    this.titleText.setOrigin(0.5);

    // Instructions
    this.startText = this.add.text(
      width / 2,
      height / 2 + 100,
      'Press SPACE to Start',
      {
        fontSize: '24px',
        fontFamily: 'monospace',
        color: '#ffffff',
      }
    );
    this.startText.setOrigin(0.5);

    // Loading text (hidden initially)
    this.loadingText = this.add.text(width / 2, height / 2 + 150, 'Loading save...', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#9ca3af',
    });
    this.loadingText.setOrigin(0.5);
    this.loadingText.setVisible(false);

    // Blinking animation for start text
    this.tweens.add({
      targets: this.startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Get username from data attribute or localStorage
    this.username = this.getUsername();

    // Input
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.startGame();
    });
  }

  getUsername(): string {
    // Try to get from canvas data attribute (set by GameCanvas component)
    const canvas = this.game.canvas;
    const username = canvas.getAttribute('data-username');
    if (username) return username;

    // Fallback
    console.warn('[MenuScene] Username not found, using guest');
    return 'guest';
  }

  async startGame() {
    this.startText.setVisible(false);
    this.loadingText.setVisible(true);

    try {
      console.log('[MenuScene] Loading save for:', this.username);
      const save = await saveManager.loadSave(this.username);
      
      console.log('[MenuScene] Save loaded, starting GameScene');
      this.scene.start('GameScene', { save });
    } catch (error) {
      console.error('[MenuScene] Error loading save:', error);
      this.loadingText.setText('Error loading save. Press SPACE to retry.');
      
      // Allow retry
      this.input.keyboard?.once('keydown-SPACE', () => {
        this.startGame();
      });
    }
  }
}
