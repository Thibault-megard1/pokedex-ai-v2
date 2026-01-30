// Debug Helper - Visual debugging for pointer interactions
import * as Phaser from 'phaser';

export class DebugHelper {
  private scene: Phaser.Scene;
  private debugGraphics: Phaser.GameObjects.Graphics | null = null;
  private debugText: Phaser.GameObjects.Text | null = null;
  private pointerMarker: Phaser.GameObjects.Arc | null = null;
  private isDebugEnabled: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  enable() {
    if (this.isDebugEnabled) return;
    this.isDebugEnabled = true;

    console.log('[DebugHelper] Enabling pointer debug mode');

    // Create debug graphics layer
    this.debugGraphics = this.scene.add.graphics();
    this.debugGraphics.setDepth(10000);
    this.debugGraphics.setScrollFactor(0);

    // Create debug text
    this.debugText = this.scene.add.text(10, 10, 'Debug Mode: ON\nClick to see pointer coords', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
    });
    this.debugText.setDepth(10001);
    this.debugText.setScrollFactor(0);

    // Create pointer marker (using Arc which is like Circle)
    this.pointerMarker = this.scene.add.arc(0, 0, 8, 0, 360, false, 0xff0000, 0.8);
    this.pointerMarker.setDepth(10002);
    this.pointerMarker.setScrollFactor(0);
    this.pointerMarker.setVisible(false);

    // Add pointer listeners
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);

    // Draw hitboxes for all interactive objects
    this.drawHitboxes();
  }

  disable() {
    if (!this.isDebugEnabled) return;
    this.isDebugEnabled = false;

    console.log('[DebugHelper] Disabling pointer debug mode');

    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);

    if (this.debugGraphics) {
      this.debugGraphics.destroy();
      this.debugGraphics = null;
    }

    if (this.debugText) {
      this.debugText.destroy();
      this.debugText = null;
    }

    if (this.pointerMarker) {
      this.pointerMarker.destroy();
      this.pointerMarker = null;
    }
  }

  toggle() {
    if (this.isDebugEnabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    console.log('[DebugHelper] Pointer DOWN:', {
      x: pointer.x,
      y: pointer.y,
      worldX: pointer.worldX,
      worldY: pointer.worldY,
      button: pointer.button,
      time: pointer.time,
    });

    if (this.debugText) {
      this.debugText.setText(
        `Debug Mode: ON\n` +
        `DOWN: (${Math.round(pointer.x)}, ${Math.round(pointer.y)})\n` +
        `World: (${Math.round(pointer.worldX)}, ${Math.round(pointer.worldY)})\n` +
        `Button: ${pointer.button}`
      );
    }

    if (this.pointerMarker) {
      this.pointerMarker.setPosition(pointer.x, pointer.y);
      this.pointerMarker.setVisible(true);
      this.pointerMarker.setFillStyle(0xff0000, 1);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (pointer.isDown && this.pointerMarker) {
      this.pointerMarker.setPosition(pointer.x, pointer.y);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    console.log('[DebugHelper] Pointer UP:', {
      x: pointer.x,
      y: pointer.y,
    });

    if (this.pointerMarker) {
      this.pointerMarker.setFillStyle(0x00ff00, 0.5);
      this.scene.time.delayedCall(200, () => {
        if (this.pointerMarker) this.pointerMarker.setVisible(false);
      });
    }
  }

  private drawHitboxes() {
    if (!this.debugGraphics) return;

    this.debugGraphics.clear();

    // Draw a simple grid to show canvas is responsive
    this.debugGraphics.lineStyle(1, 0x00ff00, 0.3);
    
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    
    // Draw grid lines every 100px
    for (let x = 0; x < width; x += 100) {
      this.debugGraphics.moveTo(x, 0);
      this.debugGraphics.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 100) {
      this.debugGraphics.moveTo(0, y);
      this.debugGraphics.lineTo(width, y);
    }
    this.debugGraphics.strokePath();
    
    console.log('[DebugHelper] Canvas size:', width, 'x', height);
  }

  refresh() {
    if (this.isDebugEnabled) {
      this.drawHitboxes();
    }
  }
}
