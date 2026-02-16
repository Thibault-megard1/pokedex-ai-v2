// Battle Log Export System
// Tracks battle actions and provides export functionality

export interface BattleAction {
  turn: number;
  timestamp: number;
  actorName: string;
  actorType: 'player' | 'enemy';
  actionType: 'move' | 'damage' | 'status' | 'faint' | 'switch' | 'start' | 'end';
  details: string;
  damage?: number;
  moveName?: string;
  moveType?: string;
  movePower?: number;
  effectiveness?: string;
}

export interface BattleLogData {
  battleId: string;
  startTime: number;
  endTime?: number;
  winner?: 'player' | 'enemy' | 'draw';
  playerPokemon: {
    id: number;
    name: string;
    level: number;
    moves: string[];
  };
  enemyPokemon: {
    id: number;
    name: string;
    level: number;
    moves: string[];
  };
  actions: BattleAction[];
  totalTurns: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
}

export class BattleLogger {
  private log: BattleLogData;
  private currentTurn: number = 0;

  constructor(
    playerPokemon: { id: number; name: string; level: number; moves: string[] },
    enemyPokemon: { id: number; name: string; level: number; moves: string[] }
  ) {
    this.log = {
      battleId: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      playerPokemon,
      enemyPokemon,
      actions: [],
      totalTurns: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
    };

    this.logAction({
      turn: 0,
      timestamp: Date.now(),
      actorName: 'Battle',
      actorType: 'player',
      actionType: 'start',
      details: `Battle started: ${playerPokemon.name} (Lv.${playerPokemon.level}) vs ${enemyPokemon.name} (Lv.${enemyPokemon.level})`,
    });
  }

  incrementTurn() {
    this.currentTurn++;
  }

  logAction(action: Omit<BattleAction, 'turn' | 'timestamp'>) {
    this.log.actions.push({
      turn: this.currentTurn,
      timestamp: Date.now(),
      ...action,
    });

    // Update totals
    if (action.damage) {
      if (action.actorType === 'player') {
        this.log.totalDamageDealt += action.damage;
      } else {
        this.log.totalDamageTaken += action.damage;
      }
    }
  }

  logMove(
    actorName: string,
    actorType: 'player' | 'enemy',
    moveName: string,
    moveType?: string,
    movePower?: number
  ) {
    this.logAction({
      actorName,
      actorType,
      actionType: 'move',
      details: `${actorName} used ${moveName}!`,
      moveName,
      moveType,
      movePower,
    });
  }

  logDamage(
    targetName: string,
    targetType: 'player' | 'enemy',
    damage: number,
    effectiveness?: string
  ) {
    let effectivenessText = '';
    if (effectiveness === 'super') effectivenessText = ' (Super effective!)';
    else if (effectiveness === 'not_very') effectivenessText = ' (Not very effective...)';
    else if (effectiveness === 'immune') effectivenessText = ' (No effect!)';

    this.logAction({
      actorName: targetName,
      actorType: targetType,
      actionType: 'damage',
      details: `${targetName} took ${damage} damage!${effectivenessText}`,
      damage,
      effectiveness,
    });
  }

  logStatus(targetName: string, targetType: 'player' | 'enemy', statusName: string) {
    this.logAction({
      actorName: targetName,
      actorType: targetType,
      actionType: 'status',
      details: `${targetName} is affected by ${statusName}!`,
    });
  }

  logFaint(pokemonName: string, pokemonType: 'player' | 'enemy') {
    this.logAction({
      actorName: pokemonName,
      actorType: pokemonType,
      actionType: 'faint',
      details: `${pokemonName} fainted!`,
    });
  }

  endBattle(winner: 'player' | 'enemy' | 'draw') {
    this.log.endTime = Date.now();
    this.log.winner = winner;
    this.log.totalTurns = this.currentTurn;

    this.logAction({
      actorName: 'Battle',
      actorType: 'player',
      actionType: 'end',
      details: `Battle ended. Winner: ${winner}. Total turns: ${this.currentTurn}`,
    });
  }

  getLog(): BattleLogData {
    return this.log;
  }

  exportAsJSON(): string {
    return JSON.stringify(this.log, null, 2);
  }

  exportAsText(): string {
    const duration = this.log.endTime
      ? Math.floor((this.log.endTime - this.log.startTime) / 1000)
      : 0;

    let text = '='.repeat(60) + '\n';
    text += 'POKEMON BATTLE LOG\n';
    text += '='.repeat(60) + '\n\n';
    text += `Battle ID: ${this.log.battleId}\n`;
    text += `Date: ${new Date(this.log.startTime).toLocaleString()}\n`;
    text += `Duration: ${duration}s\n\n`;

    text += '--- PARTICIPANTS ---\n';
    text += `[PLAYER] ${this.log.playerPokemon.name} (Lv.${this.log.playerPokemon.level})\n`;
    text += `         Moves: ${this.log.playerPokemon.moves.join(', ')}\n\n`;
    text += `[ENEMY]  ${this.log.enemyPokemon.name} (Lv.${this.log.enemyPokemon.level})\n`;
    text += `         Moves: ${this.log.enemyPokemon.moves.join(', ')}\n\n`;

    text += '--- BATTLE LOG ---\n';
    this.log.actions.forEach(action => {
      const prefix = `[Turn ${action.turn}] `;
      text += prefix + action.details + '\n';
    });

    text += '\n--- STATISTICS ---\n';
    text += `Winner: ${this.log.winner?.toUpperCase() || 'N/A'}\n`;
    text += `Total Turns: ${this.log.totalTurns}\n`;
    text += `Damage Dealt: ${this.log.totalDamageDealt}\n`;
    text += `Damage Taken: ${this.log.totalDamageTaken}\n`;

    text += '\n' + '='.repeat(60) + '\n';

    return text;
  }

  downloadJSON(filename?: string) {
    const name = filename || `battle_log_${this.log.battleId}.json`;
    this.downloadFile(this.exportAsJSON(), name, 'application/json');
  }

  downloadText(filename?: string) {
    const name = filename || `battle_log_${this.log.battleId}.txt`;
    this.downloadFile(this.exportAsText(), name, 'text/plain');
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
