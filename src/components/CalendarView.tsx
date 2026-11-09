/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Week, Tournament, Player, Match, SurfaceType, WeatherType, TournamentTier } from '../types';
import { Play, FastForward, Sun, CloudRain, Wind, AlertTriangle, HelpCircle, Award, Terminal, Compass, Edit3, Check, X, User, Trophy, Calendar, Search, CheckCircle2, Clock, Settings, Sparkles, Zap, RefreshCw } from 'lucide-react';

interface CalendarViewProps {
  currentWeek: Week;
  calendar?: Week[];
  players: Player[];
  onSimulateRound: () => void;
  onSimulateFullWeek: () => void;
  onAdvanceWeek: () => void;
  simulationLog: string[];
  onUpdateTournament: (weekNumber: number, tournamentId: string, updatedFields: Partial<Tournament>) => void;
  onForceCommitmentOverride?: () => void;
  onUpdateWeekName?: (weekNumber: number, newName: string) => void;

  // New Auto Sim props
  isAutoSimulating?: boolean;
  autoSimSpeed?: 'slow' | 'normal' | 'fast';
  autoSimTarget?: string;
  onChangeAutoSimSpeed?: (speed: 'slow' | 'normal' | 'fast') => void;
  onChangeAutoSimTarget?: (target: string) => void;
  onStartAutoSim?: (speed: 'slow' | 'normal' | 'fast', target: string) => void;
  onStopAutoSim?: () => void;
  autoSimStats?: { weeksSimulated: number; seasonsSimulated: number; targetSeasonEnd?: number };
  lastWeekResults?: {
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
  } | null;

  // Fast Simulation Mode props
  isFastSimulationMode?: boolean;
  onToggleFastSimulationMode?: (enabled: boolean) => void;
}

