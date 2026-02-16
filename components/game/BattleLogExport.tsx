'use client';

import { useEffect, useState } from 'react';

interface BattleLogExportProps {
  enabled?: boolean;
}

export default function BattleLogExport({ enabled = true }: BattleLogExportProps) {
  const [showExport, setShowExport] = useState(false);
  const [battleLog, setBattleLog] = useState<any>(null);

  useEffect(() => {
    if (!enabled) return;

    // Listen for battle end events from the game
    const handleBattleEnd = (event: CustomEvent) => {
      console.log('[BattleLogExport] Battle ended, showing export UI');
      setBattleLog(event.detail);
      setShowExport(true);
    };

    window.addEventListener('battle:end' as any, handleBattleEnd);

    return () => {
      window.removeEventListener('battle:end' as any, handleBattleEnd);
    };
  }, [enabled]);

  const exportAsJSON = () => {
    if (!battleLog) return;

    const blob = new Blob([JSON.stringify(battleLog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `battle_log_${battleLog.battleId || Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsText = () => {
    if (!battleLog) return;

    const duration = battleLog.endTime
      ? Math.floor((battleLog.endTime - battleLog.startTime) / 1000)
      : 0;

    let text = '='.repeat(60) + '\n';
    text += 'POKEMON BATTLE LOG\n';
    text += '='.repeat(60) + '\n\n';
    text += `Battle ID: ${battleLog.battleId}\n`;
    text += `Date: ${new Date(battleLog.startTime).toLocaleString()}\n`;
    text += `Duration: ${duration}s\n\n`;

    text += '--- PARTICIPANTS ---\n';
    text += `[PLAYER] ${battleLog.playerPokemon.name} (Lv.${battleLog.playerPokemon.level})\n`;
    text += `         Moves: ${battleLog.playerPokemon.moves.join(', ')}\n\n`;
    text += `[ENEMY]  ${battleLog.enemyPokemon.name} (Lv.${battleLog.enemyPokemon.level})\n`;
    text += `         Moves: ${battleLog.enemyPokemon.moves.join(', ')}\n\n`;

    if (battleLog.playerMovesUsed?.length || battleLog.enemyMovesUsed?.length) {
      text += '--- MOVES USED ---\n';
      if (battleLog.playerMovesUsed?.length) {
        text += `[PLAYER] ${battleLog.playerMovesUsed.join(', ')}\n`;
      }
      if (battleLog.enemyMovesUsed?.length) {
        text += `[ENEMY]  ${battleLog.enemyMovesUsed.join(', ')}\n`;
      }
      text += '\n';
    }

    text += '--- BATTLE LOG ---\n';
    battleLog.actions.forEach((action: any) => {
      const prefix = `[Turn ${action.turn}] `;
      text += prefix + action.details + '\n';
    });

    text += '\n--- STATISTICS ---\n';
    text += `Winner: ${battleLog.winner?.toUpperCase() || 'N/A'}\n`;
    text += `Total Turns: ${battleLog.totalTurns}\n`;
    text += `Damage Dealt: ${battleLog.totalDamageDealt}\n`;
    text += `Damage Taken: ${battleLog.totalDamageTaken}\n`;

    text += '\n' + '='.repeat(60) + '\n';

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `battle_log_${battleLog.battleId || Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const close = () => {
    setShowExport(false);
    setBattleLog(null);
  };

  if (!enabled || !showExport || !battleLog) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-4 border-yellow-400 p-6 max-w-md w-full mx-4">
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Battle Complete!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Export battle log for analysis
          </p>
        </div>

        <div className="space-y-3 mb-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-400 rounded-lg p-3">
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Winner: {battleLog.winner?.toUpperCase() || 'N/A'}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              Turns: {battleLog.totalTurns} | Damage Dealt: {battleLog.totalDamageDealt}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={exportAsText}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex flex-col items-center gap-1"
          >
            <span className="text-xl">📄</span>
            <span className="text-sm">Export .TXT</span>
          </button>

          <button
            onClick={exportAsJSON}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex flex-col items-center gap-1"
          >
            <span className="text-xl">📊</span>
            <span className="text-sm">Export .JSON</span>
          </button>
        </div>

        <button
          onClick={close}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
