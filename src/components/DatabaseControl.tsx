import React, { useState, useRef } from 'react';
import { Player, Week, Tournament, TournamentTier, WeatherType, Match } from '../types';
import { Download, Upload, CheckCircle, AlertTriangle, FileText, RefreshCw, Layers, Shield, Sparkles } from 'lucide-react';

interface DatabaseControlProps {
  players: Player[];
  calendar: Week[];
  onUpdatePlayers: (updatedPlayers: Player[]) => void;
  onUpdateCalendar: (updatedCalendar: Week[]) => void;
  logCallback: (log: string) => void;
}

export default function DatabaseControl({
  players,
  calendar,
  onUpdatePlayers,
  onUpdateCalendar,
  logCallback
}: DatabaseControlProps) {
  // Parsing states
  const [playerFileLog, setPlayerFileLog] = useState<string[]>([]);
  const [tourFileLog, setTourFileLog] = useState<string[]>([]);
  
  const [parsedPlayers, setParsedPlayers] = useState<Player[] | null>(null);
  const [parsedCalendar, setParsedCalendar] = useState<Week[] | null>(null);
  
  const [playerChangeSummary, setPlayerChangeSummary] = useState<string[]>([]);
  const [tourChangeSummary, setTourChangeSummary] = useState<string[]>([]);
  const [hasPlayerValidationError, setHasPlayerValidationError] = useState<boolean>(false);

  // Raw text modes
  const [playerRawText, setPlayerRawText] = useState('');
  const [tourRawText, setTourRawText] = useState('');
  
  const playerFileInputRef = useRef<HTMLInputElement>(null);
  const tourFileInputRef = useRef<HTMLInputElement>(null);

  // Clean utilities for CSV Parsing and Generation
  function parseCSV(text: string): string[][] {
    const result: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentValue = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue);
        currentValue = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentValue);
        result.push(row);
        row = [];
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    if (currentValue || row.length > 0) {
      row.push(currentValue);
      result.push(row);
    }
    return result.map(r => r.map(cell => cell.trim())).filter(r => r.length > 0 && r.some(cell => cell.length > 0));
  }

  function escapeCSV(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function generateCSV(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
    const headerLine = headers.map(escapeCSV).join(',');
    const rowLines = rows.map(row => row.map(escapeCSV).join(','));
    return [headerLine, ...rowLines].join('\n');
  }

  function triggerDownload(csvContent: string, fileName: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // EXPORTS
  const handleExportPlayers = () => {
    const headers = [
      'Rank',
      'Player ID',
      'Name',
      'Nationality',
      'Age',
      'Points',
      'Prev Season Points',
      'Base Ability',
      'Potential',
      'Endurance',
      'Longevity',
      'Surface Specialization',
      'Specialization Level',
      'Is Rookie',
      'Is Retired',
      'Is Filler',
      'Match Wins',
      'Match Losses',
      'Played Events'
    ];

    const sorted = [...players].sort((a, b) => {
      // Sort by ranking if non-zero, otherwise put filler/unranked below
      if (a.ranking !== b.ranking) {
        if (a.ranking === 0) return 1;
        if (b.ranking === 0) return -1;
        return a.ranking - b.ranking;
      }
      return b.points - a.points;
    });

    const rows = sorted.map(p => [
      p.ranking || 'Unranked',
      p.id,
      p.name,
      p.nationality,
      p.age,
      p.points,
      p.prevSeasonPoints,
      p.baseAbility,
      p.potential,
      p.endurance,
      p.longevity,
      p.surfaceProfile.specializationType,
      p.surfaceProfile.specializationTier,
      p.isRookie ? 'YES' : 'NO',
      p.isRetired ? 'YES' : 'NO',
      p.isFiller ? 'YES' : 'NO',
      p.stats.matchWins,
      p.stats.matchLosses,
      p.stats.playedEvents
    ]);

    const csvContent = generateCSV(headers, rows);
    triggerDownload(csvContent, `tennis_standings_season_roster.csv`);
    logCallback('✓ Exported players roster standing details successfully.');
  };

  const handleExportTournaments = () => {
    const headers = [
      'Week',
      'Tournament ID',
      'Tournament Name',
      'Tier/Level',
      'Surface',
      'Draw Size',
      'Match Format (Sets)',
      'Weather',
      'Completed',
      'Winner ID',
      'Winner Name',
      'Runner-Up ID',
      'Runner-Up Name'
    ];

    const rows: (string | number | boolean | null | undefined)[][] = [];

    calendar.forEach(w => {
      w.tournaments.forEach(t => {
        const winner = players.find(p => p.id === t.winnerId);
        const runnerUp = players.find(p => p.id === t.runnerUpId);
        rows.push([
          w.weekNumber,
          t.id,
          t.name,
          t.tier,
          t.surface,
          t.drawSize,
          t.matchFormat,
          t.weather,
          t.isCompleted ? 'YES' : 'NO',
          t.winnerId || '',
          winner ? winner.name : '',
          t.runnerUpId || '',
          runnerUp ? runnerUp.name : ''
        ]);
      });
    });

    const csvContent = generateCSV(headers, rows);
    triggerDownload(csvContent, `tennis_tournaments_schedule_results.csv`);
    logCallback('✓ Exported tournament schedule and completed results successfully.');
  };

  const handleExportH2H = () => {
    const headers = [
      'Player 1 ID',
      'Player 1 Name',
      'Player 2 ID',
      'Player 2 Name',
      'Player 1 Wins vs Player 2',
      'Player 2 Wins vs Player 1',
      'Total Head-To-Head Matches'
    ];

    const rows: (string | number | boolean | null | undefined)[][] = [];
    const processedPairs = new Set<string>();

    players.forEach(p1 => {
      Object.entries(p1.h2h || {}).forEach(([opponentId, p1Wins]) => {
        if (p1Wins <= 0) return;

        // Ensure unique alphabetical pair tracing to avoid duplicates
        const pairKey = [p1.id, opponentId].sort().join('|');
        if (processedPairs.has(pairKey)) return;
        processedPairs.add(pairKey);

        const p2 = players.find(p => p.id === opponentId);
        if (!p2) return;

        const p2Wins = p2.h2h[p1.id] || 0;
        const totalMatches = p1Wins + p2Wins;

        rows.push([
          p1.id,
          p1.name,
          p2.id,
          p2.name,
          p1Wins,
          p2Wins,
          totalMatches
        ]);
      });
    });

    const csvContent = generateCSV(headers, rows);
    triggerDownload(csvContent, `tennis_head_to_head_records.csv`);
    logCallback('✓ Exported pairwise non-zero Head to Head records successfully.');
  };

  const handleExportPlayerTemplate = () => {
    const headers = ['Player ID', 'Name', 'Nationality', 'Base Ability', 'Potential', 'Endurance', 'Longevity'];
    const rows = players.map(p => [
      p.id,
      p.name,
      p.nationality,
      p.baseAbility,
      p.potential,
      p.endurance,
      p.longevity
    ]);
    const csvContent = generateCSV(headers, rows);
    triggerDownload(csvContent, 'tennis_player_mass_edit_template.csv');
    logCallback('✓ Generated tennis_player_mass_edit_template.csv based on current roster state.');
  };

  const handleExportCalendarTemplate = () => {
    const headers = ['Tournament ID', 'Tournament Name', 'Match Format (Sets)', 'Tier/Level', 'Weather'];
    const rows: (string | number)[][] = [];
    calendar.forEach(w => {
      w.tournaments.forEach(t => {
        rows.push([
          t.id,
          t.name,
          t.matchFormat,
          t.tier,
          t.weather
        ]);
      });
    });
    const csvContent = generateCSV(headers, rows);
    triggerDownload(csvContent, 'tennis_calendar_mass_edit_template.csv');
    logCallback('✓ Generated tennis_calendar_mass_edit_template.csv based on current tournament plan.');
  };

  // PARSE PLAYERS CSV
  const handleProcessPlayersCSV = (csvText: string) => {
    const csvRows = parseCSV(csvText);
    if (csvRows.length < 2) {
      setPlayerFileLog(['Error: Invalid file format. CSV must contain a header row and at least 1 data row.']);
      setParsedPlayers(null);
      setPlayerChangeSummary([]);
      setHasPlayerValidationError(false);
      return;
    }

    const headers = csvRows[0].map(h => h.toLowerCase().trim());
    
    // Header Column Indexes
    const idIdx = headers.findIndex(h => h === 'player id' || h === 'id' || h.replace(/\s+/g, '') === 'playerid');
    const nameIdx = headers.findIndex(h => h === 'name' || h === 'player name' || h.replace(/\s+/g, '') === 'playername');
    const natIdx = headers.findIndex(h => h === 'nationality' || h === 'nation' || h === 'country');
    const baseIdx = headers.findIndex(h => h === 'base ability' || h === 'ability' || h === 'baseability' || h === 'rating' || h === 'str');
    const potIdx = headers.findIndex(h => h === 'potential');
    const endIdx = headers.findIndex(h => h === 'endurance');
    const lonIdx = headers.findIndex(h => h === 'longevity');

    if (idIdx === -1) {
      setPlayerFileLog([`Error: Missing columns. Row must have a 'Player ID' or 'ID' column.`]);
      setParsedPlayers(null);
      setPlayerChangeSummary([]);
      setHasPlayerValidationError(false);
      return;
    }

    // 1. Roster Capacity Constraint Validation Check
    let primaryCompetitorsCount = 0;
    for (let r = 1; r < csvRows.length; r++) {
      const row = csvRows[r];
      if (!row || row.length === 0) continue;
      const rawId = row[idIdx];
      if (!rawId) continue;
      const player = players.find(p => p.id === rawId);
      if (player && !player.isFiller) {
        primaryCompetitorsCount++;
      }
    }

    if (primaryCompetitorsCount > 150) {
      setPlayerFileLog([
        `❌ ROSTER CAPACITY ERROR: Sum of incoming primary competitors (${primaryCompetitorsCount}) has scaled past the 150-player capacity ceiling! Import halted completely.`
      ]);
      setParsedPlayers(null);
      setPlayerChangeSummary([]);
      setHasPlayerValidationError(true);
      return;
    }

    const nextPlayers = [...players];
    const logLines: string[] = [];
    const changeSummaryLines: string[] = [];
    let updateCount = 0;
    let ignoredCount = 0;
    let validationFailed = false;

    for (let r = 1; r < csvRows.length; r++) {
      const row = csvRows[r];
      // Skip empty or mismatching length rows
      if (!row || row.length === 0) continue;
      
      const rawId = row[idIdx];
      if (!rawId) continue;

      const pIdx = nextPlayers.findIndex(p => p.id === rawId);
      if (pIdx === -1) {
        logLines.push(`⚠️ Line ${r + 1}: Player ID '${rawId}' not found in roster. Skipping.`);
        ignoredCount++;
        continue;
      }

      const player = { ...nextPlayers[pIdx] };
      const changes: string[] = [];

      // Edit Name
      if (nameIdx !== -1 && row[nameIdx]) {
        const oldName = player.name;
        const newName = row[nameIdx].trim();
        if (newName && oldName !== newName) {
          player.name = newName;
          changes.push(`Name: '${oldName}' ➔ '${newName}'`);
        }
      }

      // Edit Nationality
      if (natIdx !== -1 && row[natIdx]) {
        const oldNat = player.nationality;
        const newNat = row[natIdx].trim();
        if (newNat && oldNat !== newNat) {
          player.nationality = newNat;
          changes.push(`Nationality: '${oldNat}' ➔ '${newNat}'`);
        }
      }

      // Helper to parse base attributes (1 - 10)
      const parseAttributeValue = (valStr: string, name: string): number | null => {
        const num = parseInt(valStr, 10);
        if (isNaN(num)) return null;
        if (num < 1 || num > 10) {
          logLines.push(`⚠️ Line ${r + 1}: Player '${player.name}' has invalid ${name} score '${valStr}'. Must be integer 1 to 10. Clamping to closest range.`);
          validationFailed = true;
          return Math.max(1, Math.min(10, num));
        }
        return num;
      };

      // Edit Base Ability
      if (baseIdx !== -1 && row[baseIdx]) {
        const parsedVal = parseAttributeValue(row[baseIdx], 'Base Ability');
        if (parsedVal !== null && player.baseAbility !== parsedVal) {
          changes.push(`Base Ability: ${player.baseAbility} ➔ ${parsedVal}`);
          player.baseAbility = parsedVal;
        }
      }

      // Edit Potential
      if (potIdx !== -1 && row[potIdx]) {
        const parsedVal = parseAttributeValue(row[potIdx], 'Potential');
        if (parsedVal !== null && player.potential !== parsedVal) {
          changes.push(`Potential: ${player.potential} ➔ ${parsedVal}`);
          player.potential = parsedVal;
        }
      }

      // Edit Endurance
      if (endIdx !== -1 && row[endIdx]) {
        const parsedVal = parseAttributeValue(row[endIdx], 'Endurance');
        if (parsedVal !== null && player.endurance !== parsedVal) {
          changes.push(`Endurance: ${player.endurance} ➔ ${parsedVal}`);
          player.endurance = parsedVal;
        }
      }

      // Edit Longevity
      if (lonIdx !== -1 && row[lonIdx]) {
        const parsedVal = parseAttributeValue(row[lonIdx], 'Longevity');
        if (parsedVal !== null && player.longevity !== parsedVal) {
          changes.push(`Longevity: ${player.longevity} ➔ ${parsedVal}`);
          player.longevity = parsedVal;
        }
      }

      if (changes.length > 0) {
        nextPlayers[pIdx] = player;
        changeSummaryLines.push(`✓ ${player.name} (${player.id}): [${changes.join(', ')}]`);
        updateCount++;
      }
    }

    logLines.unshift(
      `📊 CSV PARSED SUCCESSFULLY: Detected ${csvRows.length - 1} records.`,
      `✓ Matched & modified: ${updateCount} players.`,
      `⚠️ Unmatched/Skipped: ${ignoredCount} records.`
    );

    // Dynamic Superstar count verification log
    const ssCount = nextPlayers.filter(p => p.baseAbility >= 9).length;
    if (ssCount > 6) {
      logLines.push(`⚠️ Warning: Total Superstars (Ability 9-10) is currently at ${ssCount}. Standard cap targets 2-6 athletes.`);
    }

    setPlayerFileLog(logLines);
    setParsedPlayers(nextPlayers);
    setPlayerChangeSummary(changeSummaryLines);
    setHasPlayerValidationError(validationFailed);
  };

  // PARSE TOURNAMENTS CSV
  const handleProcessTournamentsCSV = (csvText: string) => {
    const csvRows = parseCSV(csvText);
    if (csvRows.length < 2) {
      setTourFileLog(['Error: Invalid file format. CSV must contain a header row and at least 1 data row.']);
      setParsedCalendar(null);
      setTourChangeSummary([]);
      return;
    }

    const headers = csvRows[0].map(h => h.toLowerCase().trim());
    
    const idIdx = headers.findIndex(h => h === 'tournament id' || h === 'id' || h.replace(/\s+/g, '') === 'tournamentid');
    const nameIdx = headers.findIndex(h => h === 'tournament name' || h === 'name' || h.replace(/\s+/g, '') === 'tournamentname');
    const formatIdx = headers.findIndex(h => h === 'match format (sets)' || h === 'match format' || h === 'format' || h === 'sets' || h === 'set number');
    const levelIdx = headers.findIndex(h => h === 'tier/level' || h === 'tier' || h === 'level');
    const weatherIdx = headers.findIndex(h => h === 'weather');

    if (idIdx === -1) {
      setTourFileLog([`Error: Missing columns. Row must have a 'Tournament ID' or 'ID' column.`]);
      setParsedCalendar(null);
      setTourChangeSummary([]);
      return;
    }

    // Clone calendar
    const nextCalendar = calendar.map(w => ({
      ...w,
      tournaments: w.tournaments.map(t => ({ ...t }))
    }));

    const logLines: string[] = [];
    const changeSummaryLines: string[] = [];
    let updateCount = 0;
    let ignoredCount = 0;

    const TIERS: TournamentTier[] = [
      'Grand Slam', 'Masters 1000', 'Masters 500', 'Masters 250',
      'Challenger 200', 'Challenger LCQ 150', 'Challenger 175', 'Challenger 125', 'Challenger 100'
    ];

    const WEATHERS: WeatherType[] = ['Normal', 'Hot', 'Windy', 'Rain-Delayed'];

    for (let r = 1; r < csvRows.length; r++) {
      const row = csvRows[r];
      if (!row || row.length === 0) continue;

      const rawId = row[idIdx];
      if (!rawId) continue;

      // Find tournament in the calendar
      let foundTourRef: Tournament | null = null;
      let foundWeekNum = -1;

      for (const week of nextCalendar) {
        const tIdx = week.tournaments.findIndex(t => t.id === rawId);
        if (tIdx !== -1) {
          foundTourRef = week.tournaments[tIdx];
          foundWeekNum = week.weekNumber;
          break;
        }
      }

      if (!foundTourRef) {
        logLines.push(`⚠️ Line ${r + 1}: Tournament ID '${rawId}' not found in active schedule. Skipping.`);
        ignoredCount++;
        continue;
      }

      const changes: string[] = [];

      // Edit Name
      if (nameIdx !== -1 && row[nameIdx]) {
        const oldName = foundTourRef.name;
        const newName = row[nameIdx].trim();
        if (newName && oldName !== newName) {
          foundTourRef.name = newName;
          changes.push(`Name: '${oldName}' ➔ '${newName}'`);
        }
      }

      // Edit Match Format (Sets) -> '1-Set' | '3-Set' | '5-Set'
      if (formatIdx !== -1 && row[formatIdx]) {
        const rawFormat = row[formatIdx].trim().toLowerCase();
        let targetFormat: '1-Set' | '3-Set' | '5-Set' | null = null;

        if (rawFormat.includes('1') || rawFormat.includes('one')) targetFormat = '1-Set';
        else if (rawFormat.includes('3') || rawFormat.includes('three')) targetFormat = '3-Set';
        else if (rawFormat.includes('5') || rawFormat.includes('five')) targetFormat = '5-Set';

        if (targetFormat && foundTourRef.matchFormat !== targetFormat) {
          changes.push(`Format: '${foundTourRef.matchFormat}' ➔ '${targetFormat}'`);
          foundTourRef.matchFormat = targetFormat;
        } else if (!targetFormat) {
          logLines.push(`⚠️ Line ${r + 1}: Tournament '${foundTourRef.name}' has invalid set format '${row[formatIdx]}'. Use 1, 3, or 5.`);
        }
      }

      // Edit Level (Tier)
      if (levelIdx !== -1 && row[levelIdx]) {
        const rawLevel = row[levelIdx].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedTier = TIERS.find(t => t.toLowerCase().replace(/[^a-z0-9]/g, '') === rawLevel);

        if (matchedTier && foundTourRef.tier !== matchedTier) {
          changes.push(`Tier: '${foundTourRef.tier}' ➔ '${matchedTier}'`);
          foundTourRef.tier = matchedTier;
          
          // Re-align tournament points based on new tier
          const pointsMap: Record<TournamentTier, number> = {
            'Grand Slam': 2000,
            'Masters 1000': 1000,
            'Masters 500': 500,
            'Masters 250': 250,
            'Challenger 200': 200,
            'Challenger LCQ 150': 150,
            'Challenger 175': 175,
            'Challenger 125': 125,
            'Challenger 100': 100
          };
          foundTourRef.points = pointsMap[matchedTier];
        } else if (!matchedTier) {
          logLines.push(`⚠️ Line ${r + 1}: Tournament '${foundTourRef.name}' has invalid level '${row[levelIdx]}'.`);
        }
      }

      // Edit Weather
      if (weatherIdx !== -1 && row[weatherIdx]) {
        const rawWeather = row[weatherIdx].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedWeather = WEATHERS.find(w => w.toLowerCase().replace(/[^a-z0-9]/g, '') === rawWeather);

        if (matchedWeather && foundTourRef.weather !== matchedWeather) {
          changes.push(`Weather: '${foundTourRef.weather}' ➔ '${matchedWeather}'`);
          foundTourRef.weather = matchedWeather;
        } else if (!matchedWeather) {
          logLines.push(`⚠️ Line ${r + 1}: Tournament '${foundTourRef.name}' has invalid weather type '${row[weatherIdx]}'. Use Normal, Hot, Windy, or Rain-Delayed.`);
        }
      }

      if (changes.length > 0) {
        changeSummaryLines.push(`✓ ${foundTourRef.name} (Week ${foundWeekNum}): [${changes.join(', ')}]`);
        updateCount++;
      }
    }

    logLines.unshift(
      `📊 CSV CALENDAR PARSED SUCCESSFULLY: Detected ${csvRows.length - 1} records.`,
      `✓ Matched & modified: ${updateCount} tournaments.`,
      `⚠️ Unmatched/Skipped: ${ignoredCount} records.`
    );

    setTourFileLog(logLines);
    setParsedCalendar(nextCalendar);
    setTourChangeSummary(changeSummaryLines);
  };

  // Uploader Dropzone handlers for polished interactions
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePlayersFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setPlayerRawText(result);
          handleProcessPlayersCSV(result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleToursFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setTourRawText(result);
          handleProcessTournamentsCSV(result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePlayersFileClick = () => {
    playerFileInputRef.current?.click();
  };

  const handleToursFileClick = () => {
    tourFileInputRef.current?.click();
  };

  const handlePlayersFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setPlayerRawText(result);
          handleProcessPlayersCSV(result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleToursFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setTourRawText(result);
          handleProcessTournamentsCSV(result);
        }
      };
      reader.readAsText(file);
    }
  };

  // COMMIT ACTIONS
  const handleCommitPlayers = () => {
    if (!parsedPlayers) return;
    onUpdatePlayers(parsedPlayers);
    logCallback(`✓ Database updated: modified ${playerChangeSummary.length} players mass roster attributes!`);
    setParsedPlayers(null);
    setPlayerChangeSummary([]);
    setPlayerFileLog(prev => [...prev, `🟢 SUCCESS: Mass player changes committed successfully into state!`]);
    setPlayerRawText('');
  };

  const handleCommitTournaments = () => {
    if (!parsedCalendar) return;
    onUpdateCalendar(parsedCalendar);
    logCallback(`✓ Database updated: modified ${tourChangeSummary.length} tournaments mass calendar attributes!`);
    setParsedCalendar(null);
    setTourChangeSummary([]);
    setTourFileLog(prev => [...prev, `🟢 SUCCESS: Mass tournament changes committed successfully into state!`]);
    setTourRawText('');
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-md font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Professional CSV Database Control Panel</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Mass maintain roster attributes and tournament calendars via standard spreadsheet files. Download instant CSV data grids containing real-time results, points standings, or pairwise head-to-head metrics. Perform mass edit updates without losing simulator safety constraints.
          </p>
        </div>

        {/* DATABASE STATS CARDS */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* ACTIVE ROSTER CARD */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center space-x-3 shrink-0 w-full sm:w-auto sm:min-w-[210px]">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider font-extrabold pb-0.5">ACTIVE ROSTER</div>
              <div className="text-xs font-bold font-mono text-slate-100">
                {players.length} Active Players
              </div>
              <div className="text-[9px] text-slate-500 font-sans leading-none mt-1 font-bold">100% simulated state</div>
            </div>
          </div>

          {/* ELITE TIER CARD (Moved from rankings tab) */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center space-x-3 shrink-0 w-full sm:w-auto sm:min-w-[210px]">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider font-extrabold pb-0.5 animate-pulse">ELITE TIER (9-10)</div>
              <div className="text-xs font-bold font-mono text-indigo-400">
                {players.filter(p => p.baseAbility >= 9).length} Superstars
              </div>
              <div className="text-[9px] text-slate-500 font-sans leading-none mt-1 font-bold">Strictly regulated caps</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Export and Import */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. MASTER CSV DATA EXPORTS */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">1. Export Season Datasets</h3>
            <p className="text-[10px] text-slate-500 mt-1">Generate and download fresh offline spreadsheets.</p>
          </div>

          <div className="space-y-3">
            <button
              id="export-standings-csv"
              onClick={handleExportPlayers}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 px-4 py-3 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-white">Active Roster Standings</p>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">Rank, points, abilities, filler labels, record</p>
              </div>
              <Download className="w-4 h-4 text-indigo-400 shrink-0" />
            </button>

            <button
              id="export-calendar-csv"
              onClick={handleExportTournaments}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 px-4 py-3 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-white">Tournament Calendar & Results</p>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">Wk, setup, weather, match formats, champions</p>
              </div>
              <Download className="w-4 h-4 text-indigo-400 shrink-0" />
            </button>

            <button
              id="export-h2h-csv"
              onClick={handleExportH2H}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 px-4 py-3 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-200 group-hover:text-white">Head-To-Head Records</p>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">Player pairs non-zero counts match history</p>
              </div>
              <Download className="w-4 h-4 text-indigo-400 shrink-0" />
            </button>
          </div>

          {/* Useful Tips */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/40 text-[10px] text-slate-500 leading-normal space-y-1.5">
            <strong className="text-slate-400 uppercase font-mono block text-[9px] tracking-wider">Spreadsheet Schema Guide:</strong>
            <p><strong>Mass Player Editing:</strong> Match edits mapped by ID columns. Editable headers: Name, Nationality, Base Ability, Potential, Endurance, Longevity.</p>
            <p><strong>Mass Tournament Editing:</strong> Managed by Tournament ID columns (e.g. t-c200-1). Headers: Name, Match Format (Sets), Tier/Level, Weather.</p>
          </div>
        </div>

        {/* 2. PLAYER MASSEDIT IMPORT */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">2. Mass Edit Players</h3>
              <p className="text-[10px] text-slate-500 mt-1">Specify Name, Nationality, & 1-10 ability scores</p>
            </div>
            <button
              onClick={handleExportPlayerTemplate}
              className="px-2 py-1 text-[9px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono hover:bg-slate-950 border border-slate-800 rounded transition-all cursor-pointer shadow-sm"
              title="Download player mass edit template reflecting current state"
            >
              <Download className="w-2.5 h-2.5" />
              <span>Template</span>
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handlePlayersFileDrop}
            onClick={handlePlayersFileClick}
            className="flex-1 min-h-[90px] border border-dashed border-slate-800 hover:border-indigo-600/40 bg-slate-950 hover:bg-slate-950/80 rounded-xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors"
          >
            <Upload className="w-5 h-5 text-indigo-400 mb-1" />
            <p className="text-[11px] font-bold text-slate-300">Drop Player CSV or Click to Browse</p>
            <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Needs 'Player ID' or 'ID' column</p>
            <input
              type="file"
              ref={playerFileInputRef}
              onChange={handlePlayersFileChange}
              accept=".csv"
              className="hidden"
            />
          </div>

          {/* Pasting area backup choice */}
          <div>
            <label className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-wider">Or Paste Raw CSV Data Directly:</label>
            <textarea
              className="w-full h-16 mt-1 bg-slate-950 border border-slate-900 rounded-lg p-2 font-mono text-[9px] text-slate-400 focus:outline-none focus:border-indigo-500"
              placeholder="id,name,nationality,ability&#10;p-filler-0,John Senior,USA,8"
              value={playerRawText}
              onChange={(e) => {
                setPlayerRawText(e.target.value);
                handleProcessPlayersCSV(e.target.value);
              }}
            />
          </div>

          {/* Parsed Players Results/Commit button */}
          {parsedPlayers && playerChangeSummary.length > 0 && !hasPlayerValidationError && (
            <div className="mt-auto pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{playerChangeSummary.length} Players Modified</span>
                </span>
                <button
                  id="commit-players-btn"
                  onClick={handleCommitPlayers}
                  className="bg-emerald-600 text-slate-950 hover:bg-emerald-500 font-black text-[10px] px-3 py-1.5 rounded uppercase tracking-wide cursor-pointer transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. TOURNAMENT MASSEDIT IMPORT */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">3. Mass Edit Calendar</h3>
              <p className="text-[10px] text-slate-500 mt-1">Specify Name, Sets Format, Level & Weather</p>
            </div>
            <button
              onClick={handleExportCalendarTemplate}
              className="px-2 py-1 text-[9px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono hover:bg-slate-950 border border-slate-800 rounded transition-all cursor-pointer shadow-sm"
              title="Download calendar mass edit template reflecting current state"
            >
              <Download className="w-2.5 h-2.5" />
              <span>Template</span>
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleToursFileDrop}
            onClick={handleToursFileClick}
            className="flex-1 min-h-[90px] border border-dashed border-slate-800 hover:border-indigo-600/40 bg-slate-950 hover:bg-slate-950/80 rounded-xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors"
          >
            <Upload className="w-5 h-5 text-indigo-400 mb-1" />
            <p className="text-[11px] font-bold text-slate-300">Drop Calendar CSV or Click to Browse</p>
            <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Needs 'Tournament ID' or 'ID' column</p>
            <input
              type="file"
              ref={tourFileInputRef}
              onChange={handleToursFileChange}
              accept=".csv"
              className="hidden"
            />
          </div>

          {/* Pasting area backup choice */}
          <div>
            <label className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-wider">Or Paste Raw CSV Data Directly:</label>
            <textarea
              className="w-full h-16 mt-1 bg-slate-950 border border-slate-900 rounded-lg p-2 font-mono text-[9px] text-slate-400 focus:outline-none focus:border-indigo-500"
              placeholder="id,name,sets,tier,weather&#10;t-c200-1,Miami Open Warmup,5-Set,Grand Slam,Hot"
              value={tourRawText}
              onChange={(e) => {
                setTourRawText(e.target.value);
                handleProcessTournamentsCSV(e.target.value);
              }}
            />
          </div>

          {/* Parsed Calendar Results/Commit button */}
          {parsedCalendar && tourChangeSummary.length > 0 && (
            <div className="mt-auto pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{tourChangeSummary.length} Tours Modified</span>
                </span>
                <button
                  id="commit-tours-btn"
                  onClick={handleCommitTournaments}
                  className="bg-emerald-600 text-slate-950 hover:bg-emerald-500 font-black text-[10px] px-3 py-1.5 rounded uppercase tracking-wide cursor-pointer transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* DETAILED VERIFICATION LOG AND DETECTED CHANGES PREVIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Players Logs / Previews */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col max-h-[350px]">
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 font-mono uppercase">Roster Verification Logs</span>
            {playerChangeSummary.length > 0 && (
              <span className="text-[9px] font-mono leading-none font-bold bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded uppercase font-black">Changes Pending Commit</span>
            )}
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-4 font-mono text-[10px] leading-relaxed">
            {/* Actionable changes listing */}
            {playerChangeSummary.length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] text-indigo-400 font-sans font-black uppercase tracking-wider">Proposed Alterations List:</p>
                <div className="p-2.5 bg-slate-950/60 border border-slate-800/40 rounded-lg max-h-[140px] overflow-y-auto space-y-1">
                  {playerChangeSummary.map((summary, idx) => (
                    <div key={idx} className="text-slate-300 border-b border-slate-900/40 pb-0.5 last:border-0">{summary}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation diagnostic stream */}
            <div className="space-y-1">
              <p className="text-[9px] text-slate-500 font-sans font-black uppercase tracking-wider">Diagnostic Stream:</p>
              <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 space-y-1">
                {playerFileLog.length === 0 ? (
                  <p className="text-slate-600 italic">No player file uploaded or pasted yet. Roster intact.</p>
                ) : (
                  playerFileLog.map((log, idx) => {
                    let color = 'text-slate-400';
                    if (log.includes('Error')) color = 'text-red-400 font-bold';
                    else if (log.includes('Warning') || log.includes('⚠️')) color = 'text-amber-500';
                    else if (log.includes('SUCCESS') || log.includes('✓') || log.includes('🟢')) color = 'text-emerald-400 font-bold';
                    return <div key={idx} className={color}>{log}</div>;
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Logs / Previews */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col max-h-[350px]">
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 font-mono uppercase">Calendar Verification Logs</span>
            {tourChangeSummary.length > 0 && (
              <span className="text-[9px] font-mono leading-none font-bold bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded uppercase font-black">Changes Pending Commit</span>
            )}
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-4 font-mono text-[10px] leading-relaxed">
            {/* Actionable changes listing */}
            {tourChangeSummary.length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] text-indigo-400 font-sans font-black uppercase tracking-wider">Proposed Alterations List:</p>
                <div className="p-2.5 bg-slate-950/60 border border-slate-800/40 rounded-lg max-h-[140px] overflow-y-auto space-y-1">
                  {tourChangeSummary.map((summary, idx) => (
                    <div key={idx} className="text-slate-300 border-b border-slate-900/40 pb-0.5 last:border-0">{summary}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation diagnostic stream */}
            <div className="space-y-1">
              <p className="text-[9px] text-slate-500 font-sans font-black uppercase tracking-wider">Diagnostic Stream:</p>
              <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 space-y-1">
                {tourFileLog.length === 0 ? (
                  <p className="text-slate-600 italic">No calendar file uploaded or pasted yet. Schedule intact.</p>
                ) : (
                  tourFileLog.map((log, idx) => {
                    let color = 'text-slate-400';
                    if (log.includes('Error')) color = 'text-red-400 font-bold';
                    else if (log.includes('Warning') || log.includes('⚠️')) color = 'text-amber-500';
                    else if (log.includes('SUCCESS') || log.includes('✓') || log.includes('🟢')) color = 'text-emerald-400 font-bold';
                    return <div key={idx} className={color}>{log}</div>;
                  })
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
