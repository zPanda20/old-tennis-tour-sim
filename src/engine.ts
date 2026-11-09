/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, Tournament, Match, Week, MatchScore, SurfaceType, WeatherType } from './types';
import { generateRookie, sortPlayersByRank } from './data';

/**
 * Calculates a player's surface-specific modifier to their ability.
 */
export function getSurfaceModifier(player: Player, surface: SurfaceType): number {
  const profile = player.surfaceProfile;
  if (profile.specializationType === 'Neutral' || profile.specializationTier === 'None') {
    return 0;
  }

  // Preferred surface bonus
  if (profile.specializationType === surface) {
    return 12; // Solid boost
  }

  // Non-preferred surface penalties
  const isSpecialist = profile.specializationTier === 'Specialist';
  
  if (profile.specializationType === 'Clay' && surface === 'Grass') {
    return isSpecialist ? -15 : -6; // Clay struggles heavily on Grass
  }
  if (profile.specializationType === 'Grass' && surface === 'Clay') {
    return isSpecialist ? -15 : -6; // Grass struggles heavily on Clay
  }
  if (profile.specializationType === 'Hard') {
    // Hard specs take minor debuffs on Clay/Grass
    return isSpecialist ? -8 : -3;
  }
  
  // Any other cross-play (e.g. Clay/Grass spec on Hard)
  return isSpecialist ? -8 : -3;
}

/**
 * Matches probability formula satisfying:
 *  - Primary: Base Ability (capped strictly: ranks 9 and 10 has 2-6 players, contender is 8, etc.)
 *  - Secondary: Form (0-100) and Fatigue (0-100)
 *  - An 8 rated player with 100 form is favored over a 0-form 9 or 10 player.
 *  - A 9/10 rated player with 0 form remains heavily favored against 5 or lower.
 *  - A 6 is a mild spoiler; a 7 has a solid chance.
 */
export function calculateEffectivePower(player: Player, surface: SurfaceType): number {
  const baseAbilityPower = player.baseAbility * 11;
  const surfaceMod = getSurfaceModifier(player, surface);
  const formMod = player.stats.form * 0.25;
  const fatigueMod = player.stats.fatigue * 0.30;

  return baseAbilityPower + surfaceMod + formMod - fatigueMod;
}

/**
 * Returns winning probability of player1 against player2
 */
export function getMatchProbability(p1Power: number, p2Power: number): number {
  const powerDiff = p1Power - p2Power;
  // Logistic function with tuning factor 22
  return 1 / (1 + Math.exp(-powerDiff / 22));
}

/**
 * Simulates a tennis set game-by-game.
 * Accumulates fatigue for players based on games played, weather, and endurance.
 * Hot/Extreme weather increases fatigue calculation penalties per game played.
 * Endurance (1-10) scales down these penalties.
 */
export function simulateTennisSet(
  p1: Player,
  p2: Player,
  surface: SurfaceType,
  weather: WeatherType,
  setIndex: number
): { p1Games: number; p2Games: number; totalGames: number } {
  let g1 = 0;
  let g2 = 0;
  let totalGames = g1 + g2;

  const p1Power = calculateEffectivePower(p1, surface);
  const p2Power = calculateEffectivePower(p2, surface);
  const p1Prob = getMatchProbability(p1Power, p2Power);

  // Play until someone wins 6 games by 2, or tiebreak at 6-6
  while (true) {
    if (g1 >= 6 && g1 - g2 >= 2) break;
    if (g2 >= 6 && g2 - g1 >= 2) break;
    if (g1 === 6 && g2 === 6) {
      let tbPoints1 = 0;
      let tbPoints2 = 0;
      
      // Simulate point-by-point tiebreak (first to 7, win by 2)
      while (true) {
        if (tbPoints1 >= 7 && tbPoints1 - tbPoints2 >= 2) {
          g1++;
          break;
        }
        if (tbPoints2 >= 7 && tbPoints2 - tbPoints1 >= 2) {
          g2++;
          break;
        }
        if (Math.random() < p1Prob) tbPoints1++; else tbPoints2++;
      }
      
      // Add tiebreak length as a fractional game equivalent for fatigue calculations
      const tbExtraFatigue = (tbPoints1 + tbPoints2) / 6; 
      totalGames += tbExtraFatigue; 
      
      break;
    }

    if (Math.random() < p1Prob) {
      g1++;
    } else {
      g2++;
    }
  }

  totalGames += g1 + g2;
  
  // Calculate fatigue impact per game played
  // Base fatigue: 0.15 per game
  const baseFatiguePerGame = 0.15;
  let weatherMult = 1.0;
  if (weather === 'Hot') {
    // Extreme heat creates a severe fatigue burden (2.5x standard)
    weatherMult = 2.5;
  } else if (weather === 'Windy') {
    weatherMult = 1.2;
  } else if (weather === 'Rain-Delayed') {
    weatherMult = 1.4;
  }

  // Pure Endurance (1-10) mitigation factor configured with exact tightened linear range formula:
  const p1EnduranceMitigation = 1.2 - (p1.endurance * 0.06);
  const p2EnduranceMitigation = 1.2 - (p2.endurance * 0.06);

  const p1FatigueIncrement = totalGames * baseFatiguePerGame * weatherMult * p1EnduranceMitigation;
  const p2FatigueIncrement = totalGames * baseFatiguePerGame * weatherMult * p2EnduranceMitigation;

  p1.stats.fatigue = Math.min(100, Math.max(0, p1.stats.fatigue + p1FatigueIncrement));
  p2.stats.fatigue = Math.min(100, Math.max(0, p2.stats.fatigue + p2FatigueIncrement));

  return { p1Games: g1, p2Games: g2, totalGames };
}

/**
 * Primary Match Engine Simulator
 */
