// Main game scene with player movement, NPCs, and interactions
import * as Phaser from 'phaser';
import type { GameSave, NPCData } from '../types';
import { saveManager } from '../saveManager';
import { getMap, ENCOUNTER_TABLES } from '../maps';
import { KEYBOARD_CONTROLS } from '../types';
import { createPlayer, updatePlayer, stopPlayer } from '../player';
import { MenuManager } from '../MenuManager';
import { UIHelper } from '../UIHelper';
import { DebugHelper } from '../DebugHelper';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private npcs: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private currentMap!: string;
  private collisionLayer: number[][] = [];
  private grassLayer: number[][] = [];
  private tileSize: number = 32;
  private isMoving: boolean = false;
  private canMove: boolean = true;
  private dialogueBox: Phaser.GameObjects.Container | null = null;
  private currentNPC: NPCData | null = null;
  private menuManager!: MenuManager;
  private uiHelper!: UIHelper;
  private debugHelper!: DebugHelper;
  private uiButtons: Phaser.GameObjects.Container[] = [];
  private menuOpen: boolean = false;
  private menuContainer: Phaser.GameObjects.Container | null = null;
  private grassStepCounter: number = 0;
  private playTimeTimer?: Phaser.Time.TimerEvent;
  private autoSaveTimer?: Phaser.Time.TimerEvent;
  private lastSaveTime: number = Date.now();
  private confirmExitContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }
  
  preload() {
    // Ensure input is enabled
    this.input.enabled = true;
    console.log('[GameScene] Input system enabled:', this.input.enabled);
  }

  init(data: { save: GameSave }) {
    console.log('[GameScene] Initializing with save:', data.save);
    // Save is managed by saveManager singleton
  }

  create() {
    const save = saveManager.getSave();
    if (!save) {
      console.error('[GameScene] No save data found!');
      this.scene.start('MenuScene');
      return;
    }
    
    // Debug: Log pointer events with detailed coordinate info
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const canvas = this.game.canvas;
      const rect = canvas ? canvas.getBoundingClientRect() : null;
      console.log('[GameScene] Pointer down:', {
        screen: `${Math.round(pointer.x)}, ${Math.round(pointer.y)}`,
        world: `${Math.round(pointer.worldX)}, ${Math.round(pointer.worldY)}`,
        canvas: `${this.scale.width}x${this.scale.height}`,
        window: `${window.innerWidth}x${window.innerHeight}`,
        canvasOffset: rect ? `${Math.round(rect.left)}, ${Math.round(rect.top)}` : 'unknown',
        scaleMode: this.scale.scaleMode,
      });
    });

    this.currentMap = save.position.map;
    this.loadMap(this.currentMap);
    this.createPlayer(save.position.x, save.position.y);
    this.setupCamera();
    this.setupInput();
    this.setupTimers();
    
    // Initialize UI systems
    this.uiHelper = new UIHelper(this);
    this.menuManager = new MenuManager(this);
    this.debugHelper = new DebugHelper(this);
    
    // Create UI buttons
    this.createUIButtons();
    
    // Listen for resize
    this.scale.on('resize', this.onResize, this);

    // Listen for wake event (when returning from BattleScene via wake)
    this.events.on('wake', () => {
      console.log('[GameScene] Waking up from battle, resetting input...');
      this.resetInput();
    });

    // Also reset input on create (when returning from BattleScene via start)
    this.time.delayedCall(100, () => {
      this.resetInput();
    });

    console.log('[GameScene] Scene created successfully');
  }

  loadMap(mapName: string) {
    const mapData = getMap(mapName);
    if (!mapData) {
      console.error(`[GameScene] Map not found: ${mapName}`);
      return;
    }

    this.collisionLayer = mapData.layers.collision;
    this.grassLayer = mapData.layers.grass;
    this.tileSize = mapData.tileSize;

    // Create tile map (simple grid rendering)
    const ground = mapData.layers.ground;
    for (let y = 0; y < ground.length; y++) {
      for (let x = 0; x < ground[y].length; x++) {
        const tileType = ground[y][x];
        const color = this.getTileColor(tileType);
        const tile = this.add.rectangle(
          x * this.tileSize + this.tileSize / 2,
          y * this.tileSize + this.tileSize / 2,
          this.tileSize,
          this.tileSize,
          color
        );
        tile.setDepth(0);

        // Add grass overlay if applicable
        if (mapData.layers.grass[y][x] === 1) {
          const grass = this.add.rectangle(
            x * this.tileSize + this.tileSize / 2,
            y * this.tileSize + this.tileSize / 2,
            this.tileSize,
            this.tileSize,
            0x16a34a,
            0.5
          );
          grass.setDepth(0.5);
        }
      }
    }

    // Spawn NPCs
    mapData.npcs.forEach((npcData) => {
      this.createNPC(npcData);
    });

    console.log(`[GameScene] Loaded map: ${mapName}`);
  }

  getTileColor(tileType: number): number {
    const colors: Record<number, number> = {
      0: 0x000000, // Door/exit
      1: 0x6b7280, // Wall
      2: 0xe5e7eb, // Floor
      3: 0x9ca3af, // Table/furniture
      4: 0x22c55e, // Grass
      5: 0x3b82f6, // Water
    };
    return colors[tileType] || 0xffffff;
  }

  createPlayer(x: number, y: number) {
    const pixelX = x * this.tileSize + this.tileSize / 2;
    const pixelY = y * this.tileSize + this.tileSize / 2;
    
    this.player = createPlayer(this, pixelX, pixelY);
    this.player.setData('gridX', x);
    this.player.setData('gridY', y);
    
    console.log('[GameScene] Player created at grid:', x, y);
  }

  createNPC(npcData: NPCData) {
    const npc = this.add.sprite(
      npcData.x * this.tileSize + this.tileSize / 2,
      npcData.y * this.tileSize + this.tileSize / 2,
      npcData.sprite
    );
    npc.setDepth(10);
    npc.setData('npcData', npcData);
    this.npcs.set(npcData.id, npc);
  }

  setupCamera() {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2); // Better visibility for 32x32 sprites
  }

  setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.setupKeyboardEvents();
    
    // Add debug toggle (F3 key)
    this.input.keyboard?.on('keydown-F3', () => {
      this.debugHelper.toggle();
      console.log('[GameScene] Debug mode toggled');
    });
  }

  resetInput() {
    // Reset cursor keys state
    if (this.cursors) {
      this.cursors.up.reset();
      this.cursors.down.reset();
      this.cursors.left.reset();
      this.cursors.right.reset();
    }
    if (this.shiftKey) {
      this.shiftKey.reset();
    }
    // Re-enable movement
    this.canMove = true;
    this.isMoving = false;
    console.log('[GameScene] Input reset complete');
  }

  setupKeyboardEvents() {

    // Additional keys
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.menuManager.isMenuOpen() && !this.confirmExitContainer && this.canMove) {
        this.interact();
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      if (!this.confirmExitContainer) {
        if (this.menuManager.isMenuOpen()) {
          this.menuManager.closeMenu();
        } else {
          this.menuManager.openPauseMenu(() => {
            this.canMove = true;
            this.menuOpen = false;
          });
          this.canMove = false;
          this.menuOpen = true;
        }
      }
    });

    this.input.keyboard?.on('keydown-I', () => {
      if (!this.menuManager.isMenuOpen() && !this.confirmExitContainer) {
        this.menuManager.openInventory(() => {
          this.canMove = true;
          this.menuOpen = false;
        });
        this.canMove = false;
        this.menuOpen = true;
      }
    });

    this.input.keyboard?.on('keydown-T', () => {
      if (!this.menuManager.isMenuOpen() && !this.confirmExitContainer) {
        this.menuManager.openTeam(() => {
          this.canMove = true;
          this.menuOpen = false;
        });
        this.canMove = false;
        this.menuOpen = true;
      }
    });
  }

  setupTimers() {
    // Track playtime
    this.playTimeTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        saveManager.addPlayTime(1);
      },
      loop: true,
    });

    // Auto-save every 30 seconds
    this.autoSaveTimer = this.time.addEvent({
      delay: 30000,
      callback: () => {
        this.autoSave();
      },
      loop: true,
    });
  }

  createUIButtons() {
    // Clear existing buttons
    this.uiButtons.forEach(btn => btn.destroy());
    this.uiButtons = [];
    
    const config = this.uiHelper.getConfig();
    const btnSize = this.uiHelper.getButtonSize(90, 35);
    const spacing = this.uiHelper.getSpacing(10);
    const cornerPos = this.uiHelper.getSafeCornerPosition('top-right', btnSize.width / 2 + config.padding, btnSize.height / 2 + config.padding);
    
    const buttons = [
      { label: 'Team', color: 0x3b82f6, hoverColor: 0x2563eb, action: 'team' },
      { label: 'Bag', color: 0x10b981, hoverColor: 0x059669, action: 'inventory' },
      { label: 'Menu', color: 0x6b7280, hoverColor: 0x4b5563, action: 'pause' },
    ];
    
    buttons.forEach((btnData, index) => {
      const yOffset = index * (btnSize.height + spacing);
      const btn = this.add.container(cornerPos.x, cornerPos.y + yOffset);
      btn.setScrollFactor(0);
      btn.setDepth(500);
      
      const bg = this.add.rectangle(0, 0, btnSize.width, btnSize.height, btnData.color, 0.9);
      bg.setStrokeStyle(2, 0xffffff);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        if (btnData.action === 'pause' && this.menuManager.isMenuOpen()) {
          this.menuManager.closeMenu();
        } else if (!this.menuManager.isMenuOpen()) {
          switch (btnData.action) {
            case 'team':
              this.menuManager.openTeam(() => {
                this.canMove = true;
                this.menuOpen = false;
              });
              break;
            case 'inventory':
              this.menuManager.openInventory(() => {
                this.canMove = true;
                this.menuOpen = false;
              });
              break;
            case 'pause':
              this.menuManager.openPauseMenu(() => {
                this.canMove = true;
                this.menuOpen = false;
              });
              break;
          }
          this.canMove = false;
          this.menuOpen = true;
        }
      });
      bg.on('pointerover', () => bg.setFillStyle(btnData.hoverColor, 1));
      bg.on('pointerout', () => bg.setFillStyle(btnData.color, 0.9));
      
      const text = this.uiHelper.createText(0, 0, btnData.label, 'small', '#ffffff', true);
      text.setOrigin(0.5);
      
      btn.add([bg, text]);
      this.uiButtons.push(btn);
    });
  }
  
  onResize(gameSize: Phaser.Structs.Size): void {
    // Recalculate UI helper
    this.uiHelper.recalculate();
    
    // Recreate UI buttons
    this.createUIButtons();
  }

  update() {
    if (!this.canMove || this.isMoving || this.menuOpen || this.confirmExitContainer) return;

    // Update player animations (includes run detection with shift key)
    updatePlayer(this.player, this.cursors, this.isMoving, this.shiftKey);

    const gridX = this.player.getData('gridX');
    const gridY = this.player.getData('gridY');

    let targetX = gridX;
    let targetY = gridY;
    let direction = '';

    if (this.cursors.left.isDown) {
      targetX -= 1;
      direction = 'left';
    } else if (this.cursors.right.isDown) {
      targetX += 1;
      direction = 'right';
    } else if (this.cursors.up.isDown) {
      targetY -= 1;
      direction = 'up';
    } else if (this.cursors.down.isDown) {
      targetY += 1;
      direction = 'down';
    }

    if (direction && this.canMoveTo(targetX, targetY)) {
      this.movePlayer(targetX, targetY, direction);
    }
  }

  canMoveTo(x: number, y: number): boolean {
    // Check bounds
    if (y < 0 || y >= this.collisionLayer.length) return false;
    if (x < 0 || x >= this.collisionLayer[0].length) return false;

    // Check collision
    if (this.collisionLayer[y][x] === 1) return false;

    // Check NPC collision
    for (const npc of this.npcs.values()) {
      const npcData = npc.getData('npcData') as NPCData;
      if (npcData.x === x && npcData.y === y) return false;
    }

    return true;
  }

  movePlayer(targetX: number, targetY: number, direction: string) {
    this.isMoving = true;

    const targetPixelX = targetX * this.tileSize + this.tileSize / 2;
    const targetPixelY = targetY * this.tileSize + this.tileSize / 2;

    // Determine speed based on shift key (running)
    const isRunning = this.shiftKey?.isDown || false;
    const moveDuration = isRunning ? 120 : 200; // Running is faster

    // Animation is handled by updatePlayer in the update loop
    // Just ensure lastDirection is stored
    this.player.setData('lastDirection', direction);

    this.tweens.add({
      targets: this.player,
      x: targetPixelX,
      y: targetPixelY,
      duration: moveDuration,
      onComplete: () => {
        // Return to idle
        stopPlayer(this.player);
        this.player.setData('gridX', targetX);
        this.player.setData('gridY', targetY);
        this.isMoving = false;

        // Check for grass encounter
        if (this.grassLayer[targetY][targetX] === 1) {
          this.checkWildEncounter();
        }

        // Check for warps (zone changes)
        this.checkWarp(targetX, targetY);

        // Update save position
        saveManager.updateSave({
          position: { x: targetX, y: targetY, map: this.currentMap },
        });
      },
    });
  }

  checkWildEncounter() {
    this.grassStepCounter++;
    
    // 12-18% encounter rate per step
    const encounterChance = Math.random() * 100;
    if (encounterChance < 15 && this.grassStepCounter > 3) {
      this.grassStepCounter = 0;
      this.triggerWildEncounter();
    }
  }

  checkWarp(x: number, y: number) {
    const mapData = getMap(this.currentMap);
    if (!mapData) return;

    // Check if player is standing on a warp tile
    const warp = mapData.warps.find(w => w.x === x && w.y === y);
    if (warp) {
      console.log(`[GameScene] Warp detected! ${this.currentMap} -> ${warp.targetMap}`);
      this.changeMap(warp.targetMap, warp.targetX, warp.targetY);
    }
  }

  changeMap(targetMap: string, targetX: number, targetY: number) {
    console.log(`[GameScene] Changing map to ${targetMap} at (${targetX}, ${targetY})`);
    
    // Clear current scene
    this.npcs.forEach(npc => npc.destroy());
    this.npcs.clear();
    
    // Remove all existing tiles and objects
    this.children.removeAll();
    
    // Load new map
    this.currentMap = targetMap;
    this.loadMap(targetMap);
    
    // Recreate player at new position
    this.createPlayer(targetX, targetY);
    
    // Reset camera
    this.setupCamera();
    
    // Reset movement state
    this.isMoving = false;
    this.canMove = true;
    
    // Update save
    saveManager.updateSave({
      position: { x: targetX, y: targetY, map: targetMap },
    });
  }

  triggerWildEncounter() {
    const encounters = ENCOUNTER_TABLES[this.currentMap];
    if (!encounters || encounters.length === 0) return;

    // Select random encounter based on chances
    const roll = Math.random() * 100;
    let cumulative = 0;
    
    for (const encounter of encounters) {
      cumulative += encounter.chance;
      if (roll < cumulative) {
        const level = Math.floor(
          Math.random() * (encounter.maxLevel - encounter.minLevel + 1) + encounter.minLevel
        );
        console.log(`[GameScene] Wild encounter! Pokémon #${encounter.pokemon} Lv.${level}`);
        
        // Determine battle environment based on current map
        let environment = 'grass'; // default
        if (this.currentMap.includes('cave')) {
          environment = 'cave';
        } else if (this.currentMap.includes('route')) {
          environment = 'route';
        }
        
        // Start battle scene (sleep GameScene, start BattleScene)
        const battleScene = this.scene.get('BattleScene');
        if (battleScene && this.scene.isActive('BattleScene')) {
          console.warn('[GameScene] BattleScene already active, stopping it first');
          this.scene.stop('BattleScene');
        }
        
        this.scene.sleep();
        this.scene.start('BattleScene', {
          enemyId: encounter.pokemon,
          enemyLevel: level,
          environment: environment,
        });
        break;
      }
    }
  }

  interact() {
    const gridX = this.player.getData('gridX');
    const gridY = this.player.getData('gridY');

    console.log('[GameScene] Interact pressed at:', gridX, gridY);

    // Check for NPC in adjacent tiles (all 4 directions + same tile)
    const directions = [
      { x: 0, y: 0 },  // same tile
      { x: 0, y: -1 }, // up
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }, // left
      { x: 1, y: 0 },  // right
    ];

    for (const dir of directions) {
      const checkX = gridX + dir.x;
      const checkY = gridY + dir.y;

      for (const npc of this.npcs.values()) {
        const npcData = npc.getData('npcData') as NPCData;
        console.log('[GameScene] Checking NPC:', npcData.name, 'at', npcData.x, npcData.y, 'vs', checkX, checkY);
        
        if (npcData.x === checkX && npcData.y === checkY) {
          console.log('[GameScene] Found NPC to talk to:', npcData.name);
          this.talkToNPC(npcData);
          return;
        }
      }
    }
    
    console.log('[GameScene] No NPC found nearby');
  }

  async talkToNPC(npcData: NPCData) {
    this.canMove = false;
    this.currentNPC = npcData;
    
    console.log('[GameScene] Talking to NPC:', npcData.name);

    let dialogue = '';

    if (npcData.useAI) {
      // Fetch AI-generated dialogue
      try {
        console.log('[GameScene] Fetching AI dialogue...');
        const response = await fetch('/api/ai/npc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            npcName: npcData.name,
            context: npcData.aiContext,
            playerMessage: 'Hello!',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          dialogue = data.dialogue;
          console.log('[GameScene] AI dialogue received:', dialogue);
        } else {
          console.warn('[GameScene] AI request failed, using fallback');
          dialogue = npcData.dialogues[0];
        }
      } catch (error) {
        console.error('[GameScene] Error fetching NPC dialogue:', error);
        dialogue = npcData.dialogues[0];
      }
    } else {
      // Use predefined dialogue
      const randomIndex = Math.floor(Math.random() * npcData.dialogues.length);
      dialogue = npcData.dialogues[randomIndex];
    }

    console.log('[GameScene] Showing dialogue:', dialogue);
    this.showDialogue(npcData.name, dialogue);
  }

  showDialogue(name: string, text: string) {
    console.log('[GameScene] showDialogue called:', name, text);
    
    // Remove any existing dialogue box
    if (this.dialogueBox) {
      console.log('[GameScene] Destroying previous dialogue box');
      this.dialogueBox.destroy();
    }

    // Position dialogue box above the NPC
    let dialogueX = this.tileSize * 5; // center of map by default
    let dialogueY = this.tileSize * 2;
    
    // If we have the current NPC, position above it
    if (this.currentNPC) {
      dialogueX = this.currentNPC.x * this.tileSize + this.tileSize / 2;
      dialogueY = this.currentNPC.y * this.tileSize - this.tileSize;
      console.log('[GameScene] Positioning dialogue above NPC at:', this.currentNPC.x, this.currentNPC.y);
    }
    
    this.dialogueBox = this.add.container(dialogueX, dialogueY);
    this.dialogueBox.setScrollFactor(1); // Follow camera movement
    this.dialogueBox.setDepth(100);

    console.log('[GameScene] Creating dialogue box at:', dialogueX, dialogueY);

    // Create temporary text to measure size
    const tempText = this.add.text(0, 0, text, {
      fontSize: '14px',
      fontFamily: 'monospace',
      wordWrap: { width: 350 },
    });
    const textWidth = Math.min(tempText.width + 40, 400);
    const textHeight = tempText.height;
    tempText.destroy();

    // Calculate box size based on content
    const boxWidth = Math.max(textWidth, 250);
    const boxHeight = textHeight + 95; // Extra space for name and prompt (increased)
    
    const bg = this.add.rectangle(0, 0, boxWidth, boxHeight, 0x1f2937, 0.95);
    bg.setStrokeStyle(3, 0xfbbf24);

    // Name text
    const nameText = this.add.text(0, -boxHeight / 2 + 15, name, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#fbbf24',
      fontStyle: 'bold',
      align: 'center',
    });
    nameText.setOrigin(0.5, 0);

    // Dialogue text
    const dialogueText = this.add.text(0, -boxHeight / 2 + 40, text, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      wordWrap: { width: boxWidth - 30 },
      align: 'center',
    });
    dialogueText.setOrigin(0.5, 0);

    // Continue prompt (blinking)
    const prompt = this.add.text(0, boxHeight / 2 - 20, '▼ ESPACE', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#fbbf24',
    });
    prompt.setOrigin(0.5, 0);

    // Blink animation
    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.dialogueBox.add([bg, nameText, dialogueText, prompt]);
    
    console.log('[GameScene] Dialogue box created above NPC');

    // Close dialogue on space
    const closeHandler = () => {
      console.log('[GameScene] Closing dialogue');
      this.hideDialogue();
      this.input.keyboard?.off('keydown-SPACE', closeHandler);
    };
    this.input.keyboard?.once('keydown-SPACE', closeHandler);
  }

  hideDialogue() {
    if (this.dialogueBox) {
      this.dialogueBox.destroy();
      this.dialogueBox = null;
    }
    this.canMove = true;
    this.currentNPC = null;
  }

  toggleMenu() {
    if (this.menuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.menuOpen = true;
    this.canMove = false;

    const { width, height } = this.cameras.main;

    this.menuContainer = this.add.container(width / 2, height / 2);
    this.menuContainer.setScrollFactor(0);
    this.menuContainer.setDepth(100);

    // Background
    const bg = this.add.rectangle(0, 0, 300, 400, 0x1f2937, 0.95);
    bg.setStrokeStyle(2, 0xfbbf24);

    // Title
    const title = this.add.text(0, -170, 'MENU', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#fbbf24',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Menu items
    const items = [
      { label: '[T] Team', key: 'team' },
      { label: '[I] Inventory', key: 'inventory' },
      { label: '[S] Save Game', key: 'save' },
      { label: '[H] Exit to Home', key: 'exit' },
      { label: '[ESC] Resume', key: 'resume' },
    ];

    const itemTexts = items.map((item, index) => {
      const text = this.add.text(0, -80 + index * 60, item.label, {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#ffffff',
      });
      text.setOrigin(0.5);
      text.setInteractive({ useHandCursor: true });
      text.on('pointerdown', () => this.handleMenuAction(item.key));
      return text;
    });

    this.menuContainer.add([bg, title, ...itemTexts]);
  }

  closeMenu() {
    if (this.menuContainer) {
      this.menuContainer.destroy();
      this.menuContainer = null;
    }
    this.menuOpen = false;
    this.canMove = true;
  }

  handleMenuAction(action: string) {
    switch (action) {
      case 'team':
        this.closeMenu();
        this.menuManager.openTeam(() => {
          this.canMove = true;
          this.menuOpen = false;
        });
        this.canMove = false;
        this.menuOpen = true;
        break;
      case 'inventory':
        this.closeMenu();
        this.menuManager.openInventory(() => {
          this.canMove = true;
          this.menuOpen = false;
        });
        this.canMove = false;
        this.menuOpen = true;
        break;
      case 'save':
        this.manualSave();
        break;
      case 'exit':
        this.exitToHome();
        break;
      case 'resume':
        this.closeMenu();
        break;
    }
  }

  async manualSave() {
    const save = saveManager.getSave();
    if (save) {
      const success = await saveManager.saveGame(save);
      if (success) {
        this.lastSaveTime = Date.now();
        this.showNotification('Game saved!');
      } else {
        this.showNotification('Save failed!');
      }
    }
  }

  async autoSave() {
    await saveManager.autoSave();
    this.lastSaveTime = Date.now();
    console.log('[GameScene] Auto-saved');
  }

  exitToHome() {
    const timeSinceLastSave = (Date.now() - this.lastSaveTime) / 1000; // seconds
    
    if (timeSinceLastSave > 5) {
      // Show confirmation dialog
      this.showExitConfirmation();
    } else {
      // Exit immediately
      this.performExit();
    }
  }

  showExitConfirmation() {
    this.closeMenu();
    this.canMove = false;

    const { width, height } = this.cameras.main;

    this.confirmExitContainer = this.add.container(width / 2, height / 2);
    this.confirmExitContainer.setScrollFactor(0);
    this.confirmExitContainer.setDepth(150);

    // Background overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);

    // Dialog box
    const dialogBg = this.add.rectangle(0, 0, 400, 200, 0x1f2937, 1);
    dialogBg.setStrokeStyle(3, 0xef4444);

    // Warning text
    const warningText = this.add.text(0, -50, '⚠️ Unsaved Progress', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ef4444',
      fontStyle: 'bold',
    });
    warningText.setOrigin(0.5);

    const messageText = this.add.text(0, 0, 'Your game hasn\'t been saved recently.\nExit to home anyway?', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      align: 'center',
    });
    messageText.setOrigin(0.5);

    // Buttons
    const yesButton = this.add.text(-80, 60, 'Exit', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#ef4444',
      padding: { x: 25, y: 12 },
    });
    yesButton.setOrigin(0.5);
    yesButton.setInteractive({ useHandCursor: true });
    yesButton.on('pointerdown', () => this.performExit());
    yesButton.on('pointerover', () => yesButton.setBackgroundColor('#dc2626'));
    yesButton.on('pointerout', () => yesButton.setBackgroundColor('#ef4444'));

    const noButton = this.add.text(80, 60, 'Cancel', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#3b82f6',
      padding: { x: 20, y: 12 },
    });
    noButton.setOrigin(0.5);
    noButton.setInteractive({ useHandCursor: true });
    noButton.on('pointerdown', () => this.closeExitConfirmation());
    noButton.on('pointerover', () => noButton.setBackgroundColor('#2563eb'));
    noButton.on('pointerout', () => noButton.setBackgroundColor('#3b82f6'));

    this.confirmExitContainer.add([overlay, dialogBg, warningText, messageText, yesButton, noButton]);

    // ESC to cancel
    const cancelHandler = () => {
      this.closeExitConfirmation();
      this.input.keyboard?.off('keydown-ESC', cancelHandler);
    };
    this.input.keyboard?.once('keydown-ESC', cancelHandler);
  }

  closeExitConfirmation() {
    if (this.confirmExitContainer) {
      this.confirmExitContainer.destroy();
      this.confirmExitContainer = null;
    }
    this.canMove = true;
  }

  performExit() {
    console.log('[GameScene] Exiting to home...');
    // Navigate to home page
    window.location.href = '/';
  }

  showNotification(text: string) {
    const { width } = this.cameras.main;
    const notification = this.add.text(width / 2, 50, text, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#1f2937',
      padding: { x: 20, y: 10 },
    });
    notification.setOrigin(0.5);
    notification.setScrollFactor(0);
    notification.setDepth(200);

    this.tweens.add({
      targets: notification,
      alpha: 0,
      y: 30,
      duration: 2000,
      delay: 1000,
      onComplete: () => notification.destroy(),
    });
  }

  shutdown() {
    // Clean up timers
    if (this.playTimeTimer) this.playTimeTimer.destroy();
    if (this.autoSaveTimer) this.autoSaveTimer.destroy();
  }
}
