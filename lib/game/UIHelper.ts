// UI Helper - Responsive layout calculations for all game UI
import * as Phaser from 'phaser';

export interface ViewportConfig {
  width: number;
  height: number;
  scale: number;
  padding: number;
  safeLeft: number;
  safeRight: number;
  safeTop: number;
  safeBottom: number;
  centerX: number;
  centerY: number;
  isPortrait: boolean;
  isMobile: boolean;
}

export interface FontSizes {
  tiny: number;
  small: number;
  base: number;
  medium: number;
  large: number;
  title: number;
  huge: number;
}

export class UIHelper {
  private scene: Phaser.Scene;
  private config!: ViewportConfig;
  private fonts!: FontSizes;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.recalculate();
  }

  /**
   * Recalculate all viewport measurements
   * Call this on resize events
   */
  recalculate(): void {
    const { width, height } = this.scene.cameras.main;
    
    // Calculate scale factor (0.75 to 1.25 range)
    // Base reference: 1280x720
    const scaleX = width / 1280;
    const scaleY = height / 720;
    const scale = Math.max(0.75, Math.min(1.25, Math.min(scaleX, scaleY)));
    
    // Calculate padding (scales with screen size)
    const padding = Math.max(12, Math.round(Math.min(width, height) * 0.03));
    
    // Determine if mobile-sized
    const isMobile = width < 768 || height < 600;
    
    this.config = {
      width,
      height,
      scale,
      padding,
      safeLeft: padding,
      safeRight: width - padding,
      safeTop: padding,
      safeBottom: height - padding,
      centerX: width * 0.5,
      centerY: height * 0.5,
      isPortrait: height > width,
      isMobile,
    };

    // Calculate responsive font sizes
    this.fonts = {
      tiny: Math.round(10 * scale),
      small: Math.round(13 * scale),
      base: Math.round(16 * scale),
      medium: Math.round(18 * scale),
      large: Math.round(20 * scale),
      title: Math.round(28 * scale),
      huge: Math.round(32 * scale),
    };
  }

  /**
   * Get current viewport configuration
   */
  getConfig(): ViewportConfig {
    return { ...this.config };
  }

  /**
   * Get responsive font sizes
   */
  getFonts(): FontSizes {
    return { ...this.fonts };
  }

  /**
   * Get scaled value
   */
  scale(value: number): number {
    return Math.round(value * this.config.scale);
  }

  /**
   * Get panel dimensions that fit within safe zone
   */
  getPanelDimensions(maxWidthPercent: number = 0.9, maxHeightPercent: number = 0.9): { width: number; height: number } {
    const safeWidth = this.config.safeRight - this.config.safeLeft;
    const safeHeight = this.config.safeBottom - this.config.safeTop;
    
    return {
      width: Math.round(safeWidth * maxWidthPercent),
      height: Math.round(safeHeight * maxHeightPercent),
    };
  }

  /**
   * Get button dimensions (min 44px for mobile tappability)
   */
  getButtonSize(baseWidth: number, baseHeight: number): { width: number; height: number } {
    const minSize = 44;
    return {
      width: Math.max(minSize, this.scale(baseWidth)),
      height: Math.max(minSize, this.scale(baseHeight)),
    };
  }

  /**
   * Get spacing between UI elements
   */
  getSpacing(base: number = 10): number {
    return Math.max(8, this.scale(base));
  }

  /**
   * Position element in safe zone corner
   */
  getSafeCornerPosition(corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', offsetX: number = 0, offsetY: number = 0): { x: number; y: number } {
    switch (corner) {
      case 'top-left':
        return {
          x: this.config.safeLeft + offsetX,
          y: this.config.safeTop + offsetY,
        };
      case 'top-right':
        return {
          x: this.config.safeRight - offsetX,
          y: this.config.safeTop + offsetY,
        };
      case 'bottom-left':
        return {
          x: this.config.safeLeft + offsetX,
          y: this.config.safeBottom - offsetY,
        };
      case 'bottom-right':
        return {
          x: this.config.safeRight - offsetX,
          y: this.config.safeBottom - offsetY,
        };
    }
  }

  /**
   * Clamp position to safe zone
   */
  clampToSafeZone(x: number, y: number, width: number, height: number): { x: number; y: number } {
    const halfW = width / 2;
    const halfH = height / 2;
    
    return {
      x: Math.max(this.config.safeLeft + halfW, Math.min(this.config.safeRight - halfW, x)),
      y: Math.max(this.config.safeTop + halfH, Math.min(this.config.safeBottom - halfH, y)),
    };
  }

  /**
   * Check if element fits in viewport
   */
  fitsInViewport(width: number, height: number): boolean {
    const safeWidth = this.config.safeRight - this.config.safeLeft;
    const safeHeight = this.config.safeBottom - this.config.safeTop;
    return width <= safeWidth && height <= safeHeight;
  }

  /**
   * Get column count based on viewport width
   */
  getColumnCount(itemWidth: number, minColumns: number = 1, maxColumns: number = 3): number {
    const safeWidth = this.config.safeRight - this.config.safeLeft;
    const spacing = this.getSpacing();
    const possibleColumns = Math.floor((safeWidth + spacing) / (itemWidth + spacing));
    return Math.max(minColumns, Math.min(maxColumns, possibleColumns));
  }

  /**
   * Calculate grid layout
   */
  getGridLayout(itemWidth: number, itemHeight: number, totalItems: number, columns?: number): {
    columns: number;
    rows: number;
    startX: number;
    startY: number;
    spacing: number;
  } {
    const cols = columns || this.getColumnCount(itemWidth);
    const rows = Math.ceil(totalItems / cols);
    const spacing = this.getSpacing();
    
    const totalWidth = cols * itemWidth + (cols - 1) * spacing;
    const totalHeight = rows * itemHeight + (rows - 1) * spacing;
    
    const startX = this.config.centerX - totalWidth / 2;
    const startY = this.config.centerY - totalHeight / 2;
    
    return {
      columns: cols,
      rows,
      startX,
      startY,
      spacing,
    };
  }

  /**
   * Get text style with responsive font size
   */
  getTextStyle(fontSize: 'tiny' | 'small' | 'base' | 'medium' | 'large' | 'title' | 'huge', color: string = '#333333', bold: boolean = false): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontSize: `${this.fonts[fontSize]}px`,
      fontFamily: 'Arial, sans-serif',
      color,
      fontStyle: bold ? 'bold' : 'normal',
    };
  }

  /**
   * Create responsive text object
   */
  createText(x: number, y: number, text: string, fontSize: 'tiny' | 'small' | 'base' | 'medium' | 'large' | 'title' | 'huge', color: string = '#333333', bold: boolean = false): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, text, this.getTextStyle(fontSize, color, bold));
  }

  /**
   * Update text with responsive font
   */
  updateTextStyle(textObj: Phaser.GameObjects.Text, fontSize: 'tiny' | 'small' | 'base' | 'medium' | 'large' | 'title' | 'huge', color?: string, bold?: boolean): void {
    const style = this.getTextStyle(fontSize, color || '#333333', bold || false);
    textObj.setStyle(style);
  }
}
