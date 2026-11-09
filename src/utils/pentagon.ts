/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player } from '../types';

export function hasCompletedPentagon(player: Player): boolean {
  if (!player || !player.trophyCabinet) return false;

  let wonMelbourne = false;
  let wonParis = false;
  let wonLondon = false;
  let wonNewYork = false;
  let wonSeasonChampion = false;

  player.trophyCabinet.forEach(t => {
    const name = t.tournamentName.toLowerCase();
    const tier = t.tierString || '';
    
    // Check Melbourne / Lion City (Hard court slam)
    if (name.includes('melbourne') || name.includes('shakedown') || name.includes('lion city') || name.includes('singapore')) {
      wonMelbourne = true;
    }
    // Check Paris / La Terre Rouge (Clay court slam)
    if (name.includes('paris') || name.includes('sands') || name.includes('clay slam') || name.includes('garros') || name.includes('rouge') || name.includes('terre')) {
      wonParis = true;
    }
    // Check London / The Crown (Grass court slam)
    if (name.includes('london') || name.includes('herbaceous') || name.includes('grass slam') || name.includes('the crown')) {
      wonLondon = true;
    }
    // Check New York / The Empire (Hard court slam)
    if (name.includes('new york') || name.includes('concrete') || name.includes('hardcourt slam') || name.includes('empire') || name.includes('topaz')) {
      wonNewYork = true;
    }

    // Check Season Champion (Year-End World No. 1) award
    if (
      tier === 'Season Champion' || 
      name.includes('year-end world') || 
      name.includes('year-end no. 1') || 
      name.includes('season champion')
    ) {
      wonSeasonChampion = true;
    }
  });

  // Fallback: check if the player's history contains a #1 rank finish or if their current rank is #1 on tour with seasonsOnTour > 0
  if (player.historyRankings && player.historyRankings.some(r => r === 1)) {
    wonSeasonChampion = true;
  }

  return wonMelbourne && wonParis && wonLondon && wonNewYork && wonSeasonChampion;
}