export default function CalendarView({
  currentWeek,
  calendar,
  players,
  onSimulateRound,
  onSimulateFullWeek,
  onAdvanceWeek,
  simulationLog,
  onUpdateTournament,
  onForceCommitmentOverride,
  onUpdateWeekName,

  // New props
  isAutoSimulating = false,
  autoSimSpeed = 'normal',
  autoSimTarget = 'end_season',
  onChangeAutoSimSpeed,
  onChangeAutoSimTarget,
  onStartAutoSim,
  onStopAutoSim,
  autoSimStats,
  lastWeekResults,

  // Fast Simulation Mode props
  isFastSimulationMode = false,
  onToggleFastSimulationMode
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'active' | 'entire'>('active');

  // Auto Sim local states for configuration
  const [configuredSpeed, setConfiguredSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [configuredTarget, setConfiguredTarget] = useState<string>('end_season');
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);

  // Local state for week name editing
  const [isEditingWeekName, setIsEditingWeekName] = useState(false);
  const [tempWeekName, setTempWeekName] = useState('');
  const [editingWeekNum, setEditingWeekNum] = useState<number | null>(null);

  const saveWeekName = () => {
    if (tempWeekName.trim()) {
      onUpdateWeekName?.(currentWeek.weekNumber, tempWeekName.trim());
    }
    setIsEditingWeekName(false);
  };

  // Search & Filter state for entire season view
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSurface, setFilterSurface] = useState<string>('All');
  const [filterTier, setFilterTier] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Selected tournament in the entire season view
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(currentWeek.weekNumber);
  const [selectedTourId, setSelectedTourId] = useState<string>(
    currentWeek.tournaments[0] ? currentWeek.tournaments[0].id : ''
  );

  // Entire Calendar Inspector Tour edit state
  const [isEditingInspectorTour, setIsEditingInspectorTour] = useState(false);
  const [editedInspectorTourName, setEditedInspectorTourName] = useState('');
  const [editedInspectorTourLogo, setEditedInspectorTourLogo] = useState('');
  const [editedInspectorTourTrophy, setEditedInspectorTourTrophy] = useState('');
  const [editedInspectorTourSurface, setEditedInspectorTourSurface] = useState<SurfaceType>('Hard');
  const [editedInspectorTourWeather, setEditedInspectorTourWeather] = useState<WeatherType>('Normal');
  const [editedInspectorTourTier, setEditedInspectorTourTier] = useState<TournamentTier>('Masters 250');
  const [editedInspectorTourPoints, setEditedInspectorTourPoints] = useState<number>(250);
  const [editedInspectorTourFormat, setEditedInspectorTourFormat] = useState<'1-Set' | '3-Set' | '5-Set'>('3-Set');
  const [editedInspectorTourDrawSize, setEditedInspectorTourDrawSize] = useState<number>(16);

  const [selectedTourIdx, setSelectedTourIdx] = useState(0);
  const [selectedRoundIdx, setSelectedRoundIdx] = useState(0);
  const [showFullBracket, setShowFullBracket] = useState(false);

  const activeTournaments = currentWeek.tournaments;
  const activeTour = activeTournaments[selectedTourIdx] || activeTournaments[0];

  // Tournament asset editor state
  const [isEditingTour, setIsEditingTour] = useState(false);
  const [editedTourName, setEditedTourName] = useState('');
  const [editedTourLogo, setEditedTourLogo] = useState('');
  const [editedTourTrophy, setEditedTourTrophy] = useState('');

  // Synchronize edit fields when selected tournament changes
  useEffect(() => {
    if (activeTour) {
      setEditedTourName(activeTour.name);
      setEditedTourLogo(activeTour.logoUrl || '');
      setEditedTourTrophy(activeTour.trophyUrl || '');
      setIsEditingTour(false);
    }
  }, [activeTour]);

  const handleSaveTour = () => {
    if (!editedTourName.trim()) return;
    onUpdateTournament(currentWeek.weekNumber, activeTour.id, {
      name: editedTourName.trim(),
      logoUrl: editedTourLogo.trim() || undefined,
      trophyUrl: editedTourTrophy.trim() || undefined
    });
    setIsEditingTour(false);
  };

  const inspectorWeek = calendar?.find(w => w.weekNumber === selectedWeekNum) || currentWeek;
  const inspectorTour = inspectorWeek.tournaments.find(t => t.id === selectedTourId) || inspectorWeek.tournaments[0];

  useEffect(() => {
    if (inspectorTour) {
      setEditedInspectorTourName(inspectorTour.name);
      setEditedInspectorTourLogo(inspectorTour.logoUrl || '');
      setEditedInspectorTourTrophy(inspectorTour.trophyUrl || '');
      setEditedInspectorTourSurface(inspectorTour.surface);
      setEditedInspectorTourWeather(inspectorTour.weather);
      setEditedInspectorTourTier(inspectorTour.tier);
      setEditedInspectorTourPoints(inspectorTour.points);
      setEditedInspectorTourFormat(inspectorTour.matchFormat);
      setEditedInspectorTourDrawSize(inspectorTour.drawSize);
      setIsEditingInspectorTour(false);
    }
  }, [inspectorTour]);

  const handleSaveInspectorTour = () => {
    if (!inspectorTour || !editedInspectorTourName.trim()) return;
    onUpdateTournament(selectedWeekNum, inspectorTour.id, {
      name: editedInspectorTourName.trim(),
      logoUrl: editedInspectorTourLogo.trim() || undefined,
      trophyUrl: editedInspectorTourTrophy.trim() || undefined,
      surface: editedInspectorTourSurface,
      weather: editedInspectorTourWeather,
      tier: editedInspectorTourTier,
      points: Number(editedInspectorTourPoints) || 0,
      matchFormat: editedInspectorTourFormat,
      drawSize: Number(editedInspectorTourDrawSize) || 16,
    });
    setIsEditingInspectorTour(false);
  };

  // Search & Filter tournaments across ALL weeks
  const allScheduledTournaments = (calendar || []).flatMap(w =>
    w.tournaments.map(t => ({
      weekNumber: w.weekNumber,
      weekName: w.name,
      weekCompleted: w.isCompleted,
      ...t
    }))
  );

  const filteredTournaments = allScheduledTournaments.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.tier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSurface = filterSurface === 'All' || item.surface === filterSurface;
    const matchesTier = filterTier === 'All' || item.tier === filterTier;
    let matchesStatus = true;
    if (filterStatus === 'Completed') {
      matchesStatus = item.weekNumber < currentWeek.weekNumber || item.isCompleted;
    } else if (filterStatus === 'Active') {
      matchesStatus = item.weekNumber === currentWeek.weekNumber;
    } else if (filterStatus === 'Future') {
      matchesStatus = item.weekNumber > currentWeek.weekNumber;
    }
    return matchesSearch && matchesSurface && matchesTier && matchesStatus;
  });

  const groupedByWeek: Record<number, typeof filteredTournaments> = {};
  filteredTournaments.forEach(item => {
    if (!groupedByWeek[item.weekNumber]) {
      groupedByWeek[item.weekNumber] = [];
    }
    groupedByWeek[item.weekNumber].push(item);
  });

  const sortedWeeksKeys = Object.keys(groupedByWeek).map(Number).sort((a, b) => a - b);

  // Helper to resolve player name
  const getPlayerName = (id: string | null): string => {
    if (!id) return 'TBD';
    const player = players.find(p => p.id === id);
    return player ? player.name : 'Unknown';
  };

  // Helper to resolve player ranking/ability
  const getPlayerMeta = (id: string | null): string => {
    if (!id) return '';
    const player = players.find(p => p.id === id);
    return player ? `(#${player.ranking}, A${player.baseAbility})` : '';
  };

  // Helper to render customized badge and styling based on rank
  const renderPlayerHighlight = (playerId: string | null, isWinner: boolean, fontClass = "text-[11px]", isDefeated = false) => {
    if (!playerId) {
      return <span className={`${fontClass} text-slate-600 font-medium italic`}>TBD</span>;
    }
    const player = players.find(p => p.id === playerId);
    if (!player) {
      return <span className={`${fontClass} text-slate-300 font-medium`}>Unknown</span>;
    }

    const r = player.ranking;
    let badgeClass = "";
    let textClass = "";
    const label = `#${r}`;

    if (r === 1) {
      badgeClass = "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 shadow-sm shadow-yellow-500/10 font-black";
      textClass = "text-yellow-400 font-black";
    } else if (r === 2) {
      badgeClass = "bg-slate-300/15 text-slate-200 border border-slate-300/30 font-bold";
      textClass = "text-slate-200 font-bold";
    } else if (r === 3) {
      badgeClass = "bg-amber-700/20 text-orange-400 border border-orange-500/30 font-bold";
      textClass = "text-orange-400 font-bold";
    } else if (r <= 10) {
      badgeClass = "bg-slate-800/80 text-indigo-400 border border-indigo-500/20 font-bold";
      textClass = "text-indigo-400 font-bold";
    } else {
      textClass = isWinner ? "text-indigo-400 font-extrabold" : "text-slate-300 font-medium";
    }

    if (isDefeated) {
      textClass = "text-slate-500 line-through font-normal";
    }

    return (
      <span className="flex items-center space-x-1.5 min-w-0 max-w-full">
        {r <= 10 && (
          <span className={`shrink-0 inline-flex items-center justify-center text-[7.5px] px-1 py-0.2 rounded font-mono uppercase tracking-tight leading-none ${badgeClass}`}>
            {label}
          </span>
        )}
        <span className={`truncate ${textClass} ${fontClass}`}>
          {player.name}
        </span>
        {r > 10 && (
          <span className="shrink-0 text-[8px] text-slate-500 font-mono">
            (#{r})
          </span>
        )}
      </span>
    );
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'Hot':
        return <Sun className="w-5 h-5 text-orange-500 animate-pulse" />;
      case 'Windy':
        return <Wind className="w-5 h-5 text-sky-400" />;
      case 'Rain-Delayed':
        return <CloudRain className="w-5 h-5 text-indigo-400" />;
      default:
        return <Sun className="w-5 h-5 text-yellow-500" />;
    }
  };

  // Grand Slam metadata constant reflecting Singapore, Paris, London, New York & aesthetics
  const TOURNAMENT_AESTHETICS = {
    LION_CITY: {
      name: 'Lion City Slam',
      surface: 'Hard',
      colors: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/35',
      aestheticName: 'Sapphire Blue'
    },
    TERRE_ROUGE: {
      name: 'La Terre Rouge',
      surface: 'Clay',
      colors: 'text-red-400 bg-red-500/10 border-red-500/35',
      aestheticName: 'Ruby Red'
    },
    THE_CROWN: {
      name: 'The Crown',
      surface: 'Grass',
      colors: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/35',
      aestheticName: 'Emerald Green'
    },
    THE_EMPIRE: {
      name: 'The Empire',
      surface: 'Hard',
      colors: 'text-slate-100 bg-slate-100/10 border-slate-350/30',
      aestheticName: 'White Topaz'
    }
  };

  const getSurfaceColor = (surface: string, tourName?: string) => {
    if (tourName) {
      const norm = tourName.toLowerCase();
      if (norm.includes('lion city') || norm.includes('singapore')) {
        return TOURNAMENT_AESTHETICS.LION_CITY.colors;
      }
      if (norm.includes('terre rouge') || norm.includes('paris') || norm.includes('la terre')) {
        return TOURNAMENT_AESTHETICS.TERRE_ROUGE.colors;
      }
      if (norm.includes('the crown') || norm.includes('london') || norm.includes('crown')) {
        return TOURNAMENT_AESTHETICS.THE_CROWN.colors;
      }
      if (norm.includes('the empire') || norm.includes('new york') || norm.includes('empire')) {
        return TOURNAMENT_AESTHETICS.THE_EMPIRE.colors;
      }
    }

    switch (surface) {
      case 'Hard':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'Clay':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'Grass':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  // Detect current active round in the selected tournament
  const getActiveRoundInfo = (t: Tournament) => {
    if (!t.bracket) return { index: 0, completed: false, name: '' };
    
    for (let r = 0; r < t.bracket.length; r++) {
      const incomplete = t.bracket[r].some(m => !m.isCompleted);
      if (incomplete) {
        let name = `Round ${r + 1}`;
        if (t.tier === 'Grand Slam') {
          if (r === 0) name = 'Wave 1 (Ranks 65-128)';
          else if (r === 1) name = 'Wave 2 (Qualifiers vs Ranks 33-64)';
          else if (r === 2) name = 'Wave 3 (R64 Seeds Entrance)';
          else if (r === 3) name = 'R32';
          else if (r === 4) name = 'R16';
          else if (r === 5) name = 'Quarterfinals';
          else if (r === 6) name = 'Semifinals';
          else if (r === 7) name = 'Championship Final';
        } else {
          // Normal brackets: reverse count to check QF/SF/Final
          const remainingRounds = t.bracket.length - 1 - r;
          if (remainingRounds === 0) name = 'Championship Final';
          else if (remainingRounds === 1) name = 'Semifinals';
          else if (remainingRounds === 2) name = 'Quarterfinals';
          else if (remainingRounds === 3) name = 'Round of 16';
        }
        return { index: r, completed: false, name };
      }
    }
    return { index: t.bracket.length - 1, completed: true, name: 'Tournament Completed' };
  };

  const getTournamentStatus = (tour: Tournament, wkNumber: number): 'Completed' | 'In-Progress' | 'Upcoming' => {
    const isPast = wkNumber < currentWeek.weekNumber;
    const isComp = isPast || tour.isCompleted;
    if (isComp) return 'Completed';
    if (wkNumber === currentWeek.weekNumber) {
      const hasStarted = tour.bracket?.some(round => round.some((m: Match) => m.isCompleted)) || false;
      return hasStarted ? 'In-Progress' : 'Upcoming';
    }
    return 'Upcoming';
  };

  const renderStatusBadge = (status: 'Completed' | 'In-Progress' | 'Upcoming') => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 select-none">
          <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
          <span>Completed</span>
        </span>
      );
    }
    if (status === 'In-Progress') {
      return (
        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase bg-amber-500/15 text-amber-400 border border-amber-500/25 animate-pulse select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span>In-Progress</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase bg-slate-950 text-slate-500 border border-slate-850 select-none">
        <span className="w-1 h-1 rounded-full bg-slate-500"></span>
        <span>Upcoming</span>
      </span>
    );
  };

  const activeRound = activeTour ? getActiveRoundInfo(activeTour) : { index: 0, completed: false, name: '' };

  return (
    <div className="space-y-4">
      {/* View Selector Tabs */}
      <div className="flex bg-slate-900 border border-slate-800 rounded p-1 flex-wrap items-center gap-1.5 justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-850">
            <button
              type="button"
              onClick={() => setViewMode('active')}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded transition-all cursor-pointer ${
                viewMode === 'active'
                  ? 'bg-indigo-600 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎾 Active Week Control
            </button>
            <button
              id="view-entire-calendar-btn"
              type="button"
              onClick={() => setViewMode('entire')}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded transition-all cursor-pointer ${
                viewMode === 'entire'
                  ? 'bg-indigo-600 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🗓️ Entire Season Calendar
            </button>
          </div>

          {/* Fast Simulation checkbox */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 h-[34px] rounded border border-slate-850 text-[11px] font-mono select-none">
            <label className="flex items-center space-x-1.5 cursor-pointer leading-none text-slate-300 hover:text-white">
              <input
                id="fast-simulation-mode-checkbox"
                type="checkbox"
                checked={isFastSimulationMode}
                onChange={(e) => onToggleFastSimulationMode?.(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-800 text-indigo-650 bg-slate-905 cursor-pointer focus:ring-0 focus:ring-offset-0"
              />
              <span className="flex items-center gap-1 font-bold">
                <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Fast Sim</span>
              </span>
            </label>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-mono px-2">
          Current: Week {currentWeek.weekNumber} / 43
        </div>
      </div>

      {viewMode === 'active' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      
      {/* Left Column: Calendar Weeks & Control Center */}
      <div className="lg:col-span-1 space-y-3">
        
        {/* Weekly Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-bold">CURRENT PERIOD</div>
              {isEditingWeekName ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    id="edit-week-name-input"
                    type="text"
                    value={tempWeekName}
                    onChange={(e) => setTempWeekName(e.target.value)}
                    className="bg-slate-950 text-white font-sans text-xs border border-slate-800 focus:border-indigo-500 px-2 py-1 rounded w-full focus:outline-none"
                    placeholder="Enter week title..."
                    autoFocus
                  />
                  <button
                    id="save-week-name-btn"
                    onClick={saveWeekName}
                    className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer shrink-0"
                    title="Save"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="cancel-week-name-btn"
                    onClick={() => setIsEditingWeekName(false)}
                    className="p-1 rounded bg-slate-850 text-slate-400 border border-slate-800 hover:bg-slate-800 cursor-pointer shrink-0"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <h1 className="text-md font-bold text-white font-sans mt-0.5 flex items-center gap-1.5 group select-none">
                  <span>{currentWeek.name}</span>
                  <button
                    id="trigger-edit-week-name"
                    onClick={() => {
                      setTempWeekName(currentWeek.name);
                      setIsEditingWeekName(true);
                    }}
                    className="text-slate-500 hover:text-indigo-400 p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                    title="Edit Week Name"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </h1>
              )}
            </div>
            <div className="px-2 py-0.5 text-[10px] bg-indigo-500/10 text-indigo-400 font-mono font-bold rounded border border-indigo-500/25 shrink-0 ml-2">
              WK {currentWeek.weekNumber} / 43
            </div>
          </div>

          <div className="text-[11px] text-slate-400 leading-normal">
            {currentWeek.weekNumber === 1 && 'Opening Challenger event draws the bottom-tier players to battle for an early points shaker.'}
            {currentWeek.weekNumber === 18 && 'The Bubble LCQ! Ranks 125-128 square off in matches against 129-132 to settle direct slam entry cutoffs.'}
            {currentWeek.weekNumber === 19 && 'The first Hardcourt major begins with the Lion City Slam in Singapore! Matches are high-stakes 5-set tests.'}
            {currentWeek.weekNumber >= 8 && currentWeek.weekNumber <= 10 && 'Consecutive Form Farms! Rapid high-frequency, low-fatigue 1-Set matches designed strictly to restore form levels.'}
            {currentWeek.weekNumber === 28 && 'The pinnacle clay court championship of the year, La Terre Rouge, gets underway in Paris!'}
            {currentWeek.weekNumber === 34 && 'The classic, fast grass lawns of London host The Crown for ultimate ball speed.'}
            {currentWeek.weekNumber === 43 && 'The Grand Finale! The final Grand Slam, The Empire, in New York under electric night lights!'}
            {currentWeek.weekNumber !== 1 && currentWeek.weekNumber !== 18 && currentWeek.weekNumber !== 19 && currentWeek.weekNumber !== 28 && currentWeek.weekNumber !== 34 && currentWeek.weekNumber !== 43 && 'Standard tour week allows players to strategize rest breaks and surface options.'}
          </div>

          {/* Controls Matrix */}
          <div className="space-y-1.5 pt-1">
            {!currentWeek.isCompleted ? (
              <>
                <button
                  id="sim-round-btn"
                  disabled={isAutoSimulating}
                  onClick={onSimulateRound}
                  className={`w-full font-extrabold py-2 px-3 rounded flex items-center justify-center space-x-2 transition-colors cursor-pointer text-xs uppercase ${
                    isAutoSimulating
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-505 active:bg-indigo-700 text-black shadow'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Simulate Next Round</span>
                </button>

                <button
                  id="sim-week-btn"
                  disabled={isAutoSimulating}
                  onClick={onSimulateFullWeek}
                  className={`w-full border active:bg-slate-950 font-bold py-2 px-3 rounded flex items-center justify-center space-x-2 transition-colors cursor-pointer text-xs uppercase ${
                    isAutoSimulating
                      ? 'bg-slate-900 border-slate-850 text-slate-650 cursor-not-allowed'
                      : 'bg-slate-950 hover:bg-slate-850 border border-slate-800 text-indigo-400'
                  }`}
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>Simulate Full Week</span>
                </button>
              </>
            ) : (
              <button
                id="advance-week-btn"
                disabled={isAutoSimulating}
                onClick={onAdvanceWeek}
                className={`w-full font-bold py-2.5 px-3 rounded flex items-center justify-center space-x-2 transition-all cursor-pointer text-xs uppercase shadow ${
                  isAutoSimulating
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-705'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-750 text-slate-100 animate-pulse'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Advance to Next Week</span>
              </button>
            )}

            {/* Auto Sim Block Core */}
            <div className="mt-3 pt-3 border-t border-slate-850 space-y-2">
              {!isAutoSimulating ? (
                <>
                  {!showConfigPanel ? (
                    <button
                      id="trigger-auto-sim-config-btn"
                      type="button"
                      onClick={() => setShowConfigPanel(true)}
                      className="w-full bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/25 text-indigo-300 font-extrabold py-2 px-3 rounded flex items-center justify-center space-x-2 transition-all cursor-pointer text-xs uppercase hover:border-indigo-500/50"
                    >
                      <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse animate-duration-1000" />
                      <span>🤖 Open Auto-Simulation Block</span>
                    </button>
                  ) : (
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded space-y-3.5 text-xs font-mono transition-all">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-900">
                        <span className="text-[9px] font-black text-indigo-400 tracking-wider">🤖 AUTO-SIM SCHEDULER</span>
                        <button
                          type="button"
                          onClick={() => setShowConfigPanel(false)}
                          className="text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase shrink-0"
                        >
                          ✕ Hide
                        </button>
                      </div>

                      {/* STOP CHOICE TRIGGER */}
                      <div className="space-y-1">
                        <label className="text-[8px] text-slate-500 uppercase font-black tracking-widest block">
                          Simulation Limit/Terminus Goal
                        </label>
                        <select
                          id="auto-sim-target-select"
                          value={configuredTarget}
                          onChange={(e) => setConfiguredTarget(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none text-[11px] font-mono cursor-pointer"
                        >
                          <option value="next_gs">Until Next Grand Slam 🏆</option>
                          <option value="end_season">End of Current Season 🏁</option>
                          <option value="5">Simulate 5 Full Seasons 👑</option>
                          <option value="10">Simulate 10 Full Seasons 👑</option>
                          <option value="25">Simulate 25 Full Seasons 👑</option>
                          <option value="50">Simulate 50 Full Seasons 👑</option>
                          <option value="100">Simulate 100 Full Seasons 👑</option>
                        </select>
                      </div>

                      {/* INTERLOOP SPEED */}
                      <div className="space-y-1">
                        <label className="text-[8px] text-slate-500 uppercase font-black tracking-widest block">
                          Interloop Speed Velocity
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['slow', 'normal', 'fast'] as const).map((spd) => (
                            <button
                              key={spd}
                              type="button"
                              onClick={() => setConfiguredSpeed(spd)}
                              className={`py-1.5 rounded text-[8.5px] font-black uppercase tracking-wider text-center cursor-pointer border transition-colors ${
                                configuredSpeed === spd
                                  ? 'bg-indigo-600 border-indigo-600 text-black font-black'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-805 hover:text-slate-200'
                              }`}
                            >
                              {spd === 'slow' ? '🐌 Slow' : spd === 'normal' ? '⚡ Normal' : '🚀 Fast'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* START ACTIONS */}
                      <button
                        id="start-auto-sim-btn"
                        type="button"
                        onClick={() => {
                          onStartAutoSim?.(configuredSpeed, configuredTarget);
                          setShowConfigPanel(false);
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-950 py-2 px-3 rounded font-black text-center text-xs uppercase tracking-wider block transition-transform active:translate-y-0.5 cursor-pointer"
                      >
                        🚀 Initiate Simulator Stream
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-950 border border-indigo-500/20 shadow-indigo-550/5 shadow-md p-3 rounded-lg space-y-3 text-xs font-mono">
                  <div className="flex justify-between items-center border-b border-indigo-950/60 pb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      <span className="text-[8.5px] text-indigo-400 font-extrabold uppercase tracking-widest animate-pulse">
                        🤖 SIMULATING ACTIVE STREAM...
                      </span>
                    </div>
                    <span className="text-[7.5px] text-slate-550 font-black">
                      ACTIVE RUN
                    </span>
                  </div>

                  {/* TELEMETRY METRIC OVERVIEW */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-2.5 rounded border border-slate-850">
                    <div>
                      <span className="text-[7.5px] text-slate-500 uppercase block font-bold leading-none mb-1">Weeks Run</span>
                      <span className="text-sm font-black text-slate-100 font-mono leading-none">
                        {autoSimStats?.weeksSimulated || 0} WK
                      </span>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-slate-500 uppercase block font-bold leading-none mb-1">Seasons Run</span>
                      <span className="text-sm font-black text-indigo-400 font-mono leading-none">
                        {autoSimStats?.seasonsSimulated || 0}{' '}
                        {autoSimStats?.targetSeasonEnd && autoSimStats.targetSeasonEnd > 0 ? (
                          <span className="text-[9px] text-slate-500 font-bold">
                            / {autoSimStats.targetSeasonEnd}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="col-span-2 border-t border-slate-800/60 pt-1.5 mt-0.5 leading-normal">
                      <span className="text-[7px] text-slate-500 uppercase block font-bold tracking-wider mb-0.5">Goal Terminus Criterion</span>
                      <span className="text-[9.5px] text-slate-200 font-bold uppercase truncate">
                        🏆 {autoSimTarget === 'next_gs' ? 'Until Next Grand Slam 🏆' : autoSimTarget === 'end_season' ? 'End of Current Season 🏁' : `${autoSimTarget} Seasons 👑`}
                      </span>
                    </div>
                  </div>

                  {/* REAL-TIME SPEED SLIDER (Tuned on-the-fly) */}
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-slate-500 uppercase font-black block tracking-widest">
                      Frequency Velocity (Tune On The Fly):
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {(['slow', 'normal', 'fast'] as const).map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => onChangeAutoSimSpeed?.(spd)}
                          className={`py-1 rounded text-[8px] font-black uppercase text-center cursor-pointer border ${
                            autoSimSpeed === spd
                              ? 'bg-indigo-600 border-indigo-600 text-black'
                              : 'bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {spd === 'slow' ? '🐌 Slow' : spd === 'normal' ? '⚡ Normal' : '🚀 Fast'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* STOP CONTROL BUTTON */}
                  <button
                    id="stop-auto-sim-btn"
                    type="button"
                    onClick={onStopAutoSim}
                    className="w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 hover:scale-[1.01] py-2 px-3 rounded font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 border border-slate-700 shadow duration-150 cursor-pointer"
                  >
                    <span>⏸️ Stop Auto-Simulation</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LAST COMPLETED WEEK SUMMARY PANEL */}
        {lastWeekResults && (
          <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-3 font-mono transition-all">
            {/* Title */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                <h4 className="text-[9px] font-black text-slate-200 uppercase tracking-widest leading-none">
                  WEEK {lastWeekResults.weekNumber} HONOUR ROLL
                </h4>
              </div>
              <span className="text-[7px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 rounded uppercase">
                COMPILED
              </span>
            </div>

            {/* List of winners */}
            <div className="space-y-2">
              {lastWeekResults.tournamentWinners.map((w, idx) => (
                <div key={idx} className="text-[10px] bg-slate-950/40 p-2 rounded border border-slate-850/60 leading-normal">
                  <div className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5 truncate">
                    🎾 {w.tournamentName}
                  </div>
                  <div className="flex justify-between font-sans items-center text-slate-300">
                    <span className="font-extrabold text-slate-100 flex items-center gap-1">
                      <span className="text-yellow-500 text-[10px]/none">🏆</span> {w.winnerName}
                    </span>
                    <span className="text-[8.5px] text-slate-500 font-mono lowercase shrink-0 mx-1">beats</span>
                    <span className="font-semibold text-slate-400 truncate">
                      🥈 {w.runnerUpName}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* UPSET OF THE WEEK CARD */}
            {lastWeekResults.biggestUpset ? (
              <div className="bg-gradient-to-br from-indigo-950/25 to-indigo-900/10 border border-indigo-500/20 p-3 rounded space-y-2 text-[10px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 font-bold text-[6px] text-indigo-450 uppercase font-black tracking-widest bg-indigo-500/10 rounded-bl border-l border-b border-indigo-500/10 select-none">
                  ⚡ HIGH VARIANCE
                </div>

                <div className="flex items-center space-x-1 text-[8px] text-indigo-450 font-extrabold uppercase tracking-wide">
                  <span>💥 Upset of the Week!</span>
                </div>

                <div className="space-y-1.5 mt-1.5">
                  <div className="text-slate-200 leading-snug">
                    <span className="font-sans font-extrabold text-slate-100">
                      {lastWeekResults.biggestUpset.winnerName}
                    </span>{' '}
                    <span className="text-[9px] text-indigo-400 font-bold">
                      (#{lastWeekResults.biggestUpset.winnerRank})
                    </span>{' '}
                    <span className="text-[8.5px] text-slate-500 font-mono italic block my-0.2">defeated</span>{' '}
                    <span className="font-sans font-bold text-slate-300">
                      {lastWeekResults.biggestUpset.loserName}
                    </span>{' '}
                    <span className="text-[9px] text-slate-500 font-bold">
                      (#{lastWeekResults.biggestUpset.loserRank})
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-950/80 p-1.5 rounded border border-slate-850 text-slate-200 font-mono select-none">
                    <div>
                      <span className="text-[7px] text-slate-500 block uppercase font-bold mb-0.5">Result:</span>
                      <span className="text-indigo-300 font-bold leading-none text-[9px]">{lastWeekResults.biggestUpset.score}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[7px] text-slate-500 block uppercase font-bold mb-0.5">Rank Variance:</span>
                      <span className="text-emerald-400 font-black text-[10px] leading-none">
                        📈 +{lastWeekResults.biggestUpset.variance}
                      </span>
                    </div>
                  </div>

                  <div className="text-[7.5px] text-slate-550 block italic leading-none truncate pt-0.5" title={`${lastWeekResults.biggestUpset.roundName} at ${lastWeekResults.biggestUpset.tournamentName}`}>
                    📅 {lastWeekResults.biggestUpset.roundName} @ {lastWeekResults.biggestUpset.tournamentName}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/35 border border-slate-850 p-2.5 rounded text-center leading-normal text-slate-500 text-[9px] italic font-mono select-none">
                No notable upsets (lower-ranked defeats) recorded this week. Form lines held intact!
              </div>
            )}
          </div>
        )}

        {/* Selected Week's Tournaments Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-2">
          <div className="text-[9px] text-slate-500 font-mono font-bold tracking-widest uppercase">ACTIVE TOURNAMENTS</div>
          
          <div className="space-y-1.5">
            {activeTournaments.map((tour, idx) => {
              const isActive = idx === selectedTourIdx;
              const isComp = tour.isCompleted;
              const { name: activeRdName, completed: rdCompleted } = getActiveRoundInfo(tour);
              
              return (
                <div
                  id={`tour-selector-${tour.id}`}
                  key={tour.id}
                  onClick={() => {
                    setSelectedTourIdx(idx);
                    setSelectedRoundIdx(0);
                  }}
                  className={`p-2.5 rounded border cursor-pointer transition-all ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-800 bg-slate-950 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {tour.logoUrl ? (
                        <img src={tour.logoUrl} alt="Logo" className="w-5 h-5 rounded object-cover border border-slate-800 shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-5 h-5 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[8px] text-indigo-400 font-black font-mono shrink-0">W</div>
                      )}
                      <div>
                        <div className="text-[9px] font-mono font-bold text-slate-400 flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className={`inline-block px-1 py-0.2 rounded-sm border ${getSurfaceColor(tour.surface, tour.name)} uppercase text-[8px] font-black tracking-tight`}>
                            {tour.tier}
                          </span>
                          {renderStatusBadge(getTournamentStatus(tour, currentWeek.weekNumber))}
                        </div>
                        <h3 className="text-xs font-bold text-slate-200 mt-1">{tour.name}</h3>
                      </div>
                    </div>
                    {getWeatherIcon(tour.weather)}
                  </div>

                  <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500 font-mono leading-none">
                    <div className="flex space-x-1 w-full">
                      <span>Draw {tour.drawSize} • {tour.matchFormat}</span>
                    </div>
                    <span className={`text-[9px] uppercase font-bold shrink-0 ${isComp ? 'text-emerald-400' : 'text-amber-500'}`}>
                      {isComp ? 'Complete' : activeRdName.substring(0, 16)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Center & Right Column: Bracket Display & Terminal Log */}
      <div className="lg:col-span-2 space-y-3">
        
        {/* Tournament Bracket / Matches Matrix */}
        {activeTour ? (
          <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden flex flex-col min-h-[360px]">
            {/* Bracket Header */}
            <div className="border-b border-slate-800 p-2.5 bg-slate-950 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div className="flex items-center space-x-3">
                {activeTour.logoUrl ? (
                  <img src={activeTour.logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover border border-slate-800 shrink-0 shadow-sm" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h2 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <span>{activeTour.name} Bracket Draw</span>
                    <button
                      onClick={() => setIsEditingTour(!isEditingTour)}
                      className="text-[9px] bg-slate-905 text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-500/20 hover:border-indigo-500 transition-all cursor-pointer font-mono"
                    >
                      {isEditingTour ? 'Cancel' : 'Edit Tour'}
                    </button>
                    {activeTour.bracket && (
                      <button
                        onClick={() => setShowFullBracket(true)}
                        className="text-[9px] bg-indigo-500/10 text-indigo-450 border border-indigo-500/30 px-2 py-0.5 rounded hover:bg-indigo-600 hover:text-black transition-all cursor-pointer font-mono font-black uppercase flex items-center space-x-1 shrink-0 ml-1.5"
                      >
                        <span>👁 Draw Board</span>
                      </button>
                    )}
                  </h2>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 leading-none">
                    Points: <span className="text-yellow-500 font-semibold">+{activeTour.points} PTS</span> | Surface: <span className="text-slate-400 font-semibold">{activeTour.surface}</span> | Weather: <span className="text-slate-400 font-semibold">{activeTour.weather}</span>
                  </div>
                </div>
              </div>

              {/* Round Tabs */}
              {activeTour.bracket && (
                <div className="flex space-x-0.5 bg-slate-900 p-0.5 border border-slate-800 rounded overflow-x-auto max-w-full">
                  {activeTour.bracket.map((_, rIdx) => {
                    let tabLabel = `R${rIdx + 1}`;
                    if (activeTour.tier === 'Grand Slam') {
                      if (rIdx === 0) tabLabel = 'W1';
                      else if (rIdx === 1) tabLabel = 'W2';
                      else if (rIdx === 2) tabLabel = 'R64';
                      else if (rIdx === 3) tabLabel = 'R32';
                      else if (rIdx === 4) tabLabel = 'R16';
                      else if (rIdx === 5) tabLabel = 'QF';
                      else if (rIdx === 6) tabLabel = 'SF';
                      else if (rIdx === 7) tabLabel = 'F';
                    } else {
                      const finalIndex = activeTour.bracket.length - 1;
                      if (rIdx === finalIndex) tabLabel = 'FINAL';
                      else if (rIdx === finalIndex - 1) tabLabel = 'SF';
                      else if (rIdx === finalIndex - 2) tabLabel = 'QF';
                      else if (rIdx === finalIndex - 3) tabLabel = 'R16';
                    }

                    const isCurrentActiveRd = rIdx === activeRound.index && !activeRound.completed;

                    return (
                      <button
                        id={`round-tab-${activeTour.id}-${rIdx}`}
                        key={rIdx}
                        onClick={() => setSelectedRoundIdx(rIdx)}
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded transition-all cursor-pointer ${
                          selectedRoundIdx === rIdx
                            ? 'bg-indigo-600 text-black font-black'
                            : isCurrentActiveRd
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tabLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {isEditingTour && (
              <div className="bg-slate-900 border-b border-indigo-500/20 p-3.5 space-y-3.5 text-slate-200">
                <h4 className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>EDIT TOURNAMENT ASSETS AND LABELS</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-mono uppercase font-bold">Tournament Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-sans"
                      value={editedTourName}
                      onChange={(e) => setEditedTourName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-mono uppercase font-bold">Logo Image URL</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-sans"
                      placeholder="Paste https link to custom tournament logo"
                      value={editedTourLogo}
                      onChange={(e) => setEditedTourLogo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-mono uppercase font-bold">Trophy Image URL</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-sans"
                      placeholder="Paste https link to custom trophy"
                      value={editedTourTrophy}
                      onChange={(e) => setEditedTourTrophy(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 text-[10px] font-mono uppercase">
                  <button
                    onClick={() => setIsEditingTour(false)}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 px-3 py-1.5 rounded hover:text-slate-100 transition-colors cursor-pointer text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTour}
                    className="bg-indigo-650 hover:bg-indigo-500 text-black font-extrabold px-4 py-1.5 rounded transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    <span>Save Assets</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bracket Content (List of Matches in Chosen Round Index) */}
            <div className="p-3 flex-1 h-[250px] overflow-y-auto space-y-2 bg-slate-950">
              {activeTour.bracket && activeTour.bracket[selectedRoundIdx] ? (
                activeTour.bracket[selectedRoundIdx].map((match: Match) => {
                  const isCompleted = match.isCompleted;
                  const winnerId = match.winnerId;
                  const score = match.score;

                  let scoreText = '';
                  if (match.isBye) {
                    scoreText = 'BYE';
                  } else if (isCompleted && score) {
                    scoreText = score.player1Games.map((games, sIdx) => {
                      return `${games[0]}-${score.player2Games[sIdx][0]}`;
                    }).join(', ');
                  }

                  const p1Winner = winnerId === match.player1Id;
                  const p2Winner = winnerId === match.player2Id;

                  return (
                    <div
                      key={match.id}
                      className={`p-2 bg-slate-900 border rounded transition-all ${
                        !isCompleted
                          ? 'border-slate-800'
                          : 'border-slate-800/40 hover:bg-slate-850'
                      }`}
                    >
                      {/* Player Row 1 */}
                      <div className="flex justify-between items-center text-[11px]">
                        <div className="flex items-center space-x-1.5 min-w-0 max-w-[80%]">
                          <div className={`w-1 h-1 rounded-full shrink-0 ${p1Winner ? 'bg-indigo-400' : 'bg-transparent'}`}></div>
                          {renderPlayerHighlight(match.player1Id, p1Winner, "text-[11px]", isCompleted && !p1Winner && !match.isBye)}
                        </div>
                        {score && isCompleted && (
                          <span className={`font-mono font-bold text-[10px] ${p1Winner ? 'text-yellow-400' : 'text-slate-600'}`}>
                            {score.player1Sets}
                          </span>
                        )}
                      </div>

                      {/* Divider / Versus */}
                      <div className="my-1 border-t border-slate-950/80 flex justify-between text-[9px] text-slate-600 font-mono font-bold">
                        <span>VS</span>
                        {scoreText && <span className="text-indigo-400 font-extrabold uppercase">{scoreText}</span>}
                      </div>

                      {/* Player Row 2 */}
                      <div className="flex justify-between items-center text-[11px]">
                        <div className="flex items-center space-x-1.5 min-w-0 max-w-[80%]">
                          <div className={`w-1 h-1 rounded-full shrink-0 ${p2Winner ? 'bg-indigo-400' : 'bg-transparent'}`}></div>
                          {renderPlayerHighlight(match.player2Id, p2Winner, "text-[11px]", isCompleted && !p2Winner && !match.isBye)}
                        </div>
                        {score && isCompleted && (
                          <span className={`font-mono font-bold text-[10px] ${p2Winner ? 'text-yellow-400' : 'text-slate-600'}`}>
                            {score.player2Sets}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 font-mono text-[11px]">
                  Bracket is being structured... Please play standard entries.
                </div>
              )}
            </div>

            {/* Tournament Completed Banner */}
            {activeTour.isCompleted && (
              <div className="bg-emerald-950/20 p-2 border-t border-emerald-900/30 text-emerald-400 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <div className="text-[10px] font-mono uppercase tracking-wider font-bold">
                    <span>Winner:</span> <span className="text-white font-extrabold">{getPlayerName(activeTour.winnerId)}</span> def. {getPlayerName(activeTour.runnerUpId)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Real-time Match Terminal Logs (High Vis Scannability) */}
        <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
          <div className="border-b border-slate-800 p-2 bg-slate-955 flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">LIVE WIRE WEEKLY TICKER</span>
          </div>
          <div className="p-3 h-[140px] overflow-y-auto bg-slate-950 font-mono text-[10px] text-slate-500 space-y-1 scrollbar-thin">
            {simulationLog.length === 0 ? (
              <div className="text-slate-600 italic">Wireless wire ticker active. Click sim controls of the week to seed matches.</div>
            ) : (
              simulationLog.slice().reverse().map((log, idx) => (
                <div key={idx} className="border-l-2 border-slate-850 pl-2 py-0.5 hover:border-indigo-500 transition-all text-slate-400">
                  <span className="text-emerald-400">✓</span> {log}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      </div> {/* closes grid */}

      {showFullBracket && activeTour && activeTour.bracket && (() => {
        const drawSize = activeTour.drawSize || 16;
        let stageHeightClass = 'min-h-[500px]';
        if (drawSize >= 64) {
          stageHeightClass = 'min-h-[1400px]';
        } else if (drawSize >= 32) {
          stageHeightClass = 'min-h-[850px]';
        } else if (drawSize >= 16) {
          stageHeightClass = 'min-h-[520px]';
        } else {
          stageHeightClass = 'min-h-[360px]';
        }

        return (
          <div id="full-bracket-modal" className="fixed inset-0 bg-slate-950/98 z-50 flex flex-col p-4 md:p-6 backdrop-blur-md animate-fadeIn overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4 shrink-0">
              <div className="flex items-center space-x-3">
                {activeTour.logoUrl ? (
                  <img src={activeTour.logoUrl} alt="Logo" className="w-10 h-10 rounded object-cover border border-slate-800" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 font-extrabold text-xs">W</div>
                )}
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">{activeTour.name} • Entire Bracket Draw</h2>
                  <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
                    Tier: <strong className="text-slate-355 font-bold">{activeTour.tier}</strong> | Surface: <strong className="text-slate-355 font-bold">{activeTour.surface}</strong> | Draw Size: <strong className="text-yellow-500 font-bold">{activeTour.drawSize} Players</strong>
                  </p>
                </div>
              </div>

              <button
                id="close-bracket-modal"
                onClick={() => setShowFullBracket(false)}
                className="bg-slate-900 border border-slate-800 hover:border-rose-500 hover:text-rose-455 text-slate-400 p-2 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic Scrollable Tree Stage */}
            <div className="flex-1 overflow-auto flex py-4 px-2 scrollbar-thin select-none">
              <div className={`flex space-x-12 ${stageHeightClass} w-max pr-12 items-stretch`}>
                {activeTour.bracket.map((roundMatches, rIdx) => {
                  // Resolve round title
                  let rTitle = `Round ${rIdx + 1}`;
                  if (activeTour.tier === 'Grand Slam') {
                    if (rIdx === 0) rTitle = 'W1 (Qualies)';
                    else if (rIdx === 1) rTitle = 'W2 (Entrance)';
                    else if (rIdx === 2) rTitle = 'R64 (Seeds In)';
                    else if (rIdx === 3) rTitle = 'R32';
                    else if (rIdx === 4) rTitle = 'R16';
                    else if (rIdx === 5) rTitle = 'Quarterfinals';
                    else if (rIdx === 6) rTitle = 'Semifinals';
                    else if (rIdx === 7) rTitle = 'Championship';
                  } else {
                    const isFinal = rIdx === activeTour.bracket!.length - 1;
                    if (isFinal) rTitle = 'Championship Final';
                    else if (rIdx === activeTour.bracket!.length - 2) rTitle = 'Semifinals';
                    else if (rIdx === activeTour.bracket!.length - 3) rTitle = 'Quarterfinals';
                    else if (rIdx === activeTour.bracket!.length - 4) rTitle = 'Round of 16';
                  }

                  const matchCountInRound = roundMatches.length;

                  return (
                    <div key={rIdx} className="flex flex-col min-w-[240px] max-w-[280px] shrink-0 h-full justify-between">
                      {/* Round Header Sticky Indicator */}
                      <div className="text-center font-mono py-1 px-2 border border-slate-800 bg-slate-900 rounded-lg text-indigo-400 font-black text-[9px] uppercase tracking-widest shadow-sm mb-4 shrink-0">
                        {rTitle}
                        <span className="block text-[8px] text-slate-500 mt-0.5 font-bold">Matches: {matchCountInRound}</span>
                      </div>

                      {/* Vertically self-aligning matches spanning the full bracket height cleanly */}
                      <div className="flex-1 flex flex-col justify-around py-2">
                        {roundMatches.map((match: Match) => {
                          const isCompleted = match.isCompleted;
                          const hasWinner = match.winnerId !== null;
                          const score = match.score;

                          // Score line output
                          let scoreOutput = '';
                          if (match.isBye) {
                            scoreOutput = 'BYE';
                          } else if (isCompleted && score) {
                            scoreOutput = score.player1Games.map((g, sIdx) => `${g[0]}-${score.player2Games[sIdx][0]}`).join(', ');
                          }

                          const p1Won = hasWinner && match.winnerId === match.player1Id;
                          const p2Won = hasWinner && match.winnerId === match.player2Id;

                          return (
                            <div
                              key={match.id}
                              className={`bg-slate-900 border rounded-lg overflow-hidden flex flex-col shadow-md transition-all my-2 relative shrink-0 ${
                                match.roundIndex === activeRound.index && !match.isCompleted
                                  ? 'border-indigo-500 shadow-indigo-950/20 shadow-sm'
                                  : 'border-slate-800 hover:border-slate-750'
                              }`}
                            >
                              {/* Player 1 Box */}
                              <div className={`p-2 border-b border-slate-950 flex justify-between items-center ${p1Won ? 'bg-indigo-950/30' : ''}`}>
                                <div className="min-w-0 flex-1 max-w-[85%]">
                                  {renderPlayerHighlight(match.player1Id, p1Won, "text-[10px]", hasWinner && !p1Won && !match.isBye)}
                                </div>
                                {p1Won && <span className="text-[10px] text-indigo-400 font-black shrink-0 select-none">✓</span>}
                              </div>

                              {/* Player 2 Box */}
                              <div className={`p-2 flex justify-between items-center ${p2Won ? 'bg-indigo-950/30' : ''}`}>
                                <div className="min-w-0 flex-1 max-w-[85%]">
                                  {renderPlayerHighlight(match.player2Id, p2Won, "text-[10px]", hasWinner && !p2Won && !match.isBye)}
                                </div>
                                {p2Won && <span className="text-[10px] text-indigo-400 font-black shrink-0 select-none">✓</span>}
                              </div>

                              {/* Score summary panel bar */}
                              {scoreOutput && (
                                <div className="bg-slate-950/80 px-2 py-1 border-t border-slate-950 text-center">
                                  <span className="font-mono text-[8.5px] font-black text-amber-500 leading-none">
                                    {scoreOutput}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Champion Outcome Display Box */}
                <div className="flex flex-col min-w-[200px] max-w-[240px] shrink-0 justify-center h-full pb-8">
                  <div className="bg-gradient-to-br from-yellow-950/20 to-slate-900 border-2 border-yellow-500/30 p-5 rounded-2xl text-center font-mono shadow-xl shrink-0">
                    <Trophy className="w-10 h-10 text-yellow-500 mx-auto animate-bounce mt-1" />
                    <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-3">Tournament Champion</div>
                    <div className="text-sm font-black text-yellow-400 mt-2 leading-tight truncate">
                      {activeTour.winnerId ? getPlayerName(activeTour.winnerId) : 'TBD'}
                    </div>
                    {activeTour.winnerId && (
                      <div className="text-[10px] text-slate-300 mt-1 font-bold">
                        {getPlayerMeta(activeTour.winnerId)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      </>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* List / Left side */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          {/* Search & Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-2.5">
            <div className="flex flex-col md:flex-row gap-2 justify-between items-stretch">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tournaments or tier names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-250 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              
              {/* Surface Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase whitespace-nowrap">Surface:</span>
                <select
                  value={filterSurface}
                  onChange={(e) => setFilterSurface(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="All">All Surfaces</option>
                  <option value="Hard">Hardcourt</option>
                  <option value="Clay">Claycourt</option>
                  <option value="Grass">Grasscourt</option>
                </select>
              </div>

              {/* Tier Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase whitespace-nowrap">Tier:</span>
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="All">All Tiers</option>
                  <option value="Grand Slam">Grand Slam</option>
                  <option value="Masters 1000">Masters 1000</option>
                  <option value="Masters 500">Masters 500</option>
                  <option value="Masters 250">Masters 250</option>
                  <option value="Challenger 200">Challenger 200</option>
                  <option value="Challenger LCQ 150">Challenger LCQ 150</option>
                  <option value="Challenger 175">Challenger 175</option>
                  <option value="Challenger 125">Challenger 125</option>
                  <option value="Challenger 100">Challenger 100</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase whitespace-nowrap">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="All">All Weeks</option>
                  <option value="Completed">Completed</option>
                  <option value="Active">Active Period</option>
                  <option value="Future">Future</option>
                </select>
              </div>
            </div>
          </div>

          {/* List of weeks and tournaments */}
          <div className="bg-slate-900 border border-slate-800 rounded p-3 h-[720px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {sortedWeeksKeys.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                <Calendar className="w-12 h-12 text-slate-705 mb-2 animate-pulse" />
                <div className="font-mono text-xs">No tournaments match your current filter settings.</div>
                <button 
                  onClick={() => { setSearchQuery(''); setFilterSurface('All'); setFilterTier('All'); setFilterStatus('All'); }}
                  className="mt-3 px-3 py-1 bg-slate-950 border border-slate-850 hover:border-slate-700 text-xs text-indigo-400 font-mono rounded"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              sortedWeeksKeys.map(wkNum => {
                const wkGroup = groupedByWeek[wkNum];
                const wkItem = (calendar || []).find(w => w.weekNumber === wkNum) || currentWeek;
                const isActiveWeek = wkNum === currentWeek.weekNumber;
                const isPastWeek = wkNum < currentWeek.weekNumber;
                
                let statusBadge = (
                  <span className="px-1.5 py-0.2 text-[8px] font-mono tracking-wider font-extrabold uppercase rounded bg-slate-950 text-slate-550 border border-slate-850">
                    🔮 Future
                  </span>
                );
                if (isActiveWeek) {
                  statusBadge = (
                    <span className="px-1.5 py-0.2 text-[8px] font-mono tracking-wider font-extrabold uppercase rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/35 animate-pulse">
                      ⚡ Active
                    </span>
                  );
                } else if (isPastWeek) {
                  statusBadge = (
                    <span className="px-1.5 py-0.2 text-[8px] font-mono tracking-wider font-extrabold uppercase rounded bg-emerald-500/10 text-emerald-405 border border-emerald-500/25">
                      ✓ Complete
                    </span>
                  );
                }

                return (
                  <div key={wkNum} className="space-y-1.5 border-b border-slate-950 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center px-1">
                      {editingWeekNum === wkNum ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-black text-slate-400 shrink-0">Week {wkNum} •</span>
                          <input
                            id={`edit-week-${wkNum}-input`}
                            type="text"
                            value={tempWeekName}
                            onChange={(e) => setTempWeekName(e.target.value)}
                            className="bg-slate-950 text-white font-sans text-xs border border-slate-800 focus:border-indigo-500 px-1.5 py-0.5 rounded focus:outline-none w-36 sm:w-48"
                            autoFocus
                          />
                          <button
                            id={`save-week-${wkNum}-btn`}
                            onClick={() => {
                              if (tempWeekName.trim()) {
                                onUpdateWeekName?.(wkNum, tempWeekName.trim());
                              }
                              setEditingWeekNum(null);
                            }}
                            className="p-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer shrink-0"
                            title="Save Week Name"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            id={`cancel-week-${wkNum}-btn`}
                            onClick={() => setEditingWeekNum(null)}
                            className="p-0.5 rounded bg-slate-850 text-slate-400 border border-slate-800 hover:bg-slate-800 cursor-pointer shrink-0"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-[10px] font-black text-slate-400 leading-none flex items-center gap-1.5 group select-none">
                          <span>Week {wkNum} • <span className="text-white font-sans font-bold">{wkItem.name}</span></span>
                          <button
                            id={`trigger-edit-week-${wkNum}`}
                            onClick={() => {
                              setTempWeekName(wkItem.name);
                              setEditingWeekNum(wkNum);
                            }}
                            className="text-slate-500 hover:text-indigo-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Edit Week Name"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      )}
                      {statusBadge}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {wkGroup.map(tour => {
                        const isSelected = selectedWeekNum === wkNum && selectedTourId === tour.id;
                        const hasCompleted = isPastWeek || tour.isCompleted;
                        
                        return (
                          <div
                            key={tour.id}
                            onClick={() => {
                              setSelectedWeekNum(wkNum);
                              setSelectedTourId(tour.id);
                              setIsEditingInspectorTour(false);
                            }}
                            className={`p-2.5 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-500/5 shadow shadow-indigo-950'
                                : 'border-slate-850 bg-slate-950 hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1.5">
                              <div className="flex items-center space-x-2 min-w-0">
                                {tour.logoUrl ? (
                                  <img src={tour.logoUrl} alt="Logo" className="w-5 h-5 rounded object-cover border border-slate-900 shrink-0" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-5 h-5 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[8px] text-indigo-405 font-mono font-black shrink-0">W</div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="text-[11px] font-semibold text-slate-200 truncate leading-tight">{tour.name}</h4>
                                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 mt-0.5">
                                    <span className={`inline-block px-1 py-0.2 rounded-sm border ${getSurfaceColor(tour.surface, tour.name)} uppercase text-[7px] font-black tracking-tight`}>
                                      {tour.tier}
                                    </span>
                                    {renderStatusBadge(getTournamentStatus(tour, wkNum))}
                                  </div>
                                </div>
                              </div>
                              {getWeatherIcon(tour.weather)}
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-900/60 pt-1.5 mt-2 text-[9px] text-slate-500 font-mono leading-none">
                              <span>Draw {tour.drawSize} • {tour.matchFormat}</span>
                              <span className="text-yellow-500 font-semibold">+{tour.points} PTS</span>
                            </div>

                            {hasCompleted && tour.winnerId && (
                              <div className="mt-1.5 pt-1.5 border-t border-slate-900/40 text-[9px] text-emerald-450 font-mono flex items-center gap-1 leading-none">
                                <Trophy className="w-2.5 h-2.5 text-yellow-500" />
                                <span className="truncate">Champion: <span className="text-white font-bold">{getPlayerName(tour.winnerId)}</span></span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detail Inspector / Right side */}
        <div className="lg:col-span-5 xl:col-span-4">
          {inspectorTour ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden sticky top-3 space-y-0.5">
              {/* Header branding */}
              <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-start">
                <div className="flex gap-3">
                  {inspectorTour.logoUrl ? (
                    <img src={inspectorTour.logoUrl} alt="Logo" className="w-11 h-11 rounded object-cover border border-slate-800 shadow-md shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-indigo-950/40 border border-slate-800 flex items-center justify-center text-indigo-400 font-black font-mono text-md shrink-0">W</div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none">WEEK {selectedWeekNum} SCHEDULE</div>
                    <h3 className="text-xs font-black text-white truncate mt-1 leading-none">{inspectorTour.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`inline-block px-1 py-0.2 rounded border ${getSurfaceColor(inspectorTour.surface)} uppercase text-[8px] font-sans font-extrabold tracking-tight`}>
                        {inspectorTour.tier}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono font-semibold">
                        {selectedWeekNum < currentWeek.weekNumber ? '✓ Event Completed' : selectedWeekNum === currentWeek.weekNumber ? '⚡ Active Now' : '🔮 Future Period'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {!isEditingInspectorTour && (
                  <button
                    onClick={() => setIsEditingInspectorTour(true)}
                    className="bg-slate-900 border border-slate-800 hover:border-indigo-500 text-indigo-455 hover:text-indigo-300 font-mono text-[9px] font-bold px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 select-none"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Specs</span>
                  </button>
                )}
              </div>

              {/* Editing mode or standard inspection details */}
              {isEditingInspectorTour ? (
                <div className="p-4 space-y-3 bg-slate-900/60 font-mono text-xs text-slate-300">
                  <div className="border-b border-slate-800 pb-2 mb-1 flex items-center justify-between">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <Settings className="w-3.5 h-3.5" /> Specs Configuration Panel
                    </span>
                    <span className="text-[8.5px] text-slate-500">Edit specs safely</span>
                  </div>

                  {/* Tournament Name */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-black uppercase">Tournament Name</label>
                    <input
                      type="text"
                      value={editedInspectorTourName}
                      onChange={(e) => setEditedInspectorTourName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-250 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Grid Inputs */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Surface button-group-like selector */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-black uppercase">Surface Match</label>
                      <div className="grid grid-cols-3 gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800 font-mono">
                        {(['Hard', 'Clay', 'Grass'] as SurfaceType[]).map(surf => (
                          <button
                            key={surf}
                            type="button"
                            onClick={() => setEditedInspectorTourSurface(surf)}
                            className={`py-1 text-[8.5px] font-black rounded uppercase cursor-pointer ${
                              editedInspectorTourSurface === surf
                                ? surf === 'Clay'
                                  ? 'bg-orange-500 text-slate-950'
                                  : surf === 'Grass'
                                  ? 'bg-emerald-505 text-slate-950'
                                  : 'bg-sky-500 text-slate-950'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {surf}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Weather type dropdown */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-black uppercase">Weather Pattern</label>
                      <select
                        value={editedInspectorTourWeather}
                        onChange={(e) => setEditedInspectorTourWeather(e.target.value as WeatherType)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Normal font-mono">Normal Clear</option>
                        <option value="Hot font-mono">Summer Heat</option>
                        <option value="Windy font-mono">Extreme Wind</option>
                        <option value="Rain-Delayed font-mono">Rain Delayed</option>
                      </select>
                    </div>

                    {/* Tier dropdown selector */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-black uppercase">Tournament Tier</label>
                      <select
                        value={editedInspectorTourTier}
                        onChange={(e) => {
                          const newTier = e.target.value as TournamentTier;
                          setEditedInspectorTourTier(newTier);
                          // Auto align default points structures if not manual
                          if (newTier === 'Grand Slam') { setEditedInspectorTourPoints(2000); setEditedInspectorTourDrawSize(128); setEditedInspectorTourFormat('5-Set'); }
                          else if (newTier === 'Masters 1000') { setEditedInspectorTourPoints(1000); setEditedInspectorTourDrawSize(64); setEditedInspectorTourFormat('3-Set'); }
                          else if (newTier === 'Masters 500') { setEditedInspectorTourPoints(500); setEditedInspectorTourDrawSize(32); setEditedInspectorTourFormat('3-Set'); }
                          else if (newTier === 'Masters 250') { setEditedInspectorTourPoints(250); setEditedInspectorTourDrawSize(16); setEditedInspectorTourFormat('3-Set'); }
                          else if (newTier.startsWith('Challenger')) { setEditedInspectorTourPoints(125); setEditedInspectorTourDrawSize(16); setEditedInspectorTourFormat('3-Set'); }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Grand Slam font-mono">Grand Slam</option>
                        <option value="Masters 1000 font-mono">Masters 1000</option>
                        <option value="Masters 500 font-mono">Masters 500</option>
                        <option value="Masters 250 font-mono">Masters 250</option>
                        <option value="Challenger 200 font-mono">Challenger 200</option>
                        <option value="Challenger LCQ 150 font-mono">Challenger LCQ 150</option>
                        <option value="Challenger 175 font-mono">Challenger 175</option>
                        <option value="Challenger 125 font-mono">Challenger 125</option>
                        <option value="Challenger 100 font-mono font-mono">Challenger 100</option>
                      </select>
                    </div>

                    {/* Draw Size Selector */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-black uppercase">Draw Size</label>
                      <div className="grid grid-cols-4 gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800 font-mono">
                        {([16, 32, 64, 128] as number[]).map(sz => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setEditedInspectorTourDrawSize(sz)}
                            className={`py-1 text-[8px] font-black rounded uppercase cursor-pointer ${
                              editedInspectorTourDrawSize === sz
                                ? 'bg-indigo-600 text-slate-950'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Points Input */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-black uppercase">Winner Points</label>
                      <input
                        type="number"
                        value={editedInspectorTourPoints}
                        onChange={(e) => setEditedInspectorTourPoints(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-yellow-405 font-extrabold focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    {/* Format selector */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-black uppercase">Match Format</label>
                      <div className="grid grid-cols-3 gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800 font-mono">
                        {(['1-Set', '3-Set', '5-Set'] as const).map(fmt => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => setEditedInspectorTourFormat(fmt)}
                            className={`py-1 text-[8.5px] font-black rounded cursor-pointer ${
                              editedInspectorTourFormat === fmt
                                ? 'bg-amber-500 text-slate-950'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {fmt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Logo Url */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-black uppercase font-mono">Logo URL</label>
                    <input
                      type="text"
                      value={editedInspectorTourLogo}
                      placeholder="https://images.unsplash.com/..."
                      onChange={(e) => setEditedInspectorTourLogo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  {/* Trophy Url */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-black uppercase font-mono">Trophy URL</label>
                    <input
                      type="text"
                      value={editedInspectorTourTrophy}
                      placeholder="Trophy image URL link..."
                      onChange={(e) => setEditedInspectorTourTrophy(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  {/* Guard disclaimer */}
                  <div className="text-[9px] text-slate-500 leading-normal border-t border-slate-800 bg-slate-950/40 p-2 rounded font-sans">
                    ⚠️ <strong>Rule Book Matchmaker:</strong> If editing active period matches, any ongoing brackets are preserved. Complete recalculations enforce on new advance.
                  </div>

                  {/* Save/Cancel Action triggers */}
                  <div className="flex space-x-2 pt-2 font-sans">
                    <button
                      onClick={handleSaveInspectorTour}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 font-black py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Save Specs</span>
                    </button>
                    <button
                      onClick={() => setIsEditingInspectorTour(false)}
                      className="bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700 py-2 px-3 rounded text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Visual spec stack */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-950 p-2.5 border border-slate-850/60 rounded-lg flex items-center space-x-2.5">
                      <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[8px] font-mono font-bold text-slate-555 uppercase leading-none">Tour Reward</div>
                        <div className="text-xs font-mono font-bold text-yellow-405 mt-1">+{inspectorTour.points} PTS</div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 border border-slate-850/60 rounded-lg flex items-center space-x-2.5">
                      <div className="p-1.5 rounded bg-sky-500/10 text-sky-450">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[8px] font-mono font-bold text-slate-555 uppercase leading-none">Arena Surface</div>
                        <div className={`text-xs font-mono font-bold mt-1 uppercase ${
                          inspectorTour.name.toLowerCase().includes('lion city') ? 'text-cyan-400' :
                          inspectorTour.name.toLowerCase().includes('terre rouge') ? 'text-red-400' :
                          inspectorTour.name.toLowerCase().includes('the crown') ? 'text-emerald-400' :
                          inspectorTour.name.toLowerCase().includes('the empire') ? 'text-slate-200' :
                          inspectorTour.surface === 'Hard' ? 'text-sky-400' :
                          inspectorTour.surface === 'Clay' ? 'text-orange-400' : 'text-emerald-400'
                        }`}>
                          {inspectorTour.name.toLowerCase().includes('lion city') ? 'Hard (Sapphire Blue)' :
                           inspectorTour.name.toLowerCase().includes('terre rouge') ? 'Clay (Ruby Red)' :
                           inspectorTour.name.toLowerCase().includes('the crown') ? 'Grass (Emerald Green)' :
                           inspectorTour.name.toLowerCase().includes('the empire') ? 'Hard (White Topaz)' :
                           inspectorTour.surface}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 border border-slate-850/60 rounded-lg flex items-center space-x-2.5">
                      <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[8px] font-mono font-bold text-slate-555 uppercase leading-none">Draw Format</div>
                        <div className="text-xs font-mono font-bold text-slate-300 mt-1">{inspectorTour.drawSize} Draw / {inspectorTour.matchFormat}</div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 border border-slate-850/60 rounded-lg flex items-center space-x-2.5 font-mono">
                      <div className="p-1.5 rounded">
                        {getWeatherIcon(inspectorTour.weather)}
                      </div>
                      <div>
                        <div className="text-[8px] font-mono font-bold text-slate-500 uppercase leading-none">Climate</div>
                        <div className="text-xs font-mono font-bold text-slate-300 mt-1">{inspectorTour.weather}</div>
                      </div>
                    </div>
                  </div>

                  {/* Trophy Visual Box (if custom trophy is present) */}
                  {inspectorTour.trophyUrl && (
                    <div className="bg-slate-950/60 border border-slate-850 rounded-lg p-2.5 flex items-center space-x-3 font-sans">
                      <img src={inspectorTour.trophyUrl} alt="Trophy" className="w-8 h-8 rounded object-cover border border-slate-800" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <div className="text-[8px] font-mono text-slate-500 font-bold uppercase leading-none">Winner Trophy Awarded</div>
                        <div className="text-[10px] font-bold text-slate-200 mt-1 truncate">Custom Champion Cup Asset</div>
                      </div>
                    </div>
                  )}

                  {/* Tournament Outcomes Bracket results block */}
                  {inspectorTour.bracket ? (
                    <div className="space-y-2 pt-1 font-sans">
                      <div className="border-t border-slate-800 my-2 pt-2 flex items-center space-x-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-indigo-405" />
                        <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">Bracket Tree Outcomes Ledger</span>
                      </div>

                      {selectedWeekNum < currentWeek.weekNumber || inspectorTour.isCompleted ? (
                        <div className="bg-gradient-to-br from-yellow-950/15 to-slate-950 border border-yellow-500/20 p-3 rounded-lg text-center font-mono">
                          <Trophy className="w-6 h-6 text-yellow-500 mx-auto animate-bounce mb-1" />
                          <div className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Tournament Winner</div>
                          <div className="text-xs font-black text-yellow-400 mt-1 truncate">
                            {inspectorTour.winnerId ? getPlayerName(inspectorTour.winnerId) : 'TBD'}
                          </div>
                          {inspectorTour.winnerId && (
                            <div className="text-[9px] text-slate-400 font-medium leading-normal mt-0.5">
                              {getPlayerMeta(inspectorTour.winnerId)}
                            </div>
                          )}
                          {inspectorTour.runnerUpId && (
                            <div className="text-[8.5px] text-slate-500 font-mono mt-1 border-t border-slate-850/60 pt-1.5">
                              Runner-Up: <span className="text-slate-350 font-bold">{getPlayerName(inspectorTour.runnerUpId)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5 font-mono">
                          {/* List dynamic active round results */}
                          <div className="text-center p-3 bg-slate-950 border border-slate-850 text-slate-500 text-[10px] italic rounded leading-relaxed">
                            ⚡ Bracket generation initiated! The tournament is currently ongoing. View "Active Week Control" to execute round-by-round match-simulations in real-time.
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-t border-slate-800 my-2 pt-3 flex flex-col items-center justify-center text-slate-500 py-6 text-center select-none font-mono">
                      <Sparkles className="w-6 h-6 text-indigo-505 mb-1.5 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">FUTURE TOURNAMENT DRAWS</span>
                      <span className="text-[9px] text-slate-600 leading-normal max-w-[245px] mt-1 block">
                        Enlistment entries and knockout drawings will construct when this week matches the active simulation target period.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500 font-mono">
              <AlertTriangle className="w-8 h-8 text-slate-650 mx-auto mb-2 animate-bounce" />
              <div className="text-xs">No matching tournament highlighted. Choose options in the listings list on the left to see specs.</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  {/* Calendar Auto-Override Controls at the bottom of the tab */}
  {onForceCommitmentOverride && (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
      <div className="flex items-center space-x-3 text-left">
        <div className="p-2.5 rounded bg-rose-550/10 text-rose-500 shrink-0">
          <Zap className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="text-[10px] text-rose-400 font-mono font-bold uppercase tracking-wider">CALENDAR AUTO-OVERRIDE CONTROL PANEL</div>
          <p className="text-[11px] text-slate-400 leading-normal max-w-2xl">
            Force players who have played the fewest events to register for current open drawers. Satisfies strict 20-tournaments quotas per player across the active season.
          </p>
        </div>
      </div>
      
      <button 
        id="calendar-force-override-btn"
        onClick={onForceCommitmentOverride}
        className="w-full sm:w-auto shrink-0 flex items-center justify-center space-x-1.5 text-xs font-bold text-rose-400 hover:text-rose-350 transition-all bg-rose-950/40 hover:bg-rose-950/60 px-4 py-2.5 rounded-lg border border-rose-500/25 cursor-pointer uppercase shadow"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-rose-500" />
        <span>Force Auto Overrides</span>
      </button>
    </div>
  )}
</div>
  );
}