export function simulateMatch(
  p1: Player,
  p2: Player,
  surface: SurfaceType,
  weather: WeatherType,
  format: '1-Set' | '3-Set' | '5-Set'
): MatchScore {
  const score: MatchScore = {
    player1Sets: 0,
    player2Sets: 0,
    player1Games: [],
    player2Games: []
  };

  const targetSets = format === '1-Set' ? 1 : format === '3-Set' ? 2 : 3;

  for (let s = 0; s < 5; s++) {
    if (score.player1Sets === targetSets || score.player2Sets === targetSets) {
      break;
    }

    const { p1Games, p2Games } = simulateTennisSet(p1, p2, surface, weather, s);
    score.player1Games.push([p1Games]);
    score.player2Games.push([p2Games]);

    if (p1Games > p2Games) {
      score.player1Sets++;
    } else {
      score.player2Sets++;
    }
  }

  // Stagger forms post-match: rank-and-gap-dependent scaling
  const p1Won = score.player1Sets > score.player2Sets;
  const winner = p1Won ? p1 : p2;
  const loser = p1Won ? p2 : p1;

  const winnerAbility = winner.baseAbility;
  const loserAbility = loser.baseAbility;
  const abilityDiff = winnerAbility - loserAbility;

  let winnerFormChange = 0;
  let loserFormChange = 0;

  if (abilityDiff <= -2) {
    // Shock Upset: Underdog (winner) beats Favorite (loser)
    winnerFormChange = 20 + Math.floor(Math.random() * 6); // +20 to +25
    loserFormChange = -(25 + Math.floor(Math.random() * 6)); // -25 to -30
  } else if (abilityDiff >= 2) {
    // Expected Win: Favorite beats Underdog
    if (winnerAbility >= 8 && loserAbility <= 5) {
      // Underdog Loss Modifier: heavily lower-ranked player loses to top favorite
      winnerFormChange = 1 + Math.floor(Math.random() * 2); // +1 to +2
      loserFormChange = 3; // Gains mental confidence (+3)
    } else {
      winnerFormChange = 1 + Math.floor(Math.random() * 2); // +1 to +2
      loserFormChange = -(1 + Math.floor(Math.random() * 2)); // -1 to -2
    }
  } else {
    // Even Contest: Similar ability levels (diff is -1, 0, or 1)
    winnerFormChange = 5;
    loserFormChange = 1;
  }

  winner.stats.form = Math.min(100, Math.max(0, winner.stats.form + winnerFormChange));
  loser.stats.form = Math.min(100, Math.max(0, loser.stats.form + loserFormChange));

  // Update head-to-head tracking
  if (!winner.h2h) winner.h2h = {};
  if (!loser.h2h) loser.h2h = {};
  winner.h2h[loser.id] = (winner.h2h[loser.id] || 0) + 1;

  return score;
}

/**
 * Weekly Enrollment Engine
 */
