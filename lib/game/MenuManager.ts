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
  private selectedPokemonIndex: number = 0;
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
    const fonts = this.uiHelper.getFonts();
    
    // Container
    this.menuContainer = this.scene.add.container(0, 0);
    this.menuContainer.setDepth(1000);

    // Semi-transparent overlay
    const overlay = this.scene.add.rectangle(0, 0, config.width, config.height, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();
    this.menuContainer.add(overlay);

    // Menu panel - responsive dimensions
    const panelDims = this.uiHelper.getPanelDimensions(0.7, 0.7);
    const panelWidth = Math.min(400, panelDims.width);
    const panelHeight = Math.min(500, panelDims.height);

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

    // ESC to close
    const escKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    if (escKey) {
      escKey.once('down', () => this.closeMenu());
    }
  }

  // =====================
  // TEAM MENU
  // =====================
  private createTeamMenu() {
    const config = this.uiHelper.getConfig();
    const fonts = this.uiHelper.getFonts();
    const save = saveManager.getSave();
    if (!save) return;

    // Container
    this.menuContainer = this.scene.add.container(0, 0);
    this.menuContainer.setDepth(1000);

    // Semi-transparent overlay
    const overlay = this.scene.add.rectangle(0, 0, config.width, config.height, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();
    this.menuContainer.add(overlay);

    // Menu panel - responsive
    const panelDims = this.uiHelper.getPanelDimensions(0.95, 0.92);
    const panelWidth = Math.min(900, panelDims.width);
    const panelHeight = Math.min(700, panelDims.height);

    const panel = this.scene.add.rectangle(config.centerX, config.centerY, panelWidth, panelHeight, 0xf5f5f5, 1);
    panel.setStrokeStyle(4, 0x333333);
    this.menuContainer.add(panel);

    // Title
    const title = this.uiHelper.createText(config.centerX, config.centerY - panelHeight / 2 + this.uiHelper.scale(30), 'YOUR TEAM', 'large', '#333333', true);
    title.setOrigin(0.5);
    this.menuContainer.add(title);

    // Close button
    const closeBtn = this.createSmallButton(config.centerX + panelWidth / 2 - this.uiHelper.scale(60), config.centerY - panelHeight / 2 + this.uiHelper.scale(30), 'Close', () => this.closeMenu());
    this.menuContainer.add(closeBtn);

    // Team list (left side)
    if (save.team.length === 0) {
      const noTeamText = this.uiHelper.createText(config.centerX, config.centerY, 'No Pokémon in your team yet!', 'medium', '#666666');
      noTeamText.setOrigin(0.5);
      this.menuContainer.add(noTeamText);
    } else {
      const teamListX = config.centerX - panelWidth / 2 + this.uiHelper.scale(40);
      const startY = config.centerY - panelHeight / 2 + this.uiHelper.scale(80);
      const cardSpacing = this.uiHelper.getSpacing(90);

      // Adjust for smaller screens - reduce card height if needed
      const maxCards = Math.floor((panelHeight - this.uiHelper.scale(120)) / cardSpacing);
      const visibleTeam = save.team.slice(0, Math.min(6, maxCards));

      visibleTeam.forEach((pokemon, index) => {
        const pokemonCard = this.createPokemonCard(teamListX, startY + index * cardSpacing, pokemon, index);
        this.menuContainer!.add(pokemonCard);
      });

      // Detail panel (right side) - only if screen is wide enough
      if (panelWidth > 600 && save.team.length > 0) {
        const detailPanel = this.createPokemonDetailPanel(
          config.centerX + panelWidth / 4,
          config.centerY,
          panelWidth / 2 - this.uiHelper.scale(60),
          panelHeight - this.uiHelper.scale(100),
          save.team[this.selectedPokemonIndex]
        );
        this.menuContainer.add(detailPanel);
      }
    }

    // Controls hint
    const hint = this.uiHelper.createText(config.centerX, config.centerY + panelHeight / 2 - this.uiHelper.scale(20), 'ESC to close | Click Pokémon to view details', 'tiny', '#666666');
    hint.setOrigin(0.5);
    this.menuContainer.add(hint);

    // ESC to close
    const escKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    if (escKey) {
      escKey.once('down', () => this.closeMenu());
    }
  }

  private createPokemonCard(x: number, y: number, pokemon: PlayerPokemon, index: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Card background
    const cardBg = this.scene.add.rectangle(0, 0, 380, 80, 0xffffff, 1);
    cardBg.setStrokeStyle(2, this.selectedPokemonIndex === index ? 0x3b82f6 : 0x999999);
    cardBg.setInteractive({ useHandCursor: true });
    cardBg.on('pointerdown', () => this.selectPokemon(index));
    cardBg.on('pointerover', () => cardBg.setStrokeStyle(2, 0x3b82f6));
    cardBg.on('pointerout', () => cardBg.setStrokeStyle(2, this.selectedPokemonIndex === index ? 0x3b82f6 : 0x999999));
    container.add(cardBg);

    // Pokémon sprite (placeholder)
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    const sprite = this.scene.add.image(-160, 0, 'pokemon-sprite');
    sprite.setDisplaySize(60, 60);
    
    // Load sprite dynamically
    this.scene.load.image(`pokemon-${pokemon.id}`, spriteUrl);
    this.scene.load.once('complete', () => {
      sprite.setTexture(`pokemon-${pokemon.id}`);
    });
    this.scene.load.start();
    
    container.add(sprite);

    // Name and level
    const nameText = this.scene.add.text(-120, -20, pokemon.name, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#333333',
      fontStyle: 'bold',
    });
    nameText.setOrigin(0, 0.5);
    container.add(nameText);

    const levelText = this.scene.add.text(-120, 5, `Lv. ${pokemon.level}`, {
      fontSize: '14px',
      color: '#666666',
    });
    levelText.setOrigin(0, 0.5);
    container.add(levelText);

    // HP bar
    const hpBarBg = this.scene.add.rectangle(-120, 25, 200, 8, 0xdddddd, 1);
    hpBarBg.setOrigin(0, 0.5);
    container.add(hpBarBg);

    const hpPercent = pokemon.hp / pokemon.maxHp;
    const hpBarWidth = 200 * hpPercent;
    let hpColor = 0x22c55e; // Green
    if (hpPercent < 0.5) hpColor = 0xfbbf24; // Yellow
    if (hpPercent < 0.25) hpColor = 0xef4444; // Red

    const hpBar = this.scene.add.rectangle(-120, 25, hpBarWidth, 8, hpColor, 1);
    hpBar.setOrigin(0, 0.5);
    container.add(hpBar);

    const hpText = this.scene.add.text(90, 25, `${pokemon.hp}/${pokemon.maxHp}`, {
      fontSize: '12px',
      color: '#666666',
    });
    hpText.setOrigin(0, 0.5);
    container.add(hpText);

    // Status condition badge
    if (pokemon.statusCondition) {
      const statusName = getStatusName(pokemon.statusCondition);
      const statusColor = getStatusColor(pokemon.statusCondition);
      const statusBadge = this.scene.add.text(150, -20, statusName, {
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: `#${statusColor.toString(16).padStart(6, '0')}`,
        padding: { x: 6, y: 2 },
      });
      statusBadge.setOrigin(0, 0.5);
      container.add(statusBadge);
    }

    return container;
  }

  private createPokemonDetailPanel(x: number, y: number, width: number, height: number, pokemon: PlayerPokemon): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Panel background
    const panel = this.scene.add.rectangle(0, 0, width, height, 0xffffff, 1);
    panel.setStrokeStyle(2, 0x999999);
    container.add(panel);

    // Title
    const title = this.scene.add.text(0, -height / 2 + 30, 'DETAILS', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#333333',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    container.add(title);

    let currentY = -height / 2 + 70;

    // Pokémon sprite (larger)
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    const sprite = this.scene.add.image(0, currentY + 50, 'pokemon-sprite');
    sprite.setDisplaySize(100, 100);
    
    this.scene.load.image(`pokemon-detail-${pokemon.id}`, spriteUrl);
    this.scene.load.once('complete', () => {
      sprite.setTexture(`pokemon-detail-${pokemon.id}`);
    });
    this.scene.load.start();
    
    container.add(sprite);
    currentY += 120;

    // Name and Level
    const nameText = this.scene.add.text(0, currentY, `${pokemon.name} - Lv. ${pokemon.level}`, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#333333',
      fontStyle: 'bold',
    });
    nameText.setOrigin(0.5);
    container.add(nameText);
    currentY += 35;

    // HP
    const hpText = this.scene.add.text(0, currentY, `HP: ${pokemon.hp}/${pokemon.maxHp}`, {
      fontSize: '16px',
      color: '#666666',
    });
    hpText.setOrigin(0.5);
    container.add(hpText);
    currentY += 30;

    // XP Bar
    const xpTotal = pokemon.xpTotal || pokemon.exp || 0;
    const currentLevelXP = Math.pow(pokemon.level, 3);
    const nextLevelXP = Math.pow(pokemon.level + 1, 3);
    const xpInLevel = xpTotal - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    const xpPercent = xpInLevel / xpNeeded;

    const xpLabel = this.scene.add.text(0, currentY, 'XP to Next Level', {
      fontSize: '14px',
      color: '#666666',
    });
    xpLabel.setOrigin(0.5);
    container.add(xpLabel);
    currentY += 20;

    const xpBarBg = this.scene.add.rectangle(0, currentY, width - 40, 12, 0xdddddd, 1);
    container.add(xpBarBg);

    const xpBarWidth = (width - 40) * Math.min(1, xpPercent);
    const xpBar = this.scene.add.rectangle(-xpBarBg.width / 2, currentY, xpBarWidth, 12, 0x3b82f6, 1);
    xpBar.setOrigin(0, 0.5);
    container.add(xpBar);

    const xpPercentText = this.scene.add.text(0, currentY + 15, `${Math.floor(xpPercent * 100)}%`, {
      fontSize: '12px',
      color: '#666666',
    });
    xpPercentText.setOrigin(0.5);
    container.add(xpPercentText);
    currentY += 45;

    // Stats
    const statsText = this.scene.add.text(0, currentY, 'STATS', {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#333333',
    });
    statsText.setOrigin(0.5);
    container.add(statsText);
    currentY += 25;

    const stats = [
      `ATK: ${pokemon.attack}`,
      `DEF: ${pokemon.defense}`,
      `SPD: ${pokemon.speed}`,
    ];

    stats.forEach(stat => {
      const statText = this.scene.add.text(0, currentY, stat, {
        fontSize: '14px',
        color: '#666666',
      });
      statText.setOrigin(0.5);
      container.add(statText);
      currentY += 22;
    });

    currentY += 10;

    // Moves
    if (pokemon.battleMoves && pokemon.battleMoves.length > 0) {
      const movesTitle = this.scene.add.text(0, currentY, 'MOVES', {
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#333333',
      });
      movesTitle.setOrigin(0.5);
      container.add(movesTitle);
      currentY += 25;

      pokemon.battleMoves.slice(0, 4).forEach(move => {
        const moveText = this.scene.add.text(0, currentY, `${move.name} (${move.type.toUpperCase()})`, {
          fontSize: '13px',
          color: '#666666',
        });
        moveText.setOrigin(0.5);
        container.add(moveText);

        const ppText = this.scene.add.text(0, currentY + 15, `PP: ${move.pp}/${move.maxPp}`, {
          fontSize: '11px',
          color: '#999999',
        });
        ppText.setOrigin(0.5);
        container.add(ppText);
        currentY += 38;
      });
    }

    return container;
  }

  private selectPokemon(index: number) {
    this.selectedPokemonIndex = index;
    // Recreate team menu to update selection
    if (this.menuContainer) {
      this.menuContainer.destroy();
      this.createTeamMenu();
    }
  }

  // =====================
  // INVENTORY MENU
  // =====================
  private createInventoryMenu() {
    const config = this.uiHelper.getConfig();
    const save = saveManager.getSave();
    if (!save) return;

    // Container
    this.menuContainer = this.scene.add.container(0, 0);
    this.menuContainer.setDepth(1000);

    // Semi-transparent overlay
    const overlay = this.scene.add.rectangle(0, 0, config.width, config.height, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();
    this.menuContainer.add(overlay);

    // Menu panel (responsive dimensions)
    const panelDims = this.uiHelper.getPanelDimensions(0.9, 0.9);
    const panelWidth = Math.min(700, panelDims.width);
    const panelHeight = Math.min(600, panelDims.height);
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

    // ESC to close
    const escKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    if (escKey) {
      escKey.once('down', () => this.closeMenu());
    }
  }

  private createInventoryItem(x: number, y: number, item: InventoryItem, itemWidth: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Item background (responsive width)
    const itemHeight = this.uiHelper.scale(45);
    const itemBg = this.scene.add.rectangle(0, 0, itemWidth, itemHeight, 0xffffff, 1);
    itemBg.setStrokeStyle(this.uiHelper.scale(2), 0x999999);
    itemBg.setInteractive({ useHandCursor: true });
    itemBg.on('pointerdown', () => this.useItem(item));
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

    // Overlay
    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();
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

    // Overlay
    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.5);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();
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
    const btnSize = this.uiHelper.getButtonSize(baseWidth, baseHeight);

    const bg = this.scene.add.rectangle(0, 0, btnSize.width, btnSize.height, 0x3b82f6, 1);
    bg.setStrokeStyle(2, 0x2563eb);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', onClick);
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
    const btnSize = this.uiHelper.getButtonSize(100, 35);

    const bg = this.scene.add.rectangle(0, 0, btnSize.width, btnSize.height, 0xef4444, 1);
    bg.setStrokeStyle(2, 0xdc2626);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', onClick);
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
