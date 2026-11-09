/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Player, Week, Tournament, Match, TourState, GymProfile, SeasonHistoryEntry } from './types';
import { generateInitialRoster, generateCalendar, sortPlayersByRank } from './data';
import { enrollPlayersForWeek, generateKnockoutBracket, generateGrandSlamBracket, simulateTournamentRound, simulateGrandSlamRound, distributeKnockoutPoints, runEndOfSeasonProcessing } from './engine';
import { hasCompletedPentagon } from './utils/pentagon';
import { getRivalries } from './utils/rivalry';
import TourDashboard, { getFlagEmoji } from './components/TourDashboard';
import CalendarView from './components/CalendarView';
import PlayerProfile from './components/PlayerProfile';
import GameStats from './components/GameStats';
import DatabaseControl from './components/DatabaseControl';
import SeasonHistory from './components/SeasonHistory';
import { Trophy, Calendar as CalendarIcon, User, BarChart3, ShieldCheck, Database, Eye, History } from 'lucide-react';

/**
 * Scans a finished or active week and finds the match that resulted in the highest rank difference upset.
 * Higher ranking number in tennis corresponds to a lower tier player (e.g., #100 is worse than #2).
 */
function findWeeklyUpset(week: Week, playersList: Player[]): any {
  let maxUpset: any = null;
  if (!week || !week.tournaments) return null;

  week.tournaments.forEach(t => {
    if (!t.bracket) return;
    t.bracket.forEach((round, rIdx) => {
      let roundName = `Round ${rIdx + 1}`;
      if (t.tier === 'Grand Slam') {
        if (rIdx === 0) roundName = 'Wave 1 (Rranks 65-128)';
        else if (rIdx === 1) roundName = 'Wave 2 (Qualifiers vs Seeds)';
        else if (rIdx === 2) roundName = 'Wave 3 (R64 Seeds Entrada)';
        else if (rIdx === 3) roundName = 'Round of 32';
        else if (rIdx === 4) roundName = 'Round of 16';
        else if (rIdx === 5) roundName = 'Quarterfinals';
        else if (rIdx === 6) roundName = 'Semifinals';
        else if (rIdx === 7) roundName = 'Championship Final';
      } else {
        const remainingRounds = t.bracket.length - 1 - rIdx;
        if (remainingRounds === 0) roundName = 'Championship Final';
        else if (remainingRounds === 1) roundName = 'Semifinals';
        else if (remainingRounds === 2) roundName = 'Quarterfinals';
        else if (remainingRounds === 3) roundName = 'Round of 16';
      }

      round.forEach(m => {
        if (!m.isCompleted || !m.winnerId || !m.loserId) return;
        const winner = playersList.find(p => p.id === m.winnerId);
        const loser = playersList.find(p => p.id === m.loserId);
        if (winner && loser) {
          const wRank = winner.ranking;
          const lRank = loser.ranking;
          // In tennis rankings, lower value is better (e.g. #1 > #50)
          // Therefore, an upset is when the winner ranking is GREATER than the loser ranking.
          if (wRank > lRank) {
            const variance = wRank - lRank;
            if (!maxUpset || variance > maxUpset.variance) {
              let scoreOutput = 'Unknown';
              if (m.score) {
                scoreOutput = m.score.player1Games.map((g, sIdx) => `${g[0]}-${m.score.player2Games[sIdx][0]}`).join(', ');
              }
              maxUpset = {
                winnerName: winner.name,
                winnerRank: wRank,
                winnerId: winner.id,
                loserName: loser.name,
                loserRank: lRank,
                loserId: loser.id,
                score: scoreOutput,
                roundName,
                tournamentName: t.name,
                variance
              };
            }
          }
        }
      });
    });
  });
  return maxUpset;
}