export function enrollPlayersForWeek(
  week: Week,
  allPlayers: Player[],
  prevWeek: Week | null,
  manualOverrideAll: boolean
): void {
  // Sort players to ensure rankings are correct
  sortPlayersByRank(allPlayers);

  // Total available slots in parallel tournaments of the week
  const totalSlots = week.tournaments.reduce((sum, t) => sum + t.drawSize, 0);
  const remainingWeeks = 44 - week.weekNumber; // 43 active play weeks

  // 1. Calculate each player's desire / forced check
  interface EnrollmentCandidate {
    player: Player;
    desireScore: number;
    isForced: boolean;
  }

  const candidates: EnrollmentCandidate[] = allPlayers.map((p) => {
    const eventsPlayed = p.stats.playedEvents;
    const needed = 26 - eventsPlayed;

    // Is current player retired?
    if (p.isRetired) {
      return { player: p, desireScore: -999999, isForced: false };
    }

    // If already played 26 events, strictly ineligible!
    if (needed <= 0) {
      return { player: p, desireScore: -999999, isForced: false };
    }

    // 26-Event Commitment Override Check:
    // If remaining weeks equals needed tournaments, they MUST play.
    const isForced = remainingWeeks === needed;

    if (isForced) {
      return { player: p, desireScore: 999999, isForced: true };
    }

    // If manual override is active, force players who have played the fewest events to play!
    if (manualOverrideAll) {
      return { player: p, desireScore: 500000 + (26 - eventsPlayed) * 1000 - p.stats.fatigue * 5, isForced: true };
    }

    // Standard AI decision matrix:
    let desireScore = 0;
    if (eventsPlayed < 20) {
      // Aggressively seek entries
      const neededForTarget = 20 - eventsPlayed;
      const urgency = neededForTarget / remainingWeeks;
      desireScore = urgency * 120 + 30; // High baseline desire
    } else {
      // Selective enrollment: 20 to 25 appearances
      // Look at their 20th best score
      let minBest20Score = 0;
      if (p.activeSeasonResults && p.activeSeasonResults.length >= 20) {
        const sorted = [...p.activeSeasonResults].sort((a, b) => b.pointsEarned - a.pointsEarned);
        minBest20Score = sorted[19]?.pointsEarned || 0;
      }
      
      // Evaluate if a deep run can realistically push out a lower score line
      desireScore = -30; // selective baseline
      
      // If they have high form (capacity to make a deep run)
      if (p.stats.form >= 75) {
        desireScore += 25;
      }
      // High ability players can expect deep runs
      if (p.baseAbility >= 8) {
        desireScore += 20;
      }
      // If their minimum score is low, they are more interested
      if (minBest20Score < 45) {
        desireScore += 30;
      } else if (minBest20Score < 150) {
        desireScore += 10;
      } else {
        desireScore -= 40;
      }
    }

    // Fatigue modifier - high fatigue reduces interest
    desireScore -= p.stats.fatigue * 0.8;

    // Form modifier
    if (p.stats.form < 30) {
      // Low form players might want to play Masters 250 "Form Farms" to recover form
      desireScore += 15;
    } else if (p.stats.form > 80) {
      // High form players want to play
      desireScore += 10;
    }

    // Surface modifiers
    const isGrassSwing = week.weekNumber >= 29 && week.weekNumber <= 34;
    const isClaySwing = (week.weekNumber >= 6 && week.weekNumber <= 10) || (week.weekNumber >= 20 && week.weekNumber <= 28);
    const surfaceType: SurfaceType = isGrassSwing ? 'Grass' : isClaySwing ? 'Clay' : 'Hard';

    if (p.surfaceProfile.specializationType === surfaceType) {
      desireScore += 20; // Prefers surface
    } else if (p.surfaceProfile.specializationType !== 'Neutral') {
      desireScore -= 10; // Avoids non-preferred
      
      // Surface Un-shunning Calendar Desperation Drag
      const calendarDesperationDrag = (week.weekNumber / 43) * 25; // Gradual boost up to +25 near end of season
      desireScore += calendarDesperationDrag;
    }

    // AI Look-Ahead Logic
    if (p.ranking <= 32) {
      // Top-Ranked Players (Ranks 1-32): Look ahead across full season calendar
      // Proactively decline minor events if deep-runs elevated fatigue right before mandatory GS/M1000
      const upcomingMajorEvent = [19, 28, 34, 43, 2, 4, 6, 11, 13, 15, 17, 20, 22, 24, 26, 29, 31, 35, 39].some(
        futureW => futureW > week.weekNumber && futureW <= week.weekNumber + 2
      );
      if (upcomingMajorEvent && p.stats.fatigue > 15) {
        desireScore -= 60; // Decline minor events / rest prior to Slams/M1000
      }
    } else {
      // Bottom-Ranked Players (Ranks 33-150): Horizon restricted to upcoming actual entry bubble eligibility
      // Prioritize playing to push into bubbles
      desireScore += 15;
    }

    // Tricky Vulture Trait Override / Prestige
    if (p.isTrickyVulture) {
      // Complete bypass prestige seeking
      if (p.surfaceProfile.specializationType === surfaceType) {
        desireScore += 35; // Strongly seek matching surface
      } else {
        desireScore -= 20; // Drop off-surface
      }
    } else {
      // Standard Prestige modifiers for non-vultures
      if (p.ranking <= 16) {
        // Top stars rest prior to Slams, but love Masters 1000s
        desireScore -= 5;
      }
    }

    return { player: p, desireScore, isForced };
  });

  // Filter out candidates with absolutely ineligible scores (i.e. already hit 20 events)
  const availableCandidates = candidates.filter(c => c.desireScore > -500000);

  // Sort candidates by desire score
  availableCandidates.sort((a, b) => b.desireScore - a.desireScore);

  // Take the highest S players to fill the slots
  const selectedCandidates = availableCandidates.slice(0, totalSlots);
  const selectedPlayers = selectedCandidates.map(c => c.player);

  // 2. Distribute the chosen players into the week's tournaments
  // We sort tournaments in the week by priority
  const tours = [...week.tournaments];
  
  // Custom week distributions:
  if (week.weekNumber === 1) {
    // Challenger 200 (64 Draw) - Bottom 64 players of the selected (all selected are assigned)
    const t = tours[0];
    t.entrants = selectedPlayers.map(p => p.id);
    selectedPlayers.forEach(p => p.stats.playedEvents++);
  } 
  else if (week.weekNumber === 18) {
    // Week 18: Challenger LCQ 150 (8 draw) and Challenger 100 (16 draw)
    // LCQ 150 MUST draw the bubble players:
    // "last 4 inside the bubble vs last 4 outside the bubble"
    // Cutoff is rank 128 (meaning 125, 126, 127, 128 as inside, 129, 130, 131, 132 as outside)
    const lcqTour = tours.find(t => t.tier === 'Challenger LCQ 150')!;
    const c100Tour = tours.find(t => t.tier === 'Challenger 100')!;

    // Find bubble players
    const bubbleIds = allPlayers
      .filter(p => !p.isRetired && p.ranking >= 125 && p.ranking <= 132)
      .map(p => p.id);

    // Let's force bubble guys into LCQ if available in selected, or just take the absolute ranks 125-132 directly!
    // Direct assignment to keep it realistic:
    const actualBubblePlayers = allPlayers.filter(p => p.ranking >= 125 && p.ranking <= 132 && !p.isRetired);
    const lcqEntranIds: string[] = [];

    actualBubblePlayers.forEach((p) => {
      // Ensure they don't exceed 26 events, if they do, we'll swap with standard player
      if (p.stats.playedEvents < 26) {
        lcqEntranIds.push(p.id);
        p.stats.playedEvents++;
      }
    });

    // Fallback if not enough bubble players (should always be 8)
    while (lcqEntranIds.length < 8) {
      // Find someone who is selected but not yet placed
      const fallback = selectedPlayers.find(sp => !lcqEntranIds.includes(sp.id));
      if (fallback) {
        lcqEntranIds.push(fallback.id);
        fallback.stats.playedEvents++;
      } else {
        break;
      }
    }

    lcqTour.entrants = lcqEntranIds;

    // Rest of selected go to Challenger 100
    const lcqSet = new Set(lcqEntranIds);
    const restC100 = selectedPlayers.filter(p => !lcqSet.has(p.id)).slice(0, 16);
    c100Tour.entrants = restC100.map(p => p.id);
    restC100.forEach(p => p.stats.playedEvents++);
  } 
  else if (week.weekNumber === 43) {
    const gsTour = tours.find(t => t.tier === 'Grand Slam')!;
    const c100Tour = tours.find(t => t.tier === 'Challenger 100')!;

    // Challenger 100 has a strict reverse rank priority invitation.
    // It takes the bottom 16 players from the selected 144.
    const sortedSelected = [...selectedPlayers].sort((a, b) => b.ranking - a.ranking);
    const c100Entrants = sortedSelected.slice(0, 16);
    const gsEntrants = sortedSelected.slice(16, 144);

    c100Tour.entrants = c100Entrants.map(p => p.id);
    c100Entrants.forEach(p => p.stats.playedEvents++);

    gsTour.entrants = gsEntrants.map(p => p.id);
    gsEntrants.forEach(p => p.stats.playedEvents++);
  } 
  else {
    // Standard Week Distribution:
    // Sort tournaments by tier hierarchy
    const tierOrder: Record<string, number> = {
      'Grand Slam': 1,
      'Masters 1000': 2,
      'Masters 500': 3,
      'Masters 250': 4,
      'Challenger 175': 5,
      'Challenger 125': 6,
      'Challenger 100': 7
    };
    tours.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

    let availablePlayers = [...selectedPlayers];

    tours.forEach((t) => {
      // Challenger 175 invites are restricted:
      // "restricted to players who failed to advance past the 2nd round of the preceding week's companion Masters 1000 event, plus any players ranked outside the top 64."
      if (t.tier === 'Challenger 175') {
        // Find eligible candidates in availablePlayers
        const eligibleIds = new Set<string>();
        
        // Let's analyze previous week's results
        if (prevWeek) {
          const prevM1000 = prevWeek.tournaments.find(x => x.tier === 'Masters 1000');
          if (prevM1000 && prevM1000.bracket) {
            const bracket = prevM1000.bracket;
            
            // Players exited in Rd 1 (RoundIndex 0) or Rd 2 (RoundIndex 1) are eligible
            // Let's trace losers of round 0 and round 1:
            const round0Losers = bracket[0]?.map(m => m.loserId).filter(id => id !== null) as string[] || [];
            const round1Losers = bracket[1]?.map(m => m.loserId).filter(id => id !== null) as string[] || [];
            
            round0Losers.forEach(id => eligibleIds.add(id));
            round1Losers.forEach(id => eligibleIds.add(id));
          }
        }

        // Filter availablePlayers: eligible or ranked outside top 64
        const candidatesForC175 = availablePlayers.filter((ap) => {
          return ap.ranking > 64 || eligibleIds.has(ap.id);
        });

        // Sort by desire/rank to fill Challenger 175
        candidatesForC175.sort((a, b) => b.ranking - a.ranking); // Prefer lower rank or standard reverse/needed
        const entrants = candidatesForC175.slice(0, t.drawSize);
        
        t.entrants = entrants.map(p => p.id);
        entrants.forEach(p => p.stats.playedEvents++);

        // Remove placed
        const placedIds = new Set(t.entrants);
        availablePlayers = availablePlayers.filter(ap => !placedIds.has(ap.id));
      } 
      // Challenger 100: reverse rank priority invitation.
      else if (t.tier === 'Challenger 100') {
        availablePlayers.sort((a, b) => b.ranking - a.ranking); // Lowest ranking first
        const entrants = availablePlayers.slice(0, t.drawSize);
        t.entrants = entrants.map(p => p.id);
        entrants.forEach(p => p.stats.playedEvents++);

        const placedIds = new Set(t.entrants);
        availablePlayers = availablePlayers.filter(ap => !placedIds.has(ap.id));
      } 
      // Standard Draw
      else {
        // Higher ranked players get into the higher tier tournaments
        // BUT if it's top-tier (GS, Masters 1000/500), Tricky Vulture players decline it if they can headline a smaller event on preferred surface
        const isTopTierMatch = ['Grand Slam', 'Masters 1000', 'Masters 500'].includes(t.tier);
        let candidatesForTour = [...availablePlayers];
        
        if (isTopTierMatch) {
          candidatesForTour = availablePlayers.filter((ap) => {
            if (ap.isTrickyVulture) {
              const hasSmallerPreferredEvent = tours.some(
                otherTour => 
                  ['Masters 250', 'Challenger 175', 'Challenger 125', 'Challenger 100'].includes(otherTour.tier) &&
                  otherTour.surface === ap.surfaceProfile.specializationType
              );
              if (hasSmallerPreferredEvent) {
                return false;
              }
            }
            return true;
          });
        }

        candidatesForTour.sort((a, b) => a.ranking - b.ranking); // Highest ranking first
        const entrants = candidatesForTour.slice(0, t.drawSize);
        t.entrants = entrants.map(p => p.id);
        entrants.forEach(p => p.stats.playedEvents++);

        const placedIds = new Set(t.entrants);
        availablePlayers = availablePlayers.filter(ap => !placedIds.has(ap.id));
      }
    });
  }

  // 3. Automatically fill in empty slots at any tournaments using standard alternate players
  const usedAlternateInWeek: Player[] = [];
  
  week.tournaments.forEach((t) => {
    const slotsNeeded = t.drawSize - t.entrants.length;
    if (slotsNeeded > 0) {
      // Find eligible alternates: not retired, playedEvents < 26, not already playing this week
      const eligibleAlternates = allPlayers.filter((p) => {
        return !p.isRetired && p.stats.playedEvents < 26 && !t.entrants.includes(p.id) && !usedAlternateInWeek.some(ua => ua.id === p.id);
      });
      
      // Sort eligible alternates: lowest fatigue first
      eligibleAlternates.sort((a, b) => {
        if (a.stats.fatigue !== b.stats.fatigue) {
          return a.stats.fatigue - b.stats.fatigue;
        }
        return b.baseAbility - a.baseAbility;
      });
      
      const alternateAdditions = eligibleAlternates.slice(0, slotsNeeded);
      alternateAdditions.forEach((alt) => {
        t.entrants.push(alt.id);
        alt.stats.playedEvents++;
        usedAlternateInWeek.push(alt);
      });
    }
  });

  // Calculate actual playing athletes (both standard & fillers) to compute rests correctly
  const actualPlayingIds = new Set<string>();
  week.tournaments.forEach((t) => {
    t.entrants.forEach(id => actualPlayingIds.add(id));
  });

  allPlayers.forEach((p) => {
    if (p.isRetired) return;
    if (!actualPlayingIds.has(p.id)) {
      // Rest reduces fatigue and stabilizes form
      const recovery = 25 + p.endurance * 2.5; // 27.5 to 50 fatigue recovered per week
      p.stats.fatigue = Math.max(0, p.stats.fatigue - recovery);
      p.stats.form = Math.max(10, p.stats.form - 5); // Drops form slightly when resting
    }
  });
}

