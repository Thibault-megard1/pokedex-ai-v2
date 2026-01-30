// Battle scene with enhanced visuals and real Pokémon sprites
import * as Phaser from 'phaser';
import type { PlayerPokemon } from '../types';
import { saveManager } from '../saveManager';
import { 
  fetchPokemonLearnset, 
  selectMovesForLevel, 
  selectRandomMove, 
  calculateMoveDamage,
  checkEffectTrigger,
  getStatusName,
  getStatusColor,
  calculateStatusDamage,
  canPokemonAct,
  type BattleMove,
  type StatusCondition 
} from '../moveSystem';
import {
  gainXP,
  calculateXPGain,
  getBaseExperience,
  learnMove,
  type LevelUpResult,
  type NewMoveInfo,
} from '../levelingSystem';
import { MenuManager } from '../MenuManager';
import { UIHelper } from '../UIHelper';

export class BattleScene extends Phaser.Scene {
  private playerPokemon!: PlayerPokemon;
  private enemyPokemon!: PlayerPokemon;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private enemySprite!: Phaser.GameObjects.Sprite;
  private playerPlatform!: Phaser.GameObjects.Ellipse;
  private enemyPlatform!: Phaser.GameObjects.Ellipse;
  private playerHUDContainer!: Phaser.GameObjects.Container;
  private enemyHUDContainer!: Phaser.GameObjects.Container;
  private playerHPBar!: Phaser.GameObjects.Graphics;
  private enemyHPBar!: Phaser.GameObjects.Graphics;
  private playerHPText!: Phaser.GameObjects.Text;
  private enemyHPText!: Phaser.GameObjects.Text;
  private battleLog!: Phaser.GameObjects.Text;
  private actionButtons: Phaser.GameObjects.Text[] = [];
  private moveButtons: Phaser.GameObjects.Container[] = [];
  private battleActive: boolean = true;
  private keyHandlers: { [key: string]: () => void } = {};
  private battleEnvironment: string = 'grass';
  private battleBackground?: Phaser.GameObjects.Image;
  private introComplete: boolean = false;
  private playerMoves: BattleMove[] = [];
  private enemyMoves: BattleMove[] = [];
  private selectedMove: BattleMove | null = null;
  private movesLoaded: boolean = false;
  private levelUpResult?: LevelUpResult;
  private pendingMoves: NewMoveInfo[] = [];
  private moveLearnModal?: Phaser.GameObjects.Container;
  private menuManager!: MenuManager;
  private uiHelper!: UIHelper;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: { enemyId: number; enemyLevel: number; environment?: string }) {
    console.log('[BattleScene] Starting battle with enhanced visuals:', data);
    
    // Ensure input is enabled
    if (this.input) {
      this.input.enabled = true;
      console.log('[BattleScene] Input system enabled:', this.input.enabled);
    }
    
    // Reset battle state
    this.battleActive = true;
    this.keyHandlers = {};
    this.introComplete = false;
    this.movesLoaded = false;
    this.battleEnvironment = data.environment || 'grass';
    this.selectedMove = null;
    this.playerMoves = [];
    this.enemyMoves = [];
    
    const save = saveManager.getSave();
    if (!save || save.team.length === 0) {
      // If no team, create a temporary starter
      this.playerPokemon = this.createTemporaryPokemon(25, 5); // Pikachu Lv.5
    } else {
      this.playerPokemon = save.team[0]; // Use first Pokémon
    }

    // Generate enemy Pokémon
    this.enemyPokemon = this.createWildPokemon(data.enemyId, data.enemyLevel);
    
    // Initialize stat stages to 0 and clear status conditions
    this.playerPokemon.attackStage = 0;
    this.playerPokemon.defenseStage = 0;
    this.playerPokemon.speedStage = 0;
    this.playerPokemon.statusCondition = null;
    this.playerPokemon.statusTurns = 0;
    
    this.enemyPokemon.attackStage = 0;
    this.enemyPokemon.defenseStage = 0;
    this.enemyPokemon.speedStage = 0;
    this.enemyPokemon.statusCondition = null;
    this.enemyPokemon.statusTurns = 0;
    
    // Load moves asynchronously (will be completed in create)
    this.loadPokemonMoves();
  }

  preload() {
    // Load Pokémon sprites from PokeAPI (early-game Pokémon only: 1-25)
    const spriteBase = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
    
    // Load sprites for both player and enemy
    for (let i = 1; i <= 25; i++) {
      this.load.image(`pokemon_front_${i}`, `${spriteBase}/${i}.png`);
      this.load.image(`pokemon_back_${i}`, `${spriteBase}/back/${i}.png`);
    }

    // Load battle backgrounds
    const backgrounds = ['grass', 'cave', 'route'];
    backgrounds.forEach(bg => {
      this.load.image(`battle_bg_${bg}`, `/game/assets/battle/backgrounds/${bg}.png`);
    });

    // Load Pokémon cries (from PokeAPI)
    const cryBase = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest';
    for (let i = 1; i <= 25; i++) {
      this.load.audio(`cry_${i}`, `${cryBase}/${i}.ogg`);
    }

    // Load pokéball sprite for intro animation
    this.load.image('pokeball', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Ensure input is enabled
    this.input.enabled = true;
    
    // Debug: Log pointer events with coordinate details
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log('[BattleScene] Pointer down:', {
        screen: `${pointer.x}, ${pointer.y}`,
        world: `${pointer.worldX}, ${pointer.worldY}`,
        canvas: `${this.scale.width}x${this.scale.height}`,
      });
    });

    // Initialize UIHelper
    this.uiHelper = new UIHelper(this);

    // Background with gradient effect
    this.createBackground(width, height);

    // Ground platforms (shadows)
    this.playerPlatform = this.add.ellipse(
      width * 0.30, 
      height * 0.70, 
      120, 
      30, 
      0x000000, 
      0.3
    );
    this.playerPlatform.setDepth(1);
    
    this.enemyPlatform = this.add.ellipse(
      width * 0.70, 
      height * 0.35, 
      120, 
      30, 
      0x000000, 
      0.3
    );
    this.enemyPlatform.setDepth(1);

    // Load Pokémon sprites
    this.createPokemonSprites(width, height);

    // Create HUD boxes
    this.createHUDs(width, height);

    // Battle UI (log and buttons)
    this.createBattleUI(width, height);

    // Initialize MenuManager
    this.menuManager = new MenuManager(this);

    // Setup keyboard controls
    this.setupKeyboardControls();

    // Entrance animations
    this.playEntranceAnimations(width);

    // Start idle animations
    this.startIdleAnimations();

    // Make scene responsive
    this.scale.on('resize', this.onResize, this);
    
    // Wait for moves to load and update UI
    const checkMoves = () => {
      if (this.movesLoaded) {
        this.updateMoveButtons();
      } else {
        this.time.delayedCall(100, checkMoves);
      }
    };
    this.time.delayedCall(100, checkMoves);
  }

  createBackground(width: number, height: number) {
    const bgKey = `battle_bg_${this.battleEnvironment}`;
    
    if (this.textures.exists(bgKey)) {
      // Use battle background image
      this.battleBackground = this.add.image(width / 2, height / 2, bgKey);
      this.battleBackground.setDisplaySize(width, height);
      this.battleBackground.setDepth(0);
      console.log(`[BattleScene] Loaded ${this.battleEnvironment} background`);
    } else {
      // Fallback to gradient rectangles
      console.warn(`[BattleScene] Background ${bgKey} not found, using fallback`);
      const bgTop = this.add.rectangle(width / 2, height * 0.25, width, height * 0.5, 0x87ceeb);
      bgTop.setDepth(0);
      
      const bgBottom = this.add.rectangle(width / 2, height * 0.75, width, height * 0.5, 0x90ee90);
      bgBottom.setDepth(0);
    }

    // Fade-in transition
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  createPokemonSprites(width: number, height: number) {
    // Enemy Pokémon (front sprite) - top right
    const enemySpriteKey = `pokemon_front_${this.enemyPokemon.id}`;
    if (this.textures.exists(enemySpriteKey)) {
      this.enemySprite = this.add.sprite(width * 0.70, height * 0.30, enemySpriteKey);
      this.enemySprite.setScale(3); // Scale up for visibility
      this.enemySprite.setDepth(2);
    } else {
      // Fallback: colored rectangle
      const rect = this.add.rectangle(width * 0.70, height * 0.30, 80, 80, 0xef4444);
      rect.setDepth(2);
      this.enemySprite = rect as any;
    }

    // Player Pokémon (back sprite) - bottom left
    const playerSpriteKey = `pokemon_back_${this.playerPokemon.id}`;
    if (this.textures.exists(playerSpriteKey)) {
      this.playerSprite = this.add.sprite(width * 0.30, height * 0.65, playerSpriteKey);
      this.playerSprite.setScale(3); // Scale up for visibility
      this.playerSprite.setDepth(2);
    } else {
      // Fallback: colored rectangle
      const rect = this.add.rectangle(width * 0.30, height * 0.65, 80, 80, 0x3b82f6);
      rect.setDepth(2);
      this.playerSprite = rect as any;
    }
  }

  createHUDs(width: number, height: number) {
    // Enemy HUD (top left)
    this.createEnemyHUD(width * 0.15, height * 0.15);

    // Player HUD (bottom right)
    this.createPlayerHUD(width * 0.55, height * 0.75);
  }

  createEnemyHUD(x: number, y: number) {
    this.enemyHUDContainer = this.add.container(x, y);
    this.enemyHUDContainer.setDepth(3); // HUD above sprites

    // HUD box background
    const hudBox = this.add.graphics();
    hudBox.fillStyle(0xffffff, 0.9);
    hudBox.lineStyle(3, 0x000000, 1);
    hudBox.fillRoundedRect(0, 0, 200, 70, 8);
    hudBox.strokeRoundedRect(0, 0, 200, 70, 8);

    // Pokémon name and level
    const nameText = this.add.text(10, 10, this.enemyPokemon.name.toUpperCase(), {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      fontStyle: 'bold',
    });

    const levelText = this.add.text(160, 10, `Lv${this.enemyPokemon.level}`, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
    });

    // HP label
    const hpLabel = this.add.text(10, 35, 'HP:', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
    });

    // HP bar background
    const hpBarBg = this.add.graphics();
    hpBarBg.fillStyle(0x1f2937, 1);
    hpBarBg.fillRoundedRect(35, 35, 155, 12, 4);

    // HP bar (will be updated)
    this.enemyHPBar = this.add.graphics();
    this.updateHPBar(this.enemyHPBar, 37, 37, 151, 8, this.enemyPokemon);

    // Status indicator (empty initially)
    const statusText = this.add.text(10, 55, '', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      backgroundColor: '#6b7280',
      padding: { x: 4, y: 2 },
      fontStyle: 'bold',
    });
    statusText.setName('statusText');

    // Add all to container
    this.enemyHUDContainer.add([hudBox, nameText, levelText, hpLabel, hpBarBg, this.enemyHPBar, statusText]);
  }

  createPlayerHUD(x: number, y: number) {
    this.playerHUDContainer = this.add.container(x, y);
    this.playerHUDContainer.setDepth(3); // HUD above sprites

    // HUD box background
    const hudBox = this.add.graphics();
    hudBox.fillStyle(0xffffff, 0.9);
    hudBox.lineStyle(3, 0x000000, 1);
    hudBox.fillRoundedRect(0, 0, 240, 80, 8);
    hudBox.strokeRoundedRect(0, 0, 240, 80, 8);

    // Pokémon name and level
    const nameText = this.add.text(10, 10, this.playerPokemon.name.toUpperCase(), {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      fontStyle: 'bold',
    });

    const levelText = this.add.text(180, 10, `Lv${this.playerPokemon.level}`, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
    });

    // HP label
    const hpLabel = this.add.text(10, 35, 'HP:', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
    });

    // HP bar background
    const hpBarBg = this.add.graphics();
    hpBarBg.fillStyle(0x1f2937, 1);
    hpBarBg.fillRoundedRect(35, 35, 195, 12, 4);

    // HP bar (will be updated)
    this.playerHPBar = this.add.graphics();
    this.updateHPBar(this.playerHPBar, 37, 37, 191, 8, this.playerPokemon);

    // HP text (numerical)
    this.playerHPText = this.add.text(
      120,
      55,
      `${this.playerPokemon.hp} / ${this.playerPokemon.maxHp}`,
      {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        fontStyle: 'bold',
      }
    );
    this.playerHPText.setOrigin(0.5, 0);

    // Status indicator (empty initially)
    const statusText = this.add.text(10, 65, '', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      backgroundColor: '#6b7280',
      padding: { x: 4, y: 2 },
      fontStyle: 'bold',
    });
    statusText.setName('statusText');

    // Add all to container
    this.playerHUDContainer.add([
      hudBox,
      nameText,
      levelText,
      hpLabel,
      hpBarBg,
      this.playerHPBar,
      this.playerHPText,
      statusText,
    ]);
  }

  updateHPBar(
    bar: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    maxWidth: number,
    height: number,
    pokemon: PlayerPokemon
  ) {
    bar.clear();
    const hpPercent = Math.max(0, pokemon.hp / pokemon.maxHp);
    const barWidth = maxWidth * hpPercent;

    // Color based on HP percentage
    let color = 0x10b981; // Green
    if (hpPercent < 0.5) color = 0xfbbf24; // Yellow
    if (hpPercent < 0.25) color = 0xef4444; // Red

    bar.fillStyle(color, 1);
    bar.fillRoundedRect(x, y, barWidth, height, 2);
  }

  createBattleUI(width: number, height: number) {
    // Battle log (message box)
    this.battleLog = this.add.text(
      width / 2,
      height - 240,
      `A wild ${this.enemyPokemon.name} appeared!`,
      {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        backgroundColor: '#1f2937',
        padding: { x: 25, y: 12 },
        align: 'center',
        wordWrap: { width: width * 0.8 },
        fontStyle: 'bold',
      }
    );
    this.battleLog.setOrigin(0.5);
    this.battleLog.setDepth(10); // Battle log at top

    // Create move buttons (will be populated when moves load)
    this.createMoveButtons(width, height);
    
    // Action buttons: Run and Capture (for wild battles)
    const btnSpacing = 90;
    
    // Run button
    const runBtn = this.add.text(
      width - 80,
      height - 60,
      'Run',
      {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        backgroundColor: '#ef4444',
        padding: { x: 16, y: 8 },
      }
    );
    runBtn.setOrigin(0.5);
    runBtn.setDepth(10);
    runBtn.setInteractive({ useHandCursor: true });
    
    runBtn.on('pointerover', () => {
      runBtn.setStyle({ backgroundColor: '#dc2626' });
    });
    runBtn.on('pointerout', () => {
      runBtn.setStyle({ backgroundColor: '#ef4444' });
    });
    runBtn.on('pointerdown', () => this.runAway());
    
    // Capture button (Pokéball)
    const captureBtn = this.add.text(
      width - 80,
      height - 60 - btnSpacing,
      '⚾ Catch',
      {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        backgroundColor: '#3b82f6',
        padding: { x: 12, y: 8 },
      }
    );
    captureBtn.setOrigin(0.5);
    captureBtn.setDepth(10);
    captureBtn.setInteractive({ useHandCursor: true });
    
    captureBtn.on('pointerover', () => {
      captureBtn.setStyle({ backgroundColor: '#2563eb' });
    });
    captureBtn.on('pointerout', () => {
      captureBtn.setStyle({ backgroundColor: '#3b82f6' });
    });
    captureBtn.on('pointerdown', () => this.attemptCapture());
    
    this.actionButtons = [runBtn, captureBtn];
  }

  createMoveButtons(width: number, height: number) {
    // Create 4 move button slots in a 2x2 grid
    const buttonWidth = 180;
    const buttonHeight = 50;
    const spacing = 10;
    const startX = width / 2 - buttonWidth - spacing / 2;
    const startY = height - 200;

    this.moveButtons = [];
    for (let i = 0; i < 4; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = startX + col * (buttonWidth + spacing);
      const y = startY + row * (buttonHeight + spacing);

      const container = this.add.container(x, y);
      container.setDepth(10);

      // Button background
      const bg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x3b82f6, 1);
      bg.setStrokeStyle(2, 0x000000);
      bg.setInteractive({ useHandCursor: true });

      // Move name text
      const nameText = this.add.text(-buttonWidth / 2 + 10, -8, 'Loading...', {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      nameText.setOrigin(0, 0.5);

      // Move type and PP text
      const infoText = this.add.text(-buttonWidth / 2 + 10, 8, '', {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        color: '#e0e0e0',
      });
      infoText.setOrigin(0, 0.5);

      container.add([bg, nameText, infoText]);
      container.setData('bg', bg);
      container.setData('nameText', nameText);
      container.setData('infoText', infoText);
      container.setData('index', i);

      // Hover effect
      bg.on('pointerover', () => {
        if (container.getData('enabled')) {
          bg.setFillStyle(0x2563eb);
        }
      });
      bg.on('pointerout', () => {
        if (container.getData('enabled')) {
          bg.setFillStyle(0x3b82f6);
        }
      });

      this.moveButtons.push(container);
    }
  }

  updateMoveButtons() {
    // Update move buttons with actual move data
    this.playerMoves.forEach((move, index) => {
      if (index >= this.moveButtons.length) return;

      const container = this.moveButtons[index];
      if (!container) return;
      
      const bg = container.getData('bg') as Phaser.GameObjects.Rectangle;
      const nameText = container.getData('nameText') as Phaser.GameObjects.Text;
      const infoText = container.getData('infoText') as Phaser.GameObjects.Text;

      if (!nameText || !infoText || !bg) {
        console.error(`Missing move button elements for index ${index}`, { nameText, infoText, bg });
        return;
      }

      nameText.setText(move.name);
      infoText.setText(`${move.type.toUpperCase()} | PP: ${move.pp}/${move.maxPp}`);

      // Enable or disable based on PP
      const enabled = move.pp > 0;
      container.setData('enabled', enabled);
      container.setData('move', move);

      if (enabled) {
        bg.setFillStyle(0x3b82f6);
        nameText.setAlpha(1);
        infoText.setAlpha(1);
        bg.setInteractive({ useHandCursor: true });
        
        // Remove old listeners
        bg.removeAllListeners('pointerdown');
        
        // Add click handler
        bg.on('pointerdown', () => {
          if (this.battleActive) {
            this.selectedMove = move;
            this.playerAttackWithMove(move);
          }
        });
      } else {
        bg.setFillStyle(0x6b7280); // Grey out
        nameText.setAlpha(0.5);
        infoText.setAlpha(0.5);
        bg.disableInteractive();
      }
    });

    // Hide unused slots
    for (let i = this.playerMoves.length; i < this.moveButtons.length; i++) {
      this.moveButtons[i].setVisible(false);
    }
  }

  playCry(pokemonId: number) {
    const cryKey = `cry_${pokemonId}`;
    if (this.cache.audio.exists(cryKey)) {
      try {
        this.sound.play(cryKey, { volume: 0.3 });
        console.log(`[BattleScene] Playing cry for Pokémon #${pokemonId}`);
      } catch (error) {
        console.warn(`[BattleScene] Failed to play cry for Pokémon #${pokemonId}:`, error);
      }
    } else {
      console.warn(`[BattleScene] Cry not found for Pokémon #${pokemonId}`);
    }
  }

  async loadPokemonMoves() {
    try {
      console.log('[BattleScene] Loading moves for both Pokémon...');
      
      // Load player moves
      if (this.playerPokemon.battleMoves && this.playerPokemon.battleMoves.length > 0) {
        // Use existing moves if available
        this.playerMoves = this.playerPokemon.battleMoves;
        console.log('[BattleScene] Using cached player moves');
      } else {
        // Fetch from API
        const playerLearnset = await fetchPokemonLearnset(this.playerPokemon.id);
        this.playerMoves = selectMovesForLevel(playerLearnset, this.playerPokemon.level);
        this.playerPokemon.battleMoves = this.playerMoves;
      }
      
      // Load enemy moves
      const enemyLearnset = await fetchPokemonLearnset(this.enemyPokemon.id);
      this.enemyMoves = selectMovesForLevel(enemyLearnset, this.enemyPokemon.level);
      this.enemyPokemon.battleMoves = this.enemyMoves;
      
      this.movesLoaded = true;
      console.log('[BattleScene] Moves loaded successfully');
      
      // Update UI if already created
      if (this.moveButtons.length > 0) {
        this.updateMoveButtons();
      }
    } catch (error) {
      console.error('[BattleScene] Error loading moves:', error);
      // Use fallback moves
      this.playerMoves = [{
        name: 'Tackle',
        type: 'normal',
        category: 'physical',
        power: 40,
        accuracy: 100,
        pp: 35,
        maxPp: 35,
        learnLevel: 1,
      }];
      this.enemyMoves = [...this.playerMoves];
      this.movesLoaded = true;
      
      if (this.moveButtons.length > 0) {
        this.updateMoveButtons();
      }
    }
  }

  setupKeyboardControls() {
    // Store handlers so we can remove them later
    // Number keys 1-4 for moves
    for (let i = 0; i < 4; i++) {
      const key = (i + 1).toString();
      this.keyHandlers[key] = () => {
        if (this.battleActive && this.movesLoaded && i < this.playerMoves.length) {
          const move = this.playerMoves[i];
          if (move.pp > 0) {
            this.playerAttackWithMove(move);
          }
        }
      };
      this.input.keyboard?.on(`keydown-${key}`, this.keyHandlers[key]);
    }
    
    // Legacy: A/Space uses first move
    this.keyHandlers['A'] = () => {
      if (this.battleActive && this.movesLoaded && this.playerMoves.length > 0) {
        const move = this.playerMoves[0];
        if (move.pp > 0) {
          this.playerAttackWithMove(move);
        }
      }
    };
    
    this.keyHandlers['SPACE'] = () => {
      if (this.battleActive && this.movesLoaded && this.playerMoves.length > 0) {
        const move = this.playerMoves[0];
        if (move.pp > 0) {
          this.playerAttackWithMove(move);
        }
      }
    };
    
    this.keyHandlers['R'] = () => {
      if (!this.menuManager.isMenuOpen()) {
        this.runAway();
      }
    };
    
    this.keyHandlers['ESC'] = () => {
      if (this.menuManager.isMenuOpen()) {
        this.menuManager.closeMenu();
      } else if (this.battleActive) {
        this.menuManager.openPauseMenu(() => {
          // Resume battle
        });
      }
    };
    
    this.keyHandlers['T'] = () => {
      if (!this.menuManager.isMenuOpen() && this.battleActive) {
        this.menuManager.openTeam();
      }
    };
    
    this.keyHandlers['I'] = () => {
      if (!this.menuManager.isMenuOpen() && this.battleActive) {
        this.menuManager.openInventory();
      }
    };

    // Add event listeners
    this.input.keyboard?.on('keydown-A', this.keyHandlers['A']);
    this.input.keyboard?.on('keydown-SPACE', this.keyHandlers['SPACE']);
    this.input.keyboard?.on('keydown-R', this.keyHandlers['R']);
    this.input.keyboard?.on('keydown-ESC', this.keyHandlers['ESC']);
    this.input.keyboard?.on('keydown-T', this.keyHandlers['T']);
    this.input.keyboard?.on('keydown-I', this.keyHandlers['I']);
  }

  cleanupKeyboardControls() {
    // Remove all keyboard event listeners
    if (this.input.keyboard) {
      // Remove number keys
      for (let i = 1; i <= 4; i++) {
        const key = i.toString();
        if (this.keyHandlers[key]) {
          this.input.keyboard.off(`keydown-${key}`, this.keyHandlers[key]);
        }
      }
      // Remove other keys
      this.input.keyboard.off('keydown-A', this.keyHandlers['A']);
      this.input.keyboard.off('keydown-SPACE', this.keyHandlers['SPACE']);
      this.input.keyboard.off('keydown-R', this.keyHandlers['R']);
      this.input.keyboard.off('keydown-ESC', this.keyHandlers['ESC']);
      this.input.keyboard.off('keydown-T', this.keyHandlers['T']);
      this.input.keyboard.off('keydown-I', this.keyHandlers['I']);
    }
    this.keyHandlers = {};
  }

  playEntranceAnimations(width: number) {
    const { height } = this.cameras.main;
    
    // Pokéball intro animation for enemy
    if (this.textures.exists('pokeball')) {
      const pokeball = this.add.sprite(width * 0.30, height * 0.80, 'pokeball');
      pokeball.setScale(2);
      pokeball.setDepth(5);

      // Arc trajectory to enemy position
      this.tweens.add({
        targets: pokeball,
        x: width * 0.70,
        y: height * 0.35,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => {
          // Flash effect
          this.tweens.add({
            targets: pokeball,
            alpha: 0,
            scaleX: 3,
            scaleY: 3,
            duration: 200,
            onComplete: () => {
              pokeball.destroy();
              // Show enemy Pokémon
              if (this.enemySprite) {
                this.enemySprite.setAlpha(0);
                this.tweens.add({
                  targets: this.enemySprite,
                  alpha: 1,
                  duration: 300,
                  onComplete: () => {
                    this.playCry(this.enemyPokemon.id);
                    this.introComplete = true;
                  }
                });
              }
            }
          });
        }
      });

      // Hide enemy sprite initially
      if (this.enemySprite) {
        this.enemySprite.setAlpha(0);
      }
    } else {
      // Fallback: Enemy slides in from right
      if (this.enemySprite) {
        this.enemySprite.x = width + 100;
        this.tweens.add({
          targets: this.enemySprite,
          x: width * 0.70,
          duration: 600,
          ease: 'Back.out',
          onComplete: () => {
            this.playCry(this.enemyPokemon.id);
            this.introComplete = true;
          }
        });
      }
    }

    // Enemy HUD fades in
    this.enemyHUDContainer.setAlpha(0);
    this.tweens.add({
      targets: this.enemyHUDContainer,
      alpha: 1,
      duration: 400,
      delay: 300,
    });

    // Player sprite bounces in
    if (this.playerSprite) {
      this.playerSprite.setScale(0);
      this.tweens.add({
        targets: this.playerSprite,
        scaleX: 3,
        scaleY: 3,
        duration: 500,
        ease: 'Bounce.out',
        delay: 200,
      });
    }

    // Player HUD fades in
    this.playerHUDContainer.setAlpha(0);
    this.tweens.add({
      targets: this.playerHUDContainer,
      alpha: 1,
      duration: 400,
      delay: 500,
    });
  }

  startIdleAnimations() {
    // Idle bob animation for enemy sprite
    if (this.enemySprite) {
      this.tweens.add({
        targets: this.enemySprite,
        y: this.enemySprite.y - 8,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Idle bob animation for player sprite (slightly offset)
    if (this.playerSprite) {
      this.tweens.add({
        targets: this.playerSprite,
        y: this.playerSprite.y - 8,
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: 500,
      });
    }
  }

  playerAttackWithMove(move: BattleMove) {
    if (!this.battleActive || !this.movesLoaded) return;
    this.battleActive = false;

    // Disable all interactive elements
    this.actionButtons.forEach((btn) => btn.disableInteractive());
    this.moveButtons.forEach((container) => {
      const bg = container.getData('bg');
      if (bg) bg.disableInteractive();
    });

    // Check if player can act (status effects)
    const actionCheck = canPokemonAct(this.playerPokemon);
    if (!actionCheck.canAct) {
      this.battleLog.setText(actionCheck.message);
      
      // Handle confusion self-damage
      if (this.playerPokemon.statusCondition === 'confusion' && !actionCheck.canAct) {
        const confusionDamage = Math.floor(this.playerPokemon.attack / 3);
        this.playerPokemon.hp = Math.max(0, this.playerPokemon.hp - confusionDamage);
        this.animateHPDecrease(
          this.playerHPBar,
          37,
          37,
          151,
          8,
          this.playerPokemon,
          () => {
            this.time.delayedCall(1000, () => this.enemyTurn());
          }
        );
      } else {
        this.time.delayedCall(1000, () => this.enemyTurn());
      }
      
      // Remove status if needed
      if (actionCheck.removeStatus) {
        this.playerPokemon.statusCondition = null;
        this.playerPokemon.statusTurns = 0;
        this.updateStatusDisplay();
      }
      return;
    }

    // If Pokémon can act but status was removed, show message
    if (actionCheck.removeStatus) {
      this.playerPokemon.statusCondition = null;
      this.playerPokemon.statusTurns = 0;
      this.updateStatusDisplay();
      if (actionCheck.message) {
        this.battleLog.setText(actionCheck.message);
        this.time.delayedCall(800, () => this.continuePlayerAttack(move));
        return;
      }
    }

    this.continuePlayerAttack(move);
  }

  continuePlayerAttack(move: BattleMove) {
    // Decrease PP
    move.pp = Math.max(0, move.pp - 1);
    this.updateMoveButtons();

    // Attack animation: move forward
    const originalX = this.playerSprite.x;
    this.tweens.add({
      targets: this.playerSprite,
      x: originalX + 30,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        // Screen shake
        this.cameras.main.shake(200, 0.01);

        // Flash effect on enemy
        if (this.enemySprite) {
          this.tweens.add({
            targets: this.enemySprite,
            tint: 0xff0000,
            duration: 100,
            yoyo: true,
            repeat: 1
          });
        }

        // Calculate damage using move system with stat stages
        const damage = calculateMoveDamage(
          this.playerPokemon.level,
          this.playerPokemon.attack,
          this.enemyPokemon.defense,
          move,
          1.0, // Type effectiveness (to be implemented)
          this.playerPokemon.attackStage || 0,
          this.enemyPokemon.defenseStage || 0
        );
        this.enemyPokemon.hp = Math.max(0, this.enemyPokemon.hp - damage);

        // Apply move effects (status conditions, stat changes)
        let effectMessage = '';
        if (move.effect && checkEffectTrigger(move.effect)) {
          effectMessage = this.applyMoveEffect(move.effect, this.playerPokemon, this.enemyPokemon);
        }

        // Update HP bar with smooth animation
        this.animateHPDecrease(
          this.enemyHPBar,
          37,
          37,
          151,
          8,
          this.enemyPokemon,
          () => {
            let logText = `${this.playerPokemon.name} used ${move.name}!`;
            if (damage > 0) {
              logText += ` ${damage} damage!`;
            }
            if (effectMessage) {
              logText += ` ${effectMessage}`;
            }
            this.battleLog.setText(logText);

            // Update status displays
            this.updateStatusDisplay();

            // Check if enemy fainted
            if (this.enemyPokemon.hp <= 0) {
              this.time.delayedCall(1000, () => this.victory());
            } else {
              // Apply end-of-turn status effects before enemy turn
              this.time.delayedCall(1500, () => this.applyEndOfTurnEffects('player', () => {
                this.enemyTurn();
              }));
            }
          }
        );
      },
    });
  }

  enemyTurn() {
    // Check if enemy can act (status effects)
    const actionCheck = canPokemonAct(this.enemyPokemon);
    if (!actionCheck.canAct) {
      this.battleLog.setText(actionCheck.message);
      
      // Handle confusion self-damage
      if (this.enemyPokemon.statusCondition === 'confusion' && !actionCheck.canAct) {
        const confusionDamage = Math.floor(this.enemyPokemon.attack / 3);
        this.enemyPokemon.hp = Math.max(0, this.enemyPokemon.hp - confusionDamage);
        this.animateHPDecrease(
          this.enemyHPBar,
          37,
          37,
          151,
          8,
          this.enemyPokemon,
          () => {
            if (this.enemyPokemon.hp <= 0) {
              this.time.delayedCall(1000, () => this.victory());
            } else {
              this.time.delayedCall(1000, () => this.applyEndOfTurnEffects('enemy', () => {
                // Re-enable buttons
                this.battleActive = true;
                this.actionButtons.forEach((btn) => btn.setInteractive());
                this.moveButtons.forEach((container) => {
                  if (container.getData('enabled')) {
                    const bg = container.getData('bg');
                    if (bg) bg.setInteractive({ useHandCursor: true });
                  }
                });
              }));
            }
          }
        );
      } else {
        this.time.delayedCall(1000, () => this.applyEndOfTurnEffects('enemy', () => {
          // Re-enable buttons
          this.battleActive = true;
          this.actionButtons.forEach((btn) => btn.setInteractive());
          this.moveButtons.forEach((container) => {
            if (container.getData('enabled')) {
              const bg = container.getData('bg');
              if (bg) bg.setInteractive({ useHandCursor: true });
            }
          });
        }));
      }
      
      // Remove status if needed
      if (actionCheck.removeStatus) {
        this.enemyPokemon.statusCondition = null;
        this.enemyPokemon.statusTurns = 0;
        this.updateStatusDisplay();
      }
      return;
    }

    // If Pokémon can act but status was removed, show message
    if (actionCheck.removeStatus) {
      this.enemyPokemon.statusCondition = null;
      this.enemyPokemon.statusTurns = 0;
      this.updateStatusDisplay();
      if (actionCheck.message) {
        this.battleLog.setText(actionCheck.message);
        this.time.delayedCall(800, () => this.enemyAttack());
        return;
      }
    }

    this.enemyAttack();
  }

  enemyAttack() {
    // Select a random move
    const move = selectRandomMove(this.enemyMoves);
    
    // Decrease PP
    move.pp = Math.max(0, move.pp - 1);
    
    // Attack animation: move forward
    const originalX = this.enemySprite.x;
    this.tweens.add({
      targets: this.enemySprite,
      x: originalX - 30,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        // Screen shake
        this.cameras.main.shake(200, 0.01);

        // Flash effect on player
        if (this.playerSprite) {
          this.tweens.add({
            targets: this.playerSprite,
            tint: 0xff0000,
            duration: 100,
            yoyo: true,
            repeat: 1
          });
        }

        // Calculate damage using move system with stat stages
        const damage = calculateMoveDamage(
          this.enemyPokemon.level,
          this.enemyPokemon.attack,
          this.playerPokemon.defense,
          move,
          1.0, // Type effectiveness (to be implemented)
          this.enemyPokemon.attackStage || 0,
          this.playerPokemon.defenseStage || 0
        );
        this.playerPokemon.hp = Math.max(0, this.playerPokemon.hp - damage);

        // Apply move effects (status conditions, stat changes)
        let effectMessage = '';
        if (move.effect && checkEffectTrigger(move.effect)) {
          effectMessage = this.applyMoveEffect(move.effect, this.enemyPokemon, this.playerPokemon);
        }

        // Update HP bar and HP text
        this.animateHPDecrease(
          this.playerHPBar,
          37,
          37,
          191,
          8,
          this.playerPokemon,
          () => {
            this.playerHPText.setText(
              `${this.playerPokemon.hp} / ${this.playerPokemon.maxHp}`
            );
            let logText = `${this.enemyPokemon.name} used ${move.name}!`;
            if (damage > 0) {
              logText += ` ${damage} damage!`;
            }
            if (effectMessage) {
              logText += ` ${effectMessage}`;
            }
            this.battleLog.setText(logText);

            // Update status displays
            this.updateStatusDisplay();

            // Check if player fainted
            if (this.playerPokemon.hp <= 0) {
              this.time.delayedCall(1000, () => this.defeat());
            } else {
              // Apply end-of-turn status effects before next turn
              this.time.delayedCall(1000, () => this.applyEndOfTurnEffects('enemy', () => {
                // Re-enable buttons for next turn
                this.battleActive = true;
                this.actionButtons.forEach((btn) => btn.setInteractive());
                // Re-enable move buttons
                this.moveButtons.forEach((container) => {
                  if (container.getData('enabled')) {
                    const bg = container.getData('bg');
                    if (bg) bg.setInteractive({ useHandCursor: true });
                  }
                });
              }));
            }
          }
        );
      },
    });
  }

  animateHPDecrease(
    bar: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    maxWidth: number,
    height: number,
    pokemon: PlayerPokemon,
    onComplete: () => void
  ) {
    const startHP = Math.max(pokemon.maxHp * 0.1, pokemon.hp + 10); // Approximate previous HP
    const endHP = pokemon.hp;
    const duration = 500;

    // Create a tween to animate HP decrease
    this.tweens.addCounter({
      from: startHP,
      to: endHP,
      duration: duration,
      onUpdate: (tween) => {
        const currentHP = tween.getValue();
        const tempPokemon = { ...pokemon, hp: Math.max(0, currentHP) };
        this.updateHPBar(bar, x, y, maxWidth, height, tempPokemon);
      },
      onComplete: () => {
        this.updateHPBar(bar, x, y, maxWidth, height, pokemon);
        onComplete();
      },
    });
  }

  calculateDamage(attacker: PlayerPokemon, defender: PlayerPokemon): number {
    const baseDamage = Math.floor((attacker.attack / defender.defense) * 10);
    const variance = Math.floor(Math.random() * 5) + 1;
    return Math.max(1, baseDamage + variance);
  }

  applyEndOfTurnEffects(lastActor: 'player' | 'enemy', onComplete: () => void) {
    // Increment status turn counters
    if (this.playerPokemon.statusCondition) {
      this.playerPokemon.statusTurns = (this.playerPokemon.statusTurns || 0) + 1;
    }
    if (this.enemyPokemon.statusCondition) {
      this.enemyPokemon.statusTurns = (this.enemyPokemon.statusTurns || 0) + 1;
    }

    // Apply player status damage
    if (this.playerPokemon.statusCondition && this.playerPokemon.hp > 0) {
      const { damage, message } = calculateStatusDamage(
        this.playerPokemon,
        this.playerPokemon.statusTurns || 0
      );
      
      if (damage > 0) {
        this.playerPokemon.hp = Math.max(0, this.playerPokemon.hp - damage);
        this.battleLog.setText(`${this.playerPokemon.name} ${message}`);
        
        this.animateHPDecrease(
          this.playerHPBar,
          37,
          37,
          151,
          8,
          this.playerPokemon,
          () => {
            if (this.playerPokemon.hp <= 0) {
              this.time.delayedCall(1000, () => this.defeat());
            } else {
              this.applyEnemyEndOfTurnEffects(lastActor, onComplete);
            }
          }
        );
        return;
      }
    }

    // Apply enemy status damage
    this.applyEnemyEndOfTurnEffects(lastActor, onComplete);
  }

  applyEnemyEndOfTurnEffects(lastActor: 'player' | 'enemy', onComplete: () => void) {
    if (this.enemyPokemon.statusCondition && this.enemyPokemon.hp > 0) {
      const { damage, message } = calculateStatusDamage(
        this.enemyPokemon,
        this.enemyPokemon.statusTurns || 0
      );
      
      if (damage > 0) {
        this.enemyPokemon.hp = Math.max(0, this.enemyPokemon.hp - damage);
        this.battleLog.setText(`${this.enemyPokemon.name} ${message}`);
        
        this.animateHPDecrease(
          this.enemyHPBar,
          37,
          37,
          151,
          8,
          this.enemyPokemon,
          () => {
            if (this.enemyPokemon.hp <= 0) {
              this.time.delayedCall(1000, () => this.victory());
            } else {
              onComplete();
            }
          }
        );
        return;
      }
    }

    onComplete();
  }

  runAway() {
    // Allow running away even if battle is not active (mid-animation)
    // Stop battle and disable all buttons
    this.battleActive = false;
    this.actionButtons.forEach((btn) => btn.disableInteractive());

    // Stop all animations
    this.tweens.killAll();

    this.battleLog.setText('You ran away safely!');
    
    // Fade-out transition
    this.cameras.main.fadeOut(600, 0, 0, 0);
    
    this.time.delayedCall(1000, () => {
      this.cleanupKeyboardControls();
      const gameScene = this.scene.get('GameScene');
      if (gameScene && this.scene.isSleeping('GameScene')) {
        this.scene.stop();
        this.scene.wake('GameScene');
      } else {
        this.scene.start('GameScene');
      }
    });
  }

  attemptCapture() {
    if (!this.battleActive || !this.enemyPokemon) {
      return;
    }

    // Disable all buttons during capture attempt
    this.battleActive = false;
    this.actionButtons.forEach((btn) => btn.disableInteractive());

    // Calculate catch rate based on HP percentage
    const hpPercent = this.enemyPokemon.hp / this.enemyPokemon.maxHp;
    const baseCatchRate = 50; // Base 50% chance
    const hpModifier = (1 - hpPercent) * 50; // Up to 50% bonus when HP is low
    const catchChance = Math.min(95, baseCatchRate + hpModifier); // Cap at 95%

    // Shake animation sequence
    this.battleLog.setText('Attempting capture...');
    
    this.time.delayedCall(500, () => {
      this.battleLog.setText('1...');
      this.time.delayedCall(500, () => {
        this.battleLog.setText('2...');
        this.time.delayedCall(500, () => {
          this.battleLog.setText('3...');
          this.time.delayedCall(500, () => {
            // Determine capture success
            const roll = Math.random() * 100;
            if (roll < catchChance) {
              this.captureSuccess();
            } else {
              this.captureFail();
            }
          });
        });
      });
    });
  }

  captureSuccess() {
    // Show success message
    this.battleLog.setText(`Bravo ! ${this.enemyPokemon.name} est capturé !`);

    // Get the save manager
    const gameScene = this.scene.get('GameScene') as any;
    const saveManager = gameScene?.saveManager;

    if (!saveManager) {
      console.error('SaveManager not found!');
      this.time.delayedCall(1500, () => this.runAway());
      return;
    }

    // Create captured Pokémon object
    const capturedPokemon: PlayerPokemon = {
      id: this.enemyPokemon.id,
      name: this.enemyPokemon.name,
      level: this.enemyPokemon.level,
      exp: 0,
      xpTotal: this.enemyPokemon.xpTotal,
      hp: this.enemyPokemon.maxHp, // Restore to full HP
      maxHp: this.enemyPokemon.maxHp,
      attack: this.enemyPokemon.attack,
      defense: this.enemyPokemon.defense,
      speed: this.enemyPokemon.speed,
      baseHp: this.enemyPokemon.baseHp,
      baseAttack: this.enemyPokemon.baseAttack,
      baseDefense: this.enemyPokemon.baseDefense,
      baseSpeed: this.enemyPokemon.baseSpeed,
      moves: [...this.enemyPokemon.moves], // Copy moves
    };

    // Check if team has space
    const currentSave = saveManager.getCurrentSave();
    if (!currentSave) {
      console.error('No save found!');
      this.time.delayedCall(1500, () => this.runAway());
      return;
    }

    if (currentSave.team.length < 6) {
      // Add to team
      currentSave.team.push(capturedPokemon);
      saveManager.saveGame(currentSave);
      this.battleLog.setText(`${this.enemyPokemon.name} rejoint votre équipe !`);
    } else {
      // Add to PC box (if PC system exists, otherwise just show message)
      if (!currentSave.pcBox) {
        currentSave.pcBox = [];
      }
      currentSave.pcBox.push(capturedPokemon);
      saveManager.saveGame(currentSave);
      this.battleLog.setText(`${this.enemyPokemon.name} envoyé au PC Box (équipe pleine)`);
    }

    // Fade out and return to game
    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(1000, () => {
        this.cleanupKeyboardControls();
        const gameScene = this.scene.get('GameScene');
        if (gameScene && this.scene.isSleeping('GameScene')) {
          this.scene.stop();
          this.scene.wake('GameScene');
        } else {
          this.scene.start('GameScene');
        }
      });
    });
  }

  captureFail() {
    // Show failure message
    this.battleLog.setText(`Oh non ! ${this.enemyPokemon.name} s'est libéré !`);

    // Re-enable battle after delay
    this.time.delayedCall(1500, () => {
      this.battleActive = true;
      this.actionButtons.forEach((btn) => btn.setInteractive());
      this.battleLog.setText('What will you do?');
    });
  }

  async victory() {
    this.battleLog.setText(`${this.enemyPokemon.name} est K.O. ! Vous avez gagné !`);

    // Fade out enemy sprite
    this.tweens.add({
      targets: this.enemySprite,
      alpha: 0,
      duration: 500,
    });

    // Calculate and award XP
    const baseExp = getBaseExperience(this.enemyPokemon.id);
    const xpGained = calculateXPGain(this.enemyPokemon.level, baseExp, false);
    
    // Show XP gain message
    this.time.delayedCall(800, () => {
      this.battleLog.setText(`Votre ${this.playerPokemon.name} gagne ${xpGained} XP !`);
    });

    // Apply XP and handle level-ups
    this.time.delayedCall(1800, async () => {
      try {
        const result = await gainXP(this.playerPokemon, xpGained);
        this.levelUpResult = result;
        
        if (result.leveledUp) {
          // Show level-up messages
          await this.handleLevelUp(result);
        } else {
          // No level-up, just end battle
          this.endBattle();
        }
      } catch (error) {
        console.error('[BattleScene] Error in XP/level-up:', error);
        this.endBattle();
      }
    });
  }

  async handleLevelUp(result: LevelUpResult) {
    // Show level-up message for each level gained
    for (let i = 0; i < result.levelsGained; i++) {
      const newLevel = result.oldLevel + i + 1;
      this.battleLog.setText(`${this.playerPokemon.name} passe au niveau ${newLevel} !`);
      
      // Short delay between level-up messages
      await new Promise(resolve => this.time.delayedCall(1500, resolve as any));
    }
    
    // Handle move learning
    if (result.newMoves.length > 0) {
      this.pendingMoves = [...result.newMoves];
      this.time.delayedCall(500, () => this.showNextMoveLearn());
    } else {
      this.endBattle();
    }
  }

  showNextMoveLearn() {
    if (this.pendingMoves.length === 0) {
      this.endBattle();
      return;
    }
    
    const moveInfo = this.pendingMoves[0];
    const move = moveInfo.move;
    
    // Check if Pokémon has room for new move
    if (!this.playerPokemon.battleMoves || this.playerPokemon.battleMoves.length < 4) {
      // Auto-learn the move
      learnMove(this.playerPokemon, move);
      this.battleLog.setText(`${this.playerPokemon.name} apprend ${move.name} !`);
      this.pendingMoves.shift();
      this.time.delayedCall(1500, () => this.showNextMoveLearn());
    } else {
      // Show move replacement UI
      this.showMoveReplacementUI(move);
    }
  }

  showMoveReplacementUI(newMove: BattleMove) {
    const { width, height } = this.cameras.main;
    
    // Create modal container
    this.moveLearnModal = this.add.container(width / 2, height / 2);
    this.moveLearnModal.setDepth(100);
    
    // Semi-transparent background
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    overlay.setOrigin(0.5);
    
    // Modal box
    const modalBg = this.add.rectangle(0, 0, 500, 400, 0xffffff, 1);
    modalBg.setStrokeStyle(4, 0x000000);
    
    // Title text
    const titleText = this.add.text(0, -170, `${this.playerPokemon.name} veut apprendre ${newMove.name}...`, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 450 },
    });
    titleText.setOrigin(0.5);
    
    const infoText = this.add.text(0, -130, 'Mais il connaît déjà 4 attaques.\nQuelle attaque oublier ?', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      align: 'center',
      wordWrap: { width: 450 },
    });
    infoText.setOrigin(0.5);
    
    // Create buttons for each existing move
    const buttons: Phaser.GameObjects.Container[] = [];
    const currentMoves = this.playerPokemon.battleMoves || [];
    
    for (let i = 0; i < 4; i++) {
      const move = currentMoves[i];
      const yPos = -60 + i * 70;
      
      const btnContainer = this.add.container(0, yPos);
      
      const btnBg = this.add.rectangle(0, 0, 450, 60, 0x3b82f6, 1);
      btnBg.setStrokeStyle(2, 0x000000);
      btnBg.setInteractive({ useHandCursor: true });
      
      const moveNameText = this.add.text(-210, -10, move.name, {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      
      const moveInfoText = this.add.text(-210, 10, `${move.type.toUpperCase()} | PP: ${move.maxPp}`, {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        color: '#e0e0e0',
      });
      
      // Hover effects
      btnBg.on('pointerover', () => btnBg.setFillStyle(0x2563eb));
      btnBg.on('pointerout', () => btnBg.setFillStyle(0x3b82f6));
      
      // Click handler
      btnBg.on('pointerdown', () => {
        this.confirmMoveReplacement(newMove, i);
      });
      
      btnContainer.add([btnBg, moveNameText, moveInfoText]);
      buttons.push(btnContainer);
    }
    
    // Cancel button
    const cancelBtn = this.add.text(0, 170, 'Ne pas apprendre', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      backgroundColor: '#ef4444',
      padding: { x: 20, y: 10 },
    });
    cancelBtn.setOrigin(0.5);
    cancelBtn.setInteractive({ useHandCursor: true });
    
    cancelBtn.on('pointerover', () => cancelBtn.setStyle({ backgroundColor: '#dc2626' }));
    cancelBtn.on('pointerout', () => cancelBtn.setStyle({ backgroundColor: '#ef4444' }));
    cancelBtn.on('pointerdown', () => {
      this.cancelMoveLearning(newMove);
    });
    
    // Add all to container
    this.moveLearnModal.add([overlay, modalBg, titleText, infoText, ...buttons, cancelBtn]);
  }

  confirmMoveReplacement(newMove: BattleMove, replaceIndex: number) {
    if (!this.playerPokemon.battleMoves) return;
    
    const oldMove = this.playerPokemon.battleMoves[replaceIndex];
    learnMove(this.playerPokemon, newMove, replaceIndex);
    
    // Clean up modal
    if (this.moveLearnModal) {
      this.moveLearnModal.destroy();
      this.moveLearnModal = undefined;
    }
    
    // Show success message
    this.battleLog.setText(`1, 2 et… Ta-da ! ${this.playerPokemon.name} oublie ${oldMove.name} et apprend ${newMove.name} !`);
    
    // Move to next pending move
    this.pendingMoves.shift();
    this.time.delayedCall(2000, () => this.showNextMoveLearn());
  }

  cancelMoveLearning(move: BattleMove) {
    // Clean up modal
    if (this.moveLearnModal) {
      this.moveLearnModal.destroy();
      this.moveLearnModal = undefined;
    }
    
    // Show cancel message
    this.battleLog.setText(`${this.playerPokemon.name} n'apprend pas ${move.name}.`);
    
    // Move to next pending move
    this.pendingMoves.shift();
    this.time.delayedCall(1500, () => this.showNextMoveLearn());
  }

  endBattle() {
    // Save progress
    const save = saveManager.getSave();
    if (save) {
      // Update the player's Pokémon in the team
      const teamIndex = save.team.findIndex(p => p.id === this.playerPokemon.id);
      if (teamIndex >= 0) {
        save.team[teamIndex] = this.playerPokemon;
      } else {
        save.team[0] = this.playerPokemon;
      }
      saveManager.saveGame(save);
      console.log('[BattleScene] Progress saved');
    }

    // Fade-out transition
    this.cameras.main.fadeOut(800, 0, 0, 0);

    this.time.delayedCall(1000, () => {
      this.cleanupKeyboardControls();
      const gameScene = this.scene.get('GameScene');
      if (gameScene && this.scene.isSleeping('GameScene')) {
        this.scene.stop();
        this.scene.wake('GameScene');
      } else {
        this.scene.start('GameScene');
      }
    });
  }

  defeat() {
    this.battleLog.setText(`${this.playerPokemon.name} fainted! You lost!`);

    // Fade out player sprite
    this.tweens.add({
      targets: this.playerSprite,
      alpha: 0,
      duration: 500,
    });

    // Restore all Pokémon HP to full after defeat
    const save = saveManager.getSave();
    if (save && save.team.length > 0) {
      save.team.forEach((pokemon) => {
        pokemon.hp = pokemon.maxHp; // Restore to full HP
      });
      saveManager.saveGame(save);
      console.log('[BattleScene] All Pokémon HP restored after defeat');
    }

    // Fade-out transition
    this.cameras.main.fadeOut(800, 0, 0, 0);

    this.time.delayedCall(2000, () => {
      this.cleanupKeyboardControls();
      const gameScene = this.scene.get('GameScene');
      if (gameScene && this.scene.isSleeping('GameScene')) {
        this.scene.stop();
        this.scene.wake('GameScene');
      } else {
        this.scene.start('GameScene');
      }
    });
  }

  onResize(gameSize: Phaser.Structs.Size) {
    // Recalculate UI helper
    this.uiHelper.recalculate();
    
    const { width, height } = gameSize;
    const config = this.uiHelper.getConfig();

    // Update sprite positions (scaled with viewport)
    if (this.playerSprite) {
      this.playerSprite.setPosition(width * 0.30, height * 0.65);
    }
    if (this.enemySprite) {
      this.enemySprite.setPosition(width * 0.70, height * 0.30);
    }

    // Update platform positions
    if (this.playerPlatform) {
      this.playerPlatform.setPosition(width * 0.30, height * 0.70);
    }
    if (this.enemyPlatform) {
      this.enemyPlatform.setPosition(width * 0.70, height * 0.35);
    }

    // Update HUD positions (keep within safe zones)
    if (this.playerHUDContainer) {
      const playerHUDx = Math.max(config.safeLeft + 110, width * 0.55);
      const playerHUDy = Math.min(config.safeBottom - 35, height * 0.75);
      this.playerHUDContainer.setPosition(playerHUDx, playerHUDy);
    }
    if (this.enemyHUDContainer) {
      const enemyHUDx = Math.max(config.safeLeft + 110, width * 0.15);
      const enemyHUDy = Math.max(config.safeTop + 35, height * 0.15);
      this.enemyHUDContainer.setPosition(enemyHUDx, enemyHUDy);
    }

    // Update battle log position (centered, above buttons)
    if (this.battleLog) {
      const logY = Math.min(config.safeBottom - this.uiHelper.scale(240), height - 240);
      this.battleLog.setPosition(config.centerX, logY);
    }

    // Update action buttons position (Run and Capture, stacked vertically)
    if (this.actionButtons.length > 0) {
      const btnSize = this.uiHelper.getButtonSize(80, 40);
      const btnSpacing = 90;
      const basePos = this.uiHelper.getSafeCornerPosition('bottom-right', btnSize.width / 2 + config.padding, btnSize.height / 2 + config.padding);
      
      // Run button (bottom)
      this.actionButtons[0].setPosition(basePos.x, basePos.y);
      
      // Capture button (above Run button)
      if (this.actionButtons.length > 1) {
        this.actionButtons[1].setPosition(basePos.x, basePos.y - btnSpacing);
      }
    }
    
    // Update move button positions (responsive grid layout)
    const buttonWidth = this.uiHelper.scale(180);
    const buttonHeight = this.uiHelper.scale(50);
    const spacing = this.uiHelper.getSpacing(10);
    const startX = config.centerX - buttonWidth - spacing / 2;
    const startY = Math.min(config.safeBottom - this.uiHelper.scale(200), height - 200);
    
    this.moveButtons.forEach((container, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = startX + col * (buttonWidth + spacing);
      const y = startY + row * (buttonHeight + spacing);
      container.setPosition(x, y);
    });
  }

  createWildPokemon(id: number, level: number): PlayerPokemon {
    const baseStats = this.getPokemonBaseStats(id);
    const pokemon: PlayerPokemon = {
      id: id,
      name: this.getPokemonName(id),
      level: level,
      exp: 0,
      xpTotal: 0, // Initialize to 0 XP at level 1 (will be calculated)
      hp: baseStats.hp + level * 2,
      maxHp: baseStats.hp + level * 2,
      attack: baseStats.attack + level,
      defense: baseStats.defense + level,
      speed: baseStats.speed + level,
      // Store base stats for level-up recalculation
      baseHp: baseStats.hp,
      baseAttack: baseStats.attack,
      baseDefense: baseStats.defense,
      baseSpeed: baseStats.speed,
      moves: ['Tackle'],
    };
    
    // Calculate proper xpTotal for the level
    const { getTotalXPForLevel } = require('../levelingSystem');
    pokemon.xpTotal = getTotalXPForLevel(level);
    
    return pokemon;
  }

  createTemporaryPokemon(id: number, level: number): PlayerPokemon {
    return this.createWildPokemon(id, level);
  }

  getPokemonBaseStats(id: number) {
    // Simple base stats for early-game Pokémon
    const stats: Record<number, { hp: number; attack: number; defense: number; speed: number }> = {
      1: { hp: 45, attack: 49, defense: 49, speed: 45 }, // Bulbasaur
      4: { hp: 39, attack: 52, defense: 43, speed: 65 }, // Charmander
      7: { hp: 44, attack: 48, defense: 65, speed: 43 }, // Squirtle
      10: { hp: 45, attack: 30, defense: 35, speed: 45 }, // Caterpie
      13: { hp: 40, attack: 35, defense: 30, speed: 50 }, // Weedle
      16: { hp: 40, attack: 45, defense: 40, speed: 56 }, // Pidgey
      19: { hp: 30, attack: 56, defense: 35, speed: 72 }, // Rattata
      21: { hp: 40, attack: 60, defense: 30, speed: 70 }, // Spearow
      23: { hp: 35, attack: 60, defense: 44, speed: 55 }, // Ekans
      25: { hp: 35, attack: 55, defense: 40, speed: 90 }, // Pikachu
    };
    return stats[id] || { hp: 40, attack: 50, defense: 50, speed: 50 };
  }

  getPokemonName(id: number): string {
    const names: Record<number, string> = {
      1: 'Bulbasaur',
      4: 'Charmander',
      7: 'Squirtle',
      10: 'Caterpie',
      13: 'Weedle',
      16: 'Pidgey',
      19: 'Rattata',
      21: 'Spearow',
      23: 'Ekans',
      25: 'Pikachu',
    };
    return names[id] || `Pokémon #${id}`;
  }

  applyMoveEffect(effect: any, attacker: PlayerPokemon, defender: PlayerPokemon): string {
    let message = '';
    
    // Apply status condition
    if (effect.statusCondition && effect.target === 'opponent' && !defender.statusCondition) {
      defender.statusCondition = effect.statusCondition;
      defender.statusTurns = 0; // Initialize status turn counter
      
      const statusNames: Record<string, string> = {
        burn: 'burned',
        paralysis: 'paralyzed',
        poison: 'poisoned',
        sleep: 'fell asleep',
        freeze: 'was frozen',
        'badly-poisoned': 'was badly poisoned',
        confusion: 'became confused',
        flinch: 'flinched',
        'leech-seed': 'was seeded',
        curse: 'was cursed',
        trap: 'was trapped',
      };
      message = `${defender.name} ${statusNames[effect.statusCondition] || 'was affected'}!`;
    }
    
    // Apply stat changes
    if (effect.statChanges && effect.statChanges.length > 0) {
      const target = effect.target === 'self' ? attacker : defender;
      
      for (const statChange of effect.statChanges) {
        const currentStage = target[`${statChange.stat}Stage`] || 0;
        const newStage = Math.max(-6, Math.min(6, currentStage + statChange.stages));
        target[`${statChange.stat}Stage`] = newStage;
        
        const statNames: Record<string, string> = {
          attack: 'Attack',
          defense: 'Defense',
          speed: 'Speed',
        };
        
        const changeText = statChange.stages > 0 ? 'rose' : 'fell';
        const intensity = Math.abs(statChange.stages) > 1 ? ' sharply' : '';
        message += ` ${target.name}'s ${statNames[statChange.stat]} ${changeText}${intensity}!`;
      }
    }
    
    return message.trim();
  }

  updateStatusDisplay(): void {
    // Update player status
    const playerStatusText = this.playerHUDContainer.getByName('statusText') as Phaser.GameObjects.Text;
    if (playerStatusText) {
      if (this.playerPokemon.statusCondition) {
        const statusName = getStatusName(this.playerPokemon.statusCondition);
        const statusColor = getStatusColor(this.playerPokemon.statusCondition);
        playerStatusText.setText(statusName);
        playerStatusText.setStyle({ backgroundColor: `#${statusColor.toString(16).padStart(6, '0')}` });
        playerStatusText.setVisible(true);
      } else {
        playerStatusText.setVisible(false);
      }
    }
    
    // Update enemy status
    const enemyStatusText = this.enemyHUDContainer.getByName('statusText') as Phaser.GameObjects.Text;
    if (enemyStatusText) {
      if (this.enemyPokemon.statusCondition) {
        const statusName = getStatusName(this.enemyPokemon.statusCondition);
        const statusColor = getStatusColor(this.enemyPokemon.statusCondition);
        enemyStatusText.setText(statusName);
        enemyStatusText.setStyle({ backgroundColor: `#${statusColor.toString(16).padStart(6, '0')}` });
        enemyStatusText.setVisible(true);
      } else {
        enemyStatusText.setVisible(false);
      }
    }
  }
}
