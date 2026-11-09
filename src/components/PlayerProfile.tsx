/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Player, Trophy, GymProfile } from '../types';
import { Trophy as TrophyIcon, Shield, Flame, Battery, Compass, Star, TrendingUp, Calendar, Heart, Award, Edit3, Check, X, RefreshCw, User, Search } from 'lucide-react';
import { getSurfaceModifier } from '../engine';
import { hasCompletedPentagon } from '../utils/pentagon';

interface PlayerProfileProps {
  player: Player;
  allPlayers: Player[];
  onBackToDashboard: () => void;
  onUpdatePlayer: (updatedPlayer: Player) => void;
  onSelectPlayer?: (id: string) => void;
  gyms?: GymProfile[];
  calendar?: any[];
  currentSeason?: number;
  seasonHistory?: any[];
}

export default function PlayerProfile({ 
  player, 
  allPlayers, 
  onBackToDashboard, 
  onUpdatePlayer, 
  onSelectPlayer, 
  gyms,
  calendar = [],
  currentSeason = 1,
  seasonHistory = []
}: PlayerProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(player.name);
  const [editedNat, setEditedNat] = useState(player.nationality);
  const [editedPortrait, setEditedPortrait] = useState(player.portraitUrl || '');
  const [editedAbility, setEditedAbility] = useState(player.baseAbility);
  const [editedPotential, setEditedPotential] = useState(player.potential);
  const [editedEndurance, setEditedEndurance] = useState(player.endurance);
  const [editedLongevity, setEditedLongevity] = useState(player.longevity);
  const [editedAge, setEditedAge] = useState(player.age);
  const [editedIsTrickyVulture, setEditedIsTrickyVulture] = useState(player.isTrickyVulture);

  // Gym state
  const getPlayerGymId = () => gyms?.find(g => player.name.endsWith(g.suffix))?.id || 'none';
  const [editedGymId, setEditedGymId] = useState(getPlayerGymId());

  // Tab & H2H filtering/sorting states
  const [profileTab, setProfileTab] = useState<'overview' | 'h2h'>('overview');
  const [h2hSearch, setH2hSearch] = useState('');
  const [playedOnly, setPlayedOnly] = useState(false);
  const [h2hSortBy, setH2hSortBy] = useState<'rank' | 'wins' | 'total' | 'ratio'>('rank');
  const [trophyCabinetSortBy, setTrophyCabinetSortBy] = useState<'date' | 'tier'>('date');

  // Keep state synced when player details change
  useEffect(() => {
    setEditedName(player.name);
    setEditedNat(player.nationality);
    setEditedPortrait(player.portraitUrl || '');
    setEditedAbility(player.baseAbility);
    setEditedPotential(player.potential);
    setEditedEndurance(player.endurance);
    setEditedLongevity(player.longevity);
    setEditedAge(player.age);
    setEditedIsTrickyVulture(player.isTrickyVulture);
    setEditedGymId(getPlayerGymId());
    setProfileTab('overview'); // reset to overview on player switch
    setIsEditing(false);
  }, [player, gyms]);

  const handleSave = () => {
    if (!editedName.trim()) return;

    // Resolve name according to gym selection
    let nameWithoutGym = editedName.trim();
    if (gyms) {
      gyms.forEach(g => {
        if (nameWithoutGym.endsWith(g.suffix)) {
          nameWithoutGym = nameWithoutGym.slice(0, -g.suffix.length).trim();
        }
      });
    }

    // Append new gym suffix
    const selectedGym = gyms?.find(g => g.id === editedGymId);
    const newSuffix = selectedGym ? selectedGym.suffix : '';
    const finalName = `${nameWithoutGym}${newSuffix}`;

    onUpdatePlayer({
      ...player,
      name: finalName,
      nationality: editedNat.trim().toUpperCase().slice(0, 3),
      portraitUrl: editedPortrait.trim() || undefined,
      age: Math.max(15, Math.min(50, Number(editedAge) || player.age)),
      baseAbility: Math.max(1, Math.min(10, editedAbility)),
      potential: Math.max(1, Math.min(10, editedPotential)),
      endurance: Math.max(1, Math.min(10, editedEndurance)),
      longevity: Math.max(1, Math.min(10, editedLongevity)),
      isTrickyVulture: editedIsTrickyVulture,
    });
    setIsEditing(false);
  };

  // Calculate career statistics highlights
  const totalMatches = player.stats.matchWins + player.stats.matchLosses;
  const winRatio = totalMatches > 0 ? (player.stats.matchWins / totalMatches) * 100 : 0;

  // Find some premium stats
  const coreSpecType = player.surfaceProfile.specializationType;
  const coreSpecTier = player.surfaceProfile.specializationTier;

  // Let's get his modifier outputs
  const hardMod = getSurfaceModifier(player, 'Hard');
  const clayMod = getSurfaceModifier(player, 'Clay');
  const grassMod = getSurfaceModifier(player, 'Grass');

  // Compute tournament statistics for record section
  const getTournamentStats = () => {
    const stats: Record<string, { wins: number; finals: number; semis: number; quarters: number; played: number; tier: string; surface: string }> = {};

    // 1. Load any saved career exits from player.careerExits
    if (player.careerExits) {
      Object.entries(player.careerExits).forEach(([name, val]) => {
        let tier = 'Masters 1000';
        let surface = 'Hard';
        if (
          name.includes('Melbourne') || name.includes('Parisian') || name.includes('London') || name.includes('New York') || 
          name.toLowerCase().includes('shakedown') || name.toLowerCase().includes('sand') || name.toLowerCase().includes('herbaceous') || 
          name.toLowerCase().includes('jungle') || name.toLowerCase().includes('lion city') || name.toLowerCase().includes('la terre rouge') || 
          name.toLowerCase().includes('the crown') || name.toLowerCase().includes('the empire')
        ) {
          tier = 'Grand Slam';
        }
        if (name.includes('Parisian') || name.includes('Clay') || name.includes('Sands') || name.includes('Monte Carlo') || name.toLowerCase().includes('la terre rouge')) surface = 'Clay';
        if (name.includes('London') || name.includes('Grass') || name.includes('Herbaceous') || name.toLowerCase().includes('the crown')) surface = 'Grass';
        
        stats[name] = {
          wins: val.wins || 0,
          finals: val.finals || 0,
          semis: val.semis || 0,
          quarters: val.quarters || 0,
          played: val.played || 0,
          tier,
          surface
        };
      });
    }

    // 2. Scan completed tournaments in the current calendar for the active season
    if (calendar && calendar.length > 0) {
      calendar.forEach((week: any) => {
        if (!week.tournaments) return;
        week.tournaments.forEach((t: any) => {
          if (!t.isCompleted || !t.bracket) return;
          
          const played = t.entrants?.includes(player.id) || t.bracket[0]?.some((m: any) => m.player1Id === player.id || m.player2Id === player.id) || false;
          if (!played) return;

          const name = t.name;
          if (!stats[name]) {
            stats[name] = { wins: 0, finals: 0, semis: 0, quarters: 0, played: 0, tier: t.tier, surface: t.surface };
          }

          if (player.careerExits?.[name]) return;

          stats[name].played += 1;

          if (t.winnerId === player.id) {
            stats[name].wins += 1;
          } else if (t.runnerUpId === player.id) {
            stats[name].finals += 1;
          } else {
            const numRounds = t.bracket.length;
            if (numRounds >= 2) {
              const sfRound = t.bracket[numRounds - 2];
              if (sfRound.some((m: any) => m.loserId === player.id)) {
                stats[name].semis += 1;
                return;
              }
            }
            if (numRounds >= 3) {
              const qfRound = t.bracket[numRounds - 3];
              if (qfRound.some((m: any) => m.loserId === player.id)) {
                stats[name].quarters += 1;
                return;
              }
            }
          }
        });
      });
    }

    // 3. Make sure wins are fully consistent with trophyCabinet
    if (player.trophyCabinet) {
      player.trophyCabinet.forEach(trophy => {
        const name = trophy.tournamentName;
        if (!stats[name]) {
          let surface = 'Hard';
          if (name.includes('Clay') || name.includes('Parisian') || name.includes('Sands') || name.includes('Red Sands') || name.toLowerCase().includes('la terre rouge')) surface = 'Clay';
          if (name.includes('Grass') || name.includes('London') || name.includes('Herbaceous') || name.toLowerCase().includes('the crown')) surface = 'Grass';
          stats[name] = { wins: 0, finals: 0, semis: 0, quarters: 0, played: 0, tier: trophy.tierString, surface };
        }
        
        const countFromCabinet = player.trophyCabinet.filter(tc => tc.tournamentName === name).length;
        if (stats[name].wins < countFromCabinet) {
          stats[name].wins = countFromCabinet;
          if (stats[name].played < stats[name].wins) {
            stats[name].played = stats[name].wins;
          }
        }
      });
    }

    return stats;
  };

  const statsMap = getTournamentStats();
  
  const slamData = [
    { name: 'Lion City Slam', label: 'Lion City Slam', surface: 'Hard', style: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { name: 'La Terre Rouge', label: 'La Terre Rouge', surface: 'Clay', style: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { name: 'The Crown', label: 'The Crown', surface: 'Grass', style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'The Empire', label: 'The Empire', surface: 'Hard', style: 'text-slate-200 bg-slate-300/10 border-slate-500/20' }
  ].map(slam => {
    const data = statsMap[slam.name] || statsMap[slam.label] || statsMap[slam.name === 'Lion City Slam' ? 'Melbourne Shakedown' : slam.name === 'La Terre Rouge' ? 'Parisian Red Sands' : slam.name === 'The Crown' ? 'London Herbaceous' : 'New York Concrete Jungle'] || { wins: 0, finals: 0, semis: 0, quarters: 0, played: 0 };
    return {
      name: slam.name,
      label: slam.label,
      surface: slam.surface,
      style: slam.style,
      ...data
    };
  });

  const isSlam = (name: string) => {
    const n = name.toLowerCase();
    return n.includes('melbourne') || n.includes('parisian') || n.includes('london') || n.includes('new york') || n.includes('slam');
  };

  const topNonSlams = Object.entries(statsMap)
    .filter(([name]) => !isSlam(name))
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => b.played - a.played || b.wins - a.wins)
    .slice(0, 5);

  const historyRows = [];
  const totalCompletedSeasons = player.historyRankings ? player.historyRankings.length : 0;
  for (let i = 0; i < totalCompletedSeasons; i++) {
    const seasonNum = i + 1;
    const rank = player.historyRankings[i];
    const pts = player.historyPoints[i] || 0;
    
    const standing = seasonHistory?.find((h: any) => h.seasonNumber === seasonNum)?.topTen.find((st: any) => st.id === player.id);
    
    const wins = player.historyMatchWins?.[i] ?? standing?.stats.matchWins ?? 0;
    const losses = player.historyMatchLosses?.[i] ?? standing?.stats.matchLosses ?? 0;
    const titles = player.historyTitlesCount?.[i] ?? player.trophyCabinet.filter(t => t.season === seasonNum).length ?? 0;
    
    historyRows.push({
      season: seasonNum,
      rank,
      points: pts,
      wins,
      losses,
      titles,
      isOngoing: false
    });
  }
  
  historyRows.push({
    season: currentSeason,
    rank: player.ranking,
    points: player.points,
    wins: player.stats.matchWins,
    losses: player.stats.matchLosses,
    titles: player.trophyCabinet.filter(t => t.season === currentSeason).length,
    isOngoing: true
  });

  const isPentagon = hasCompletedPentagon(player);

  return (
    <div className="space-y-3">
      {/* Profile Header Block */}
      <div className={`rounded p-4 relative overflow-hidden border transition-all ${
        isPentagon
          ? "border-slate-300 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 ring-2 ring-slate-400/40 shadow-[0_0_20px_rgba(226,232,240,0.85)]"
          : "bg-slate-900 border-slate-800"
      }`}>
        {/* Decorative background flare */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 relative z-10">
          <div className="space-y-1.5">
            <button
              id="back-to-dashboard-btn"
              onClick={onBackToDashboard}
              className="text-[10px] text-indigo-400 font-mono font-bold hover:text-indigo-300 transition-colors flex items-center space-x-1 cursor-pointer uppercase"
            >
              <span>← Back to Rankings</span>
            </button>
            
            <div className="flex items-center gap-3">
              {/* Portrait Display with dynamic fallback */}
              {player.portraitUrl ? (
                <img
                  src={player.portraitUrl}
                  alt={player.name}
                  className={`w-14 h-14 rounded object-cover shadow-md transform hover:scale-105 transition-all border-2 ${
                    isPentagon ? 'border-slate-200' : 'border-indigo-500'
                  }`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to initial display on broken images
                    (e.target as any).src = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop";
                  }}
                />
              ) : (
                <div className="w-14 h-14 rounded bg-slate-950 border border-slate-800 shadow-inner flex flex-col items-center justify-center text-slate-400 shrink-0">
                  <User className="w-5 h-5 text-indigo-400" />
                  <span className="text-[8px] font-mono text-slate-500 mt-0.5">{player.nationality}</span>
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <h1 className="text-xl font-bold text-white">{player.name}</h1>
                  {player.isRookie && (
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-mono px-1.5 py-0.2 rounded border border-emerald-500/20 font-bold uppercase tracking-tight">
                      ROOKIE PRODIGY
                    </span>
                  )}
                  {player.isTrickyVulture && (
                    <span className="text-[8px] bg-yellow-500/10 text-yellow-500 font-mono px-1.5 py-0.2 rounded border border-yellow-500/20 font-bold uppercase tracking-tight" title="Decline premium elite events to farm and sweep weaker challenger/minor draws">
                      🦅 TRICKY VULTURE
                    </span>
                  )}
                  {player.isRetired && (
                    <span className="text-[8px] bg-red-500/10 text-red-400 font-mono px-1.5 py-0.2 rounded border border-red-500/20 font-bold uppercase tracking-tight">
                      🕊️ RETIRED LEGEND
                    </span>
                  )}
                  {isPentagon && (
                    <span className="text-[8px] bg-slate-100 text-slate-950 font-black px-1.5 py-0.2 rounded shadow-[0_0_8px_rgba(255,255,255,0.9)] border border-white uppercase tracking-tight animate-pulse">
                      ⬡ PENTAGON LEGEND ⬡
                    </span>
                  )}
                  {(() => {
                    const playerGym = gyms?.find(g => player.name.endsWith(g.suffix));
                    if (!playerGym) return null;
                    return (
                      <span className={`text-[8px] font-mono border px-1.5 py-0.5 rounded uppercase tracking-wider font-extrabold ${
                        playerGym.color === 'sky' ? 'bg-sky-500/15 text-sky-400 border-sky-500/20' :
                        playerGym.color === 'blue' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                        playerGym.color === 'orange' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                        playerGym.color === 'indigo' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' :
                        playerGym.color === 'emerald' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                        playerGym.color === 'amber' ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' :
                        'bg-slate-500/15 text-slate-400 border-slate-500/20'
                      }`}>
                        {playerGym.name}
                      </span>
                    );
                  })()}
                </div>
                
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 font-mono mt-0.5">
                  <span>NAT: <strong className="text-slate-300">{player.nationality}</strong></span>
                  <span>•</span>
                  <span>AGE: <strong className="text-slate-300">{player.age} Yrs</strong></span>
                  <span>•</span>
                  <span>SEASONS: <strong className="text-slate-300">{player.seasonsOnTour}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 items-center">
            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:text-white transition-all text-indigo-400 px-3 py-1.5 rounded text-[10px] font-mono font-bold flex items-center space-x-1.5 cursor-pointer uppercase shadow-sm mr-2"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit PRO Dossier'}</span>
            </button>

            {/* World rank circle */}
            <div className="bg-slate-950 border border-slate-800 p-2 rounded text-center min-w-[85px]">
              <div className="text-[8px] text-slate-500 font-mono uppercase font-bold tracking-wider">
                {player.isRetired ? 'FINAL RANK' : 'CURRENT RANK'}
              </div>
              <div className="text-lg font-black font-mono text-yellow-500 mt-0.5">
                #{player.ranking}
              </div>
            </div>

            {/* Rolling points circle */}
            <div className="bg-slate-950 border border-slate-800 p-2 rounded text-center min-w-[85px]">
              <div className="text-[8px] text-slate-500 font-mono uppercase font-bold tracking-wider">ROLLING POINTS</div>
              <div className="text-lg font-black font-mono text-white mt-0.5">
                {player.points.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Dossier Toggles */}
      <div className="flex border-b border-slate-800 font-mono text-[11.5px] py-1.5 mb-1.5 gap-1.5 shrink-0 select-none">
        <button
          onClick={() => setProfileTab('overview')}
          className={`px-4 py-2 hover:text-white transition-all border-b-2 font-bold cursor-pointer uppercase tracking-tight ${
            profileTab === 'overview'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-500 hover:border-slate-800'
          }`}
        >
          Overview Diagnostics
        </button>
        <button
          id="profile-h2h-tab"
          onClick={() => setProfileTab('h2h')}
          className={`px-4 py-2 hover:text-white transition-all border-b-2 font-bold cursor-pointer uppercase tracking-tight flex items-center space-x-2 ${
            profileTab === 'h2h'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-500 hover:border-slate-800'
          }`}
        >
          <span>Head-to-Head Records</span>
          {Object.keys(player.h2h || {}).length > 0 && (
            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black px-1.5 py-0.2 rounded leading-none shrink-0 font-mono">
              {Object.keys(player.h2h || {}).length}
            </span>
          )}
        </button>
      </div>

      {isEditing && (
        /* EDIT PANEL CONTAINER */
        <div className="bg-slate-900 border border-indigo-500/30 rounded p-4 space-y-4 shadow-lg animate-fadeIn text-slate-200">
          <h3 className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase flex items-center space-x-1 border-b border-slate-800 pb-2">
            <Edit3 className="w-4 h-4 text-indigo-500" />
            <span>MODIFY PRO LEVEL REGISTER DETAIL</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Column 1: Core Fields & Portrait Preview */}
            <div className="space-y-3 md:col-span-2">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase font-bold">Player Name</label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 font-sans focus:outline-none focus:border-indigo-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase font-bold">Nationality</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={editedNat}
                    onChange={(e) => setEditedNat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 text-center uppercase"
                    placeholder="ESP"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase font-bold">Age (Yrs)</label>
                  <input
                    type="number"
                    min={15}
                    max={50}
                    value={editedAge}
                    onChange={(e) => setEditedAge(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 text-center"
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase font-bold">Training Gym Membership</label>
                  <select
                    value={editedGymId}
                    onChange={(e) => setEditedGymId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="none">Independent (No Gym)</option>
                    {gyms?.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.suffix})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase font-bold">Portrait Image URL</label>
                  <input
                    type="text"
                    value={editedPortrait}
                    onChange={(e) => setEditedPortrait(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-100 font-sans focus:outline-none focus:border-indigo-500"
                    placeholder="Paste direct HTTPS portrait image link url"
                  />
                </div>
              </div>

              {/* URL preview hint helper */}
              <div className="flex items-center space-x-2 bg-slate-950/40 p-2 rounded border border-slate-850/50">
                <div className="w-10 h-10 rounded overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center shrink-0">
                  {editedPortrait ? (
                    <img src={editedPortrait} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => (e.target as any).src = "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=200&auto=format&fit=crop"} />
                  ) : <User className="w-5 h-5 text-slate-600" />}
                </div>
                <div className="text-[9px] text-slate-500 leading-tight">
                  <span className="text-slate-400 font-bold block">Portrait Asset Live Sync</span>
                  Paste any direct URL (such as Unsplash, Imgur, or hosting servers) to see immediate pro profile rendering.
                </div>
              </div>

              {/* Special Status Switch: Tricky Vulture */}
              <div className="flex items-center space-x-2 bg-slate-950/40 p-2 rounded border border-slate-850/50">
                <label className="flex items-start space-x-2.5 cursor-pointer select-none py-1 w-full">
                  <input
                    type="checkbox"
                    checked={editedIsTrickyVulture}
                    onChange={(e) => setEditedIsTrickyVulture(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 text-indigo-650 bg-slate-955 cursor-pointer mt-0.5"
                  />
                  <div className="text-[11px] font-bold font-mono text-slate-300 select-none">
                    <span className="text-yellow-500 font-extrabold uppercase">🦅 TRICKY VULTURE STATUS</span>
                    <span className="text-[9px] text-slate-500 block font-normal leading-tight mt-0.5">
                      Check to flag player as a Tricky Vulture. Vultures decline elite events to sweeps weaker draws.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Column 2: Ability Sliders */}
            <div className="space-y-3 col-span-2">
              <div className="grid grid-cols-2 gap-4">
                {/* Base Ability */}
                <div className="space-y-1 font-mono">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-indigo-400">BASE ABILITY</span>
                    <span>{editedAbility} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={editedAbility}
                    onChange={(e) => setEditedAbility(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded cursor-pointer"
                  />
                  <div className="text-[8px] text-slate-500 mt-0.5">Power index impacting overall set control logic.</div>
                </div>

                {/* Potential */}
                <div className="space-y-1 font-mono">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-violet-400">DEVELOPMENT POTENTIAL</span>
                    <span>{editedPotential} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={editedPotential}
                    onChange={(e) => setEditedPotential(Number(e.target.value))}
                    className="w-full accent-violet-500 bg-slate-950 h-1.5 rounded cursor-pointer"
                  />
                  <div className="text-[8px] text-slate-500 mt-0.5">Increases end-of-season upgrade rates for juniors.</div>
                </div>

                {/* Endurance */}
                <div className="space-y-1 font-mono">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-emerald-400">STAMINA ENDURANCE</span>
                    <span>{editedEndurance} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={editedEndurance}
                    onChange={(e) => setEditedEndurance(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-950 h-1.5 rounded cursor-pointer"
                  />
                  <div className="text-[8px] text-slate-500 mt-0.5">Increases physical resistance against hot weather matches.</div>
                </div>

                {/* Longevity */}
                <div className="space-y-1 font-mono">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-amber-400">LONGEVITY RESISTANCE</span>
                    <span>{editedLongevity} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={editedLongevity}
                    onChange={(e) => setEditedLongevity(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-slate-950 h-1.5 rounded cursor-pointer"
                  />
                  <div className="text-[8px] text-slate-500 mt-0.5">Protects senior players from rating decay post 8 seasons.</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-950 hover:bg-slate-850 px-3 py-1.5 rounded hover:text-slate-100 transition-colors cursor-pointer text-[10px] font-mono leading-none flex items-center space-x-1 uppercase text-slate-400"
                >
                  <X className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 px-4 py-1.5 rounded text-black font-black transition-colors cursor-pointer text-[10px] font-mono leading-none flex items-center space-x-1 uppercase"
                >
                  <Check className="w-3 h-3 text-black stroke-[3px]" />
                  <span>Save Profile</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {profileTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Left Panel: Attributes & Surface Bio */}
        <div className="space-y-3">
          
          {/* Base Attributes Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3.5 space-y-3">
            <h3 className="text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center space-x-1.5 font-bold">
              <Star className="w-3.5 h-3.5 text-indigo-400" />
              <span>CORE PHYSICAL PROFILE</span>
            </h3>

            <div className="space-y-2.5 font-mono">
              {/* Base Ability */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>BASE ABILITY</span>
                  <span className="font-extrabold text-slate-200">{player.baseAbility} / 10</span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${player.baseAbility * 10}%` }}></div>
                </div>
              </div>

              {/* Potential */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>DEVELOPMENT POTENTIAL</span>
                  <span className="font-extrabold text-slate-200">{player.potential} / 10</span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${player.potential * 10}%` }}></div>
                </div>
                <p className="text-[9px] text-slate-500 leading-none">Speeds up end-of-season rating gains during young years.</p>
              </div>

              {/* Endurance */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>STAMINA ENDURANCE</span>
                  <span className="font-extrabold text-slate-200">{player.endurance} / 10</span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${player.endurance * 10}%` }}></div>
                </div>
                <p className="text-[9px] text-slate-500 leading-none">Inhibits fatigue &amp; boosts recovery speed.</p>
              </div>

              {/* Longevity */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>LONGEVITY RESISTANCE</span>
                  <span className="font-extrabold text-slate-200">{player.longevity} / 10</span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${player.longevity * 10}%` }}></div>
                </div>
                <p className="text-[9px] text-slate-500 leading-none">Shields veteran players from decay post 8 seasons.</p>
              </div>
            </div>
          </div>

          {/* Surface Specialty modifiers */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3.5 space-y-3">
            <h3 className="text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center space-x-1.5 font-bold">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>SURFACE AFFINITY MODIFIERS</span>
            </h3>

            <div>
              <div className="space-y-1.5 text-[11px] font-mono">
                {/* Surface Type Row */}
                <div className="flex justify-between items-center text-slate-400 py-1 border-b border-slate-950 text-slate-300">
                  <span>Specialty Archetype:</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                    coreSpecType === 'Hard' ? 'text-sky-400 bg-sky-500/5' : coreSpecType === 'Clay' ? 'text-orange-400 bg-orange-500/5' : coreSpecType === 'Grass' ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-400 bg-slate-950'
                  }`}>
                    {coreSpecType} {coreSpecTier !== 'None' ? coreSpecTier : 'Profile'}
                  </span>
                </div>

                {/* Hardcourt output */}
                <div className="flex justify-between items-center text-slate-400 py-0.5 border-b border-slate-950 text-slate-300">
                  <span>Hardcourt Mod:</span>
                  <span className={hardMod > 0 ? 'text-emerald-400 font-extrabold' : hardMod < 0 ? 'text-rose-500' : 'text-slate-500'}>
                    {hardMod > 0 ? `+${hardMod}` : hardMod === 0 ? '0' : hardMod}
                  </span>
                </div>

                {/* Clay output */}
                <div className="flex justify-between items-center text-slate-400 py-0.5 border-b border-slate-950 text-slate-300">
                  <span>Claycourt Mod:</span>
                  <span className={clayMod > 0 ? 'text-emerald-400 font-extrabold' : clayMod < 0 ? 'text-rose-500 font-bold' : 'text-slate-500'}>
                    {clayMod > 0 ? `+${clayMod}` : clayMod === 0 ? '0' : clayMod}
                  </span>
                </div>

                {/* Grasscourt output */}
                <div className="flex justify-between items-center text-slate-400 py-0.5 text-slate-300">
                  <span>Grasscourt Mod:</span>
                  <span className={grassMod > 0 ? 'text-emerald-400 font-extrabold' : grassMod < 0 ? 'text-rose-500 font-bold' : 'text-slate-500'}>
                    {grassMod > 0 ? `+${grassMod}` : grassMod === 0 ? '0' : grassMod}
                  </span>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 font-sans mt-2 pt-2 border-t border-slate-950 leading-tight">
                {coreSpecTier === 'Specialist' && '★ Specialist: Massive +12 specialty, but inflicts extreme debuffs (up to -15) on other surfaces.'}
                {coreSpecTier === 'Master' && '👑 Master: Massive +12 strength on preferred surface, with highly insulated debuffs elsewhere.'}
                {coreSpecTier === 'None' && '★ Neutral gets uniform 0 modifiers across all surfaces, acting as a stable all-rounder.'}
              </div>
            </div>
          </div>

          {/* Surface Performance Records */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3.5 space-y-3">
            <h3 className="text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center space-x-1.5 font-bold">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>SURFACE PERFORMANCE RECORD</span>
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
              {/* Hard */}
              <div className="bg-slate-950 border border-slate-850 p-2 rounded">
                <span className="text-[9px] text-sky-400 uppercase font-bold block">Hard</span>
                <div className="text-xs font-black text-slate-100 mt-1">
                  {player.surfaceStats?.hardWins || 0} - {player.surfaceStats?.hardLosses || 0}
                </div>
                <span className="text-[8px] text-slate-500 block mt-0.5">
                  {((player.surfaceStats?.hardWins || 0) + (player.surfaceStats?.hardLosses || 0)) > 0 
                    ? `${((player.surfaceStats!.hardWins / (player.surfaceStats!.hardWins + player.surfaceStats!.hardLosses)) * 100).toFixed(0)}%`
                    : '0%'}
                </span>
              </div>

              {/* Clay */}
              <div className="bg-slate-950 border border-slate-850 p-2 rounded">
                <span className="text-[9px] text-orange-400 uppercase font-bold block">Clay</span>
                <div className="text-xs font-black text-slate-100 mt-1">
                  {player.surfaceStats?.clayWins || 0} - {player.surfaceStats?.clayLosses || 0}
                </div>
                <span className="text-[8px] text-slate-500 block mt-0.5">
                  {((player.surfaceStats?.clayWins || 0) + (player.surfaceStats?.clayLosses || 0)) > 0 
                    ? `${((player.surfaceStats!.clayWins / (player.surfaceStats!.clayWins + player.surfaceStats!.clayLosses)) * 100).toFixed(0)}%`
                    : '0%'}
                </span>
              </div>

              {/* Grass */}
              <div className="bg-slate-950 border border-slate-850 p-2 rounded">
                <span className="text-[9px] text-emerald-400 uppercase font-bold block">Grass</span>
                <div className="text-xs font-black text-slate-100 mt-1">
                  {player.surfaceStats?.grassWins || 0} - {player.surfaceStats?.grassLosses || 0}
                </div>
                <span className="text-[8px] text-slate-500 block mt-0.5">
                  {((player.surfaceStats?.grassWins || 0) + (player.surfaceStats?.grassLosses || 0)) > 0 
                    ? `${((player.surfaceStats!.grassWins / (player.surfaceStats!.grassWins + player.surfaceStats!.grassLosses)) * 100).toFixed(0)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Center/Right Panel: Season Metrics, Trophy Cabinet Grid, H2H */}
        <div className="lg:col-span-2 space-y-3">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* High Performance Metrics card */}
            <div className="bg-slate-900 border border-slate-800 rounded p-3.5 space-y-3">
              <h3 className="text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center space-x-1.5 font-bold">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                <span>SEASON MATCH METRICS</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2 rounded border border-slate-850 font-mono text-center">
                  <div className="text-[9px] text-slate-500 font-bold">WIN - LOSS</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    {player.stats.matchWins} – {player.stats.matchLosses}
                  </div>
                </div>

                <div className="bg-slate-950 p-2 rounded border border-slate-850 font-mono text-center">
                  <div className="text-[9px] text-slate-500 font-bold">WIN RATIO</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    {winRatio.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-slate-955 p-2 rounded border border-slate-850 font-mono text-center">
                  <div className="text-[9px] text-slate-500 font-bold">SLAM WINS</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    {player.stats.grandSlamWins}
                  </div>
                </div>

                <div className="bg-slate-950 p-2 rounded border border-slate-850 font-mono text-center">
                  <div className="text-[9px] text-slate-500 font-bold">FORM / TIRED</div>
                  <div className="text-sm font-bold text-amber-500 mt-1">
                    {Math.round(player.stats.form)} / {Math.round(player.stats.fatigue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Core physical status state gauges */}
            <div className="bg-slate-900 border border-slate-800 rounded p-3.5 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center space-x-1.5 font-bold">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>ATHLETE PHYSICAL STATUS</span>
                </h3>

                <div className="space-y-3 mt-2">
                  {/* Form Indicator */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">ACTIVE FORM FACTOR</span>
                      <span className="text-emerald-400 font-bold">{Math.round(player.stats.form)}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${player.stats.form}%` }}></div>
                    </div>
                  </div>

                  {/* Fatigue Indicator */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">FATIGUE INDEX</span>
                      <span className={`${player.stats.fatigue > 60 ? 'text-rose-500' : 'text-yellow-500'} font-bold`}>{Math.round(player.stats.fatigue)}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${player.stats.fatigue}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 font-sans border-t border-slate-950 pt-2 leading-tight mt-1">
                Fatigue accumulates rapidly in extreme hot weather events and reduces effectiveness by up to -25 power points. Rest weeks recover this securely.
              </div>
            </div>

            {/* Season Weekly Rank Tracker (Custom SVG line chart!) */}
            {(() => {
              const displayRanks = player.weeklyRankings && player.weeklyRankings.length > 0 
                ? player.weeklyRankings 
                : [player.ranking, player.ranking]; // duplicate to show flat starting line if empty

              const minR = Math.min(...displayRanks);
              const maxR = Math.max(...displayRanks);
              
              // Define adjusted axis bounds so it doesn't clip or look completely flat
              let rMinBound = minR;
              let rMaxBound = maxR;
              if (rMinBound === rMaxBound) {
                rMinBound = Math.max(1, rMinBound - 5);
                rMaxBound = rMaxBound + 5;
              } else {
                rMinBound = Math.max(1, rMinBound - 2);
                rMaxBound = rMaxBound + 2;
              }

              // Build week ticks
              const weekLabels = [];
              const numWeeksAvailable = displayRanks.length;
              if (numWeeksAvailable <= 6) {
                for (let i = 0; i < numWeeksAvailable; i++) {
                  weekLabels.push({ index: i, text: `W${i + 1}` });
                }
              } else {
                weekLabels.push({ index: 0, text: 'W1' });
                const step = Math.floor((numWeeksAvailable - 1) / 4);
                for (let stepIdx = 1; stepIdx < 4; stepIdx++) {
                  const idx = stepIdx * step;
                  if (idx < numWeeksAvailable - 1) {
                    weekLabels.push({ index: idx, text: `W${idx + 1}` });
                  }
                }
                weekLabels.push({ index: numWeeksAvailable - 1, text: `W${numWeeksAvailable}` });
              }

              return (
                <div className="bg-slate-900 border border-slate-800 rounded p-3.5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center space-x-1.5 font-bold">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                        <span>SEASON WEEK-BY-WEEK RANK HISTORY</span>
                      </h3>
                      <p className="text-[9px] text-slate-500 font-sans mt-0.5">Rank progression throughout the active calendar season. High rank curves plot higher.</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 uppercase font-bold">
                        Best: #{minR}
                      </span>
                    </div>
                  </div>

                  {/* Graph plotting area */}
                  <div className="bg-slate-950 p-3 rounded border border-slate-850 relative">
                    <svg viewBox="0 0 500 180" className="w-full h-auto overflow-visible">
                      <defs>
                        <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#818cf8" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                        <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Y-Axis scale tick lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, gridIdx) => {
                        const yVal = 15 + ratio * 130;
                        const valueRepresented = Math.round(rMinBound + ratio * (rMaxBound - rMinBound));
                        return (
                          <g key={gridIdx}>
                            <line 
                              x1="45" 
                              y1={yVal} 
                              x2="480" 
                              y2={yVal} 
                              stroke="#1e293b" 
                              strokeWidth="1" 
                              strokeDasharray="4 4" 
                            />
                            <text 
                              x="35" 
                              y={yVal + 3} 
                              fill="#64748b" 
                              fontSize="8.5" 
                              fontFamily="monospace" 
                              textAnchor="end"
                            >
                              #{valueRepresented}
                            </text>
                          </g>
                        );
                      })}

                      {/* Render line and area fill */}
                      {(() => {
                        const pathPoints = displayRanks.map((rank, idx) => {
                          const x = 50 + (idx / Math.max(1, displayRanks.length - 1)) * 420;
                          // Invert Y-scale mapping: highest rank (smallest index) goes to top (yVal = 15)
                          const y = 15 + ((rank - rMinBound) / (rMaxBound - rMinBound)) * 130;
                          return { x, y };
                        });

                        const linePath = pathPoints.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
                        const fillPath = `${linePath} L ${pathPoints[pathPoints.length - 1].x} 145 L ${pathPoints[0].x} 145 Z`;

                        return (
                          <g>
                            {displayRanks.length > 1 && (
                              <path d={fillPath} fill="url(#chartAreaGrad)" />
                            )}
                            <path 
                              d={linePath} 
                              fill="none" 
                              stroke="url(#chartLineGrad)" 
                              strokeWidth="2.5" 
                              strokeLinecap="round"
                              strokeLinejoin="round" 
                            />
                            {pathPoints.map((pt, pidx) => (
                              <circle
                                key={pidx}
                                cx={pt.x}
                                cy={pt.y}
                                r={pidx === displayRanks.length - 1 ? "4.5" : "2.5"}
                                fill={pidx === displayRanks.length - 1 ? "#34d399" : "#818cf8"}
                                stroke={pidx === displayRanks.length - 1 ? "#020617" : "transparent"}
                                strokeWidth="1.5"
                              />
                            ))}
                          </g>
                        );
                      })()}

                      {/* X-Axis labels */}
                      {weekLabels.map((lbl, lblIdx) => {
                        const x = 50 + (lbl.index / Math.max(1, displayRanks.length - 1)) * 420;
                        return (
                          <text
                            key={lblIdx}
                            x={x}
                            y="165"
                            fill="#64748b"
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="middle"
                            fontWeight="bold"
                          >
                            {lbl.text}
                          </text>
                        );
                      })}
                    </svg>

                    {/* Placeholder hint overlay for un-simulated roster state */}
                    {(!player.weeklyRankings || player.weeklyRankings.length === 0) && (
                      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[0.5px] flex flex-col items-center justify-center text-center p-4">
                        <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-widest bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20 mb-1.5 animate-pulse">
                          Awaiting Weekly Activity
                        </span>
                        <p className="text-[9px] text-slate-500 max-w-[280px] leading-relaxed">
                          No week-to-week rank transitions logged yet in this season. Simulate standard matches with the tournament schedule to visualize their curve!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* Interactive Golden Trophy Cabinet Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-2">
              <h3 className="text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center space-x-1.5 font-bold mb-1 sm:mb-0">
                <TrophyIcon className="w-4 h-4 text-yellow-500 animate-pulse" />
                <span>CAREER CHAMPIONSHIP TROPHY CABINET ({player.trophyCabinet.length} Titles)</span>
              </h3>
              
              <div className="flex items-center space-x-1 font-mono text-[9px] select-none">
                <span className="text-slate-500 mr-1">SORT:</span>
                <button
                  type="button"
                  onClick={() => setTrophyCabinetSortBy('date')}
                  className={`px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                    trophyCabinetSortBy === 'date'
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 font-bold'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  MOST RECENT
                </button>
                <button
                  type="button"
                  onClick={() => setTrophyCabinetSortBy('tier')}
                  className={`px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                    trophyCabinetSortBy === 'tier'
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 font-bold'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  TIER
                </button>
              </div>
            </div>

            {player.trophyCabinet.length === 0 ? (
              <div className="border border-dashed border-slate-800 p-6 rounded text-center font-mono text-slate-600 text-[11px]">
                No official championships or golden trophies collected on tour yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                {(() => {
                  const sortedTrophies = [...player.trophyCabinet].sort((a, b) => {
                    if (trophyCabinetSortBy === 'tier') {
                      const tierPriority = (tier: string) => {
                        if (tier.includes('Grand Slam')) return 1;
                        if (tier.includes('1000')) return 2;
                        if (tier.includes('500')) return 3;
                        if (tier.includes('250')) return 4;
                        return 5;
                      };
                      const prioA = tierPriority(a.tierString);
                      const prioB = tierPriority(b.tierString);
                      if (prioA !== prioB) {
                        return prioA - prioB;
                      }
                    }
                    if (b.season !== a.season) {
                      return b.season - a.season;
                    }
                    const idxA = player.trophyCabinet.indexOf(a);
                    const idxB = player.trophyCabinet.indexOf(b);
                    return idxB - idxA;
                  });

                  return sortedTrophies.map((trophy: Trophy, tIdx: number) => {
                    let badgeColor = 'text-slate-400 bg-slate-950 border-slate-850';
                    if (trophy.tierString === 'Grand Slam') badgeColor = 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30';
                    else if (trophy.tierString === 'Masters 1000') badgeColor = 'text-violet-400 bg-violet-500/10 border-violet-500/20';
                    else if (trophy.tierString === 'Masters 500') badgeColor = 'text-sky-400 bg-sky-500/10 border-sky-500/20';

                    return (
                      <div
                        key={tIdx}
                        className="bg-slate-950 border border-slate-850 rounded p-2 flex items-center space-x-3 relative overflow-hidden group hover:border-yellow-500/40 transition-colors"
                      >
                        <div className="w-8 h-8 rounded bg-yellow-500/5 text-yellow-500 shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center overflow-hidden border border-slate-800">
                          {trophy.trophyUrl ? (
                            <img src={trophy.trophyUrl} alt="Trophy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <TrophyIcon className="w-4 h-4" />
                          )}
                        </div>
                        
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5 leading-none">
                            <span className={`inline-block border text-[8px] uppercase font-mono px-1 rounded ${badgeColor} font-bold leading-none`}>
                              {trophy.tierString.split(' ')[0]}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono font-bold">S{trophy.season}</span>
                          </div>
                          <h4 className="text-[11px] font-bold text-slate-300 mt-1 truncate max-w-[150px] sm:max-w-[200px]" title={trophy.tournamentName}>
                            {trophy.tournamentName}
                          </h4>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Career Tournament Records Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3.5 space-y-3">
            <h3 className="text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center space-x-1.5 font-bold">
              <Award className="w-3.5 h-3.5 text-yellow-500" />
              <span>CAREER TOUR TOURNAMENT RECORDS</span>
            </h3>
            
            <p className="text-[9.5px] font-mono text-slate-500 leading-normal">
              Stat breakdown showing championships, finalist placements, and knockout round exits logged over seasons.
            </p>

            {/* Individual Grand Slams Performance */}
            <div className="space-y-2">
              <h4 className="text-[9px] text-indigo-400 font-mono font-black uppercase tracking-wider">
                Individual Grand Slams
              </h4>
              <div className="overflow-x-auto select-none">
                <table className="w-full text-[10px] font-mono text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[8.5px] font-black uppercase">
                      <th className="py-1 px-1">Tournament</th>
                      <th className="py-1 px-1 text-center">Wins</th>
                      <th className="py-1 px-1 text-center">Finals</th>
                      <th className="py-1 px-1 text-center font-bold text-slate-400">SF Exits</th>
                      <th className="py-1 px-1 text-center font-bold text-slate-400">QF Exits</th>
                      <th className="py-1 px-1 text-center">Played</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slamData.map((slam, idx) => (
                      <tr key={idx} className="border-b border-slate-850 hover:bg-slate-950/20">
                        <td className="py-2.5 px-1 font-bold text-slate-200">
                          <div>{slam.name}</div>
                          <div className="text-[8px] text-slate-500 uppercase mt-0.5 font-normal flex items-center gap-1.5">
                            <span className="font-extrabold text-[7.5px] uppercase border px-1 rounded bg-slate-950 text-indigo-400 border-indigo-500/10">GS</span>
                            <span>{slam.surface} Surface</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-1 text-center">
                          <span className={`text-[11px] font-black ${slam.wins > 0 ? "text-yellow-400 scale-105 inline-block" : "text-slate-600"}`}>
                            {slam.wins}
                          </span>
                        </td>
                        <td className="py-2.5 px-1 text-center">
                          <span className={`text-[11px] font-bold ${slam.finals > 0 ? "text-indigo-400 font-black" : "text-slate-600"}`}>
                            {slam.finals}
                          </span>
                        </td>
                        <td className="py-2.5 px-1 text-center text-slate-400 font-bold">
                          {slam.semis || <span className="text-slate-600">0</span>}
                        </td>
                        <td className="py-2.5 px-1 text-center text-slate-400 font-bold">
                          {slam.quarters || <span className="text-slate-600">0</span>}
                        </td>
                        <td className="py-2.5 px-1 text-center text-slate-500 font-black">
                          {slam.played}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top 5 Regular Tour Events Played */}
            <div className="space-y-2 pt-2 border-t border-slate-850">
              <h4 className="text-[9px] text-indigo-400 font-mono font-black uppercase tracking-wider">
                Top 5 Regular Season Most Played Events
              </h4>
              {topNonSlams.length === 0 ? (
                <div className="py-4 text-center text-[9px] font-mono text-slate-500 uppercase">
                  No regular season tournament record entries recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] font-mono text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-[8.5px] font-black uppercase">
                        <th className="py-1 px-1">Tournament</th>
                        <th className="py-1 px-1 text-center text-yellow-500 font-black">Wins</th>
                        <th className="py-1 px-1 text-center text-indigo-400 font-bold">Finals</th>
                        <th className="py-1 px-1 text-center text-slate-400">SFs</th>
                        <th className="py-1 px-1 text-center text-slate-400">QFs</th>
                        <th className="py-1 px-1 text-center">Played</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topNonSlams.map((tour, idx) => (
                        <tr key={idx} className="border-b border-slate-850 hover:bg-slate-950/20">
                          <td className="py-2 px-1 font-bold text-slate-200">
                            <div className="truncate max-w-[155px]" title={tour.name}>{tour.name}</div>
                            <div className="text-[8px] text-slate-500 uppercase mt-0.5 font-normal flex items-center gap-1.5">
                              <span className="font-bold text-[7.5px] uppercase border px-1 rounded bg-slate-950 text-slate-400 border-slate-800 leading-none">{tour.tier.split(' ')[0]}</span>
                              <span>{tour.surface}</span>
                            </div>
                          </td>
                          <td className="py-2 px-1 text-center text-yellow-400 font-bold">
                            {tour.wins || <span className="text-slate-600 font-normal">0</span>}
                          </td>
                          <td className="py-2 px-1 text-center text-indigo-400 font-bold">
                            {tour.finals || <span className="text-slate-600 font-normal">0</span>}
                          </td>
                          <td className="py-2 px-1 text-center text-slate-400 font-bold">
                            {tour.semis || <span className="text-slate-600 font-normal font-normal font-normal">0</span>}
                          </td>
                          <td className="py-2 px-1 text-center text-slate-400 font-bold">
                            {tour.quarters || <span className="text-slate-600 font-normal font-normal font-normal">0</span>}
                          </td>
                          <td className="py-2 px-1 text-center text-slate-500 font-black">
                            {tour.played}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Historical Record Logs (Seasons Rank Progress) */}
          {player.historyRankings && player.historyRankings.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded p-3.5 space-y-3">
              <h3 className="text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center space-x-1.5 font-bold">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>HISTORIC SEASON STANDINGS</span>
              </h3>
              
              <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-thin">
                {player.historyRankings.map((rank, sIdx) => {
                  const pts = player.historyPoints[sIdx] || 0;
                  return (
                    <div key={sIdx} className="bg-slate-950 border border-slate-850 p-2 rounded min-w-[85px] text-center font-mono">
                      <div className="text-[8px] text-slate-500 font-bold uppercase">SEASON {sIdx + 1}</div>
                      <div className="text-sm font-black text-indigo-400 mt-0.5">#{rank}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{pts.toLocaleString()} PTS</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
        </div>

        {/* Full-width Timeline of Season History results at bottom of Pro Dossier */}
        <div id="career-seasons-timeline" className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-4 mt-3">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Calendar className="w-4 h-4 text-amber-555 fill-amber-500/10" />
            <div>
              <h3 className="text-[11px] text-white font-mono uppercase tracking-widest font-black">
                OVERALL CAREER SEASON STANDINGS HISTORY
              </h3>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                Comprehensive seasonal standings, championship titles, and match performance statistics. Row visual highlight indicates ending a season as No. 1.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {historyRows.map((row, idx) => {
              const rank = row.rank;
              const matchesPlayed = row.wins + row.losses;
              const winRatio = matchesPlayed > 0 ? (row.wins / matchesPlayed) * 100 : 0;
              const isNo1 = rank === 1;

              return (
                <div
                  key={idx}
                  className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border font-mono transition-all duration-300 ${
                    isNo1
                      ? "border-amber-500 bg-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.22)] ring-2 ring-amber-500/40"
                      : "border-slate-850 bg-slate-950/65 hover:bg-slate-950/90"
                  }`}
                >
                  {/* Left Column: Season & Ranking status */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col min-w-[90px]">
                      <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider leading-none">Season Period</span>
                      <span className={`text-[13px] font-bold mt-1.5 ${isNo1 ? "text-amber-400 font-black" : "text-slate-300"}`}>
                        Season {row.season}
                      </span>
                      {row.isOngoing && (
                        <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1 mt-1 uppercase font-bold text-center leading-none tracking-tight">
                          ONGOING ACTIVE
                        </span>
                      )}
                    </div>
                    
                    <div className="h-8 w-[1px] bg-slate-800"></div>

                    <div className="flex flex-col">
                      <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider leading-none">{row.isOngoing ? "Live Rank" : "Year-End Rank"}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-base font-extrabold font-mono tracking-tight ${
                          isNo1 ? "text-amber-400 font-black" : rank <= 10 ? "text-indigo-400" : "text-slate-300"
                        }`}>
                          #{rank}
                        </span>
                        {isNo1 && (
                          <span className="text-xs inline-block animate-bounce" title="End of Season No. 1 Ranking Championship">
                            👑
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Points & Matches statistics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-3 md:mt-0 min-w-[280px]">
                    <div className="flex flex-col md:items-center text-left md:text-center">
                      <span className="text-[8.5px] text-slate-500 uppercase font-black">Rating Points</span>
                      <span className={`text-[12px] font-bold mt-1.5 ${isNo1 ? "text-amber-400 font-black" : "text-slate-300"}`}>
                        {row.points.toLocaleString()} PTS
                      </span>
                    </div>

                    <div className="flex flex-col md:items-center text-left md:text-center">
                      <span className="text-[8.5px] text-slate-500 uppercase font-black font-semibold">Record (W-L)</span>
                      <span className="text-[12px] font-bold text-slate-300 mt-1.5">
                        {row.wins} – {row.losses}
                      </span>
                      {matchesPlayed > 0 && (
                        <span className="text-[8px] text-slate-500 mt-0.5 font-bold uppercase">
                          {winRatio.toFixed(1)}% Ratio
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col md:items-center text-left md:text-center col-span-2 sm:col-span-1">
                      <span className="text-[8.5px] text-slate-500 uppercase font-black">Championship Titles</span>
                      <div className="flex items-center gap-1 justify-start md:justify-center mt-1.5">
                        <span className={`text-[12px] font-bold ${row.titles > 0 ? "text-yellow-400" : "text-slate-600"}`}>
                          {row.titles} {row.titles === 1 ? 'Title' : 'Titles'}
                        </span>
                        {row.titles > 0 && (
                          <TrophyIcon className="w-3.5 h-3.5 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Mini visual decorator or crown flare */}
                  {isNo1 && (
                    <div className="hidden lg:flex items-center justify-end pr-2 bg-gradient-to-r from-amber-500/0 to-amber-500/5 py-1 px-4 rounded-xl border border-amber-500/10">
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[8px] text-amber-400 font-extrabold uppercase tracking-wider">WORLD NO.1 CHAMPION</span>
                        <span className="text-[9px] text-slate-400 mt-0.5 font-bold">Golden Season Glow Awarded</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          {/* Summary Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl font-mono text-center">
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-850">
              <div className="text-[9px] text-slate-500 uppercase font-black">Overall H2H Record</div>
              <div className="text-md font-black text-slate-200 mt-1">
                {allPlayers
                  .filter(opp => opp.id !== player.id)
                  .reduce((sum, opp) => sum + (player.h2h?.[opp.id] || 0), 0)} W – {allPlayers
                  .filter(opp => opp.id !== player.id)
                  .reduce((sum, opp) => sum + (opp.h2h?.[player.id] || 0), 0)} L
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-850">
              <div className="text-[9px] text-slate-500 uppercase font-black">H2H Win Rate</div>
              <div className="text-md font-black mt-1 text-emerald-400">
                {(() => {
                  const wins = allPlayers.filter(opp => opp.id !== player.id).reduce((sum, opp) => sum + (player.h2h?.[opp.id] || 0), 0);
                  const losses = allPlayers.filter(opp => opp.id !== player.id).reduce((sum, opp) => sum + (opp.h2h?.[player.id] || 0), 0);
                  const total = wins + losses;
                  return total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
                })()}%
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-850">
              <div className="text-[9px] text-slate-500 uppercase font-black">Rivals Faced</div>
              <div className="text-md font-black text-indigo-400 mt-1">
                {allPlayers.filter(opp => opp.id !== player.id && ((player.h2h?.[opp.id] || 0) + (opp.h2h?.[player.id] || 0)) > 0).length} / {allPlayers.length - 1}
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-850">
              <div className="text-[9px] text-slate-500 uppercase font-black">Rivals Defeated</div>
              <div className="text-md font-black text-yellow-500 mt-1">
                {allPlayers.filter(opp => opp.id !== player.id && (player.h2h?.[opp.id] || 0) > 0).length} / {allPlayers.length - 1}
              </div>
            </div>
          </div>

          {/* Filter and Control Toolbar */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search rival by name or country..."
                value={h2hSearch}
                onChange={(e) => setH2hSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            </div>

            {/* Toggles and Sorts */}
            <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] text-slate-400 uppercase font-black">
              {/* Played Only Toggle */}
              <label className="flex items-center space-x-2 cursor-pointer select-none border border-slate-800 bg-slate-950 p-1.5 px-3 rounded-lg hover:border-slate-700 transition-all">
                <input
                  type="checkbox"
                  checked={playedOnly}
                  onChange={(e) => setPlayedOnly(e.target.checked)}
                  className="accent-indigo-500"
                />
                <span>Rivals Played Only</span>
              </label>

              {/* Sort selector */}
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Sort By:</span>
                <div className="flex border border-slate-800 bg-slate-950 rounded-lg p-0.5">
                  <button
                    onClick={() => setH2hSortBy('rank')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${h2hSortBy === 'rank' ? 'bg-indigo-600 text-black font-extrabold' : 'hover:text-white'}`}
                  >
                    Rank
                  </button>
                  <button
                    onClick={() => setH2hSortBy('wins')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${h2hSortBy === 'wins' ? 'bg-indigo-600 text-black font-extrabold' : 'hover:text-white'}`}
                  >
                    Wins
                  </button>
                  <button
                    onClick={() => setH2hSortBy('total')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${h2hSortBy === 'total' ? 'bg-indigo-600 text-black font-extrabold' : 'hover:text-white'}`}
                  >
                    Played
                  </button>
                  <button
                    onClick={() => setH2hSortBy('ratio')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${h2hSortBy === 'ratio' ? 'bg-indigo-600 text-black font-extrabold' : 'hover:text-white'}`}
                  >
                    Win %
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Rivals Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 font-mono text-[9px] text-slate-500 uppercase tracking-wider border-b border-slate-850">
                    <th className="py-2.5 px-4 font-black">Rival Opponent</th>
                    <th className="py-2.5 px-3 font-black text-center">Power / Specialty</th>
                    <th className="py-2.5 px-3 font-black text-center">Seasons Age</th>
                    <th className="py-2.5 px-3 font-black text-center">H2H Record</th>
                    <th className="py-2.5 px-3 font-black">Record % Distribution</th>
                    <th className="py-2.5 px-4 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {(() => {
                    const opponentsList = allPlayers
                      .filter(opp => opp.id !== player.id)
                      .map(opp => {
                        const wins = player.h2h?.[opp.id] || 0;
                        const losses = opp.h2h?.[player.id] || 0;
                        const total = wins + losses;
                        const pct = total > 0 ? (wins / total) * 100 : 0;
                        return {
                          opponent: opp,
                          wins,
                          losses,
                          total,
                          pct
                        };
                      });

                    const filteredOpponents = opponentsList
                      .filter(item => {
                        if (playedOnly && item.total === 0) return false;
                        if (h2hSearch.trim()) {
                          const query = h2hSearch.toLowerCase();
                          return (
                            item.opponent.name.toLowerCase().includes(query) ||
                            item.opponent.nationality.toLowerCase().includes(query)
                          );
                        }
                        return true;
                      })
                      .sort((a, b) => {
                        if (h2hSortBy === 'wins') {
                          return b.wins - a.wins || a.opponent.ranking - b.opponent.ranking;
                        }
                        if (h2hSortBy === 'total') {
                          return b.total - a.total || a.opponent.ranking - b.opponent.ranking;
                        }
                        if (h2hSortBy === 'ratio') {
                          return b.pct - a.pct || b.total - a.total || a.opponent.ranking - b.opponent.ranking;
                        }
                        return a.opponent.ranking - b.opponent.ranking;
                      });

                    if (filteredOpponents.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                            No matching rival records or match history logs catalogued.
                          </td>
                        </tr>
                      );
                    }

                    return filteredOpponents.map((item) => {
                      const o = item.opponent;
                      const hasImage = !!o.portraitUrl;
                      return (
                        <tr key={o.id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-xs text-yellow-500 font-black">
                                #{o.ranking}
                              </span>
                              <div className="w-8 h-8 rounded border border-slate-800 overflow-hidden bg-slate-950 shrink-0 select-none">
                                {hasImage ? (
                                  <img src={o.portraitUrl} alt={o.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-950 text-[10px] text-indigo-400 font-bold font-mono">
                                    {o.nationality}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-200 hover:text-indigo-400 cursor-pointer flex items-center gap-1.5" onClick={() => onSelectPlayer && onSelectPlayer(o.id)}>
                                  <span>{o.name}</span>
                                  {o.isRookie && (
                                    <span className="text-[7px] bg-emerald-500/15 text-emerald-400 font-mono px-1 rounded border border-emerald-500/10 uppercase leading-none font-black">
                                      R
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 mt-0.5 uppercase">
                                  Nationality: <strong className="text-slate-400 font-bold">{o.nationality}</strong>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="text-xs font-mono font-bold text-slate-300 flex flex-col items-center justify-center">
                              <span className="text-amber-500">{o.baseAbility} STR</span>
                              <span className={`text-[8.5px] uppercase mt-0.5 px-1 py-0.2 rounded font-black ${
                                o.surfaceProfile.specializationType === 'Hard' ? 'text-sky-400 bg-sky-500/5' : o.surfaceProfile.specializationType === 'Clay' ? 'text-orange-400 bg-orange-500/5' : o.surfaceProfile.specializationType === 'Grass' ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-500 bg-slate-950'
                              }`}>
                                {o.surfaceProfile.specializationType} {o.surfaceProfile.specializationTier !== 'None' ? o.surfaceProfile.specializationTier : ''}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="text-xs font-mono text-slate-300">
                              <div className="font-bold">{o.age} YRS</div>
                              <div className="text-[9px] text-slate-500 uppercase">Season {o.seasonsOnTour}</div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center font-mono">
                            <div className="text-xs font-black text-slate-100">
                              {item.wins} W – {item.losses} L
                            </div>
                            <div className="text-[9.5px] font-bold text-slate-500 mt-0.5">
                              {item.total > 0 ? `${item.pct.toFixed(0)}% WIN` : 'Unplayed'}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {item.total > 0 ? (
                              <div className="space-y-1">
                                <div className="width-[100px] h-2 bg-rose-950 rounded overflow-hidden flex">
                                  <div className="h-full bg-emerald-500 border-r border-slate-950" style={{ width: `${item.pct}%` }}></div>
                                  <div className="h-full bg-rose-500" style={{ width: `${100 - item.pct}%` }}></div>
                                </div>
                                <div className="flex justify-between font-mono text-[8px] text-slate-500">
                                  <span>{item.wins} Wins</span>
                                  <span>{item.losses} Losses</span>
                                </div>
                              </div>
                            ) : (
                              <span className="font-mono text-[9px] text-slate-600 uppercase">No Matches Logged</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                if (onSelectPlayer) {
                                  onSelectPlayer(o.id);
                                  // Switch to overview tab for the newly selected player
                                  setProfileTab('overview');
                                }
                              }}
                              className="bg-slate-950 hover:bg-indigo-650 hover:text-black text-indigo-400 border border-slate-850 px-2 py-1 rounded text-[9px] font-mono font-black uppercase transition-all duration-200 cursor-pointer"
                            >
                              Dossier →
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