/**
 * Generates match brackets for direct knockout draws.
 * Standard bracket drawing + seeding:
 * Seeds are separated to prevent early meetings.
 */
export function generateKnockoutBracket(tournament: Tournament, allPlayers: Player[]): void {
  const entrants = tournament.entrants.map(id => allPlayers.find(p => p.id === id)!);
  const size = tournament.drawSize;

  // Let's sort entrants by rank to figure out Seed positions
  entrants.sort((a, b) => a.ranking - b.ranking);

  const numRounds = Math.log2(size);
  const rounds: Match[][] = [];

  // Match list for Round 0 (e.g. 32 matches for 64 draw)
  const rd0Matches: Match[] = [];
  const half = size / 2;

  // Set up seed placements to avoid top seeds playing early
  // We construct a seeded line-up for Round 1
  const seededEntrants: Array<Player | null> = Array(size).fill(null);

  if (size === 128) {
    // Grand Slam has unique 3-Wave drawing matrix (handled separately!)
    return;
  }

  // Standard draw sizes: 8, 16, 32, 64
  // Let's distribute seeds: Seed 1 at top, Seed 2 at bottom, others spread out
  // Simple seed arrangement based on draw size
  const seedPostions: number[] = [];
  if (size === 64) {
    seedPostions.push(0, 63, 31, 32, 15, 48, 16, 47);
  } else if (size === 32) {
    seedPostions.push(0, 31, 15, 16, 7, 24, 8, 23);
  } else if (size === 16) {
    seedPostions.push(0, 15, 7, 8, 3, 12, 4, 11);
  } else {
    seedPostions.push(0, 7, 3, 4);
  }

  // Filter positions valid for current draw size
  const fittedPositions = seedPostions.filter(pos => pos < size);
  const numSeeds = Math.min(entrants.length, fittedPositions.length);
  const seeds = entrants.slice(0, numSeeds);
  const unseeded = entrants.slice(numSeeds);

  seeds.forEach((s, idx) => {
    if (idx < fittedPositions.length) {
      seededEntrants[fittedPositions[idx]] = s;
    }
  });

  // Shuffle unseeded list
  const shuffledUnseeded = [...unseeded].sort(() => Math.random() - 0.5);
  let unshufIdx = 0;

  for (let idx = 0; idx < size; idx++) {
    if (seededEntrants[idx] === null) {
      seededEntrants[idx] = shuffledUnseeded[unshufIdx] || null;
      unshufIdx++;
    }
  }

  // Create matches
  for (let m = 0; m < half; m++) {
    const p1 = seededEntrants[m * 2];
    const p2 = seededEntrants[m * 2 + 1];

    rd0Matches.push({
      id: `m-${tournament.id}-0-${m}`,
      tournamentId: tournament.id,
      roundIndex: 0,
      matchIndex: m,
      player1Id: p1 ? p1.id : null,
      player2Id: p2 ? p2.id : null,
      winnerId: null,
      loserId: null,
      score: null,
      isCompleted: false,
      isBye: p1 === null || p2 === null,
      gamesPlayed: 0
    });
  }
  rounds.push(rd0Matches);

  // Fill empty slot structures for subsequent rounds
  for (let r = 1; r < numRounds; r++) {
    const roundMatches: Match[] = [];
    const numMatches = size / Math.pow(2, r + 1);
    for (let m = 0; m < numMatches; m++) {
      roundMatches.push({
        id: `m-${tournament.id}-${r}-${m}`,
        tournamentId: tournament.id,
        roundIndex: r,
        matchIndex: m,
        player1Id: null,
        player2Id: null,
        winnerId: null,
        loserId: null,
        score: null,
        isCompleted: false,
        isBye: false,
        gamesPlayed: 0
      });
    }
    rounds.push(roundMatches);
  }

  tournament.bracket = rounds;
}

/**
 * Grand Slams Staggered Drawing Matrix (3 waves)
 *  - Wave 1: Bottom 64 qualified face off (ranks 65-128)
 *  - Wave 2: 32 Winners face ranks 33-64
 *  - Wave 3: 32 Winners enter main bracket against Top 32 seeds.
 */
