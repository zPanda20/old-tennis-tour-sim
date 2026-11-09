/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, HistoricalRivalry } from '../types';

/**
 * Computes all head-to-head matchup records (rivalries) based on player records.
 * Returns them sorted by total matches played descending, then by intensity (closer H2H).
 */
export function getRivalries(allPlayers: Player[]): HistoricalRivalry[] {
  const rivalries: HistoricalRivalry[] = [];
  const len = allPlayers.length;

  for (let i = 0; i < len; i++) {
    const p1 = allPlayers[i];
    for (let j = i + 1; j < len; j++) {
      const p2 = allPlayers[j];

      const p1Wins = p1.h2h?.[p2.id] || 0;
      const p2Wins = p2.h2h?.[p1.id] || 0;
      const total = p1Wins + p2Wins;

      if (total > 0) {
        rivalries.push({
          player1Id: p1.id,
          player1Name: p1.name,
          player1Nationality: p1.nationality,
          player2Id: p2.id,
          player2Name: p2.name,
          player2Nationality: p2.nationality,
          player1Wins: p1Wins,
          player2Wins: p2Wins,
          totalMatches: total
        });
      }
    }
  }

  // Sort by totalMatches descending.
  // In case of a tie, sort by intensity: closer differences in wins (making it more intense/even).
  rivalries.sort((a, b) => {
    if (b.totalMatches !== a.totalMatches) {
      return b.totalMatches - a.totalMatches;
    }
    const diffA = Math.abs(a.player1Wins - a.player2Wins);
    const diffB = Math.abs(b.player1Wins - b.player2Wins);
    return diffA - diffB; // closer record first
  });

  return rivalries;
}
