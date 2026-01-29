// Battle scene for wild encounters
import * as Phaser from 'phaser';
import type { PlayerPokemon } from '../types';
import { saveManager } from '../saveManager';

export class BattleScene extends Phaser.Scene {
  private playerPokemon!: PlayerPokemon;
  private enemyPokemon!: PlayerPokemon;
  private battleUI!: Phaser.GameObjects.Container;
  private playerHPBar!: Phaser.GameObjects.Graphics;
  private enemyHPBar!: Phaser.GameObjects.Graphics;
  private battleLog!: Phaser.GameObjects.Text;
  private actionButtons: Phaser.GameObjects.Text[] = [];
  private battleActive: boolean = true;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: { enemyId: number; enemyLevel: number }) {
    console.log('[BattleScene] Starting battle:', data);
    
    const save = saveManager.getSave();
    if (!save || save.team.length === 0) {
      // If no team, create a temporary starter
      this.playerPokemon = this.createTemporaryPokemon(25, 5); // Pikachu Lv.5
    } else {
      this.playerPokemon = save.team[0]; // Use first Pokémon
    }

    // Generate enemy Pokémon
    this.enemyPokemon = this.createWildPokemon(data.enemyId, data.enemyLevel);
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x87ceeb);

    // Ground platforms
    const playerPlatform = this.add.ellipse(width * 0.25, height * 0.7, 150, 40, 0x8b4513);
    const enemyPlatform = this.add.ellipse(width * 0.75, height * 0.4, 150, 40, 0x8b4513);

    // Pokémon sprites (placeholders)
    const playerSprite = this.add.rectangle(width * 0.25, height * 0.6, 80, 80, 0x3b82f6);
    const enemySprite = this.add.rectangle(width * 0.75, height * 0.3, 80, 80, 0xef4444);

    // Labels
    const playerLabel = this.add.text(
      width * 0.25,
      height * 0.75,
      `${this.playerPokemon.name} Lv.${this.playerPokemon.level}`,
      { fontSize: '16px', fontFamily: 'monospace', color: '#ffffff' }
    );
    playerLabel.setOrigin(0.5);

    const enemyLabel = this.add.text(
      width * 0.75,
      height * 0.45,
      `Wild ${this.enemyPokemon.name} Lv.${this.enemyPokemon.level}`,
      { fontSize: '16px', fontFamily: 'monospace', color: '#ffffff' }
    );
    enemyLabel.setOrigin(0.5);

    // HP Bars
    this.createHPBars();

    // Battle UI
    this.createBattleUI();

    // Entrance animation
    this.tweens.add({
      targets: enemySprite,
      x: width * 0.75,
      from: width + 100,
      duration: 500,
      ease: 'Back.out',
    });
  }

  createHPBars() {
    const { width, height } = this.cameras.main;

    // Player HP
    const playerHPBg = this.add.rectangle(width * 0.7, height * 0.85, 200, 20, 0x1f2937);
    this.playerHPBar = this.add.graphics();
    this.updateHPBar(this.playerHPBar, width * 0.6, height * 0.85, this.playerPokemon);

    const playerHPText = this.add.text(
      width * 0.7,
      height * 0.85,
      `${this.playerPokemon.hp}/${this.playerPokemon.maxHp}`,
      { fontSize: '14px', fontFamily: 'monospace', color: '#ffffff' }
    );
    playerHPText.setOrigin(0.5);

    // Enemy HP
    const enemyHPBg = this.add.rectangle(width * 0.3, height * 0.15, 200, 20, 0x1f2937);
    this.enemyHPBar = this.add.graphics();
    this.updateHPBar(this.enemyHPBar, width * 0.2, height * 0.15, this.enemyPokemon);
  }

  updateHPBar(bar: Phaser.GameObjects.Graphics, x: number, y: number, pokemon: PlayerPokemon) {
    bar.clear();
    const hpPercent = pokemon.hp / pokemon.maxHp;
    const barWidth = 200 * hpPercent;
    
    let color = 0x10b981; // Green
    if (hpPercent < 0.5) color = 0xfbbf24; // Yellow
    if (hpPercent < 0.25) color = 0xef4444; // Red

    bar.fillStyle(color, 1);
    bar.fillRect(x, y - 10, barWidth, 20);
  }

  createBattleUI() {
    const { width, height } = this.cameras.main;

    // Battle log
    this.battleLog = this.add.text(
      width / 2,
      height - 150,
      `Wild ${this.enemyPokemon.name} appeared!`,
      {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: '#1f2937',
        padding: { x: 20, y: 10 },
        align: 'center',
        wordWrap: { width: width * 0.8 },
      }
    );
    this.battleLog.setOrigin(0.5);

    // Action buttons
    const actions = ['Attack', 'Run'];
    this.actionButtons = actions.map((action, index) => {
      const btn = this.add.text(
        width / 2 - 100 + index * 200,
        height - 80,
        action,
        {
          fontSize: '20px',
          fontFamily: 'monospace',
          color: '#ffffff',
          backgroundColor: '#3b82f6',
          padding: { x: 30, y: 15 },
        }
      );
      btn.setOrigin(0.5);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => this.handleAction(action.toLowerCase()));
      btn.on('pointerover', () => btn.setBackgroundColor('#2563eb'));
      btn.on('pointerout', () => btn.setBackgroundColor('#3b82f6'));
      return btn;
    });
  }

  handleAction(action: string) {
    if (!this.battleActive) return;

    if (action === 'attack') {
      this.playerAttack();
    } else if (action === 'run') {
      this.attemptRun();
    }
  }

  playerAttack() {
    this.battleActive = false;
    this.disableButtons();

    // Calculate damage (simple formula)
    const damage = Math.max(1, Math.floor(
      (this.playerPokemon.attack / this.enemyPokemon.defense) * 10 + Math.random() * 5
    ));

    this.enemyPokemon.hp = Math.max(0, this.enemyPokemon.hp - damage);
    this.updateHPBar(this.enemyHPBar, this.cameras.main.width * 0.2, this.cameras.main.height * 0.15, this.enemyPokemon);

    this.battleLog.setText(`${this.playerPokemon.name} attacked! Dealt ${damage} damage!`);

    this.time.delayedCall(1500, () => {
      if (this.enemyPokemon.hp <= 0) {
        this.victory();
      } else {
        this.enemyAttack();
      }
    });
  }

  enemyAttack() {
    const damage = Math.max(1, Math.floor(
      (this.enemyPokemon.attack / this.playerPokemon.defense) * 8 + Math.random() * 5
    ));

    this.playerPokemon.hp = Math.max(0, this.playerPokemon.hp - damage);
    this.updateHPBar(this.playerHPBar, this.cameras.main.width * 0.6, this.cameras.main.height * 0.85, this.playerPokemon);

    this.battleLog.setText(`Wild ${this.enemyPokemon.name} attacked! Dealt ${damage} damage!`);

    this.time.delayedCall(1500, () => {
      if (this.playerPokemon.hp <= 0) {
        this.defeat();
      } else {
        this.battleActive = true;
        this.enableButtons();
      }
    });
  }

  attemptRun() {
    const runChance = Math.random();
    if (runChance > 0.5) {
      this.battleLog.setText('Got away safely!');
      this.disableButtons();
      this.time.delayedCall(1500, () => {
        this.endBattle();
      });
    } else {
      this.battleLog.setText("Can't escape!");
      this.time.delayedCall(1500, () => {
        this.enemyAttack();
      });
    }
  }

  victory() {
    this.battleActive = false;
    this.disableButtons();

    const expGained = this.enemyPokemon.level * 15;
    this.battleLog.setText(
      `Wild ${this.enemyPokemon.name} fainted!\n${this.playerPokemon.name} gained ${expGained} EXP!`
    );

    // Update player Pokémon
    this.playerPokemon.exp += expGained;
    const save = saveManager.getSave();
    if (save && save.team.length > 0) {
      save.team[0] = this.playerPokemon;
      saveManager.updateSave({ team: save.team });
    }

    this.time.delayedCall(2500, () => {
      this.endBattle();
    });
  }

  defeat() {
    this.battleActive = false;
    this.disableButtons();

    this.battleLog.setText(`${this.playerPokemon.name} fainted!\nYou blacked out...`);

    this.time.delayedCall(2500, () => {
      this.endBattle();
    });
  }

  endBattle() {
    this.scene.stop();
    this.scene.resume('GameScene');
  }

  disableButtons() {
    this.actionButtons.forEach(btn => {
      btn.disableInteractive();
      btn.setAlpha(0.5);
    });
  }

  enableButtons() {
    this.actionButtons.forEach(btn => {
      btn.setInteractive();
      btn.setAlpha(1);
    });
  }

  createWildPokemon(id: number, level: number): PlayerPokemon {
    const baseStats = {
      hp: 40,
      attack: 20,
      defense: 15,
      speed: 20,
    };

    const maxHp = baseStats.hp + level * 2;
    
    return {
      id,
      name: `Pokemon #${id}`,
      level,
      exp: 0,
      hp: maxHp,
      maxHp,
      attack: baseStats.attack + level,
      defense: baseStats.defense + level,
      speed: baseStats.speed + level,
      moves: ['Tackle'],
    };
  }

  createTemporaryPokemon(id: number, level: number): PlayerPokemon {
    return this.createWildPokemon(id, level);
  }
}