export function generateGrandSlamBracket(tournament: Tournament, allPlayers: Player[]): void {
  const entrants = tournament.entrants.map(id => allPlayers.find(p => p.id === id)!);
  
  // Sort entrants by ranking
  entrants.sort((a, b) => a.ranking - b.ranking);

  // Let's divide entrants into waves based on ranking slices inside the tournament:
  // top 32 ranked are Seeds (ranks 1-32)
  // middle 32 ranked (ranks 33-64)
  // bottom 64 ranked (ranks 65-128)
  const wave3Seeds = entrants.slice(0, 32);
  const wave2Contenders = entrants.slice(32, 64);
  const wave1Competitors = entrants.slice(64, 128);

  const rounds: Match[][] = [];

  // Wave 1: 32 matches
  const wave1Matches: Match[] = [];
  const shuffledCompetitors = [...wave1Competitors].sort(() => Math.random() - 0.5);

  for (let m = 0; m < 32; m++) {
    wave1Matches.push({
      id: `m-${tournament.id}-wave1-${m}`,
      tournamentId: tournament.id,
      roundIndex: 0, // This is wave 1
      matchIndex: m,
      player1Id: shuffledCompetitors[m * 2].id,
      player2Id: shuffledCompetitors[m * 2 + 1].id,
      winnerId: null,
      loserId: null,
      score: null,
      isCompleted: false,
      isBye: false,
      gamesPlayed: 0
    });
  }
  rounds.push(wave1Matches);

  // Wave 2: 32 matches (winners vs wave2Contenders)
  const wave2Matches: Match[] = [];
  for (let m = 0; m < 32; m++) {
    wave2Matches.push({
      id: `m-${tournament.id}-wave2-${m}`,
      tournamentId: tournament.id,
      roundIndex: 1, // This is wave 2
      matchIndex: m,
      player1Id: null, // Will be Wave 1 winner
      player2Id: wave2Contenders[m].id, // Seeded contender (fixed)
      winnerId: null,
      loserId: null,
      score: null,
      isCompleted: false,
      isBye: false,
      gamesPlayed: 0
    });
  }
  rounds.push(wave2Matches);

  // Wave 3 Main Bracket (R64 through Final):
  // Round indices 2, 3, 4, 5, 6, 7
  // Round 2 (Main Rd of 64): 32 seeded players vs 32 wave 2 winners
  // To avoid Top 8 seed clashes before QF, place Seeds 1-8 distinctly in the 32 slots:
  // Replaces the 16-element array with a full 32-element spread
  const seedPlacements = [
    0, 31, 15, 16, 7, 24, 8, 23, 3, 28, 12, 19, 4, 27, 11, 20, 
    1, 30, 14, 17, 6, 25, 9, 22, 2, 29, 13, 18, 5, 26, 10, 21
  ];
  const wave3Matches: Match[] = [];

  for (let m = 0; m < 32; m++) {
    // Determine seed placement
    let seedId = null;
    const seedIdx = seedPlacements.indexOf(m);
    if (seedIdx !== -1 && seedIdx < wave3Seeds.length) {
      seedId = wave3Seeds[seedIdx].id;
    } else {
      // Find unused seed
      const seedIdsUsed = wave3Matches.map(wm => wm.player1Id).filter(id => id !== null);
      const remainingSeed = wave3Seeds.find(s => !seedIdsUsed.includes(s.id));
      if (remainingSeed) seedId = remainingSeed.id;
    }

    wave3Matches.push({
      id: `m-${tournament.id}-wave3-r3-${m}`,
      tournamentId: tournament.id,
      roundIndex: 2, // Main draw Round of 64
      matchIndex: m,
      player1Id: seedId,
      player2Id: null, // Will be Wave 2 winner
      winnerId: null,
      loserId: null,
      score: null,
      isCompleted: false,
      isBye: false,
      gamesPlayed: 0
    });
  }
  rounds.push(wave3Matches);

  // Main draw subsequent rounds:
  // Round 3 (R32): 16 matches
  // Round 4 (R16): 8 matches
  // Round 5 (QF): 4 matches
  // Round 6 (SF): 2 matches
  // Round 7 (Final): 1 match
  const mainDrawDrawSizes = [16, 8, 4, 2, 1];
  mainDrawDrawSizes.forEach((drawSize, index) => {
    const roundMatches: Match[] = [];
    const rIdx = index + 3; // 3, 4, ...
    for (let m = 0; m < drawSize; m++) {
      roundMatches.push({
        id: `m-${tournament.id}-r${rIdx}-${m}`,
        tournamentId: tournament.id,
        roundIndex: rIdx,
        matchIndex: m,
        player1Id: null,
        player2Id: null,
        winnerId: null,
        loserId: null,
        score: null,
        isCompleted: false,
        isBye: false,
        gamesPlayed: 0
      });
    }
    rounds.push(roundMatches);
  });

  tournament.bracket = rounds;
}

/**
 * Simulates a single round in a standard tournament.
 * If tournament has no bracket, it throws.
 */
export function simulateTournamentRound(
  tournament: Tournament,
  allPlayers: Player[],
  roundIndex: number
): string[] {
  const logs: string[] = [];
  if (!tournament.bracket) return logs;
  
  const round = tournament.bracket[roundIndex];
  if (!round) return logs;

  const surface = tournament.surface;
  const weather = tournament.weather;
  const format = tournament.matchFormat;

  const nextRound = tournament.bracket[roundIndex + 1];

  round.forEach((match, matchIdx) => {
    if (match.isCompleted) return;

    // Defensive auto-detect bypass for accidental walkovers / byes to prevent getting stuck
    if (!match.isBye && (!match.player1Id || !match.player2Id)) {
      if (!match.player1Id && !match.player2Id) {
        // Both are null: waiting for preceding matches to resolve
        return;
      }
      // Only one is null: convert to a bye for the remaining player
      match.isBye = true;
    }

    if (match.isBye) {
      match.winnerId = match.player1Id || match.player2Id;
      match.loserId = null;
      match.isCompleted = true;
      
      // Advance to next round
      if (nextRound) {
        const nextMatchIdx = Math.floor(matchIdx / 2);
        const nextMatch = nextRound[nextMatchIdx];
        if (matchIdx % 2 === 0) {
          nextMatch.player1Id = match.winnerId;
        } else {
          nextMatch.player2Id = match.winnerId;
        }
      }
      return;
    }

    const p1 = allPlayers.find(p => p.id === match.player1Id)!;
    const p2 = allPlayers.find(p => p.id === match.player2Id)!;

    if (!p1 || !p2) {
      // Incomplete match slots due to unresolved brackets
      return;
    }

    // Simulate match
    const score = simulateMatch(p1, p2, surface, weather, format);
    match.score = score;
    match.isCompleted = true;

    // Determine winner & loser
    const p1Won = score.player1Sets > score.player2Sets;
    match.winnerId = p1Won ? p1.id : p2.id;
    match.loserId = p1Won ? p2.id : p1.id;

    // Track match wins/losses
    const winner = p1Won ? p1 : p2;
    const loser = p1Won ? p2 : p1;
    winner.stats.matchWins++;
    loser.stats.matchLosses++;
    recordSurfaceMatchOutcome(winner, loser, surface);

    // Record total games played
    let games = 0;
    score.player1Games.forEach((gArray, sIdx) => {
      const g1 = gArray[0];
      const g2 = score.player2Games[sIdx][0];
      games += g1 + g2;
    });
    match.gamesPlayed = games;

    // Grand Slam record tracking (for ranking tie-breakers)
    const isGrandSlamMainDraw = tournament.tier === 'Grand Slam' && roundIndex >= 2;
    if (isGrandSlamMainDraw) {
      winner.stats.grandSlamWins++;
    }

    // Build log
    const setScoreStrings = score.player1Games.map((g, sIdx) => {
      return `${g[0]}-${score.player2Games[sIdx][0]}`;
    }).join(', ');
    
    logs.push(`${tournament.name} [R${roundIndex}]: ${winner.name} def. ${loser.name} ${score.player1Sets}-${score.player2Sets} (${setScoreStrings})`);

    // Advance to next round
    if (nextRound) {
      const nextMatchIdx = Math.floor(matchIdx / 2);
      const nextMatch = nextRound[nextMatchIdx];
      if (matchIdx % 2 === 0) {
        nextMatch.player1Id = match.winnerId;
      } else {
        nextMatch.player2Id = match.winnerId;
      }
    }
  });

  return logs;
}