export default function App() {
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0); // 0 is Week 1, 42 is Week 43
  const [players, setPlayers] = useState<Player[]>([]);
  const [calendar, setCalendar] = useState<Week[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'rankings' | 'calendar' | 'profile' | 'analytics' | 'database' | 'history'>('calendar');
  const [noAudio, setNoAudio] = useState(true); // Always force true as per prompt
  const [manualOverrideAll, setManualOverrideAll] = useState(false);
  const [endOfYearTrophyUrl, setEndOfYearTrophyUrl] = useState<string>('');

  const [retiredPlayers, setRetiredPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem('tennis_retired_players');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [ceremonyData, setCeremonyData] = useState<{
    seasonNumber: number;
    champion?: Player;
    melbourneWinner?: Player;
    parisWinner?: Player;
    londonWinner?: Player;
    nyWinner?: Player;
  } | null>(null);

  // Save retiredPlayers on change
  useEffect(() => {
    try {
      localStorage.setItem('tennis_retired_players', JSON.stringify(retiredPlayers));
    } catch {}
  }, [retiredPlayers]);
  const [seasonHistory, setSeasonHistory] = useState<SeasonHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('tennis_season_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [gyms, setGyms] = useState<GymProfile[]>([
    { id: 'zera', suffix: '-zera', name: 'Zera High Performance Gym', foundedYear: 2014, location: 'Nice, France', color: 'sky', logoUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&auto=format&fit=crop' },
    { id: 'cold', suffix: '-cold', name: 'Cold Precision Tactical Camp', foundedYear: 2016, location: 'Zürich, Switzerland', color: 'blue', logoUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&auto=format&fit=crop' },
    { id: 'fury', suffix: '-fury', name: 'Fury Agility Training Academy', foundedYear: 2011, location: 'Bradenton, FL, USA', color: 'orange', logoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop' },
    { id: 'zone', suffix: '-zone', name: 'Zone Deep State Center', foundedYear: 2019, location: 'Alicante, Spain', color: 'indigo', logoUrl: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=200&auto=format&fit=crop' },
    { id: 'edge', suffix: '-edge', name: 'Edge Hardcourt Lab', foundedYear: 2018, location: 'Tokyo, Japan', color: 'emerald', logoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop' },
    { id: 'apex', suffix: '-apex', name: 'Apex Championship Club', foundedYear: 2010, location: 'London, UK', color: 'amber', logoUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=200&auto=format&fit=crop' },
  ]);

  // Save seasonHistory on changes
  useEffect(() => {
    try {
      localStorage.setItem('tennis_season_history', JSON.stringify(seasonHistory));
    } catch (e) {
      console.error(e);
    }
  }, [seasonHistory]);

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    if (updatedPlayer.isRetired) {
      setRetiredPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
    } else {
      const updatedPlayers = players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
      sortPlayersByRank(updatedPlayers);
      setPlayers(updatedPlayers);
    }
  };

  const handleUpdateTournament = (weekNumber: number, tournamentId: string, updatedFields: Partial<Tournament>) => {
    const updatedCalendar = calendar.map(week => {
      if (week.weekNumber === weekNumber) {
        return {
          ...week,
          tournaments: week.tournaments.map(t => {
            if (t.id === tournamentId) {
              return { ...t, ...updatedFields };
            }
            return t;
          })
        };
      }
      return week;
    });
    setCalendar(updatedCalendar);
  };

  const handleUpdateWeekName = (weekNumber: number, newName: string) => {
    const updatedCalendar = calendar.map(week => {
      if (week.weekNumber === weekNumber) {
        return {
          ...week,
          name: newName
        };
      }
      return week;
    });
    setCalendar(updatedCalendar);
  };

  // Initialize roster and calendar on mount
  useEffect(() => {
    const initialRoster = generateInitialRoster();
    const cleanCalendar = generateCalendar();
    
    // Enroll players for Week 1
    const week1 = cleanCalendar[0];
    enrollPlayersForWeek(week1, initialRoster, null, false);
    
    // Generate bracket for Challenger 200 (64 draw)
    generateKnockoutBracket(week1.tournaments[0], initialRoster);

    setPlayers(initialRoster);
    setCalendar(cleanCalendar);
    setSimulationLog([
      `🎙️ Welcome to the Tennis Tour Simulator!`,
      `✓ Roster generated: 150 professional athletes registered.`,
      `✓ Strict Elite Cap: strictly 4 superstars created with rating 9 & 10.`,
      `✓ Week 1 tournament structured. Bottom 64 players drawn to shakedown early rank standings!`
    ]);
  }, []);

  const currentWeek = calendar[currentWeekIndex];

  // --- Auto-Simulation Core Setup ---
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [autoSimSpeed, setAutoSimSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [autoSimTarget, setAutoSimTarget] = useState<string>('end_season');
  const [autoSimStartingSeason, setAutoSimStartingSeason] = useState<number>(1);
  const [autoSimStats, setAutoSimStats] = useState({
    weeksSimulated: 0,
    seasonsSimulated: 0,
    targetSeasonEnd: 0
  });

  const [isFastSimulationMode, setIsFastSimulationMode] = useState(false);
  const isFastSimulationModeRef = useRef(isFastSimulationMode);

  useEffect(() => {
    isFastSimulationModeRef.current = isFastSimulationMode;
  }, [isFastSimulationMode]);

  const [lastWeekResults, setLastWeekResults] = useState<{
    weekNumber: number;
    name: string;
    tournamentWinners: Array<{ tournamentName: string; winnerName: string; runnerUpName: string }>;
    biggestUpset?: {
      winnerName: string;
      winnerRank: number;
      winnerId: string;
      loserName: string;
      loserRank: number;
      loserId: string;
      score: string;
      roundName: string;
      tournamentName: string;
      variance: number;
    } | null;
  } | null>(null);

  const isAutoSimulatingRef = useRef(false);
  const autoSimTimerRef = useRef<any>(null);
  const autoSimSpeedRef = useRef(autoSimSpeed);
  const autoSimTargetRef = useRef(autoSimTarget);

  // Auto-hide season award ceremony in auto simulation
  useEffect(() => {
    if (ceremonyData && isAutoSimulating) {
      const timer = setTimeout(() => {
        setCeremonyData(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [ceremonyData, isAutoSimulating]);

  useEffect(() => {
    autoSimSpeedRef.current = autoSimSpeed;
  }, [autoSimSpeed]);

  useEffect(() => {
    autoSimTargetRef.current = autoSimTarget;
  }, [autoSimTarget]);

  const calendarRef = useRef(calendar);
  const currentWeekIndexRef = useRef(currentWeekIndex);
  const playersRef = useRef(players);
  const currentSeasonRef = useRef(currentSeason);
  const autoSimStartWeekIndexRef = useRef<number>(-1);

  useEffect(() => { calendarRef.current = calendar; }, [calendar]);
  useEffect(() => { currentWeekIndexRef.current = currentWeekIndex; }, [currentWeekIndex]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { currentSeasonRef.current = currentSeason; }, [currentSeason]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (autoSimTimerRef.current) {
        clearTimeout(autoSimTimerRef.current);
      }
    };
  }, []);

  const runAutoSimCycle = () => {
    if (!isAutoSimulatingRef.current) return;

    const currentWeekIndex = currentWeekIndexRef.current;
    const curCalendar = calendarRef.current;
    const currentWeekObj = curCalendar[currentWeekIndex];
    if (!currentWeekObj) return;
    
    const season = currentSeasonRef.current;

    // A. Check if starting a Grand Slam week while in next_gs target
    const target = autoSimTargetRef.current;
    if (target === 'next_gs') {
      const containsGS = currentWeekObj.tournaments.some(t => t.tier === 'Grand Slam');
      if (containsGS && currentWeekIndex !== autoSimStartWeekIndexRef.current) {
        // Halt if no rounds have been simulated yet in this Grand Slam week
        const isFreshGS = currentWeekObj.tournaments.every(t => 
          !t.bracket || t.bracket.every(round => round.every(m => !m.isCompleted))
        );
        if (isFreshGS) {
          setIsAutoSimulating(false);
          isAutoSimulatingRef.current = false;
          setSimulationLog(prev => [
            ...prev,
            `🏁 AUTO-SIMULATION PAUSED: Arrived at Grand Slam week (${currentWeekObj.name})! Halted matches so you can manage your roster or play manually.`
          ]);
          return;
        }
      }
    }

    // B. If currently active week is NOT completed, simulate one round
    if (!currentWeekObj.isCompleted) {
      handleSimulateRound();
      const speed = autoSimSpeedRef.current;
      const delay = isFastSimulationModeRef.current ? 0 : (speed === 'slow' ? 1500 : speed === 'normal' ? 750 : 150);
      autoSimTimerRef.current = setTimeout(runAutoSimCycle, delay);
      return;
    }

    // C. If active week is completed, advance or halt based on target
    if (currentWeekObj.isCompleted) {
      setAutoSimStats(prev => ({
        ...prev,
        weeksSimulated: prev.weeksSimulated + 1
      }));

      // Determine stopping criteria
      let shouldStop = false;
      let stopReason = '';

      if (target === 'next_gs') {
        if (currentWeekIndex < 42) {
          const nextWeek = curCalendar[currentWeekIndex + 1];
          const hasGS = nextWeek?.tournaments.some(t => t.tier === 'Grand Slam');
          if (hasGS) {
            shouldStop = true;
            stopReason = `The next week (${nextWeek.name}) is a Grand Slam tournament.`;
          }
        } else {
          shouldStop = true;
          stopReason = 'End of the season has been reached.';
        }
      } else if (target === 'end_season') {
        if (currentWeekIndex >= 42) {
          shouldStop = true;
          stopReason = 'The season has completed.';
        }
      } else {
        const numSeasons = parseInt(target, 10);
        if (!isNaN(numSeasons)) {
          const startingSeasonVal = autoSimStartingSeason;
          const currentTargetSeasonEnd = startingSeasonVal + numSeasons - 1;
          if (season >= currentTargetSeasonEnd && currentWeekIndex >= 42) {
            shouldStop = true;
            stopReason = `Completed auto-simulation target of ${numSeasons} seasons.`;
          }
        }
      }

      if (shouldStop) {
        setIsAutoSimulating(false);
        isAutoSimulatingRef.current = false;
        setSimulationLog(prev => [
          ...prev,
          `🏁 AUTO-SIM TARGET COMPLETED: ${stopReason}`
        ]);
        return;
      }

      // If we are continuing, trigger the transition
      const speed = autoSimSpeedRef.current;
      const transitionDelay = isFastSimulationModeRef.current ? 0 : (speed === 'slow' ? 3000 : speed === 'normal' ? 1500 : 400);

      autoSimTimerRef.current = setTimeout(() => {
        if (!isAutoSimulatingRef.current) return;

        // Advance week or trigger end-of-season
        let cycleTimeout = isFastSimulationModeRef.current ? 0 : 150;
        if (currentWeekIndex < 42) {
          handleAdvanceWeek();
        } else {
          handleEndSeasonAndUpgrade();
          // Reset starting season reference to newly completed season, increment seasonsSimulated count
          setAutoSimStats(prev => ({
            ...prev,
            seasonsSimulated: prev.seasonsSimulated + 1
          }));
          cycleTimeout = isFastSimulationModeRef.current ? 50 : 5500; // Stall next cycle for 5.5 seconds during ceremony, or 50w for Fast mode
        }

        // Run the next round sim of the new week in next tick
        autoSimTimerRef.current = setTimeout(runAutoSimCycle, cycleTimeout);
      }, transitionDelay);
    }
  };

  const handleStartAutoSim = (speed: 'slow' | 'normal' | 'fast', target: string) => {
    setAutoSimSpeed(speed);
    setAutoSimTarget(target);
    setIsAutoSimulating(true);
    isAutoSimulatingRef.current = true;
    setAutoSimStartingSeason(currentSeason);
    autoSimStartWeekIndexRef.current = currentWeekIndex;

    let targetSeasonEndValue = currentSeason;
    const numSeasons = parseInt(target, 10);
    if (!isNaN(numSeasons)) {
      targetSeasonEndValue = currentSeason + numSeasons - 1;
    }

    setAutoSimStats({
      weeksSimulated: 0,
      seasonsSimulated: 0,
      targetSeasonEnd: targetSeasonEndValue
    });

    setSimulationLog(prev => [
      ...prev,
      `🤖 AUTO-SIM PROGRAM LAUNCHED: Stop criterion is set to ${target === 'next_gs' ? 'Next Grand Slam' : target === 'end_season' ? 'End of Season' : numSeasons + ' Seasons'}.`
    ]);

    setActiveTab('calendar');
    autoSimTimerRef.current = setTimeout(runAutoSimCycle, isFastSimulationModeRef.current ? 0 : 600);
  };

  const handleStopAutoSim = () => {
    setIsAutoSimulating(false);
    isAutoSimulatingRef.current = false;
    if (autoSimTimerRef.current) {
      clearTimeout(autoSimTimerRef.current);
      autoSimTimerRef.current = null;
    }
    setSimulationLog(prev => [
      ...prev,
      `⏸️ AUTO-SIMULATION STOPPED ON DEMAND: Complete match records and standing histories are maintained and safely stored.`
    ]);
  };

  // Manual/Backend override to dynamically force bubble guys or low-play players into quotas
  const handleForceCommitmentOverride = () => {
    if (!currentWeek || currentWeek.isCompleted) {
      setSimulationLog(prev => [
        ...prev, 
        `⚠️ Manual Override Denied: Please advance to a new active week before applying forces.`
      ]);
      return;
    }

    setManualOverrideAll(true);
    
    // Recheck enrollment for current week with manual overrides active
    const weekCopy = { ...currentWeek };
    const prevWeek = currentWeekIndex > 0 ? calendar[currentWeekIndex - 1] : null;
    
    // Reset entrants
    weekCopy.tournaments.forEach(t => t.entrants = []);
    
    // Re-enroll with overrides
    enrollPlayersForWeek(weekCopy, players, prevWeek, true);
    
    // Rebuild brackets
    weekCopy.tournaments.forEach((t) => {
      if (t.tier === 'Grand Slam') {
        generateGrandSlamBracket(t, players);
      } else {
        generateKnockoutBracket(t, players);
      }
    });

    const updatedCalendar = [...calendar];
    updatedCalendar[currentWeekIndex] = weekCopy;
    setCalendar(updatedCalendar);

    setSimulationLog(prev => [
      ...prev,
      `🚨 BACKEND MANUAL OVERRIDE ACTIVATED: All available players with matching vacancies are forced to enter active brackets!`
    ]);
  };

  // Simulate one round across all active tournaments of the week
  const handleSimulateRound = () => {
    const latWeekIdx = currentWeekIndexRef.current;
    const latCalendar = calendarRef.current;
    const latPlayers = playersRef.current;
    const curWeek = latCalendar[latWeekIdx];
    if (!curWeek || curWeek.isCompleted) return;

    let roundSimLogs: string[] = [];
    const updatedCalendar = [...latCalendar];
    const weekCopy = { ...curWeek };

    // Simulate for all tournaments in parallel
    weekCopy.tournaments.forEach((t) => {
      if (t.isCompleted) return;

      // Ensure bracket is built
      if (!t.bracket) {
        if (t.tier === 'Grand Slam') {
          generateGrandSlamBracket(t, latPlayers);
        } else {
          generateKnockoutBracket(t, latPlayers);
        }
      }

      // Find current active round
      let activeRdIdx = -1;
      for (let r = 0; r < t.bracket!.length; r++) {
        if (t.bracket![r].some(m => !m.isCompleted)) {
          activeRdIdx = r;
          break;
        }
      }

      if (activeRdIdx !== -1) {
        let logs: string[] = [];
        if (t.tier === 'Grand Slam') {
          logs = simulateGrandSlamRound(t, latPlayers, activeRdIdx, currentSeasonRef.current);
        } else {
          logs = simulateTournamentRound(t, latPlayers, activeRdIdx);
        }
        roundSimLogs.push(...logs);

        // Check if now complete
        const stillIncomplete = t.bracket![activeRdIdx].some(m => !m.isCompleted);
        const nextRound = t.bracket![activeRdIdx + 1];
        
        if (!stillIncomplete && !nextRound) {
          // This tournament is fully completed! Distribute points!
          if (t.tier !== 'Grand Slam') {
            distributeKnockoutPoints(t, latPlayers, currentSeasonRef.current);
          }
          t.isCompleted = true;

          // Record player tournament exits for a finished tournament
          const tName = t.name;
          const entrants = t.entrants || [];
          entrants.forEach(pId => {
            const p = latPlayers.find(x => x.id === pId);
            if (p) {
              if (!p.careerExits) {
                p.careerExits = {};
              }
              if (!p.careerExits[tName]) {
                p.careerExits[tName] = { wins: 0, finals: 0, semis: 0, quarters: 0, played: 0 };
              }
              const rec = p.careerExits[tName];
              rec.played += 1;
              if (t.winnerId === pId) {
                rec.wins += 1;
              } else if (t.runnerUpId === pId) {
                rec.finals += 1;
              } else if (t.bracket) {
                const numRounds = t.bracket.length;
                if (numRounds >= 2) {
                  const sfRound = t.bracket[numRounds - 2];
                  if (sfRound.some(m => m.loserId === pId)) {
                    rec.semis += 1;
                  }
                }
                if (numRounds >= 3) {
                  const qfRound = t.bracket[numRounds - 3];
                  if (qfRound.some(m => m.loserId === pId)) {
                    rec.quarters += 1;
                  }
                }
              }
            }
          });
        }
      }
    });

    // Check if the overall week is complete (all tournaments finished)
    const allFinished = weekCopy.tournaments.every(t => t.isCompleted);
    if (allFinished) {
      weekCopy.isCompleted = true;
      roundSimLogs.push(`🏁 Week ${weekCopy.weekNumber} has fully completed! Recalculating standing indices...`);
    }

    // Sort and update rankings
    const playersCopy = [...latPlayers];
    sortPlayersByRank(playersCopy);

    if (allFinished) {
      playersCopy.forEach((p, idx) => {
        if (!p.weeklyRankings) {
          p.weeklyRankings = [];
        }
        p.weeklyRankings.push(idx + 1);
      });
    }

    setPlayers(playersCopy);

    updatedCalendar[latWeekIdx] = weekCopy;
    setCalendar(updatedCalendar);
    setSimulationLog(prev => {
      const merged = [...prev, ...roundSimLogs];
      return merged.slice(-400);
    });
    setManualOverrideAll(false); // Reset override check

    // Set honour roll (lastWeekResults) immediately in real-time when week completes
    if (allFinished) {
      const tournamentWinners = weekCopy.tournaments.map(t => {
        const winner = playersCopy.find(p => p.id === t.winnerId);
        const runnerUp = playersCopy.find(p => p.id === t.runnerUpId);
        return {
          tournamentName: t.name,
          winnerName: winner ? winner.name : 'Unknown',
          runnerUpName: runnerUp ? runnerUp.name : 'Unknown'
        };
      });

      const biggestUpset = findWeeklyUpset(weekCopy, playersCopy);

      setLastWeekResults({
        weekNumber: weekCopy.weekNumber,
        name: weekCopy.name,
        tournamentWinners,
        biggestUpset
      });
    }
  };

  // Simulate full tournament week in a fast-forward loop
  const handleSimulateFullWeek = () => {
    if (!currentWeek || currentWeek.isCompleted) return;

    let iterations = 0;
    // For standard tournaments maximum rounds is 8 (Grand slams, Wave 1 through finals)
    while (!currentWeek.isCompleted && iterations < 12) {
      handleSimulateRound();
      iterations++;
    }
  };

  // Advance week Index
  const handleAdvanceWeek = () => {
    const latWeekIdx = currentWeekIndexRef.current;
    const latCalendar = calendarRef.current;
    const latPlayers = playersRef.current;
    const curWeek = latCalendar[latWeekIdx];
    if (!curWeek || !curWeek.isCompleted) return;

    if (latWeekIdx < 42) {
      const nextIdx = latWeekIdx + 1;
      const updatedCalendar = [...latCalendar];
      const nextWeek = updatedCalendar[nextIdx];

      // Enroll players for the new week
      enrollPlayersForWeek(nextWeek, latPlayers, curWeek, false);

      // Instantly generate brackets for the new week's tournaments
      nextWeek.tournaments.forEach((t) => {
        if (t.tier === 'Grand Slam') {
          generateGrandSlamBracket(t, latPlayers);
        } else {
          generateKnockoutBracket(t, latPlayers);
        }
      });

      setCurrentWeekIndex(nextIdx);
      setCalendar(updatedCalendar);
      setSimulationLog(prev => [
        ...prev,
        `🚀 ADVANCED PERIOD: Now entering Week ${nextWeek.weekNumber}. Invites accepted. Brackets drawn!`
      ]);
    }
  };

  // End of Season upgrades & transfers processing
  const handleEndSeasonAndUpgrade = () => {
    const latCalendar = calendarRef.current;
    const latPlayers = playersRef.current;
    const curSeason = currentSeasonRef.current;

    // 1. Gather final seasonal statistics, top ten, and major champions BEFORE reset
    const sortedFinalPlayers = [...latPlayers]
      .filter(p => !p.isRetired)
      .sort((a, b) => b.points - a.points);

    // Award the Year-End World No. 1 Trophy to the champion
    const seasonChamp = sortedFinalPlayers[0];
    if (seasonChamp) {
      if (!seasonChamp.trophyCabinet) {
        seasonChamp.trophyCabinet = [];
      }
      const alreadyHasIt = seasonChamp.trophyCabinet.some(t => t.season === curSeason && t.tierString === 'Season Champion');
      if (!alreadyHasIt) {
        seasonChamp.trophyCabinet.push({
          season: curSeason,
          tournamentName: "Year-End World No. 1 Trophy",
          tierString: "Season Champion"
        });
      }
    }

    // Gather Grand Slam winners
    const allSlamTournaments = latCalendar.flatMap(w => w.tournaments).filter(t => t.tier === 'Grand Slam' && t.isCompleted);
    const melbourneSlam = allSlamTournaments.find(t => t.name.toLowerCase().includes('melbourne') || t.name.toLowerCase().includes('shakedown'));
    const parisSlam = allSlamTournaments.find(t => t.name.toLowerCase().includes('paris') || t.name.toLowerCase().includes('sands'));
    const londonSlam = allSlamTournaments.find(t => t.name.toLowerCase().includes('london') || t.name.toLowerCase().includes('herbaceous'));
    const nySlam = allSlamTournaments.find(t => t.name.toLowerCase().includes('new york') || t.name.toLowerCase().includes('concrete'));

    const melbourneWinner = melbourneSlam ? latPlayers.find(p => p.id === melbourneSlam.winnerId) : undefined;
    const parisWinner = parisSlam ? latPlayers.find(p => p.id === parisSlam.winnerId) : undefined;
    const londonWinner = londonSlam ? latPlayers.find(p => p.id === londonSlam.winnerId) : undefined;
    const nyWinner = nySlam ? latPlayers.find(p => p.id === nySlam.winnerId) : undefined;

    setCeremonyData({
      seasonNumber: curSeason,
      champion: seasonChamp,
      melbourneWinner,
      parisWinner,
      londonWinner,
      nyWinner
    });

    const topTen = sortedFinalPlayers.slice(0, 10).map((p, idx) => ({
      id: p.id,
      name: p.name,
      nationality: p.nationality,
      ranking: idx + 1,
      points: p.points,
      stats: {
        matchWins: p.stats.matchWins,
        matchLosses: p.stats.matchLosses,
      },
      isFiller: p.isFiller
    }));

    const winners: any[] = [];
    latCalendar.forEach(w => {
      w.tournaments.forEach(t => {
        if (t.isCompleted && (t.tier === 'Grand Slam' || t.tier === 'Masters 1000' || t.tier === 'Masters 500')) {
          const winnerPlayer = latPlayers.find(p => p.id === t.winnerId);
          winners.push({
            tournamentId: t.id,
            tournamentName: t.name,
            tier: t.tier,
            winnerId: t.winnerId || 'unknown',
            winnerName: winnerPlayer ? winnerPlayer.name : (t.winnerId || 'Unknown'),
            winnerNationality: winnerPlayer ? winnerPlayer.nationality : 'SYS'
          });
        }
      });
    });

    const topThreeTrajectories = sortedFinalPlayers.slice(0, 3).map((p) => {
      let rankings = p.weeklyRankings ? [...p.weeklyRankings] : [];
      if (rankings.length === 0) {
        rankings = Array.from({ length: 43 }, (_, idx) => {
          const base = p.ranking || 1;
          const fluctuation = Math.sin(idx / 2) * 2;
          return Math.max(1, Math.round(base + fluctuation));
        });
      } else if (rankings.length < 43) {
        const lastVal = rankings[rankings.length - 1] || p.ranking || 1;
        while (rankings.length < 43) {
          rankings.push(lastVal);
        }
      }
      return {
        playerId: p.id,
        playerName: p.name,
        rankings: rankings
      };
    });

    const seasonRivalries = getRivalries([...latPlayers, ...retiredPlayers]).slice(0, 10);

    const newHistoryEntry: SeasonHistoryEntry = {
      seasonNumber: curSeason,
      topTen,
      winners,
      topThreeTrajectories,
      topRivalries: seasonRivalries
    };

    setSeasonHistory(prev => {
      // Avoid duplicate runs for the same season
      if (prev.some(entry => entry.seasonNumber === curSeason)) {
        return prev;
      }
      return [...prev, newHistoryEntry];
    });

    // 2. Perform attributes upgrades and ageings
    const updatedRoster = runEndOfSeasonProcessing(latPlayers, curSeason, (s) => {
      setSimulationLog(prev => [...prev, s]);
    });

    // Capture newly retired players to the retired list
    const newlyRetired = latPlayers.filter(p => p.isRetired);
    if (newlyRetired.length > 0) {
      setRetiredPlayers(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const filteredNew = newlyRetired.filter(p => !existingIds.has(p.id));
        return [...prev, ...filteredNew];
      });
    }

    // Rebuild fresh 43-week calendar schedule for new season
    const freshCalendar = generateCalendar();
    
    // Enroll for Week 1
    const week1 = freshCalendar[0];
    enrollPlayersForWeek(week1, updatedRoster, null, false);
    generateKnockoutBracket(week1.tournaments[0], updatedRoster);

    setPlayers(updatedRoster);
    setCalendar(freshCalendar);
    setCurrentWeekIndex(0);
    setCurrentSeason(prev => prev + 1);
    setActiveTab('rankings');

    setSimulationLog(prev => [
      ...prev,
      `🏆 SEASON ${curSeason + 1} HAS LAUNCHED! Check Dashboard to view rookie placements and upgraded skill sets. Final records for Season ${curSeason} have been safely written to the History tab!`
    ]);
  };

  const handleGenerateMockHistory = () => {
    // Generate static/representative results
    const roster = players.length > 0 ? players : generateInitialRoster();
    if (players.length === 0) {
      setPlayers(roster);
    }

    const mockSeason1Trajectories = [
      {
        playerId: roster[0].id,
        playerName: roster[0].name,
        rankings: Array.from({ length: 43 }, (_, i) => Math.max(1, Math.round(1 + Math.sin(i / 3) * 1.5 + (i < 10 ? 2 : 0))))
      },
      {
        playerId: roster[1].id,
        playerName: roster[1].name,
        rankings: Array.from({ length: 43 }, (_, i) => Math.max(1, Math.round(2 + Math.cos(i / 4) * 1.8 + (i < 15 ? 1 : 0))))
      },
      {
        playerId: roster[2].id,
        playerName: roster[2].name,
        rankings: Array.from({ length: 43 }, (_, i) => Math.max(1, Math.round(3 + Math.sin(i / 5 + 1) * 2.2)))
      }
    ];

    const p0 = roster[0];
    const p1 = roster[1];
    const p2 = roster[2];
    const p3 = roster[3];
    const p4 = roster[4];

    // Seed overall head-to-head records
    p0.h2h = { [p1.id]: 7, [p2.id]: 6, [p3.id]: 5, [p4.id]: 4 };
    p1.h2h = { [p0.id]: 5, [p2.id]: 4, [p3.id]: 6, [p4.id]: 5 };
    p2.h2h = { [p0.id]: 4, [p1.id]: 5, [p3.id]: 3, [p4.id]: 6 };
    p3.h2h = { [p0.id]: 3, [p1.id]: 4, [p2.id]: 5, [p4.id]: 4 };
    p4.h2h = { [p0.id]: 2, [p1.id]: 3, [p2.id]: 3, [p3.id]: 5 };

    const mockSeason1Rivalries = [
      {
        player1Id: p0.id, player1Name: p0.name, player1Nationality: p0.nationality,
        player2Id: p1.id, player2Name: p1.name, player2Nationality: p1.nationality,
        player1Wins: 4, player2Wins: 3, totalMatches: 7
      },
      {
        player1Id: p0.id, player1Name: p0.name, player1Nationality: p0.nationality,
        player2Id: p2.id, player2Name: p2.name, player2Nationality: p2.nationality,
        player1Wins: 3, player2Wins: 2, totalMatches: 5
      },
      {
        player1Id: p1.id, player1Name: p1.name, player1Nationality: p1.nationality,
        player2Id: p2.id, player2Name: p2.name, player2Nationality: p2.nationality,
        player1Wins: 2, player2Wins: 3, totalMatches: 5
      }
    ];

    const mockSeason2Rivalries = [
      {
        player1Id: p0.id, player1Name: p0.name, player1Nationality: p0.nationality,
        player2Id: p1.id, player2Name: p1.name, player2Nationality: p1.nationality,
        player1Wins: 7, player2Wins: 5, totalMatches: 12
      },
      {
        player1Id: p0.id, player1Name: p0.name, player1Nationality: p0.nationality,
        player2Id: p2.id, player2Name: p2.name, player2Nationality: p2.nationality,
        player1Wins: 6, player2Wins: 4, totalMatches: 10
      },
      {
        player1Id: p1.id, player1Name: p1.name, player1Nationality: p1.nationality,
        player2Id: p2.id, player2Name: p2.name, player2Nationality: p2.nationality,
        player1Wins: 4, player2Wins: 5, totalMatches: 9
      },
      {
        player1Id: p1.id, player1Name: p1.name, player1Nationality: p1.nationality,
        player2Id: p3.id, player2Name: p3.name, player2Nationality: p3.nationality,
        player1Wins: 6, player2Wins: 4, totalMatches: 10
      }
    ];

    const mockSeason1: SeasonHistoryEntry = {
      seasonNumber: 1,
      topTen: roster.slice(0, 10).map((p, idx) => ({
        id: p.id,
        name: p.name,
        nationality: p.nationality,
        ranking: idx + 1,
        points: 4400 - idx * 350,
        stats: { matchWins: 45 - idx * 2, matchLosses: 10 + idx },
        isFiller: p.isFiller
      })),
      winners: [
        { tournamentId: 'm-gs-1', tournamentName: 'Lion City Slam', tier: 'Grand Slam', winnerId: roster[0].id, winnerName: roster[0].name, winnerNationality: roster[0].nationality },
        { tournamentId: 'm-gs-2', tournamentName: 'La Terre Rouge', tier: 'Grand Slam', winnerId: roster[1].id, winnerName: roster[1].name, winnerNationality: roster[1].nationality },
        { tournamentId: 'm-gs-3', tournamentName: 'The Crown', tier: 'Grand Slam', winnerId: roster[2].id, winnerName: roster[2].name, winnerNationality: roster[2].nationality },
        { tournamentId: 'm-gs-4', tournamentName: 'The Empire', tier: 'Grand Slam', winnerId: roster[0].id, winnerName: roster[0].name, winnerNationality: roster[0].nationality },
        { tournamentId: 'm-1000-1', tournamentName: 'Indian Wells Masters', tier: 'Masters 1000', winnerId: roster[3].id, winnerName: roster[3].name, winnerNationality: roster[3].nationality },
        { tournamentId: 'm-1000-2', tournamentName: 'Miami Open Masters', tier: 'Masters 1000', winnerId: roster[4].id, winnerName: roster[4].name, winnerNationality: roster[4].nationality },
        { tournamentId: 'm-500-1', tournamentName: 'Rotterdam Indoor 500', tier: 'Masters 500', winnerId: roster[5].id, winnerName: roster[5].name, winnerNationality: roster[5].nationality },
        { tournamentId: 'm-500-2', tournamentName: 'Barcelona Clay 500', tier: 'Masters 500', winnerId: roster[6].id, winnerName: roster[6].name, winnerNationality: roster[6].nationality }
      ],
      topThreeTrajectories: mockSeason1Trajectories,
      topRivalries: mockSeason1Rivalries
    };

    const mockSeason2Trajectories = [
      {
        playerId: roster[1].id,
        playerName: roster[1].name,
        rankings: Array.from({ length: 43 }, (_, i) => Math.max(1, Math.round(1 + Math.cos(i / 3) * 1.2 + (i < 12 ? 1 : 0))))
      },
      {
        playerId: roster[3].id,
        playerName: roster[3].name,
        rankings: Array.from({ length: 43 }, (_, i) => Math.max(1, Math.round(2 + Math.sin(i / 4 + 0.5) * 1.6)))
      },
      {
        playerId: roster[0].id,
        playerName: roster[0].name,
        rankings: Array.from({ length: 43 }, (_, i) => Math.max(1, Math.round(3 + Math.sin(i / 6 + 2) * 2.5)))
      }
    ];

    const mockSeason2: SeasonHistoryEntry = {
      seasonNumber: 2,
      topTen: [...roster].reverse().slice(0, 10).map((p, idx) => ({
        id: p.id,
        name: p.name,
        nationality: p.nationality,
        ranking: idx + 1,
        points: 3900 - idx * 280,
        stats: { matchWins: 40 - idx * 2, matchLosses: 12 + idx },
        isFiller: p.isFiller
      })),
      winners: [
        { tournamentId: 'm-gs-1', tournamentName: 'Lion City Slam', tier: 'Grand Slam', winnerId: roster[1].id, winnerName: roster[1].name, winnerNationality: roster[1].nationality },
        { tournamentId: 'm-gs-2', tournamentName: 'La Terre Rouge', tier: 'Grand Slam', winnerId: roster[3].id, winnerName: roster[3].name, winnerNationality: roster[3].nationality },
        { tournamentId: 'm-gs-3', tournamentName: 'The Crown', tier: 'Grand Slam', winnerId: roster[0].id, winnerName: roster[0].name, winnerNationality: roster[0].nationality },
        { tournamentId: 'm-gs-4', tournamentName: 'The Empire', tier: 'Grand Slam', winnerId: roster[4].id, winnerName: roster[4].name, winnerNationality: roster[4].nationality },
        { tournamentId: 'm-1000-1', tournamentName: 'Indian Wells Masters', tier: 'Masters 1000', winnerId: roster[2].id, winnerName: roster[2].name, winnerNationality: roster[2].nationality },
        { tournamentId: 'm-1000-2', tournamentName: 'Miami Open Masters', tier: 'Masters 1000', winnerId: roster[5].id, winnerName: roster[5].name, winnerNationality: roster[5].nationality },
        { tournamentId: 'm-500-1', tournamentName: 'Rotterdam Indoor 500', tier: 'Masters 500', winnerId: roster[7].id, winnerName: roster[7].name, winnerNationality: roster[7].nationality },
        { tournamentId: 'm-500-2', tournamentName: 'Barcelona Clay 500', tier: 'Masters 500', winnerId: roster[8].id, winnerName: roster[8].name, winnerNationality: roster[8].nationality }
      ],
      topThreeTrajectories: mockSeason2Trajectories,
      topRivalries: mockSeason2Rivalries
    };

    // Seed mock careerExits and history lists on the actual players
    const updatedPlayers = roster.map(p => {
      const matchesS1 = mockSeason1.topTen.find(st => st.id === p.id);
      const matchesS2 = mockSeason2.topTen.find(st => st.id === p.id);
      
      const pExits: Record<string, { wins: number, finals: number, semis: number, quarters: number, played: number }> = {};
      
      // Seed reasonable counts for the 4 Slams
      const slamNames = ['Lion City Slam', 'La Terre Rouge', 'The Crown', 'The Empire'];
      slamNames.forEach(sName => {
        let wins = 0;
        let finals = 0;
        let semis = 0;
        let quarters = 0;
        
        if (mockSeason1.winners.some(w => w.winnerId === p.id && (w.tournamentName === sName || w.tournamentName.includes(sName)))) wins++;
        if (mockSeason2.winners.some(w => w.winnerId === p.id && (w.tournamentName === sName || w.tournamentName.includes(sName)))) wins++;
        
        if (p.baseAbility >= 9) {
          finals = Math.floor(Math.random() * 2);
          semis = Math.floor(Math.random() * 3) + 1;
          quarters = Math.floor(Math.random() * 2) + 1;
        } else if (p.baseAbility === 8) {
          finals = Math.floor(Math.random() * 1);
          semis = Math.floor(Math.random() * 2);
          quarters = Math.floor(Math.random() * 3) + 1;
        } else if (p.baseAbility >= 6) {
          semis = Math.floor(Math.random() * 1);
          quarters = Math.floor(Math.random() * 2);
        }
        
        const played = wins + finals + semis + quarters + Math.floor(Math.random() * 2);
        if (played > 0) {
          pExits[sName] = { wins, finals, semis, quarters, played };
        }
      });
      
      const otherTours = ['California Dunes', 'Miami Mirage', 'Monte Carlo Cliffside', 'Shanghai Neon'];
      otherTours.forEach(oName => {
        let wins = 0;
        if (mockSeason1.winners.some(w => w.winnerId === p.id && w.tournamentName.includes(oName.split(' ')[0]))) wins++;
        if (mockSeason2.winners.some(w => w.winnerId === p.id && w.tournamentName.includes(oName.split(' ')[0]))) wins++;
        
        let finals = 0, semis = 0, quarters = 0;
        if (p.baseAbility >= 8) {
          finals = Math.random() < 0.3 ? 1 : 0;
          semis = Math.floor(Math.random() * 2);
          quarters = Math.floor(Math.random() * 2) + 1;
        }
        const played = wins + finals + semis + quarters + Math.floor(Math.random() * 2);
        if (played > 0) {
          pExits[oName] = { wins, finals, semis, quarters, played };
        }
      });
      
      return {
        ...p,
        careerExits: pExits,
        historyMatchWins: [matchesS1?.stats.matchWins ?? Math.floor(Math.random() * 15 + 5), matchesS2?.stats.matchWins ?? Math.floor(Math.random() * 15 + 5)],
        historyMatchLosses: [matchesS1?.stats.matchLosses ?? Math.floor(Math.random() * 10 + 10), matchesS2?.stats.matchLosses ?? Math.floor(Math.random() * 10 + 10)],
        historyTitlesCount: [
          mockSeason1.winners.filter(w => w.winnerId === p.id).length, 
          mockSeason2.winners.filter(w => w.winnerId === p.id).length
        ],
        historyRankings: [matchesS1?.ranking ?? Math.floor(Math.random() * 50 + 20), matchesS2?.ranking ?? Math.floor(Math.random() * 50 + 20)],
        historyPoints: [matchesS1?.points ?? Math.floor(Math.random() * 1000 + 300), matchesS2?.points ?? Math.floor(Math.random() * 1000 + 300)],
      };
    });

    setPlayers(updatedPlayers);
    setSeasonHistory([mockSeason1, mockSeason2]);
    setSimulationLog(prev => [
      ...prev,
      `📜 ARCHIVES MODIFIED: Populated Season 1 & 2 mock historical records for showcase viewing!`
    ]);
  };

  const handleClearHistory = () => {
    setSeasonHistory([]);
    setSimulationLog(prev => [
      ...prev,
      `🧹 ARCHIVES PURGED: Erased all historical season logs successfully.`
    ]);
  };

  // Load selected player's analytical profile tab
  const handleSelectPlayer = (id: string) => {
    setSelectedPlayerId(id);
    setActiveTab('profile');
  };

  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || retiredPlayers.find(p => p.id === selectedPlayerId);

  return (
    <div id="career-simulation-container" className="min-h-screen bg-slate-950 text-slate-300 flex flex-col font-sans selection:bg-indigo-600 selection:text-black">
      
      {/* TOP NAVIGATION / GLOBAL HEADER */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-black font-black text-md italic shrink-0">T</div>
          <div>
            <h1 className="text-white font-bold leading-none uppercase tracking-wider text-xs">Tennis Tour Simulator</h1>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.15em] mt-0.5">Season {String(currentSeason).padStart(2, '0')} • Professional Analytics Engine</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {/* Current Period Monospace Widget */}
          <div className="hidden sm:block text-right">
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Current Period</div>
            <div className="text-indigo-400 font-mono text-[11px] font-bold">WEEK {currentWeek ? currentWeek.weekNumber : 1} of 43</div>
          </div>
          <div className="hidden sm:block w-[1px] h-6 bg-slate-800"></div>

          {/* Navigation tabs */}
          <nav className="flex space-x-1 p-0.5 bg-slate-950 rounded border border-slate-800">
            <button
              id="tab-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-indigo-600 text-black font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CALENDAR
            </button>

            <button
              id="tab-rankings"
              onClick={() => setActiveTab('rankings')}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all cursor-pointer ${
                activeTab === 'rankings'
                  ? 'bg-indigo-600 text-black font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              RANKINGS
            </button>

            <button
              id="tab-profile"
              disabled={!selectedPlayer}
              onClick={() => {
                if (selectedPlayer) setActiveTab('profile');
              }}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all cursor-pointer ${
                !selectedPlayer ? 'opacity-30 cursor-not-allowed' : ''
              } ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-black font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PRO Dossier
            </button>

            <button
              id="tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-black font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Milestone
            </button>

            <button
              id="tab-database"
              onClick={() => setActiveTab('database')}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-indigo-600 text-black font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DATABASE
            </button>

            <button
              id="tab-history"
              onClick={() => setActiveTab('history')}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-black font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              HISTORY
            </button>
          </nav>


        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:py-6">
        
        {/* End of Season Advance Indicator (Rendered at Week 43 completed) */}
        {currentWeek?.isCompleted && currentWeekIndex === 42 && (
          <div className="mb-6 bg-gradient-to-r from-yellow-950/30 to-slate-950 border-2 border-yellow-500/30 p-5 rounded-2xl flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 shadow-lg">
            <div>
              <h2 className="text-md font-bold text-yellow-500 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 animate-bounce" />
                <span>Season {currentSeason} Championship Wrap-up!</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                All 88 tournaments complete. Prepare to execute aging upgrades, experience decays, and register incoming and outgoing roster shifts.
              </p>
            </div>
            
            <button
              id="end-season-process-btn"
              onClick={handleEndSeasonAndUpgrade}
              className="bg-yellow-500 text-slate-950 hover:bg-yellow-400 active:bg-yellow-600 font-bold px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer text-xs uppercase"
            >
              <Database className="w-4 h-4 fill-current" />
              <span>Process Career Upgrades</span>
            </button>
          </div>
        )}

        {/* Tab Routing rendering */}
        {activeTab === 'rankings' && (
          <TourDashboard
            players={[...players, ...retiredPlayers]}
            onSelectPlayer={handleSelectPlayer}
            calendar={calendar}
            seasonHistory={seasonHistory}
          />
        )}

        {activeTab === 'calendar' && currentWeek && (
          <CalendarView
            currentWeek={currentWeek}
            calendar={calendar}
            players={players}
            onSimulateRound={handleSimulateRound}
            onSimulateFullWeek={handleSimulateFullWeek}
            onAdvanceWeek={handleAdvanceWeek}
            simulationLog={simulationLog}
            onUpdateTournament={handleUpdateTournament}
            onForceCommitmentOverride={handleForceCommitmentOverride}
            onUpdateWeekName={handleUpdateWeekName}
            isAutoSimulating={isAutoSimulating}
            autoSimSpeed={autoSimSpeed}
            autoSimTarget={autoSimTarget}
            onChangeAutoSimSpeed={setAutoSimSpeed}
            onChangeAutoSimTarget={setAutoSimTarget}
            onStartAutoSim={handleStartAutoSim}
            onStopAutoSim={handleStopAutoSim}
            autoSimStats={autoSimStats}
            lastWeekResults={lastWeekResults}
            isFastSimulationMode={isFastSimulationMode}
            onToggleFastSimulationMode={setIsFastSimulationMode}
          />
        )}

        {activeTab === 'profile' && selectedPlayer && (
          <PlayerProfile
            player={selectedPlayer}
            allPlayers={[...players, ...retiredPlayers]}
            onBackToDashboard={() => setActiveTab('rankings')}
            onUpdatePlayer={handleUpdatePlayer}
            onSelectPlayer={handleSelectPlayer}
            gyms={gyms}
            calendar={calendar}
            currentSeason={currentSeason}
            seasonHistory={seasonHistory}
          />
        )}

        {activeTab === 'analytics' && (
          <GameStats
            players={players}
            retiredPlayers={retiredPlayers}
            currentSeason={currentSeason}
            endOfYearTrophyUrl={endOfYearTrophyUrl}
            onUpdateEndOfYearTrophy={setEndOfYearTrophyUrl}
            gyms={gyms}
            onUpdateGyms={setGyms}
            onUpdatePlayer={handleUpdatePlayer}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseControl
            players={players}
            calendar={calendar}
            onUpdatePlayers={setPlayers}
            onUpdateCalendar={setCalendar}
            logCallback={(log) => setSimulationLog(prev => [...prev, log])}
          />
        )}

        {activeTab === 'history' && (
          <SeasonHistory
            history={seasonHistory}
            onClearHistory={handleClearHistory}
            onGenerateMockHistory={handleGenerateMockHistory}
            onSelectPlayer={handleSelectPlayer}
            calendar={calendar}
            players={players}
          />
        )}

      </main>

      {/* Footer credits bar */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-500 font-mono space-y-2 md:space-y-0">
          <div className="flex items-center space-x-1">
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            <span>Interactive Sports Analytics Prototype</span>
          </div>
          <span>Tennis Tour Simulator • Fully Offline calculation</span>
        </div>
      </footer>

      {/* 5-SECOND END-OF-SEASON AWARDS CEREMONY FULLSCREEN MODAL */}
      {ceremonyData && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto leading-relaxed selection:bg-slate-200">
          <div className="bg-slate-900 border border-slate-705 rounded-2xl w-full max-w-4xl p-6 md:p-8 relative overflow-hidden shadow-2xl max-h-[95vh] flex flex-col justify-between">
            
            {/* Ambient Silver particles decor in background */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-slate-100/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header section with crown element and season title */}
            <div className="text-center relative z-10 border-b border-slate-800 pb-5 shrink-0">
              <span className="text-[10px] font-mono tracking-widest text-indigo-400 font-extrabold uppercase bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded">
                Official Season Audit
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-150 uppercase tracking-tight mt-3">
                🏆 Season {ceremonyData.seasonNumber} Awards Showcase
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1 font-bold">
                Meticulous grand slam records and season championships audit
              </p>
            </div>

            {/* Core Awards content panel */}
            <div className="my-6 space-y-6 overflow-y-auto pr-1 flex-1 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                
                {/* Year-End No. 1 Season Champion Banner Card (5 Cols) */}
                <div className="lg:col-span-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-750 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-lg group">
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <span className="text-[7.5px] font-mono font-black border border-slate-700 bg-slate-950 text-yellow-501 px-1.5 py-0.2 rounded" title="Championship Trophy Designated">
                      No. 1
                    </span>
                  </div>
                  
                  {/* Decorative big trophy watermark in background */}
                  <div className="absolute right-[-20px] bottom-[-20px] text-slate-100/5 text-9xl font-black pointer-events-none select-none">
                    🏆
                  </div>

                  <div className="text-center">
                    <span className="text-[8.5px] font-mono font-black text-slate-500 uppercase tracking-widest block">
                      WORLD NUMBER ONE
                    </span>
                    <h3 className="text-md font-mono font-black text-yellow-500 mt-0.5 uppercase tracking-tight">
                      SEASON CHAMPION
                    </h3>
                  </div>

                  {/* Player Image / Portrait wrapper */}
                  <div className="flex justify-center my-4 relative">
                    <div className="w-24 h-24 rounded-full border-2 border-yellow-500/65 overflow-hidden shadow-inner bg-slate-950 relative z-10 shrink-0">
                      {ceremonyData.champion?.portraitUrl ? (
                        <img 
                          src={ceremonyData.champion.portraitUrl} 
                          alt={ceremonyData.champion.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as any).src = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&auto=format&fit=crop";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                          <span className="text-2xl">👑</span>
                          <span className="text-[8px] font-mono mt-0.5">{ceremonyData.champion?.nationality}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Champion details block */}
                  <div className="text-center pb-2 relative z-10">
                    <h4 className="text-md font-bold text-slate-100 leading-snug uppercase truncate">
                      {ceremonyData.champion?.name}
                    </h4>
                    <div className="flex items-center justify-center space-x-1.5 mt-1">
                      <span className="text-sm select-none">{ceremonyData.champion ? getFlagEmoji(ceremonyData.champion.nationality) : '🏳️'}</span>
                      <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase bg-slate-950 border border-slate-850 px-1.5 py-0.2 rounded">
                        {ceremonyData.champion?.nationality}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1.5 mt-3 border-t border-slate-850 pt-3 text-[10.5px] font-mono text-slate-500">
                      <div className="text-left">
                        <span className="block text-[8px] uppercase">W-L Record</span>
                        <strong className="text-slate-300">{ceremonyData.champion?.stats.matchWins}-{ceremonyData.champion?.stats.matchLosses}</strong>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] uppercase">Total points</span>
                        <strong className="text-yellow-500 font-extrabold">{ceremonyData.champion?.points.toLocaleString()} PTS</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grand Slam Winners Grid (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-mono font-black text-slate-400 uppercase tracking-widest block">
                      MAJOR CHAMPIONS
                    </span>
                    <h3 className="text-xs font-black text-slate-200 uppercase leading-none pb-2 border-b border-indigo-500/20">
                      The Grand Slam Victors
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {[
                      { key: 'melbourne', term: 'MELBOURNE SHAKEDOWN', emoji: '🇦🇺', win: ceremonyData.melbourneWinner, sub: 'Classic Hardcourt' },
                      { key: 'paris', term: 'PARISIAN RED SANDS', emoji: '🇫🇷', win: ceremonyData.parisWinner, sub: 'Clay court' },
                      { key: 'london', term: 'LONDON HERBACEOUS', emoji: '🇬🇧', win: ceremonyData.londonWinner, sub: 'Wimbledon Grass' },
                      { key: 'newyork', term: 'NEW YORK JUNGLE', emoji: '🇺🇸', win: ceremonyData.nyWinner, sub: 'Concrete Hard court' }
                    ].map((slamItem) => {
                      return (
                        <div key={slamItem.key} className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-1 group hover:border-slate-700 transition-all duration-300">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {/* Portrait Display with fallback */}
                            <div className="w-10 h-10 rounded-lg border border-slate-800 overflow-hidden bg-slate-900 shrink-0 relative flex items-center justify-center">
                              {slamItem.win?.portraitUrl ? (
                                <img 
                                  src={slamItem.win.portraitUrl} 
                                  alt={slamItem.win.name} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as any).src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100&auto=format&fit=crop";
                                  }}
                                />
                              ) : (
                                <span className="text-sm select-none">{slamItem.emoji}</span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <span className="text-[7.5px] text-slate-500 font-mono font-black uppercase truncate block leading-none">
                                {slamItem.term}
                              </span>
                              {slamItem.win ? (
                                <>
                                  <h4 className="font-bold text-xs text-slate-100 uppercase truncate leading-snug group-hover:text-amber-450 transition-colors mt-0.5">
                                    {slamItem.win.name.split(' ').pop()}
                                  </h4>
                                  <span className="text-[8px] text-indigo-450 font-mono leading-none block uppercase tracking-tight mt-0.5">
                                    NAT: {slamItem.win.nationality}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-600 font-mono italic">Not complete</span>
                              )}
                            </div>
                          </div>

                          <div className="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] shrink-0 font-bold">
                            🏆
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl text-[10.5px] font-mono text-slate-500 leading-normal">
                    💡 <strong>The Pentagon Achievement Target</strong>: To score this ultimate achievement, a pro must secure all 4 different Grand Slam titles at least once in their career history, and finish a season ranked World #1 No. 1 overall! Completion unlocks a silver glow.
                  </div>
                </div>

              </div>
            </div>

            {/* Footer buttons / timing info inside popup */}
            <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row justify-between items-center bg-slate-900 shrink-0 text-center sm:text-left gap-3 relative z-10">
              {isAutoSimulating ? (
                <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 font-extrabold animate-pulse uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span>Auto-Simulation ongoing... popup auto-dismisses in 5s (viewing in real-time)</span>
                </div>
              ) : (
                <div className="text-[11px] font-mono text-slate-500 font-bold uppercase">
                  Manual Season transition • Close pop-up to resume
                </div>
              )}

              {!isAutoSimulating && (
                <button
                  id="close-ceremony-modal-btn"
                  onClick={() => setCeremonyData(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-slate-950 text-[11px] font-black font-mono tracking-wider px-6 py-2.5 rounded-xl cursor-pointer uppercase transition-all shadow-md shadow-indigo-650/15"
                >
                  Close & Continue to Season {currentSeason}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
