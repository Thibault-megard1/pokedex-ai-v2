// Menu Manager - Handles all in-game menus (Team, Inventory, Pause)
import * as Phaser from 'phaser';
import type { GameSave, PlayerPokemon, InventoryItem } from './types';
import { saveManager } from './saveManager';
import { getStatusName, getStatusColor } from './moveSystem';
import { UIHelper } from './UIHelper';

export type MenuState = 'none' | 'pause' | 'team' | 'inventory';

export class MenuManager {
  private scene: Phaser.Scene;
  private menuState: MenuState = 'none';
  private menuContainer: Phaser.GameObjects.Container | null = null;
  private onClose: (() => void) | null = null;
  private selectedPokemonIndex: number = -1; // -1 means no selection
  private detailPanelContainer: Phaser.GameObjects.Container | null = null;
  private uiHelper: UIHelper;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.uiHelper = new UIHelper(scene);
    
    // Listen for resize events
    this.scene.scale.on('resize', this.onResize, this);
  }
  
  private onResize(gameSize: Phaser.Structs.Size): void {
    // Recalculate UI helper
    this.uiHelper.recalculate();
    
    // Recreate current menu if open
    if (this.menuState !== 'none') {
      const currentState = this.menuState;
      const currentCallback = this.onClose;
      
      // Destroy and recreate
      if (this.menuContainer) {
        this.menuContainer.destroy();
        this.menuContainer = null;
      }
      
      // Recreate appropriate menu
      switch (currentState) {
        case 'pause':
          this.createPauseMenu();
          break;
        case 'team':
          this.createTeamMenu();
          break;
        case 'inventory':
          this.createInventoryMenu();
          break;
      }
      
      this.onClose = currentCallback;
    }
  }

  isMenuOpen(): boolean {
    return this.menuState !== 'none';
  }

  getMenuState(): MenuState {
    return this.menuState;
  }

  openPauseMenu(onCloseCallback?: () => void) {
    if (this.menuState !== 'none') return;
    
    this.menuState = 'pause';
    this.onClose = onCloseCallback || null;
    this.createPauseMenu();
  }

  openTeam(onCloseCallback?: () => void) {
    if (this.menuState !== 'none') return;
    
    this.menuState = 'team';
    this.onClose = onCloseCallback || null;
    this.createTeamMenu();
  }

  openInventory(onCloseCallback?: () => void) {
    if (this.menuState !== 'none') return;
    
    this.menuState = 'inventory';
    this.onClose = onCloseCallback || null;
    this.createInventoryMenu();
  }

  closeMenu() {
    if (this.menuContainer) {
      this.menuContainer.destroy();
      this.menuContainer = null;
    }
    
    const previousState = this.menuState;
    this.menuState = 'none';
    
    if (this.onClose) {
      this.onClose();
      this.onClose = null;
    }
  }

  // =====================
  // PAUSE MENU
  // =====================
  private createPauseMenu() {
    const config = this.uiHelper.getConfig();
    const menuScale = this.uiHelper.getMenuScale();
    
    // Container
    this.menuContainer = this.scene.add.container(0, 0);
    this.menuContainer.setDepth(1000);
    this.menuContainer.setScrollFactor(0); // Fixed to camera

    // Semi-transparent overlay (non-interactive to allow clicks through)
    const overlay = this.scene.add.rectangle(0, 0, config.width, config.height, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    this.menuContainer.add(overlay);

    // Menu panel - responsive dimensions with menuScale
    const panelDims = this.uiHelper.getPanelDimensions(0.65, 0.65);
    const panelWidth = Math.min(Math.round(350 * menuScale), panelDims.width);
    const panelHeight = Math.min(Math.round(450 * menuScale), panelDims.height);

    const panel = this.scene.add.rectangle(config.centerX, config.centerY, panelWidth, panelHeight, 0xffffff, 1);
    panel.setStrokeStyle(4, 0x333333);
    this.menuContainer.add(panel);

    // Title
    const title = this.uiHelper.createText(config.centerX, config.centerY - panelHeight / 2 + this.uiHelper.scale(40), 'PAUSE MENU', 'title', '#333333', true);
    title.setOrigin(0.5);
    this.menuContainer.add(title);

    // Menu options
    const options = [
      { label: 'Resume', action: () => this.closeMenu() },
      { label: 'Team', action: () => { this.closeMenu(); setTimeout(() => this.openTeam(), 100); } },
      { label: 'Inventory', action: () => { this.closeMenu(); setTimeout(() => this.openInventory(), 100); } },
      { label: 'Save Game', action: () => this.saveGame() },
      { label: 'Exit to Menu', action: () => this.exitToMenu() },
    ];

    const spacing = this.uiHelper.getSpacing(70);
    const startY = config.centerY - this.uiHelper.scale(80);
    options.forEach((option, index) => {
      const btnY = startY + index * spacing;
      const btn = this.createButton(config.centerX, btnY, option.label, option.action);
      this.menuContainer!.add(btn);
    });

    // Close hint
    const hint = this.uiHelper.createText(config.centerX, config.centerY + panelHeight / 2 - this.uiHelper.scale(30), 'Press ESC to close', 'small', '#666666');
    hint.setOrigin(0.5);
    this.menuContainer.add(hint);
  }

  // =====================
  // TEAM MENU
  // =====================
  private createTeamMenu() {
    const config = this.uiHelper.getConfig();
    const menuScale = this.uiHelper.getMenuScale();
    const save = saveManager.getSave();
    if (!save) return;

    // Container
    this.menuContainer = this.scene.add.container(0, 0);
    this.menuContainer.setDepth(1000);
    this.menuContainer.setScrollFactor(0);

    // Semi-transparent overlay (non-interactive to allow clicks through)
    const overlay = this.scene.add.rectangle(0, 0, config.width, config.height, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    // Removed setInteractive to fix click issues
    this.menuContainer.add(overlay);

    // Menu panel - smaller and more compact
    const panelDims = this.uiHelper.getPanelDimensions(0.85, 0.82);
    const panelWidth = Math.min(Math.round(750 * menuScale), panelDims.width);
    const panelHeight = Math.min(Math.round(600 * menuScale), panelDims.height);

    const panel = this.scene.add.rectangle(config.centerX, config.centerY, panelWidth, panelHeight, 0xf5f5f5, 1);
    panel.setStrokeStyle(3, 0x333333);
    this.menuContainer.add(panel);

    // Title
    const title = this.uiHelper.createText(
      config.centerX,
      config.centerY - panelHeight / 2 + this.uiHelper.scale(25),
      'YOUR TEAM',
      'large',
      '#333333',
      true
    );
    title.setOrigin(0.5);
    this.menuContainer.add(title);

    // Close button
    const closeBtn = this.createSmallButton(
      config.centerX + panelWidth / 2 - this.uiHelper.scale(50),
      config.centerY - panelHeight / 2 + this.uiHelper.scale(25),
      'X',
      () => this.closeMenu()
    );
    this.menuContainer.add(closeBtn);

    // Team list
    if (save.team.length === 0) {
      const noTeamText = this.uiHelper.createText(config.centerX, config.centerY, 'No Pokémon in your team yet!', 'medium', '#666666');
      noTeamText.setOrigin(0.5);
      this.menuContainer.add(noTeamText);
    } else {
      // Calculate layout based on screen size
      const hasDetailPanel = this.selectedPokemonIndex !== -1;
      const isDesktop = config.width >= 768 && !config.isMobile;
      
      // List area dimensions
      const listWidth = hasDetailPanel && isDesktop ? panelWidth * 0.4 : panelWidth * 0.85;
      const listX = config.centerX - panelWidth / 2 + (hasDetailPanel && isDesktop ? listWidth * 0.55 : panelWidth * 0.5);
      const startY = config.centerY - panelHeight / 2 + this.uiHelper.scale(60);
      
      // Compact card spacing
      const cardHeight = Math.round(65 * menuScale);
      const cardSpacing = Math.round(10 * menuScale);
      const totalCardHeight = cardHeight + cardSpacing;
      
      // Maximum visible cards
      const availableHeight = panelHeight - this.uiHelper.scale(100);
      const maxVisibleCards = Math.floor(availableHeight / totalCardHeight);
      const visibleTeam = save.team.slice(0, Math.min(6, maxVisibleCards));

      visibleTeam.forEach((pokemon, index) => {
        const pokemonCard = this.createCompactPokemonCard(
          listX,
          startY + index * totalCardHeight,
          pokemon,
          index,
          Math.round(listWidth * 0.9)
        );
        this.menuContainer!.add(pokemonCard);
      });

      // Detail panel (right side on desktop, bottom on mobile)
      if (hasDetailPanel) {
        const pokemon = save.team[this.selectedPokemonIndex];
        if (isDesktop) {
          // Desktop: right panel
          const detailX = config.centerX + panelWidth * 0.15;
          const detailWidth = panelWidth * 0.52;
          const detailHeight = panelHeight - this.uiHelper.scale(80);
          this.detailPanelContainer = this.createDetailPanel(detailX, config.centerY, detailWidth, detailHeight, pokemon);
        } else {
          // Mobile: bottom panel (scrollable)
          const detailWidth = panelWidth * 0.9;
          const detailHeight = Math.min(panelHeight * 0.5, Math.round(350 * menuScale));
          const detailY = config.centerY + panelHeight / 2 - detailHeight / 2 - this.uiHelper.scale(20);
          this.detailPanelContainer = this.createDetailPanel(config.centerX, detailY, detailWidth, detailHeight, pokemon);
        }
        this.menuContainer.add(this.detailPanelContainer);
      }
    }

    // Controls hint
    const hintText = this.selectedPokemonIndex !== -1 ? 'ESC to close | Click Pokémon again to hide details' : 'ESC to close | Click Pokémon to view details';
    const hint = this.uiHelper.createText(
      config.centerX,
      config.centerY + panelHeight / 2 - this.uiHelper.scale(15),
      hintText,
      'tiny',
      '#666666'
    );
    hint.setOrigin(0.5);
    this.menuContainer.add(hint);
  }

  private createCompactPokemonCard(x: number, y: number, pokemon: PlayerPokemon, index: number, cardWidth: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setScrollFactor(0);
    const menuScale = this.uiHelper.getMenuScale();
    const cardHeight = Math.round(65 * menuScale);
    const isSelected = this.selectedPokemonIndex === index;

    // Card background
    const cardBg = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, 0xffffff, 1);
    cardBg.setStrokeStyle(isSelected ? 3 : 2, isSelected ? 0x3b82f6 : 0xcccccc);
    cardBg.setInteractive({ useHandCursor: true });
    cardBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.selectPokemon(index);
    });
    cardBg.on('pointerover', () => {
      if (!isSelected) cardBg.setStrokeStyle(2, 0x3b82f6);
    });
    cardBg.on('pointerout', () => {
      if (!isSelected) cardBg.setStrokeStyle(2, 0xcccccc);
    });
    container.add(cardBg);

    // Pokémon sprite (small)
    const spriteSize = Math.round(50 * menuScale);
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    const sprite = this.scene.add.image(-cardWidth / 2 + spriteSize / 2 + 8, 0, 'pokemon-sprite');
    sprite.setDisplaySize(spriteSize, spriteSize);
    
    this.scene.load.image(`pokemon-compact-${pokemon.id}`, spriteUrl);
    this.scene.load.once('complete', () => {
      if (sprite.scene) sprite.setTexture(`pokemon-compact-${pokemon.id}`);
    });
    this.scene.load.start();
    
    container.add(sprite);

    // Name and level (compact)
    const nameX = -cardWidth / 2 + spriteSize + 16;
    const nameText = this.uiHelper.createText(nameX, -cardHeight / 4, pokemon.name, 'base', '#333333', true);
    nameText.setOrigin(0, 0.5);
    container.add(nameText);

    const levelText = this.uiHelper.createText(nameX, cardHeight / 4, `Lv. ${pokemon.level}`, 'small', '#666666');
    levelText.setOrigin(0, 0.5);
    container.add(levelText);

    // HP bar (compact)
    const hpBarWidth = Math.round(120 * menuScale);
    const hpBarHeight = Math.round(6 * menuScale);
    const hpBarX = cardWidth / 2 - hpBarWidth - 8;
    
    const hpBarBg = this.scene.add.rectangle(hpBarX, 0, hpBarWidth, hpBarHeight, 0xdddddd, 1);
    hpBarBg.setOrigin(0, 0.5);
    container.add(hpBarBg);

    const hpPercent = pokemon.hp / pokemon.maxHp;
    const hpBarFillWidth = hpBarWidth * hpPercent;
    let hpColor = 0x22c55e;
    if (hpPercent < 0.5) hpColor = 0xfbbf24;
    if (hpPercent < 0.25) hpColor = 0xef4444;

    const hpBar = this.scene.add.rectangle(hpBarX, 0, hpBarFillWidth, hpBarHeight, hpColor, 1);
    hpBar.setOrigin(0, 0.5);
    container.add(hpBar);

    // HP text (small)
    const hpText = this.uiHelper.createText(hpBarX + hpBarWidth / 2, hpBarHeight + 8, `${pokemon.hp}/${pokemon.maxHp}`, 'tiny', '#666666');
    hpText.setOrigin(0.5, 0);
    container.add(hpText);

    // Status condition badge (if any)
    if (pokemon.statusCondition) {
      const statusName = getStatusName(pokemon.statusCondition);
      const statusColor = getStatusColor(pokemon.statusCondition);
      const statusBadge = this.uiHelper.createText(
        cardWidth / 2 - 8,
        -cardHeight / 4,
        statusName,
        'tiny',
        '#ffffff',
        true
      );
      statusBadge.setOrigin(1, 0.5);
      statusBadge.setBackgroundColor(`#${statusColor.toString(16).padStart(6, '0')}`);
      statusBadge.setPadding(4, 2, 4, 2);
      container.add(statusBadge);
    }

    return container;
  }

  private createDetailPanel(x: number, y: number, width: number, height: number, pokemon: PlayerPokemon): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const menuScale = this.uiHelper.getMenuScale();

    // Panel background
    const panel = this.scene.add.rectangle(0, 0, width, height, 0xffffff, 0.98);
    panel.setStrokeStyle(3, 0x3b82f6);
    container.add(panel);

    let currentY = -height / 2 + this.uiHelper.scale(20);

    // Close button for detail panel
    const closeDetailBtn = this.createSmallButton(
      width / 2 - this.uiHelper.scale(25),
      currentY,
      'X',
      () => {
        this.selectedPokemonIndex = -1;
        this.refreshTeamMenu();
      }
    );
    container.add(closeDetailBtn);

    // Title
    const title = this.uiHelper.createText(0, currentY, 'DETAILS', 'medium', '#333333', true);
    title.setOrigin(0.5);
    container.add(title);
    currentY += this.uiHelper.scale(35);

    // Pokémon sprite (larger)
    const spriteSize = Math.round(96 * menuScale);
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    const sprite = this.scene.add.image(0, currentY + spriteSize / 2, 'pokemon-sprite');
    sprite.setDisplaySize(spriteSize, spriteSize);
    
    this.scene.load.image(`pokemon-detail-${pokemon.id}`, spriteUrl);
    this.scene.load.once('complete', () => {
      if (sprite.scene) sprite.setTexture(`pokemon-detail-${pokemon.id}`);
    });
    this.scene.load.start();
    
    container.add(sprite);
    currentY += spriteSize + this.uiHelper.scale(15);

    // Name and Level
    const nameText = this.uiHelper.createText(0, currentY, `${pokemon.name}`, 'large', '#333333', true);
    nameText.setOrigin(0.5);
    container.add(nameText);
    currentY += this.uiHelper.scale(25);

    const levelText = this.uiHelper.createText(0, currentY, `Level ${pokemon.level}`, 'base', '#666666');
    levelText.setOrigin(0.5);
    container.add(levelText);
    currentY += this.uiHelper.scale(25);

    // HP Bar
    const hpLabel = this.uiHelper.createText(0, currentY, `HP: ${pokemon.hp} / ${pokemon.maxHp}`, 'small', '#666666');
    hpLabel.setOrigin(0.5);
    container.add(hpLabel);
    currentY += this.uiHelper.scale(18);

    const hpBarWidth = width * 0.7;
    const hpBarHeight = Math.round(10 * menuScale);
    const hpBarBg = this.scene.add.rectangle(0, currentY, hpBarWidth, hpBarHeight, 0xdddddd, 1);
    container.add(hpBarBg);

    const hpPercent = pokemon.hp / pokemon.maxHp;
    const hpBarFillWidth = hpBarWidth * hpPercent;
    let hpColor = 0x22c55e;
    if (hpPercent < 0.5) hpColor = 0xfbbf24;
    if (hpPercent < 0.25) hpColor = 0xef4444;

    const hpBar = this.scene.add.rectangle(-hpBarWidth / 2, currentY, hpBarFillWidth, hpBarHeight, hpColor, 1);
    hpBar.setOrigin(0, 0.5);
    container.add(hpBar);
    currentY += this.uiHelper.scale(25);

    // Stats
    const statsText = this.uiHelper.createText(
      0,
      currentY,
      `ATK: ${pokemon.attack}  DEF: ${pokemon.defense}  SPD: ${pokemon.speed}`,
      'small',
      '#666666'
    );
    statsText.setOrigin(0.5);
    container.add(statsText);
    currentY += this.uiHelper.scale(25);

    // XP Progress
    const xpTotal = pokemon.xpTotal || pokemon.exp || 0;
    const currentLevelXP = Math.pow(pokemon.level, 3);
    const nextLevelXP = Math.pow(pokemon.level + 1, 3);
    const xpInLevel = xpTotal - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    const xpPercent = Math.max(0, Math.min(1, xpInLevel / xpNeeded));

    const xpLabel = this.uiHelper.createText(0, currentY, 'XP to Next Level', 'small', '#666666');
    xpLabel.setOrigin(0.5);
    container.add(xpLabel);
    currentY += this.uiHelper.scale(16);

    const xpBarWidth = width * 0.7;
    const xpBarBg = this.scene.add.rectangle(0, currentY, xpBarWidth, hpBarHeight, 0xdddddd, 1);
    container.add(xpBarBg);

    const xpBarFillWidth = xpBarWidth * xpPercent;
    const xpBar = this.scene.add.rectangle(-xpBarWidth / 2, currentY, xpBarFillWidth, hpBarHeight, 0x3b82f6, 1);
    xpBar.setOrigin(0, 0.5);
    container.add(xpBar);

    const xpPercentText = this.uiHelper.createText(0, currentY + hpBarHeight + 6, `${Math.floor(xpPercent * 100)}%`, 'tiny', '#666666');
    xpPercentText.setOrigin(0.5, 0);
    container.add(xpPercentText);
    currentY += this.uiHelper.scale(30);

    // Moves
    const movesTitle = this.uiHelper.createText(0, currentY, 'MOVES', 'small', '#333333', true);
    movesTitle.setOrigin(0.5);
    container.add(movesTitle);
    currentY += this.uiHelper.scale(20);

    const moves = Array.isArray(pokemon.moves) ? pokemon.moves.slice(0, 4) : [];
    if (moves.length === 0) {
      const noMoves = this.uiHelper.createText(0, currentY, 'No moves learned', 'small', '#999999');
      noMoves.setOrigin(0.5);
      container.add(noMoves);
    } else {
      moves.forEach((move, i) => {
        const moveText = typeof move === 'string' ? move : move.name || 'Unknown';
        const moveLine = this.uiHelper.createText(0, currentY + i * this.uiHelper.scale(18), `• ${moveText}`, 'small', '#666666');
        moveLine.setOrigin(0.5);
        container.add(moveLine);
      });
    }

    return container;
  }

  private selectPokemon(index: number) {
    // Toggle selection: if clicking the same Pokémon, deselect it
    if (this.selectedPokemonIndex === index) {
      this.selectedPokemonIndex = -1;
    } else {
      this.selectedPokemonIndex = index;
    }
    this.refreshTeamMenu();
  }

  private refreshTeamMenu() {
    // Destroy and recreate team menu to update selection
    if (this.menuContainer) {
      this.menuContainer.destroy();
      this.menuContainer = null;
      this.detailPanelContainer = null;
    }
    this.createTeamMenu();
  }

  // =====================
  // INVENTORY MENU
  // =====================
  private createInventoryMenu() {
    const config = this.uiHelper.getConfig();
    const menuScale = this.uiHelper.getMenuScale();
    const save = saveManager.getSave();
    if (!save) return;

    // Container
    this.menuContainer = this.scene.add.container(0, 0);
    this.menuContainer.setDepth(1000);
    this.menuContainer.setScrollFactor(0); // Fixed to camera

    // Semi-transparent overlay (non-interactive to allow clicks through)
    const overlay = this.scene.add.rectangle(0, 0, config.width, config.height, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    this.menuContainer.add(overlay);

    // Menu panel (responsive dimensions with menuScale)
    const panelDims = this.uiHelper.getPanelDimensions(0.82, 0.82);
    const panelWidth = Math.min(Math.round(650 * menuScale), panelDims.width);
    const panelHeight = Math.min(Math.round(550 * menuScale), panelDims.height);
    const panelX = config.centerX;
    const panelY = config.centerY;

    const panel = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xf5f5f5, 1);
    panel.setStrokeStyle(this.uiHelper.scale(4), 0x333333);
    this.menuContainer.add(panel);

    // Title (responsive font)
    const title = this.uiHelper.createText(panelX, panelY - panelHeight / 2 + this.uiHelper.scale(30), 'INVENTORY', 'title', '#333333', true);
    title.setOrigin(0.5);
    this.menuContainer.add(title);

    // Close button (responsive)
    const closeBtn = this.createSmallButton(panelX + panelWidth / 2 - this.uiHelper.scale(60), panelY - panelHeight / 2 + this.uiHelper.scale(30), 'Close', () => this.closeMenu());
    this.menuContainer.add(closeBtn);

    // Inventory list (responsive grid)
    if (!save.inventory || save.inventory.length === 0) {
      const noItemsText = this.uiHelper.createText(panelX, panelY, 'No items in inventory!', 'medium', '#666666');
      noItemsText.setOrigin(0.5);
      this.menuContainer.add(noItemsText);
    } else {
      const startY = panelY - panelHeight / 2 + this.uiHelper.scale(80);
      const itemHeight = this.uiHelper.scale(55);
      const itemsPerColumn = Math.floor((panelHeight - this.uiHelper.scale(120)) / itemHeight);
      
      // Adaptive column count based on width
      const columns = panelWidth > this.uiHelper.scale(600) ? 2 : 1;
      const columnWidth = (panelWidth - this.uiHelper.scale(80)) / columns - this.uiHelper.scale(20);
      const columnSpacing = this.uiHelper.getSpacing(40);

      save.inventory.forEach((item, index) => {
        const column = Math.floor(index / itemsPerColumn);
        const row = index % itemsPerColumn;
        const itemX = panelX - panelWidth / 2 + this.uiHelper.scale(40) + column * (columnWidth + columnSpacing);
        const itemY = startY + row * itemHeight;

        const itemCard = this.createInventoryItem(itemX, itemY, item, columnWidth);
        this.menuContainer!.add(itemCard);
      });
    }

    // Controls hint (responsive font)
    const hint = this.uiHelper.createText(panelX, panelY + panelHeight / 2 - this.uiHelper.scale(20), 'ESC to close | Click item to use', 'small', '#666666');
    hint.setOrigin(0.5);
    this.menuContainer.add(hint);
  }

  private createInventoryItem(x: number, y: number, item: InventoryItem, itemWidth: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setScrollFactor(0);

    // Item background (responsive width)
    const itemHeight = this.uiHelper.scale(45);
    const itemBg = this.scene.add.rectangle(0, 0, itemWidth, itemHeight, 0xffffff, 1);
    itemBg.setStrokeStyle(this.uiHelper.scale(2), 0x999999);
    itemBg.setInteractive({ useHandCursor: true });
    itemBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.useItem(item);
    });
    itemBg.on('pointerover', () => itemBg.setFillStyle(0xf0f0f0));
    itemBg.on('pointerout', () => itemBg.setFillStyle(0xffffff));
    container.add(itemBg);

    // Item icon (placeholder - use emoji for now)
    let icon = '📦';
    if (item.type === 'potion') icon = '🧪';
    if (item.type === 'pokeball') icon = '⚾';

    const iconText = this.uiHelper.createText(-itemWidth / 2 + this.uiHelper.scale(20), 0, icon, 'large');
    iconText.setOrigin(0, 0.5);
    container.add(iconText);

    // Item name (responsive font)
    const nameText = this.uiHelper.createText(-itemWidth / 2 + this.uiHelper.scale(50), -this.uiHelper.scale(8), item.name, 'base', '#333333', true);
    nameText.setOrigin(0, 0.5);
    container.add(nameText);

    // Quantity (responsive font)
    const qtyText = this.uiHelper.createText(-itemWidth / 2 + this.uiHelper.scale(50), this.uiHelper.scale(8), `x${item.quantity}`, 'small', '#666666');
    qtyText.setOrigin(0, 0.5);
    container.add(qtyText);

    return container;
  }

  private useItem(item: InventoryItem) {
    const save = saveManager.getSave();
    if (!save) return;

    // Check if item is usable
    if (item.type === 'potion') {
      // Show Pokémon selection to heal
      this.showPokemonSelector('Choose a Pokémon to heal', (pokemon) => {
        if (pokemon) {
          // Heal Pokémon
          const healAmount = 20; // Default potion heals 20 HP
          const oldHp = pokemon.hp;
          pokemon.hp = Math.min(pokemon.maxHp, pokemon.hp + healAmount);
          const healed = pokemon.hp - oldHp;

          // Reduce item quantity
          item.quantity--;
          if (item.quantity <= 0) {
            save.inventory = save.inventory.filter(i => i.id !== item.id);
          }

          // Save
          saveManager.saveGame(save);

          // Show message
          this.showMessage(`${pokemon.name} was healed for ${healed} HP!`, () => {
            // Refresh inventory
            this.closeMenu();
            setTimeout(() => this.openInventory(), 100);
          });
        }
      });
    } else if (item.type === 'pokeball') {
      this.showMessage('Poké Balls can only be used in battle!');
    } else {
      this.showMessage(`Cannot use ${item.name} here.`);
    }
  }

  private showPokemonSelector(title: string, onSelect: (pokemon: PlayerPokemon | null) => void) {
    const save = saveManager.getSave();
    if (!save || save.team.length === 0) {
      this.showMessage('No Pokémon in your team!');
      return;
    }

    // Close current menu and open selector
    const { width, height } = this.scene.cameras.main;
    
    const selectorContainer = this.scene.add.container(0, 0);
    selectorContainer.setDepth(1100);

    // Overlay (non-interactive to allow clicks through)
    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    overlay.setOrigin(0, 0);
    selectorContainer.add(overlay);

    // Panel
    const panelWidth = Math.min(500, width * 0.9);
    const panelHeight = Math.min(400, height * 0.8);
    const panelX = width / 2;
    const panelY = height / 2;

    const panel = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xffffff, 1);
    panel.setStrokeStyle(4, 0x333333);
    selectorContainer.add(panel);

    // Title
    const titleText = this.scene.add.text(panelX, panelY - panelHeight / 2 + 30, title, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#333333',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5);
    selectorContainer.add(titleText);

    // Pokémon list
    const startY = panelY - panelHeight / 2 + 70;
    save.team.forEach((pokemon, index) => {
      const btnY = startY + index * 50;
      const btn = this.createButton(panelX, btnY, `${pokemon.name} (HP: ${pokemon.hp}/${pokemon.maxHp})`, () => {
        selectorContainer.destroy();
        onSelect(pokemon);
      }, 380, 40);
      selectorContainer.add(btn);
    });

    // Cancel button
    const cancelBtn = this.createButton(panelX, panelY + panelHeight / 2 - 40, 'Cancel', () => {
      selectorContainer.destroy();
      onSelect(null);
    }, 200, 35);
    selectorContainer.add(cancelBtn);
  }

  private showMessage(message: string, onClose?: () => void) {
    const { width, height } = this.scene.cameras.main;
    
    const messageContainer = this.scene.add.container(0, 0);
    messageContainer.setDepth(1200);

    // Overlay (non-interactive to allow clicks through)
    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.5);
    overlay.setOrigin(0, 0);
    messageContainer.add(overlay);

    // Message box
    const boxWidth = Math.min(400, width * 0.8);
    const boxHeight = 150;
    const boxX = width / 2;
    const boxY = height / 2;

    const box = this.scene.add.rectangle(boxX, boxY, boxWidth, boxHeight, 0xffffff, 1);
    box.setStrokeStyle(4, 0x333333);
    messageContainer.add(box);

    // Message text
    const text = this.scene.add.text(boxX, boxY - 20, message, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#333333',
      wordWrap: { width: boxWidth - 40 },
      align: 'center',
    });
    text.setOrigin(0.5);
    messageContainer.add(text);

    // OK button
    const okBtn = this.createButton(boxX, boxY + 40, 'OK', () => {
      messageContainer.destroy();
      if (onClose) onClose();
    }, 120, 35);
    messageContainer.add(okBtn);
  }

  // =====================
  // UTILITIES
  // =====================
  private createButton(x: number, y: number, label: string, onClick: () => void, baseWidth: number = 300, baseHeight: number = 50): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setScrollFactor(0);
    const btnSize = this.uiHelper.getButtonSize(baseWidth, baseHeight);

    const bg = this.scene.add.rectangle(0, 0, btnSize.width, btnSize.height, 0x3b82f6, 1);
    bg.setStrokeStyle(2, 0x2563eb);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      onClick();
    });
    bg.on('pointerover', () => bg.setFillStyle(0x2563eb));
    bg.on('pointerout', () => bg.setFillStyle(0x3b82f6));
    container.add(bg);

    const text = this.uiHelper.createText(0, 0, label, 'base', '#ffffff', true);
    text.setOrigin(0.5);
    container.add(text);

    return container;
  }

  private createSmallButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setScrollFactor(0);
    const btnSize = this.uiHelper.getButtonSize(100, 35);

    const bg = this.scene.add.rectangle(0, 0, btnSize.width, btnSize.height, 0xef4444, 1);
    bg.setStrokeStyle(2, 0xdc2626);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      onClick();
    });
    bg.on('pointerover', () => bg.setFillStyle(0xdc2626));
    bg.on('pointerout', () => bg.setFillStyle(0xef4444));
    container.add(bg);

    const text = this.uiHelper.createText(0, 0, label, 'small', '#ffffff', true);
    text.setOrigin(0.5);
    container.add(text);

    return container;
  }

  private saveGame() {
    const save = saveManager.getSave();
    if (save) {
      saveManager.saveGame(save);
      this.showMessage('Game saved successfully!');
    }
  }

  private exitToMenu() {
    this.closeMenu();
    this.scene.scene.start('MenuScene');
  }
}