/**
 * Handle Staggered Grand Slam Waves simulation
 */
export function simulateGrandSlamRound(
  tournament: Tournament,
  allPlayers: Player[],
  roundIndex: number,
  currentSeason: number
): string[] {
  const logs: string[] = [];
  if (!tournament.bracket) return logs;

  const round = tournament.bracket[roundIndex];
  if (!round) return logs;

  const surface = tournament.surface;
  const weather = tournament.weather;
  const format = tournament.matchFormat;

  if (roundIndex === 0) {
    // WAVE 1 Simulation
    round.forEach((match, matchIdx) => {
      const p1 = allPlayers.find(p => p.id === match.player1Id)!;
      const p2 = allPlayers.find(p => p.id === match.player2Id)!;

      const score = simulateMatch(p1, p2, surface, weather, format);
      match.score = score;
      match.isCompleted = true;

      const p1Won = score.player1Sets > score.player2Sets;
      match.winnerId = p1Won ? p1.id : p2.id;
      match.loserId = p1Won ? p2.id : p1.id;

      const winner = p1Won ? p1 : p2;
      const loser = p1Won ? p2 : p1;
      winner.stats.matchWins++;
      loser.stats.matchLosses++;
      recordSurfaceMatchOutcome(winner, loser, surface);

      // Award Points for Wave 1 Exits: 15 Pts
      addSeasonPoints(loser, tournament.id, 15);

      const setScores = score.player1Games.map((g, sIdx) => `${g[0]}-${score.player2Games[sIdx][0]}`).join(', ');
      logs.push(`${tournament.name} [Wave 1]: ${winner.name} def. ${loser.name} ${score.player1Sets}-${score.player2Sets} (${setScores})`);

      // Advance winner to Wave 2!
      // In Wave 2: there are 32 matches, each winner advances to player1Id of match Index `matchIdx`
      const nextRound = tournament.bracket[1];
      if (nextRound && nextRound[matchIdx]) {
        nextRound[matchIdx].player1Id = match.winnerId;
      }
    });

  } else if (roundIndex === 1) {
    // WAVE 2 Simulation
    round.forEach((match, matchIdx) => {
      const p1 = allPlayers.find(p => p.id === match.player1Id)!; // Wave 1 Winner
      const p2 = allPlayers.find(p => p.id === match.player2Id)!; // Ranked 33-64 player

      const score = simulateMatch(p1, p2, surface, weather, format);
      match.score = score;
      match.isCompleted = true;

      const p1Won = score.player1Sets > score.player2Sets;
      match.winnerId = p1Won ? p1.id : p2.id;
      match.loserId = p1Won ? p2.id : p1.id;

      const winner = p1Won ? p1 : p2;
      const loser = p1Won ? p2 : p1;
      winner.stats.matchWins++;
      loser.stats.matchLosses++;
      recordSurfaceMatchOutcome(winner, loser, surface);

      // Award Points for Wave 2 Exits: 30 Pts
      addSeasonPoints(loser, tournament.id, 30);

      const setScores = score.player1Games.map((g, sIdx) => `${g[0]}-${score.player2Games[sIdx][0]}`).join(', ');
      logs.push(`${tournament.name} [Wave 2]: ${winner.name} def. ${loser.name} ${score.player1Sets}-${score.player2Sets} (${setScores})`);

      // Advance winner to Wave 3 Main Draw!
      // Wave 3 (Roundindex 2) has 32 matches. Winner goes into player2Id of match index `matchIdx`
      const nextRound = tournament.bracket[2];
      if (nextRound && nextRound[matchIdx]) {
        nextRound[matchIdx].player2Id = match.winnerId;
      }
    });

  } else {
    // Main bracket rounds: Wave 3 Rd 1 (rIndex 2) up to Final (rIndex 7)
    const logsMain = simulateTournamentRound(tournament, allPlayers, roundIndex);
    logs.push(...logsMain);

    // If matches are completed and this is the final round (roundIndex 7)
    // Award the proper points:
    if (roundIndex === 7) {
      const finalMatch = round[0];
      if (finalMatch && finalMatch.isCompleted) {
        tournament.isCompleted = true;
        tournament.winnerId = finalMatch.winnerId;
        tournament.runnerUpId = finalMatch.loserId;

        const winner = allPlayers.find(p => p.id === finalMatch.winnerId)!;
        const runnerUp = allPlayers.find(p => p.id === finalMatch.loserId)!;

        addSeasonPoints(winner, tournament.id, 2000);
        addSeasonPoints(runnerUp, tournament.id, 1300);

        // Record Trophy
        winner.trophyCabinet.push({
          season: currentSeason || 1, // Store the actual active season
          tournamentName: tournament.name,
          tierString: tournament.tier,
          trophyUrl: tournament.trophyUrl
        });

        // Award points to losers of previous rounds
        // Round indices map to:
        // SF (Round 6, 2 matches) -> SF losers get 800
        // QF (Round 5, 4 matches) -> QF losers get 400
        // R16 (Round 4, 8 matches) -> R16 losers get 200
        // R32 (Round 3, 16 matches) -> R32 losers get 100
        // R64 (Round 2, 32 matches) -> R64 losers get 50
        const bracket = tournament.bracket;
        
        // Round 6 losers (SF):
        bracket[6].forEach(m => {
          const l = allPlayers.find(p => p.id === m.loserId);
          if (l) addSeasonPoints(l, tournament.id, 800);
        });
        
        // Round 5 losers (QF):
        bracket[5].forEach(m => {
          const l = allPlayers.find(p => p.id === m.loserId);
          if (l) addSeasonPoints(l, tournament.id, 400);
        });

        // Round 4 losers (R16):
        bracket[4].forEach(m => {
          const l = allPlayers.find(p => p.id === m.loserId);
          if (l) addSeasonPoints(l, tournament.id, 200);
        });

        // Round 3 losers (R32):
        bracket[3].forEach(m => {
          const l = allPlayers.find(p => p.id === m.loserId);
          if (l) addSeasonPoints(l, tournament.id, 100);
        });

        // Round 2 losers (R64):
        bracket[2].forEach(m => {
          const l = allPlayers.find(p => p.id === m.loserId);
          if (l) addSeasonPoints(l, tournament.id, 50);
        });
      }
    }
  }

  return logs;
}

