import React, { useState } from 'react';
import { SeasonHistoryEntry, Player, Week } from '../types';
import { Trophy, Users, Award, Sparkles, AlertCircle, ArrowLeftRight, Trash2, X, TrendingUp, Calendar, Flame, Swords } from 'lucide-react';
import SeasonRankingGraph from './SeasonRankingGraph';
import { hasCompletedPentagon } from '../utils/pentagon';
import { getFlagEmoji } from './TourDashboard';

interface SeasonHistoryProps {
  history: SeasonHistoryEntry[];
  onClearHistory: () => void;
  onGenerateMockHistory: () => void;
  onSelectPlayer: (playerId: string) => void;
  calendar?: Week[];
  players?: Player[];
}

export default function SeasonHistory({
  history,
  onClearHistory,
  onGenerateMockHistory,
  onSelectPlayer,
  calendar,
  players = []
}: SeasonHistoryProps) {
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState<number>(0);
  const [wrapSeasonToShow, setWrapSeasonToShow] = useState<SeasonHistoryEntry | null>(null);

  // Helper to extract slam winner
  const getSlamWinner = (slamKey: 'melbourne' | 'paris' | 'london' | 'newyork', winners: any[]) => {
    const gsWinners = winners.filter(w => w.tier === 'Grand Slam');
    if (slamKey === 'melbourne') {
      return gsWinners.find(w => w.tournamentName.toLowerCase().includes('melbourne') || w.tournamentName.toLowerCase().includes('shakedown') || w.tournamentName.toLowerCase().includes('lion city')) || gsWinners[0];
    }
    if (slamKey === 'paris') {
      return gsWinners.find(w => w.tournamentName.toLowerCase().includes('paris') || w.tournamentName.toLowerCase().includes('sand') || w.tournamentName.toLowerCase().includes('clay') || w.tournamentName.toLowerCase().includes('garros') || w.tournamentName.toLowerCase().includes('terre rouge')) || gsWinners[1];
    }
    if (slamKey === 'london') {
      return gsWinners.find(w => w.tournamentName.toLowerCase().includes('london') || w.tournamentName.toLowerCase().includes('grass') || w.tournamentName.toLowerCase().includes('herbaceous') || w.tournamentName.toLowerCase().includes('wimbledon') || w.tournamentName.toLowerCase().includes('the crown')) || gsWinners[2];
    }
    if (slamKey === 'newyork') {
      return gsWinners.find(w => w.tournamentName.toLowerCase().includes('new york') || w.tournamentName.toLowerCase().includes('concrete') || w.tournamentName.toLowerCase().includes('hardcourt') || w.tournamentName.toLowerCase().includes('jungle') || w.tournamentName.toLowerCase().includes('flushing') || w.tournamentName.toLowerCase().includes('the empire')) || gsWinners[3];
    }
    return null;
  };

  // Helper to compute most improved players for season S
  const getMostImprovedPlayers = (S: number, topTen: any[]) => {
    const improvements: Array<{ name: string; nationality: string; startRank: number; endRank: number; change: number }> = [];

    if (players && players.length > 0) {
      players.forEach((p, idx) => {
        let endRank = p.historyRankings?.[S - 1];
        if (!endRank && S === 1) {
          const stIdx = topTen.findIndex(st => st.id === p.id);
          if (stIdx !== -1) {
            endRank = topTen[stIdx].ranking;
          }
        }

        if (endRank) {
          let startRank = 0;
          if (S > 1) {
            startRank = p.historyRankings?.[S - 2] || 120;
          } else {
            const baseRank = 150 - (p.baseAbility * 10 + p.potential * 3) + (idx % 10);
            startRank = Math.max(endRank + 2, Math.min(150, baseRank));
          }

          const change = startRank - endRank;
          if (change > 0) {
            improvements.push({
              name: p.name,
              nationality: p.nationality,
              startRank,
              endRank,
              change
            });
          }
        }
      });
    }

    if (improvements.length === 0) {
      if (S === 1) {
        return [
          { name: "Carlos Alcaraz-cold", nationality: "ESP", startRank: 32, endRank: 3, change: 29 },
          { name: "Jannik Sinner-zera", nationality: "ITA", startRank: 15, endRank: 2, change: 13 },
          { name: "Holger Rune-quick", nationality: "DEN", startRank: 85, endRank: 9, change: 76 }
        ];
      } else if (S === 2) {
        return [
          { name: "Ben Shelton-boom", nationality: "USA", startRank: 96, endRank: 15, change: 81 },
          { name: "Arthur Fils-pulse", nationality: "FRA", startRank: 110, endRank: 24, change: 86 },
          { name: "Carlos Alcaraz-cold", nationality: "ESP", startRank: 3, endRank: 1, change: 2 }
        ];
      } else {
        return [
          { name: "Alex de Minaur", nationality: "AUS", startRank: 42, endRank: 11, change: 31 },
          { name: "Grigor Dimitrov", nationality: "BUL", startRank: 35, endRank: 12, change: 23 },
          { name: "Jack Draper", nationality: "GBR", startRank: 82, endRank: 28, change: 54 }
        ];
      }
    }

    return improvements
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);
  };

  // Active entries or empty
  const activeSeason = history[selectedSeasonIdx] || null;

  // Filter winners by category
  const getWinnersByTier = (tierName: string) => {
    if (!activeSeason) return [];
    return activeSeason.winners.filter(w => w.tier === tierName);
  };

  const getTournamentLogo = (tournamentName: string, tournamentId: string) => {
    // 1. Try to find the tournament logo in the current calendar
    if (calendar) {
      const flatTours = calendar.flatMap(w => w.tournaments);
      const found = flatTours.find(t => t.id === tournamentId || t.name.toLowerCase() === tournamentName.toLowerCase());
      if (found?.logoUrl) {
        return found.logoUrl;
      }
    }

    // 2. Try to find in custom styles from localStorage (maps slam name)
    const norm = tournamentName.toLowerCase();
    let slamIdx = -1;
    if (norm.includes('melbourne') || norm.includes('australian') || norm.includes('lion city')) slamIdx = 0;
    else if (norm.includes('paris') || norm.includes('garros') || norm.includes('red sands') || norm.includes('terre rouge')) slamIdx = 1;
    else if (norm.includes('london') || norm.includes('wimbledon') || norm.includes('grasslands') || norm.includes('the crown')) slamIdx = 2;
    else if (norm.includes('new york') || norm.includes('flushing') || norm.includes('concrete jungle') || norm.includes('the empire')) slamIdx = 3;

    if (slamIdx !== -1) {
      try {
        const savedStyles = localStorage.getItem('tennis_custom_trophies_styles_v3');
        if (savedStyles) {
          const parsed = JSON.parse(savedStyles);
          if (parsed[slamIdx]?.customLogoUrl) {
            return parsed[slamIdx].customLogoUrl;
          }
        }
      } catch (e) {
        // Ignored
      }
    }

    return undefined;
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-md font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>Tour Historical Archives</span>
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Relive final seasonal championships. This ledger records the ultimate Top Ten standings along with tournament champions across all elite majors: Grand Slam, Masters 1000, and Masters 500.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-3 py-1.5 rounded-lg border border-red-900/30 bg-red-950/10 hover:bg-red-950/30 text-red-400 hover:text-red-300 transition-colors uppercase tracking-tight font-mono text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          )}

          {history.length === 0 && (
            <button
              onClick={onGenerateMockHistory}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-black font-black uppercase text-[10px] tracking-wide flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:translate-y-[-1px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-black stroke-[3px]" />
              <span>Generate Mock Archives</span>
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-950 border border-slate-900 p-12 rounded-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
            <Trophy className="w-6 h-6 text-slate-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">No Historical Ledgers Logged</h3>
            <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
              Complete Season 1 (Week 43 matches) under the CALENDAR, and advance the season to write final standing records and champion rosters permanently inside this tab!
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onGenerateMockHistory}
              className="px-4 py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-900/80 text-indigo-400 hover:text-indigo-300 font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate 2 Seasons of Fast Mock Data</span>
            </button>
          </div>
        </div>
      ) : (
        /* History Dashboard Content */
        <div className="space-y-6">
          {/* Season Selector Timeline */}
          <div className="flex items-center space-x-2 border-b border-slate-850 pb-3 overflow-x-auto scroller-hidden">
            <span className="text-[10px] text-slate-500 font-mono uppercase font-bold tracking-wider mr-2 shrink-0">Historic Ledger:</span>
            {history.map((entry, idx) => (
              <button
                key={entry.seasonNumber}
                onClick={() => {
                  setSelectedSeasonIdx(idx);
                  setWrapSeasonToShow(entry);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all shrink-0 cursor-pointer ${
                  selectedSeasonIdx === idx
                    ? 'bg-indigo-600 text-black font-black shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-100 border border-slate-800'
                }`}
                title={`View Season ${entry.seasonNumber} Wrap Summary Modal`}
              >
                Season {entry.seasonNumber}
              </button>
            ))}
          </div>

          {activeSeason && (
            <div className="space-y-6">
              {/* Quick Action Season Wrap Banner */}
              <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-500/20 rounded-lg shrink-0">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-black text-slate-200 uppercase tracking-widest leading-none">
                      SEASON {activeSeason.seasonNumber} WRAP CHRONICLES READY
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 leading-normal">
                      Click below or select any season above to inspect the complete honor roll: Top 10, Grand Slam champions, and breakthrough players.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWrapSeasonToShow(activeSeason)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-505 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-slate-950 font-black uppercase text-[10px] tracking-wider shrink-0 cursor-pointer flex items-center justify-center gap-2 transition-all shadow hover:translate-y-[-1px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950 stroke-[3px]" />
                  <span>Reveal Season Wrap Modal</span>
                </button>
              </div>

              {/* Season Standings Trajectory Visualization */}
              {activeSeason.topThreeTrajectories && (
                <SeasonRankingGraph
                  trajectories={activeSeason.topThreeTrajectories}
                  seasonNumber={activeSeason.seasonNumber}
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Side: FINAL STANDINGS TOP 10 (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Final Top 10 Standings</span>
                  </h3>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                    S{activeSeason.seasonNumber} ELITE
                  </span>
                </div>

                <div className="divide-y divide-slate-850">
                  {activeSeason.topTen.map((standing) => {
                    const playerObj = players.find(p => p.id === standing.id);
                    const isPentagon = playerObj ? hasCompletedPentagon(playerObj) : false;
                    return (
                      <div
                        key={standing.id}
                        onClick={() => onSelectPlayer(standing.id)}
                        className={`py-2.5 flex items-center justify-between text-xs px-1.5 rounded-lg transition-all cursor-pointer group leading-snug my-0.5 ${
                          isPentagon
                            ? 'border border-slate-300 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shadow-[0_0_12px_rgba(203,213,225,0.75)] hover:border-slate-200 hover:shadow-[0_0_16px_rgba(226,232,240,0.9)]'
                            : 'hover:bg-slate-850/30'
                        }`}
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <span className={`w-5 text-center font-mono font-black ${
                            standing.ranking === 1 ? 'text-yellow-500 text-sm' :
                            standing.ranking === 2 ? 'text-slate-300' :
                            standing.ranking === 3 ? 'text-amber-600' :
                            'text-slate-500'
                          }`}>
                            #{standing.ranking}
                          </span>

                          <div className="truncate">
                            <div className="flex items-center space-x-1.5 truncate">
                              <span className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors uppercase truncate">
                                {standing.name}
                              </span>
                              {isPentagon && (
                                <span className="text-[7.5px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-950 shadow-[0_0_8px_rgba(255,255,255,0.9)] border border-white/20 uppercase shrink-0" title="Completed The Pentagon">
                                  ⬡ PENTAGON
                                </span>
                              )}
                              <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-slate-950 text-slate-400 shrink-0">
                                {standing.nationality}
                              </span>
                            </div>
                          
                          <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span>W-L: {standing.stats.matchWins}-{standing.stats.matchLosses}</span>
                            <span>•</span>
                            <span>Pct: {
                              (standing.stats.matchWins + standing.stats.matchLosses) > 0
                                ? ((standing.stats.matchWins / (standing.stats.matchWins + standing.stats.matchLosses)) * 100).toFixed(0)
                                : '0'
                            }%</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-indigo-400 group-hover:text-indigo-300 transition-colors">
                          {standing.points.toLocaleString()}
                        </span>
                        <span className="text-[8.5px] text-slate-500 block font-mono">PTS</span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: MAJOR CHAMPION TIMELINES (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
                <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span>Elite Tournament Champions</span>
                </h3>

                <div className="space-y-4">
                  
                  {/* Category 1: Grand Slams */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 border-b border-yellow-500/20 pb-1">
                      <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest font-mono">🏆 GRAND SLAMS (4 Majors)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {getWinnersByTier('Grand Slam').length > 0 ? (
                        getWinnersByTier('Grand Slam').map((t) => {
                          const logoUrl = getTournamentLogo(t.tournamentName, t.tournamentId);
                          return (
                            <div
                              key={t.tournamentId}
                              onClick={() => onSelectPlayer(t.winnerId)}
                              className="bg-slate-950 border border-slate-850 p-2 md:p-2.5 rounded-xl flex items-center justify-between hover:border-yellow-500/30 hover:bg-slate-950/60 transition-all cursor-pointer group gap-2 min-w-0"
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                {logoUrl ? (
                                  <img 
                                    src={logoUrl} 
                                    alt="Logo" 
                                    className="w-6 h-6 rounded object-cover border border-slate-800 shrink-0 shadow-sm" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded bg-slate-900 border border-slate-850 flex items-center justify-center text-[7.5px] text-yellow-500 font-bold shrink-0">
                                    🏆
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span className="text-[8px] text-slate-500 font-mono uppercase font-black truncate block" title={t.tournamentName}>
                                    {t.tournamentName}
                                  </span>
                                  <span className="font-bold text-slate-200 group-hover:text-yellow-500 transition-colors uppercase truncate text-[11px] block">
                                    {t.winnerName.split(' ').pop()}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[8px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-1 rounded shrink-0">
                                {t.winnerNationality}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-2 text-center py-4 text-[10px] text-slate-500 font-mono uppercase bg-slate-950/40 rounded-xl">
                          No majors completed
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category 2: Masters 1000 */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 border-b border-indigo-500/20 pb-1">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest font-mono">🌟 MASTERS 1000 SERIES</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {getWinnersByTier('Masters 1000').length > 0 ? (
                        getWinnersByTier('Masters 1000').map((t) => {
                          const logoUrl = getTournamentLogo(t.tournamentName, t.tournamentId);
                          return (
                            <div
                              key={t.tournamentId}
                              onClick={() => onSelectPlayer(t.winnerId)}
                              className="bg-slate-950 border border-slate-850 p-2 md:p-2.5 rounded-xl flex items-center justify-between hover:border-indigo-500/30 hover:bg-slate-950/60 transition-all cursor-pointer group gap-2 min-w-0"
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                {logoUrl ? (
                                  <img 
                                    src={logoUrl} 
                                    alt="Logo" 
                                    className="w-6 h-6 rounded object-cover border border-slate-800 shrink-0 shadow-sm" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded bg-slate-900 border border-slate-850 flex items-center justify-center text-[7px] text-indigo-400 font-bold shrink-0">
                                    ⭐
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span className="text-[8px] text-slate-500 font-mono uppercase font-black truncate block" title={t.tournamentName}>
                                    {t.tournamentName}
                                  </span>
                                  <span className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors uppercase truncate text-[11px] block">
                                    {t.winnerName.split(' ').pop()}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[8px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-1 rounded shrink-0">
                                {t.winnerNationality}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-2 text-center py-4 text-[10px] text-slate-500 font-mono uppercase bg-slate-950/40 rounded-xl">
                          No Masters 1000 completed
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category 3: Masters 500 */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 border-b border-slate-700 pb-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">🌌 MASTERS 500 SERIES</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {getWinnersByTier('Masters 500').length > 0 ? (
                        getWinnersByTier('Masters 500').map((t) => {
                          const logoUrl = getTournamentLogo(t.tournamentName, t.tournamentId);
                          return (
                            <div
                              key={t.tournamentId}
                              onClick={() => onSelectPlayer(t.winnerId)}
                              className="bg-slate-950 border border-slate-850 p-2 md:p-2.5 rounded-xl flex items-center justify-between hover:border-slate-700 hover:bg-slate-950/60 transition-all cursor-pointer group gap-2 min-w-0"
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                {logoUrl ? (
                                  <img 
                                    src={logoUrl} 
                                    alt="Logo" 
                                    className="w-6 h-6 rounded object-cover border border-slate-800 shrink-0 shadow-sm" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded bg-slate-900 border border-slate-850 flex items-center justify-center text-[7px] text-slate-500 font-bold shrink-0">
                                    🌌
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span className="text-[8px] text-slate-500 font-mono uppercase font-black truncate block" title={t.tournamentName}>
                                    {t.tournamentName}
                                  </span>
                                  <span className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors uppercase truncate text-[11px] block">
                                    {t.winnerName.split(' ').pop()}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[8px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-1 rounded shrink-0">
                                {t.winnerNationality}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-2 text-center py-4 text-[10px] text-slate-500 font-mono uppercase bg-slate-950/40 rounded-xl">
                          No Masters 500 completed
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
          )}
        </div>
      )}

      {/* Detailed Season Wrap Modal */}
      {wrapSeasonToShow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          {/* Modal Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="border-b border-slate-800 bg-slate-950/90 p-4.5 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-[13px] font-black tracking-widest uppercase text-white font-mono flex items-center gap-1.5 leading-none">
                    <span>👑 SEASON {wrapSeasonToShow.seasonNumber} CHRONICLES WRAP-UP</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Definitive historic audit displaying local legends, world top 10 rankings, and season honors.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWrapSeasonToShow(null)}
                className="text-slate-450 hover:text-white p-2 rounded-full bg-slate-950 border border-slate-800 hover:bg-slate-850 cursor-pointer transition-colors"
                title="Close Detailed Wrap"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Column 1: Final Top 10 Standings (5 Cols) */}
                <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 p-4.5 rounded-xl flex flex-col space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <h4 className="text-[11px] font-mono font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-450" />
                      <span>Year-End ATP Top 10</span>
                    </h4>
                    <span className="text-[8px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded uppercase">
                      Official Audit
                    </span>
                  </div>

                  <div className="divide-y divide-slate-850/60 font-mono text-[10.5px]">
                    {wrapSeasonToShow.topTen.slice(0, 10).map((st) => {
                      const isNo1 = st.ranking === 1;
                      const matchesPlayed = st.stats.matchWins + st.stats.matchLosses;
                      const ratio = matchesPlayed > 0 ? (st.stats.matchWins / matchesPlayed * 100).toFixed(0) : '0';
                      const playerObj = players.find(p => p.id === st.id);
                      const isPentagon = playerObj ? hasCompletedPentagon(playerObj) : false;
                      return (
                        <div 
                          key={st.id} 
                          onClick={() => {
                            onSelectPlayer(st.id);
                            setWrapSeasonToShow(null);
                          }}
                          className={`py-2.5 flex items-center justify-between group px-2 rounded-lg cursor-pointer transition-all leading-snug my-0.5 ${
                            isPentagon
                              ? 'border border-slate-300 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shadow-[0_0_12px_rgba(203,213,225,0.75)] hover:border-slate-200'
                              : 'hover:bg-slate-850/50'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <span className={`w-5 text-center font-black text-xs ${
                              isNo1 ? 'text-yellow-400 text-sm' :
                              st.ranking === 2 ? 'text-slate-300' :
                              st.ranking === 3 ? 'text-amber-600' :
                              'text-slate-500'
                            }`}>
                              {isNo1 ? '👑' : `#${st.ranking}`}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-extrabold text-slate-100 group-hover:text-indigo-400 uppercase truncate">
                                  {st.name}
                                </span>
                                {isPentagon && (
                                  <span className="text-[7px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-950 shadow-[0_0_8px_rgba(255,255,255,0.9)] border border-white/20 uppercase shrink-0" title="Completed The Pentagon">
                                    ⬡ PENTAGON
                                  </span>
                                )}
                                <span className="text-[8px] font-mono bg-slate-950 px-1 rounded border border-slate-850 text-slate-500">
                                  {st.nationality}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-500 block font-bold uppercase mt-0.5">
                                W-L: {st.stats.matchWins}-{st.stats.matchLosses} ({ratio}% Win Ratio)
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="font-black text-indigo-400 group-hover:text-indigo-300">
                              {st.points.toLocaleString()}
                            </span>
                            <span className="text-[8px] text-slate-500 block leading-none">PTS</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Champions & Breakdown (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col space-y-5">
                  
                  {/* Grand Slams Subsection */}
                  <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-xl flex flex-col space-y-3.5">
                    <h4 className="text-[11px] font-mono font-black text-slate-200 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2.5">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span>Grand Slam Winners (4 Majors)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
                      {[
                        { key: 'melbourne', name: 'Lion City Slam', surface: 'Hard', emoji: '🇸🇬 Singapore Sapphire', bg: 'from-cyan-950/20 to-slate-900 border-cyan-500/10 hover:border-cyan-500/30' },
                        { key: 'paris', name: 'La Terre Rouge', surface: 'Clay', emoji: '🇫🇷 French Ruby', bg: 'from-rose-950/20 to-slate-900 border-rose-500/10 hover:border-rose-500/30' },
                        { key: 'london', name: 'The Crown', surface: 'Grass', emoji: '🇬🇧 Emerald Lawn', bg: 'from-emerald-950/20 to-slate-900 border-emerald-500/10 hover:border-emerald-500/30' },
                        { key: 'newyork', name: 'The Empire', surface: 'Hard', emoji: '🇺🇸 White Topaz Hard', bg: 'from-slate-800/20 to-slate-900 border-slate-500/10 hover:border-slate-500/30' }
                      ].map((slam) => {
                        const winnerInfo = getSlamWinner(slam.key as any, wrapSeasonToShow.winners);
                        const winnerPlayerObj = winnerInfo ? players.find(p => p.id === winnerInfo.winnerId) : null;
                        const isWinnerPentagon = winnerPlayerObj ? hasCompletedPentagon(winnerPlayerObj) : false;
                        return (
                          <div 
                            key={slam.key} 
                            onClick={() => {
                              if (winnerInfo?.winnerId) {
                                onSelectPlayer(winnerInfo.winnerId);
                                setWrapSeasonToShow(null);
                              }
                            }}
                            className={`border p-3.5 rounded-xl flex flex-col justify-between hover:bg-slate-950/80 transition-all cursor-pointer group hover:translate-y-[-1.5px] duration-300 ${
                              isWinnerPentagon
                                ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-slate-300 ring-2 ring-slate-400/35 shadow-[0_0_12px_rgba(226,232,240,0.655)] hover:border-slate-200'
                                : `bg-gradient-to-b ${slam.bg}`
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between text-[8px] font-mono uppercase font-black text-slate-500">
                                <span>{slam.emoji}</span>
                                <span className={`font-black text-[7px] border px-1 rounded bg-slate-950 ${isWinnerPentagon ? 'text-slate-100 border-slate-300 shadow-[0_0_5px_white]' : 'text-indigo-400 border-slate-800'}`}>
                                  {isWinnerPentagon ? '⬡ LEGEND' : 'GS'}
                                </span>
                              </div>
                              <h5 className="font-mono text-[9px] font-bold text-slate-400 mt-1.5 truncate uppercase" title={slam.name}>
                                {slam.name}
                              </h5>
                            </div>

                            <div className="flex items-center gap-2.5 mt-3 border-t border-slate-850/50 pt-2 shrink-0">
                              <div className={`w-8 h-8 rounded-lg bg-slate-900 border flex items-center justify-center text-xs font-bold shrink-0 shadow-inner group-hover:bg-slate-950 transition-colors ${
                                isWinnerPentagon ? 'border-slate-300 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'border-slate-800 group-hover:border-yellow-500/30'
                              }`}>
                                🏆
                              </div>
                              <div className="min-w-0">
                                {winnerInfo ? (
                                  <>
                                    <span className="font-black text-slate-100 uppercase group-hover:text-yellow-400 transition-colors block text-[11px] truncate leading-tight flex items-center gap-1">
                                      {winnerInfo.winnerName}
                                    </span>
                                    <span className="text-[8.5px] font-mono text-slate-500 uppercase block font-bold">
                                      Nationality: {winnerInfo.winnerNationality}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-slate-600 font-mono">Completed</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Most Improved Players Subsection */}
                  <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-xl flex flex-col space-y-3.5">
                    <h4 className="text-[11px] font-mono font-black text-slate-200 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2.5">
                      <Flame className="w-4 h-4 text-orange-500 font-bold" />
                      <span>Most Improved Players of the Season</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {getMostImprovedPlayers(wrapSeasonToShow.seasonNumber, wrapSeasonToShow.topTen).map((p, idx) => {
                        return (
                          <div 
                            key={idx}
                            onClick={() => {
                              // If they exist in active catalog, select them
                              const foundPlayer = players?.find(ap => ap.name === p.name);
                              if (foundPlayer) {
                                onSelectPlayer(foundPlayer.id);
                                setWrapSeasonToShow(null);
                              }
                            }}
                            className="bg-slate-900/50 border border-slate-850/80 p-3.5 rounded-xl flex flex-col justify-between font-mono hover:border-slate-700 hover:bg-slate-900/80 transition-all text-left cursor-pointer group"
                          >
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[8px] font-mono text-indigo-400 font-black tracking-widest uppercase">
                                  RISE #{idx + 1}
                                </span>
                                <span className="text-[7.5px] text-slate-500 uppercase font-black border border-slate-850 bg-slate-950 px-1 rounded">
                                  {p.nationality}
                                </span>
                              </div>
                              <h5 className="text-[11px] font-bold text-slate-150 uppercase truncate group-hover:text-indigo-400 transition-colors">
                                {p.name.split(' ').pop()}
                              </h5>
                              <p className="text-[8px] text-slate-500 leading-none truncate font-bold">
                                {p.name}
                              </p>
                            </div>

                            <div className="mt-3.5 pt-2.5 border-t border-slate-850/60 shrink-0">
                              <div className="flex justify-between items-end">
                                <div className="text-[8.5px] text-slate-500 leading-none space-y-1">
                                  <div>Before: #{p.startRank}</div>
                                  <div>Ended: #{p.endRank}</div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[12.5px] font-black text-emerald-400 flex items-center leading-none">
                                    +{p.change}
                                  </span>
                                  <div className="text-[7.5px] text-slate-500 font-black uppercase mt-0.5 leading-none">Ranks</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Season Rivalries Subsection */}
                  <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-xl flex flex-col space-y-3.5 text-slate-100">
                    <h4 className="text-[11px] font-mono font-black text-slate-200 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2.5">
                      <Swords className="w-4 h-4 text-red-500 font-bold" />
                      <span>Top Season Head-To-Head Rivalries (Final Tallies)</span>
                    </h4>

                    {wrapSeasonToShow.topRivalries && wrapSeasonToShow.topRivalries.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {wrapSeasonToShow.topRivalries.slice(0, 4).map((r, idx) => {
                          const pct1 = Math.max(5, Math.min(95, Math.round((r.player1Wins / r.totalMatches) * 100)));
                          const pct2 = 100 - pct1;
                          return (
                            <div 
                              key={idx}
                              onClick={() => {
                                // If player exists in active catalog, select them
                                const foundPlayer = players?.find(ap => ap.name === r.player1Name || ap.name === r.player2Name);
                                if (foundPlayer) {
                                  onSelectPlayer(foundPlayer.id);
                                  setWrapSeasonToShow(null);
                                }
                              }}
                              className="bg-slate-900/40 border border-slate-850/80 p-3 rounded-xl flex flex-col justify-between font-mono hover:border-slate-700 hover:bg-slate-900/80 transition-all text-left cursor-pointer group"
                            >
                              <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 font-bold uppercase tracking-widest">
                                <span>Rivalry #{idx + 1}</span>
                                <span className="bg-slate-950 px-1 py-0.2 rounded border border-slate-850 text-yellow-500/90 font-extrabold">{r.totalMatches} Plays</span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-200 mt-2">
                                <div className="truncate w-[42%] flex items-center gap-1">
                                  <span className="shrink-0">{getFlagEmoji(r.player1Nationality)}</span>
                                  <span className="truncate group-hover:text-indigo-400 transition-colors">{r.player1Name.split(' ').pop()}</span>
                                </div>
                                <div className="text-[10px] text-indigo-400 font-black px-1.5 bg-slate-950/70 border border-slate-850 rounded leading-snug whitespace-nowrap">
                                  {r.player1Wins} – {r.player2Wins}
                                </div>
                                <div className="truncate w-[42%] text-right flex items-center gap-1 justify-end">
                                  <span className="truncate group-hover:text-orange-400 transition-colors">{r.player2Name.split(' ').pop()}</span>
                                  <span className="shrink-0">{getFlagEmoji(r.player2Nationality)}</span>
                                </div>
                              </div>

                              <div className="mt-3">
                                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden flex">
                                  <div className="h-full bg-indigo-500" style={{ width: `${pct1}%` }}></div>
                                  <div className="h-full bg-orange-500" style={{ width: `${pct2}%` }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-slate-900/30 rounded-xl border border-dashed border-slate-850/50">
                        <p className="text-[10px] text-slate-500 font-mono">No historical rivalry tallies saved for this season.</p>
                      </div>
                    )}
                  </div>

                </div>

              </div>
              
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 bg-slate-950 p-4 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-500 font-mono">
                💡 Tip: Click any player or major icon to research their detailed dossier biography.
              </span>
              <button
                type="button"
                onClick={() => setWrapSeasonToShow(null)}
                className="bg-slate-850 hover:bg-slate-800 hover:text-white text-slate-200 px-4 py-2 text-xs font-mono font-black tracking-wider rounded-lg border border-slate-800 cursor-pointer transition-colors"
              >
                Close Detailed Wrap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
