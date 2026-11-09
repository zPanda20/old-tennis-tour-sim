/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Player, GymProfile } from '../types';
import { getRivalries } from '../utils/rivalry';
import { getFlagEmoji } from './TourDashboard';
import { BarChart3, Award, Flame, Library, Activity, ShieldAlert, Sparkles, UserCheck, Trophy as TrophyIcon, Edit3, Check, X, Camera, MapPin, Calendar, Building2, Plus, UserPlus, Swords } from 'lucide-react';

interface GameStatsProps {
  players: Player[];
  retiredPlayers?: Player[];
  currentSeason: number;
  endOfYearTrophyUrl: string;
  onUpdateEndOfYearTrophy: (url: string) => void;
  gyms: GymProfile[];
  onUpdateGyms: (updatedGyms: GymProfile[]) => void;
  onUpdatePlayer: (updatedPlayer: Player) => void;
}

export default function GameStats({
  players,
  retiredPlayers = [],
  currentSeason,
  endOfYearTrophyUrl,
  onUpdateEndOfYearTrophy,
  gyms,
  onUpdateGyms,
  onUpdatePlayer
}: GameStatsProps) {
  const [isEditingTrophy, setIsEditingTrophy] = useState(false);
  const [trophyUrlInput, setTrophyUrlInput] = useState(endOfYearTrophyUrl);

  const [subTab, setSubTab] = useState<'insights' | 'gyms' | 'rivalries'>('insights');
  const [rivalryQuery, setRivalryQuery] = useState('');
  const [editingGymId, setEditingGymId] = useState<string | null>(null);
  const [gymEditName, setGymEditName] = useState('');
  const [gymEditLocation, setGymEditLocation] = useState('');
  const [gymEditFounded, setGymEditFounded] = useState(2015);
  const [gymEditLogo, setGymEditLogo] = useState('');
  const [gymEditSuffix, setGymEditSuffix] = useState('');
  const [assigningGymId, setAssigningGymId] = useState<string | null>(null);
  const [playerToAssignId, setPlayerToAssignId] = useState('');

  const number1Player = players.find(p => p.ranking === 1) || players[0];

  const handleSaveTrophy = () => {
    onUpdateEndOfYearTrophy(trophyUrlInput.trim());
    setIsEditingTrophy(false);
  };

  const handleEditGym = (gym: GymProfile) => {
    setEditingGymId(gym.id);
    setGymEditName(gym.name);
    setGymEditSuffix(gym.suffix);
    setGymEditLocation(gym.location);
    setGymEditFounded(gym.foundedYear);
    setGymEditLogo(gym.logoUrl || '');
  };

  const handleSaveGym = (gymId: string) => {
    const gymBefore = gyms.find(g => g.id === gymId);
    if (!gymBefore) return;

    const oldSuffix = gymBefore.suffix;
    let targetSuffix = gymEditSuffix.trim();
    if (targetSuffix && !targetSuffix.startsWith('-')) {
      targetSuffix = `-${targetSuffix}`;
    }

    const updated = gyms.map(g => {
      if (g.id === gymId) {
        return {
          ...g,
          name: gymEditName.trim(),
          suffix: targetSuffix || g.suffix,
          location: gymEditLocation.trim(),
          foundedYear: Number(gymEditFounded) || g.foundedYear,
          logoUrl: gymEditLogo.trim() || undefined
        };
      }
      return g;
    });

    onUpdateGyms(updated);

    // Propagate suffix renaming to matching active players immediately
    if (oldSuffix !== targetSuffix && targetSuffix) {
      players.forEach(p => {
        if (p.name.endsWith(oldSuffix)) {
          const stripped = p.name.slice(0, -oldSuffix.length).trim();
          onUpdatePlayer({
            ...p,
            name: `${stripped}${targetSuffix}`
          });
        }
      });
    }

    setEditingGymId(null);
  };

  const handleAssignPlayerToGym = (gymSuffix: string) => {
    const playerToAssign = players.find(p => p.id === playerToAssignId);
    if (!playerToAssign) return;

    // Change their gym membership: strip previous suffix, append new one
    let cleanName = playerToAssign.name;
    gyms.forEach(g => {
      if (cleanName.endsWith(g.suffix)) {
        cleanName = cleanName.slice(0, -g.suffix.length).trim();
      }
    });

    const finalName = gymSuffix ? `${cleanName}${gymSuffix}` : cleanName;

    onUpdatePlayer({
      ...playerToAssign,
      name: finalName
    });

    setPlayerToAssignId('');
    setAssigningGymId(null);
  };

  // 1. Sort players by trophy count
  const titleHolders = [...players]
    .filter(p => p.trophyCabinet.length > 0)
    .sort((a, b) => b.trophyCabinet.length - a.trophyCabinet.length)
    .slice(0, 5);

  // 2. Sort players by match win ratio
  const winPratHolders = [...players]
    .filter(p => (p.stats.matchWins + p.stats.matchLosses) >= 5)
    .sort((a, b) => {
      const rA = a.stats.matchWins / (a.stats.matchWins + a.stats.matchLosses);
      const rB = b.stats.matchWins / (b.stats.matchWins + b.stats.matchLosses);
      return rB - rA;
    })
    .slice(0, 5);

  // 3. Count specs
  const countSpec = (surf: string) => players.filter(p => p.surfaceProfile.specializationType === surf).length;
  const hardCount = countSpec('Hard');
  const clayCount = countSpec('Clay');
  const grassCount = countSpec('Grass');
  const neutralCount = countSpec('Neutral');
  const totalCount = players.length;

  // 4. Young rookies lists
  const juniors = [...players]
    .filter(p => p.age <= 21)
    .sort((a, b) => a.ranking - b.ranking)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Sub-tab Navigation */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-lg max-w-md p-1">
        <button
          type="button"
          onClick={() => setSubTab('insights')}
          className={`flex-1 py-1.5 px-3 text-center text-xs font-mono font-bold uppercase rounded cursor-pointer transition-all ${
            subTab === 'insights'
              ? 'bg-indigo-600 text-slate-950 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📈 League Insights
        </button>
        <button
          id="gyms-tab-btn"
          type="button"
          onClick={() => setSubTab('gyms')}
          className={`flex-1 py-1.5 px-3 text-center text-xs font-mono font-bold uppercase rounded cursor-pointer transition-all ${
            subTab === 'gyms'
              ? 'bg-indigo-600 text-slate-950 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🎾 Gyms & Academies
        </button>
        <button
          id="rivalries-tab-btn"
          type="button"
          onClick={() => setSubTab('rivalries')}
          className={`flex-1 py-1.5 px-3 text-center text-xs font-mono font-bold uppercase rounded cursor-pointer transition-all ${
            subTab === 'rivalries'
              ? 'bg-indigo-600 text-slate-950 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚔️ Rivalries
        </button>
      </div>

      {subTab === 'insights' && (
        <div className="space-y-6">
          {/* Dynamic World Number 1 Trophy & Designation Spotlight Card */}
          {number1Player && (
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-yellow-500/20 rounded-xl p-5 md:p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-6 justify-between relative z-10">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  {/* World No.1 Trophy Asset */}
                  <div className="w-24 h-24 rounded-lg bg-yellow-500/5 border border-yellow-500/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                    {endOfYearTrophyUrl ? (
                      <img src={endOfYearTrophyUrl} alt="Year-End World No.1 Trophy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <TrophyIcon className="w-12 h-12 text-yellow-500 animate-pulse" />
                    )}
                  </div>

                  <div>
                    <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[9px] uppercase font-mono border border-yellow-500/20 rounded font-black tracking-widest mb-2">
                      <TrophyIcon className="w-3 h-3" />
                      <span>PRESTIGIOUS WORLD NO.1 CHAMPION</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-100 font-sans tracking-tight leading-tight">
                      {number1Player.name}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Nationality: <span className="text-slate-200">{number1Player.nationality}</span> | Age: <span className="text-slate-200">{number1Player.age} Seasons</span> | Base Power: <span className="text-amber-500 font-semibold">{number1Player.baseAbility} STR</span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1.5">
                      Points: <span className="text-yellow-500 font-bold">{Math.round(number1Player.points)} PTS</span> | S{currentSeason} Titles: <span className="text-slate-300 font-bold">{number1Player.trophyCabinet.length}</span>
                    </p>
                  </div>
                </div>

                {/* Custom Trophy Manager and Link Input Trigger */}
                <div className="w-full md:w-auto text-right font-mono text-xs">
                  {!isEditingTrophy ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingTrophy(true)}
                      className="w-full md:w-auto bg-slate-900 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-lg font-bold hover:border-yellow-500/40 hover:text-white transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-yellow-500" />
                      <span>Customize #1 Trophy Image</span>
                    </button>
                  ) : (
                    <div className="bg-slate-950 p-3 rounded-lg border border-yellow-500/20 text-left space-y-2 mt-2 w-full md:w-80">
                      <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">END-OF-YEAR #1 TROPHY IMAGE URL</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:border-yellow-500/40 focus:outline-none"
                        placeholder="https://example.com/trophy_cup.png"
                        value={trophyUrlInput}
                        onChange={(e) => setTrophyUrlInput(e.target.value)}
                      />
                      <div className="flex gap-1.5 text-[9px] uppercase justify-end pt-1">
                        <button type="button" onClick={() => setIsEditingTrophy(false)} className="px-2 py-1 rounded bg-slate-900 hover:text-white text-slate-400 border border-slate-800">Cancel</button>
                        <button type="button" onClick={handleSaveTrophy} className="px-2.5 py-1 rounded bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold flex items-center space-x-0.5">
                          <Check className="w-3 h-3 stroke-[3px]" />
                          <span>Save URL</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Tour Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Surface breakdown stats dashboard */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs text-slate-400 font-mono tracking-wider uppercase flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>SURFACE SPECIALIST FRACTIONS</span>
              </h3>

              <div className="space-y-3 font-mono text-xs">
                {/* Hardcourt */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>HARDCOURT SPECIALISTS</span>
                    <span>{hardCount} / {totalCount}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(hardCount / totalCount) * 100}%` }}></div>
                  </div>
                </div>

                {/* Clay */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>CLAYCOURT SPECIALISTS</span>
                    <span>{clayCount} / {totalCount}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(clayCount / totalCount) * 100}%` }}></div>
                  </div>
                </div>

                {/* Grass */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>GRASSLAWN SPECIALISTS</span>
                    <span>{grassCount} / {totalCount}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(grassCount / totalCount) * 100}%` }}></div>
                  </div>
                </div>

                {/* Neutral */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>NEUTRAL ALL-ROUNDERS</span>
                    <span>{neutralCount} / {totalCount}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-500 rounded-full" style={{ width: `${(neutralCount / totalCount) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Trophy Holders List */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs text-slate-400 font-mono tracking-wider uppercase flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5 text-yellow-500" />
                <span>SEASON TITLE LEADERS</span>
              </h3>

              <div className="space-y-2">
                {titleHolders.length === 0 ? (
                  <div className="text-slate-600 text-xs font-mono py-4">No championship titles crowned yet this season.</div>
                ) : (
                  titleHolders.map((p, idx) => (
                    <div key={p.id} className="flex justify-between items-center text-xs text-slate-300 py-1.5 border-b border-slate-900 last:border-0 font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">#{idx + 1}</span>
                        <span className="text-slate-100 font-bold">{p.name}</span>
                      </div>
                      <span className="text-yellow-500 font-black">{p.trophyCabinet.length} Trophies</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Highest Winning ratios list */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs text-slate-400 font-mono tracking-wider uppercase flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>TOP MATCH WIN RATIOS</span>
              </h3>

              <div className="space-y-2">
                {winPratHolders.length === 0 ? (
                  <div className="text-slate-600 text-xs font-mono py-4">No match win records recorded. Start sims.</div>
                ) : (
                  winPratHolders.map((p, idx) => {
                    const wins = p.stats.matchWins;
                    const total = wins + p.stats.matchLosses;
                    const pct = total > 0 ? (wins / total) * 100 : 0;
                    return (
                      <div key={p.id} className="flex justify-between items-center text-xs text-slate-300 py-1.5 border-b border-slate-900 last:border-0 font-mono">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-500">#{idx + 1}</span>
                          <span className="text-slate-100 font-bold">{p.name}</span>
                        </div>
                        <span className="text-emerald-400 font-extrabold">{pct.toFixed(1)}% ({wins}/{total})</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Row 2: Next Gen Rookies under observation */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs text-slate-400 font-mono tracking-wider uppercase flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>ACTIVE NEXT-GEN ROOKIE REPORT (AGEES ≤ 21, BEST TOUR RANKINGS)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {juniors.map((p, idx) => {
                const spec = p.surfaceProfile.specializationType;
                return (
                  <div key={p.id} className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-850 p-4 rounded-xl text-center relative overflow-hidden font-mono text-xs">
                    <div className="absolute right-1 top-1 bg-violet-500/10 text-violet-400 text-[8px] font-bold border border-violet-500/20 px-1 rounded">
                      AGE {p.age}
                    </div>

                    <div className="text-slate-500 uppercase mt-1">RANK</div>
                    <div className="text-xl font-black text-violet-400 my-1">
                      #{p.ranking}
                    </div>

                    <div className="font-sans font-bold text-slate-200 mt-1.5 truncate" title={p.name}>
                      {p.name}
                    </div>
                    
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.nationality} | Ability: {p.baseAbility}</div>
                    <div className="text-[9px] text-violet-500 font-extrabold mt-1 uppercase border border-violet-500/15 p-1 rounded-sm bg-violet-500/5">
                      Potential {p.potential} / 10
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {subTab === 'gyms' && (
        /* GYMS & ACADEMIES TAB CONTENT */
        <div id="gyms-list-view" className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Training Gyms & Academies Profiles</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl font-mono leading-relaxed">
              Players on tour can belong to specialized training gyms. Gym status is dynamically recognized by name suffix (e.g., <code className="text-yellow-500 font-bold">-zera</code> or <code className="text-yellow-500 font-bold">-cold</code>). Select any academy below to edit its profile and draft or release members.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gyms.map((gym) => {
              // Extract members based on dyn suffix
              const members = players.filter(p => p.name.endsWith(gym.suffix));
              const avgAbility = members.length > 0 ? (members.reduce((sum, p) => sum + p.baseAbility, 0) / members.length) : 0;
              const topRep = members.length > 0 ? [...members].sort((a, b) => a.ranking - b.ranking)[0] : null;

              const isEditingThisGym = editingGymId === gym.id;

              return (
                <div key={gym.id} className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden flex flex-col shadow-lg transition-transform hover:translate-y-[-2px] duration-300">
                  {/* Gym Accent Header Block */}
                  <div className={`h-1.5 w-full ${
                    gym.color === 'sky' ? 'bg-sky-500' :
                    gym.color === 'blue' ? 'bg-blue-500' :
                    gym.color === 'orange' ? 'bg-orange-500' :
                    gym.color === 'indigo' ? 'bg-indigo-500' :
                    gym.color === 'emerald' ? 'bg-emerald-500' :
                    gym.color === 'amber' ? 'bg-amber-500' :
                    'bg-slate-500'
                  }`}></div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      {/* Brand Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center shrink-0">
                            {gym.logoUrl ? (
                              <img src={gym.logoUrl} alt={gym.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => (e.target as any).src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100&auto=format"} />
                            ) : (
                              <Building2 className="w-5 h-5 text-indigo-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-100 uppercase tracking-wide truncate" title={gym.name}>
                              {gym.name}
                            </h4>
                            <span className="inline-block mt-0.5 text-[8.5px] bg-slate-900 border border-slate-800 font-mono text-indigo-400 px-1.5 py-0.2 rounded font-black uppercase">
                              {gym.suffix}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEditGym(gym)}
                          className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1 shrink-0 bg-slate-900/50 hover:bg-slate-900 rounded border border-slate-800"
                          title="Modify Gym profile"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        </button>
                      </div>

                      {/* Display Info or Edit Form */}
                      {isEditingThisGym ? (
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2.5 text-[11px] font-mono">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2 space-y-1">
                              <label className="text-[8px] text-slate-400 font-bold block uppercase">GYM NAME</label>
                              <input
                                type="text"
                                value={gymEditName}
                                onChange={(e) => setGymEditName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] text-slate-400 font-bold block uppercase">SUFFIX</label>
                              <input
                                type="text"
                                value={gymEditSuffix}
                                onChange={(e) => setGymEditSuffix(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 focus:border-indigo-500 focus:outline-none"
                                placeholder="-suffix"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[8px] text-slate-400 font-bold block uppercase">LOCATION</label>
                              <input
                                type="text"
                                value={gymEditLocation}
                                onChange={(e) => setGymEditLocation(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] text-slate-400 font-bold block uppercase">ESTABLISHED</label>
                              <input
                                type="number"
                                value={gymEditFounded}
                                onChange={(e) => setGymEditFounded(Number(e.target.value) || 2015)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center text-slate-100 focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-400 font-bold block uppercase">LOGO URL</label>
                            <input
                              type="text"
                              value={gymEditLogo}
                              onChange={(e) => setGymEditLogo(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-1.5 justify-end pt-2 border-t border-slate-850">
                            <button type="button" onClick={() => setEditingGymId(null)} className="px-2 py-1 text-[9px] bg-slate-950 rounded text-slate-400 font-bold hover:text-white">Cancel</button>
                            <button type="button" onClick={() => handleSaveGym(gym.id)} className="px-2.5 py-1 text-[9px] bg-indigo-600 rounded text-black font-black flex items-center space-x-0.5">
                              <Check className="w-2.5 h-2.5 text-black stroke-[3px]" />
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Info bar */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate" title={gym.location}>{gym.location}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 justify-end">
                              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>EST. {gym.foundedYear}</span>
                            </div>
                          </div>

                          {/* Stat Grid */}
                          <div className="grid grid-cols-3 gap-1.5 bg-slate-900/60 border border-slate-900 rounded-lg p-2 text-center font-mono text-[10px]">
                            <div className="border-r border-slate-900">
                              <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-tight">MEMBERS</span>
                              <strong className="block text-indigo-400 text-xs font-black mt-0.5">{members.length} PRO</strong>
                            </div>
                            <div className="border-r border-slate-900">
                              <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-tight">AVG POWER</span>
                              <strong className="block text-amber-500 text-xs font-black mt-0.5">{avgAbility > 0 ? avgAbility.toFixed(1) : 'N/A'}</strong>
                            </div>
                            <div>
                              <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-tight">TOP RANK</span>
                              <strong className="block text-white text-xs font-black mt-0.5">{topRep ? `#${topRep.ranking}` : 'N/A'}</strong>
                            </div>
                          </div>

                          {topRep && (
                            <div className="text-[10px] font-mono flex justify-between items-center bg-slate-900/40 px-2.5 py-1.5 rounded border border-slate-900">
                              <span className="text-slate-500 uppercase text-[8.5px] font-black">Star Athlete:</span>
                              <span className="text-yellow-500 font-black truncate max-w-[150px]">{topRep.name}</span>
                            </div>
                          )}

                          {/* Member roster list */}
                          <div className="space-y-1">
                            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono"> Roster Member List ({members.length})</span>
                            <div className="h-28 overflow-y-auto rounded bg-slate-950/80 border border-slate-901 px-2.5 py-1 scrollbar-thin text-[10px] font-mono space-y-1">
                              {members.length === 0 ? (
                                <div className="text-slate-600 text-center py-8">No athletes drafted in this camp.</div>
                              ) : (
                                members.map(p => (
                                  <div key={p.id} className="flex justify-between items-center py-1 border-b border-slate-900 last:border-0 hover:bg-slate-900/40 px-1 rounded">
                                    <span className="text-slate-300 font-bold truncate max-w-[125px]">{p.name.replace(gym.suffix, '')}</span>
                                    <span className="text-indigo-400 font-extrabold shrink-0">#{p.ranking}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Assign panel */}
                    {!isEditingThisGym && (
                      <div className="pt-2 border-t border-slate-900 mt-2">
                        {assigningGymId === gym.id ? (
                          <div className="flex gap-1 items-center font-mono text-[10px]">
                            <select
                              value={playerToAssignId}
                              onChange={(e) => setPlayerToAssignId(e.target.value)}
                              className="flex-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-100"
                            >
                              <option value="">-- Choose Roster --</option>
                              {players
                                .filter(p => !p.name.endsWith(gym.suffix))
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(p => (
                                  <option key={p.id} value={p.id}>
                                    #{p.ranking} {p.name}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleAssignPlayerToGym(gym.suffix)}
                              disabled={!playerToAssignId}
                              className="px-2.5 py-1 bg-indigo-600 font-extrabold text-slate-950 hover:bg-indigo-500 rounded cursor-pointer shrink-0"
                            >
                              Draft
                            </button>
                            <button
                              type="button"
                              onClick={() => setAssigningGymId(null)}
                              className="p-1 text-slate-500 hover:text-white cursor-pointer shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAssigningGymId(gym.id);
                              setPlayerToAssignId('');
                            }}
                            className="w-full text-center text-[10px] font-mono border border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/10 hover:text-indigo-400 py-1.5 rounded transition-all flex items-center justify-center space-x-1 text-slate-500 cursor-pointer uppercase"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Draft Athlete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Action: Release Member back to Independent Roster */}
          <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-200">Academy Releases Center</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Quickly transfer any gym member back to an Independent un-affiliated status on the professional tour.</p>
            </div>
            
            <div className="flex gap-2 items-center flex-wrap">
              <select
                id="release-player-select"
                className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200"
                defaultValue=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const p = players.find(x => x.id === val);
                  if (p) {
                    // Strip credentials suffix
                    const GYM_SUFFIX_REGEX = /-(zera|cold|fury|zone|edge|apex)$/;
                    const cleanName = p.name.replace(GYM_SUFFIX_REGEX, '').trim();
                    onUpdatePlayer({ ...p, name: cleanName });
                  }
                  e.target.value = "";
                }}
              >
                <option value="" disabled>-- Select Member to Release --</option>
                {players
                  .filter(p => /-(zera|cold|fury|zone|edge|apex)$/.test(p.name))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.ranking} {p.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {subTab === 'rivalries' && (
        <div className="space-y-6 animate-fadeIn text-slate-100">
          {/* Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Swords className="w-5 h-5 text-red-500" />
              <span>Elite Head-To-Head Tour Rivalries</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl font-mono leading-relaxed">
              These are the most frequent and intense face-offs on the tour. Head-to-head records are compiled automatically from all season tournament matchups, including historic matches with retired legends.
            </p>
          </div>

          {/* Statistics summary row */}
          {(() => {
            const allRivalries = getRivalries([...players, ...retiredPlayers]);
            const totalRivalriesCount = allRivalries.length;
            const topMatch = allRivalries[0];
            
            // To find the closest intense rivalry with at least 4 matches
            const intenseMatch = [...allRivalries]
              .filter(r => r.totalMatches >= 4)
              .sort((a, b) => {
                const diffA = Math.abs(a.player1Wins - a.player2Wins);
                const diffB = Math.abs(b.player1Wins - b.player2Wins);
                if (diffA !== diffB) return diffA - diffB; // closer first
                return b.totalMatches - a.totalMatches; // more matches first
              })[0] || (allRivalries.length > 0 ? allRivalries[0] : null);

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Tracked Matchups</span>
                  <strong className="text-2xl font-black text-indigo-400 block mt-1">{totalRivalriesCount} Unique Pairs</strong>
                  <span className="text-[10px] text-slate-500 block mt-1">Across all seasons</span>
                </div>

                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Most Frequent Battleground</span>
                  {topMatch ? (
                    <>
                      <strong className="text-sm font-bold text-slate-100 block mt-1 truncate" title={`${topMatch.player1Name} vs ${topMatch.player2Name}`}>
                        {topMatch.player1Name.split(' ').pop()} vs {topMatch.player2Name.split(' ').pop()}
                      </strong>
                      <span className="text-[11px] text-yellow-500 font-extrabold block mt-0.5">
                        {topMatch.totalMatches} matches ({topMatch.player1Wins} – {topMatch.player2Wins})
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-600 block mt-2">No matches played yet</span>
                  )}
                </div>

                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Closest Gridlocked Rivalry</span>
                  {intenseMatch ? (
                    <>
                      <strong className="text-sm font-bold text-slate-100 block mt-1 truncate" title={`${intenseMatch.player1Name} vs ${intenseMatch.player2Name}`}>
                        {intenseMatch.player1Name.split(' ').pop()} vs {intenseMatch.player2Name.split(' ').pop()}
                      </strong>
                      <span className="text-[11px] text-emerald-400 font-extrabold block mt-0.5">
                        {intenseMatch.player1Wins}W – {intenseMatch.player2Wins}W ({intenseMatch.totalMatches} plays)
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-600 block mt-2">No competitive rivalries yet</span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Search and interactive filter */}
          {(() => {
            const allRivalries = getRivalries([...players, ...retiredPlayers]);
            
            const filteredRivalries = allRivalries.filter(r => {
              const name1 = r.player1Name.toLowerCase();
              const name2 = r.player2Name.toLowerCase();
              const tag = rivalryQuery.toLowerCase();
              return name1.includes(tag) || name2.includes(tag);
            });

            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/50 border border-slate-850 p-3 rounded-lg">
                  <div className="w-full sm:w-72">
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 focus:border-red-500/40 focus:outline-none font-mono"
                      placeholder="Search for a player's rivalry..."
                      value={rivalryQuery}
                      onChange={(e) => setRivalryQuery(e.target.value)}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Showing {filteredRivalries.length} of {allRivalries.length} rivalries
                  </div>
                </div>

                {filteredRivalries.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-850 rounded-xl bg-slate-950/40">
                    <span className="text-xs text-slate-500 font-mono">No matching matchups found. Play more seasons or change search query!</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRivalries.slice(0, 20).map((r, idx) => {
                      const p1IsRetired = retiredPlayers.some(p => p.id === r.player1Id);
                      const p2IsRetired = retiredPlayers.some(p => p.id === r.player2Id);
                      const p1Obj = [...players, ...retiredPlayers].find(p => p.id === r.player1Id);
                      const p2Obj = [...players, ...retiredPlayers].find(p => p.id === r.player2Id);

                      const pct1 = Math.round((r.player1Wins / r.totalMatches) * 105) / 105; // avoid standard React issue on float
                      const pct1Int = Math.max(5, Math.min(95, Math.round((r.player1Wins / r.totalMatches) * 100)));
                      const pct2Int = 100 - pct1Int;

                      return (
                        <div key={idx} className="bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-850 rounded-xl p-4 hover:border-slate-700 transition-all shadow-md relative group font-mono text-xs">
                          {/* Rank indicator background */}
                          <div className="absolute left-3 top-3 text-[10px] text-slate-600 font-bold">
                            #{idx + 1}
                          </div>

                          <div className="flex justify-between items-center space-x-2 mt-2">
                            {/* Player 1 Details */}
                            <div className="w-2/5 min-w-0">
                              <div className="flex items-center space-x-1">
                                <span className="text-base leading-none shrink-0" title={r.player1Nationality}>
                                  {getFlagEmoji(r.player1Nationality)}
                                </span>
                                <h4 className="text-xs font-black text-slate-100 truncate uppercase" title={r.player1Name}>
                                  {r.player1Name}
                                </h4>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1 leading-none">
                                {p1IsRetired ? (
                                  <span className="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-black uppercase tracking-wider">Retired</span>
                                ) : (
                                  <span>RANK #{p1Obj?.ranking || 'N/A'}</span>
                                )}
                              </div>
                            </div>

                            {/* H2H Score Display block */}
                            <div className="w-1/5 text-center shrink-0">
                              <div className="text-slate-500 text-[9px] uppercase font-bold tracking-tight">H2H Score</div>
                              <div className="text-sm font-black text-white mt-0.5 whitespace-nowrap">
                                {r.player1Wins} – {r.player2Wins}
                              </div>
                              <div className="text-[9.5px] text-yellow-500/85 mt-0.5 uppercase tracking-wide">
                                {r.totalMatches} matches
                              </div>
                            </div>

                            {/* Player 2 Details */}
                            <div className="w-2/5 min-w-0 text-right">
                              <div className="flex items-center space-x-1 justify-end">
                                <h4 className="text-xs font-black text-slate-100 truncate uppercase" title={r.player2Name}>
                                  {r.player2Name}
                                </h4>
                                <span className="text-base leading-none shrink-0" title={r.player2Nationality}>
                                  {getFlagEmoji(r.player2Nationality)}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1 leading-none">
                                {p2IsRetired ? (
                                  <span className="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-black uppercase tracking-wider">Retired</span>
                                ) : (
                                  <span>RANK #{p2Obj?.ranking || 'N/A'}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Percent visual comparison progress bar */}
                          <div className="mt-4.5">
                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden flex">
                              <div 
                                className="h-full bg-indigo-500 hover:bg-indigo-400 transition-all rounded-l-full" 
                                style={{ width: `${pct1Int}%` }}
                                title={`${r.player1Name}: ${pct1Int}%`}
                              ></div>
                              <div 
                                className="h-full bg-orange-500 hover:bg-orange-400 transition-all rounded-r-full" 
                                style={{ width: `${pct2Int}%` }}
                                title={`${r.player2Name}: ${pct2Int}%`}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500 mt-1.5 font-bold uppercase">
                              <span className="text-indigo-400">{pct1Int}% wins</span>
                              <span className="text-orange-400">{pct2Int}% wins</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {filteredRivalries.length > 20 && (
                  <div className="text-center py-2 text-[10px] text-slate-600 font-mono">
                    * Displaying the top 20 most competitive rivalries. Filter by name to find other matchups.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