/**
 * Distributes points upon completing a Standard Tournament
 */
export function distributeKnockoutPoints(tournament: Tournament, allPlayers: Player[], currentSeason: number): void {
  if (!tournament.bracket) return;

  const rounds = tournament.bracket;
  const numRounds = rounds.length;

  // Let's resolve the final round
  const finalRound = rounds[numRounds - 1];
  const finalMatch = finalRound[0];
  if (!finalMatch || !finalMatch.isCompleted) return;

  tournament.isCompleted = true;
  tournament.winnerId = finalMatch.winnerId;
  tournament.runnerUpId = finalMatch.loserId;

  const winner = allPlayers.find(p => p.id === finalMatch.winnerId)!;
  const runnerUp = allPlayers.find(p => p.id === finalMatch.loserId)!;

  winner.trophyCabinet.push({
    season: currentSeason,
    tournamentName: tournament.name,
    tierString: tournament.tier,
    trophyUrl: tournament.trophyUrl
  });

  // Distribute points based on relative tier
  // Points scheme configurations:
  const ptsAllocation: Record<string, { W: number; RU: number; SF: number; QF: number; R16?: number; R32?: number; R64?: number }> = {
    'Masters 1000': { W: 1000, RU: 600, SF: 360, QF: 180, R16: 90, R32: 45, R64: 10 },
    'Masters 500': { W: 500, RU: 300, SF: 180, QF: 90, R16: 45, R32: 10 },
    'Masters 250': { W: 250, RU: 150, SF: 90, QF: 45, R16: 10 },
    'Challenger 200': { W: 200, RU: 120, SF: 70, QF: 35, R16: 15, R32: 5, R64: 1 },
    'Challenger LCQ 150': { W: 150, RU: 90, SF: 45, QF: 10 },
    'Challenger 175': { W: 175, RU: 100, SF: 60, QF: 30, R16: 15, R32: 5 },
    'Challenger 125': { W: 125, RU: 75, SF: 45, QF: 20, R16: 5 },
    'Challenger 100': { W: 100, RU: 60, SF: 35, QF: 15, R16: 5 }
  };

  const scheme = ptsAllocation[tournament.tier];
  if (!scheme) return;

  // W
  addSeasonPoints(winner, tournament.id, scheme.W);
  // RU
  addSeasonPoints(runnerUp, tournament.id, scheme.RU);

  // Let's sweep rounds to give points to losers
  // Round indexing:
  // rounds[numRounds - 2] is SF (losers get SF pts)
  // rounds[numRounds - 3] is QF (losers get QF pts)
  // rounds[numRounds - 4] is R16 (losers get R16 pts)
  // rounds[numRounds - 5] is R32 (losers get R32 pts)
  // rounds[numRounds - 6] is R64 (losers get R64 pts)

  const reversedRounds = [...rounds].reverse(); // final, SF, QF, R16, R32, R64

  // SF losers: reversedRounds[1]
  if (reversedRounds[1]) {
    reversedRounds[1].forEach(m => {
      const p = allPlayers.find(x => x.id === m.loserId);
      if (p) addSeasonPoints(p, tournament.id, scheme.SF);
    });
  }

  // QF losers: reversedRounds[2]
  if (reversedRounds[2]) {
    reversedRounds[2].forEach(m => {
      const p = allPlayers.find(x => x.id === m.loserId);
      if (p) addSeasonPoints(p, tournament.id, scheme.QF);
    });
  }

  // R16 losers: reversedRounds[3]
  if (reversedRounds[3] && scheme.R16) {
    reversedRounds[3].forEach(m => {
      const p = allPlayers.find(x => x.id === m.loserId);
      if (p) addSeasonPoints(p, tournament.id, scheme.R16);
    });
  }

  // R32 losers: reversedRounds[4]
  if (reversedRounds[4] && scheme.R32) {
    reversedRounds[4].forEach(m => {
      const p = allPlayers.find(x => x.id === m.loserId);
      if (p) addSeasonPoints(p, tournament.id, scheme.R32);
    });
  }

  // R64 losers: reversedRounds[5]
  if (reversedRounds[5] && scheme.R64) {
    reversedRounds[5].forEach(m => {
      const p = allPlayers.find(x => x.id === m.loserId);
      if (p) addSeasonPoints(p, tournament.id, scheme.R64);
    });
  }
}

/**
 * End-of-Season Player Progression, Decay, and Rookie spawning logic.
 */
export function runEndOfSeasonProcessing(players: Player[], currentSeason: number, logCb: (s: string) => void): Player[] {
  logCb(`Processing End of Season ${currentSeason} upgrades & decays...`);
  
  // 1. Fully reset Form and Fatigue to 0
  players.forEach((p) => {
    p.prevSeasonPoints = p.points;
    p.historyPoints.push(p.points);
    p.historyRankings.push(p.ranking);
    p.activeSeasonResults = [];
    
    if (!p.historyMatchWins) p.historyMatchWins = [];
    if (!p.historyMatchLosses) p.historyMatchLosses = [];
    if (!p.historyTitlesCount) p.historyTitlesCount = [];
    
    p.historyMatchWins.push(p.stats.matchWins);
    p.historyMatchLosses.push(p.stats.matchLosses);
    
    const yearlyTitles = p.trophyCabinet.filter(t => t.season === currentSeason).length;
    p.historyTitlesCount.push(yearlyTitles);
    
    p.stats.form = 50; // Neutral starting form
    p.stats.fatigue = 0;
    p.stats.playedEvents = 0;
    p.stats.grandSlamWins = 0;
    p.age += 1;
    p.seasonsOnTour += 1;

    // Rookies from this season are no longer rookies in the next season
    p.isRookie = false;
  });

  // 2. Decide Retirements : Age > 35 forces retirement, otherwise older players have a realistic chance.
  players.forEach((p, idx) => {
    if (p.age > 35) {
      p.isRetired = true;
      logCb(`🕊️ RETIREMENT: ${p.name} (Age ${p.age}, Rank #${p.ranking}) has reached the tour age limit (>35) and retired!`);
    } else if (p.age > 31) {
      // Retirement chance increases with age, mitigated slightly by high longevity
      const ageDiff = p.age - 31;
      let retireChance = ageDiff * 0.15; // Age 32: 15%, Age 35: 60%
      
      // Longevity stat reduces retirement chance
      retireChance -= p.longevity * 0.015;

      if (Math.random() < retireChance) {
        p.isRetired = true;
        logCb(`🕊️ RETIREMENT: ${p.name} (Age ${p.age}, Rank #${p.ranking}) has retired from the Tour!`);
      }
    }
  });

  // 3. Player Progression / Decay Loop
  players.forEach((p) => {
    if (p.isRetired) return;

    // Progression: Under 26
    if (p.age < 26) {
      const isPerformingWell = p.stats.matchWins > p.stats.matchLosses || p.stats.matchWins >= 12 || p.trophyCabinet.some(t => t.season === currentSeason);
      
      if (isPerformingWell) {
        // Potential (1-10) scales growth probability. Performing well gives a massive extra boost.
        const baseGrowthChance = p.potential * 0.12;
        const performanceBonus = Math.max(0.1, p.stats.matchWins / 25) * 0.15;
        const overallGrowthChance = baseGrowthChance + performanceBonus;

        // Roll for overall state evolution
        if (Math.random() < overallGrowthChance) {
          // Gaining Ability
          if (p.baseAbility < 8) {
            p.baseAbility++;
            logCb(`⭐ PROGRESSION: ${p.name} (Age ${p.age}) performed exceptionally and boosted base ability to ${p.baseAbility}!`);
          } else if (p.baseAbility === 8) {
            // Progress to 9 (Superstar)
            const current9and10Count = players.filter(x => !x.isRetired && x.baseAbility >= 9).length;
            if (current9and10Count < 6) {
              p.baseAbility++;
              logCb(`✨ SUPERSTAR EMERGENCE: ${p.name} (Age ${p.age}) has broken through to Elite status (Ability ${p.baseAbility})!`);
            }
          } else if (p.baseAbility === 9) {
            // Progress to 10 (Legend)
            const current10Count = players.filter(x => !x.isRetired && x.baseAbility === 10).length;
            if (current10Count < 3) {
              p.baseAbility++;
              logCb(`👑 GOD MODE UNLOCKED: ${p.name} (Age ${p.age}) reached full legend level (Ability 10)!`);
            }
          }

          // Chance to grow physical endurance
          if (p.endurance < 10 && Math.random() < 0.4) {
            p.endurance++;
            logCb(`🔋 ENDURANCE BOOST: ${p.name}'s stamina endurance improved to ${p.endurance} / 10.`);
          }

          // Chance to grow career longevity
          if (p.longevity < 10 && Math.random() < 0.3) {
            p.longevity++;
            logCb(`🧬 CAREER SHIELD: ${p.name}'s longevity resistance improved to ${p.longevity} / 10.`);
          }
        }
      } else {
        // If young but struggling, they can still grow, but at a heavily reduced rate
        const growthRoll = Math.random();
        if (growthRoll < (p.potential * 0.04)) {
          if (p.baseAbility < 7) {
            p.baseAbility++;
            logCb(`⭐ GRADUAL DEVELOPMENT: ${p.name} (Age ${p.age}) gained experience and increased ability to ${p.baseAbility}.`);
          }
        }
      }
    } 
    // Decay: Past Age 29
    else if (p.age > 29) {
      // Longevity shields older players from rating decay.
      // If Longevity is 10, decay probability is near 0. If Longevity is 1, decay is very high.
      const decayBaseChance = (p.age - 29) * 0.12;
      const shield = p.longevity * 0.085;
      const decayChance = Math.max(0, decayBaseChance - shield);

      if (Math.random() < decayChance) {
        if (p.baseAbility > 3) {
          p.baseAbility--;
          logCb(`📉 AGE DECAY: Veteran ${p.name} (Age ${p.age}) saw their attributes decay to ${p.baseAbility}.`);
        }
        
        // Also a minor decay for secondary metrics like endurance to simulate wearing down
        if (p.endurance > 3 && Math.random() < 0.35) {
          p.endurance--;
          logCb(`📉 STAMINA DRAIN: Veteran ${p.name}'s endurance faded to ${p.endurance}.`);
        }
      }
    }
  });

  // Remove retired players from the active roster
  let activeRoster = players.filter(p => !p.isRetired);

  // 4. Spawn Rookies to maintain 175 standard counts
  const rookiesNeeded = Math.max(0, 175 - activeRoster.length);

  if (rookiesNeeded > 0) {
    logCb(`Generating ${rookiesNeeded} fresh junior rookies to kick off Season ${currentSeason + 1}...`);
    for (let k = 0; k < rookiesNeeded; k++) {
      const freshRookie = generateRookie(`p-rookie-s${currentSeason + 1}-${k}`, false);
      activeRoster.push(freshRookie);
      logCb(`🌱 NEW PRODIGY: ${freshRookie.name} (${freshRookie.nationality}, Age 18, ${freshRookie.surfaceProfile.specializationType} Spec) enters the professional tour.`);
    }
  }

  // Reset rolling tour points slightly for next season balancing
  // All players points are soft reset: keep 30% of previous season points to avoid absolute start overlap, plus a small noise
  activeRoster.forEach((p) => {
    // If they are a rookie, keep their starting low points.
    if (!p.isRookie) {
      p.points = Math.floor(p.points * 0.25) + 100 + Math.floor(Math.random() * 200);
    }
    // Set match ratios back
    p.stats.matchWins = 0;
    p.stats.matchLosses = 0;
  });

  // Re-sort
  sortPlayersByRank(activeRoster);

  return activeRoster;
}

export function recordSurfaceMatchOutcome(winner: Player, loser: Player, surface: SurfaceType) {
  if (!winner.surfaceStats) {
    winner.surfaceStats = { hardWins: 0, hardLosses: 0, clayWins: 0, clayLosses: 0, grassWins: 0, grassLosses: 0 };
  }
  if (!loser.surfaceStats) {
    loser.surfaceStats = { hardWins: 0, hardLosses: 0, clayWins: 0, clayLosses: 0, grassWins: 0, grassLosses: 0 };
  }
  
  if (surface === 'Hard') {
    winner.surfaceStats.hardWins++;
    loser.surfaceStats.hardLosses++;
  } else if (surface === 'Clay') {
    winner.surfaceStats.clayWins++;
    loser.surfaceStats.clayLosses++;
  } else if (surface === 'Grass') {
    winner.surfaceStats.grassWins++;
    loser.surfaceStats.grassLosses++;
  }
}

/**
 * Recalculates rolling points for a player using their Best 20 results in the active season,
 * plus a decaying portion of their starting season points to ensure smooth early seasonal transitions.
 */
export function recalculateRollingPoints(player: Player): void {
  if (!player.activeSeasonResults) {
    player.activeSeasonResults = [];
  }
  const sorted = [...player.activeSeasonResults].sort((a, b) => b.pointsEarned - a.pointsEarned);
  const top20 = sorted.slice(0, 20);
  const sum = top20.reduce((acc, curr) => acc + curr.pointsEarned, 0);
  
  const eventsPlayed = player.stats.playedEvents;
  const initialPoints = player.prevSeasonPoints || 0;
  const decayFactor = Math.max(0, 1 - (eventsPlayed / 20));
  const startingBase = Math.floor(initialPoints * 0.25) + 200;
  player.points = sum + Math.floor(startingBase * decayFactor);
}

export function addSeasonPoints(player: Player, tournamentId: string, points: number): void {
  if (!player.activeSeasonResults) {
    player.activeSeasonResults = [];
  }
  const existing = player.activeSeasonResults.find(r => r.tournamentId === tournamentId);
  if (existing) {
    existing.pointsEarned = points;
  } else {
    player.activeSeasonResults.push({ tournamentId, pointsEarned: points });
  }
  recalculateRollingPoints(player);
}

