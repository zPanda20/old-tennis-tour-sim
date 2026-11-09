/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SurfaceType = 'Hard' | 'Clay' | 'Grass' | 'Neutral';
export type SpecTier = 'Specialist' | 'Master' | 'None';

export interface SurfaceProfile {
  specializationType: SurfaceType;
  specializationTier: SpecTier;
}

export interface Trophy {
  season: number;
  tournamentName: string;
  tierString: string;
  trophyUrl?: string;
}

export interface PlayerStats {
  form: number;       // 0 - 100
  fatigue: number;    // 0 - 100
  playedEvents: number;
  matchWins: number;
  matchLosses: number;
  grandSlamWins: number; // GS Main Draw Match wins (for ranking tie-breakers)
}

export interface Player {
  id: string;
  name: string;
  nationality: string;
  portraitUrl?: string;
  age: number;
  seasonsOnTour: number;
  
  // Base Attributes
  baseAbility: number; // 1 - 10 (9 and 10 capped to 2-6 players total)
  potential: number;   // 1 - 10
  endurance: number;   // 1 - 10
  longevity: number;   // 1 - 10
  
  // Surface
  surfaceProfile: SurfaceProfile;
  
  // Rankings & History
  ranking: number;
  points: number;
  prevSeasonPoints: number; // For rolling points tracking if needed
  
  // Trophy Cabinet
  trophyCabinet: Trophy[];
  
  // Active Season Stats
  stats: PlayerStats;
  
  // Head-to-head records with other player IDs: [player_id] -> wins count
  h2h: Record<string, number>;
  
  // Is this player a rookie generated this year?
  isRookie: boolean;
  isRetired: boolean;
  isFiller?: boolean;
  isTrickyVulture: boolean;
  historyPoints: number[]; // History of points end of each season
  historyRankings: number[]; // History of ranking end of each season
  careerExits?: Record<string, {
    wins: number;
    finals: number;
    semis: number;
    quarters: number;
    played: number;
  }>;
  historyMatchWins?: number[];
  historyMatchLosses?: number[];
  historyTitlesCount?: number[];
  surfaceStats?: {
    hardWins: number;
    hardLosses: number;
    clayWins: number;
    clayLosses: number;
    grassWins: number;
    grassLosses: number;
  };
  weeklyRankings?: number[];
  activeSeasonResults?: Array<{ tournamentId: string; pointsEarned: number }>;
}

export type TournamentTier =
  | 'Grand Slam'
  | 'Masters 1000'
  | 'Masters 500'
  | 'Masters 250'
  | 'Challenger 200'
  | 'Challenger LCQ 150'
  | 'Challenger 175'
  | 'Challenger 125'
  | 'Challenger 100';

export type WeatherType = 'Normal' | 'Hot' | 'Windy' | 'Rain-Delayed';

export interface Tournament {
  id: string;
  name: string;
  logoUrl?: string;
  trophyUrl?: string;
  smallLogoUrl: string;
  largeTrophyUrl: string;
  week: number;
  tier: TournamentTier;
  drawSize: number;
  surface: SurfaceType;
  weather: WeatherType;
  points: number; // Winner points
  matchFormat: '1-Set' | '3-Set' | '5-Set';
  isCompleted: boolean;
  bracket: Match[][] | null; // Array of rounds, each round is list of matches
  winnerId: string | null;
  runnerUpId: string | null;
  // Specific list of player IDs playing in this tournament
  entrants: string[];
}

export interface MatchScore {
  player1Sets: number;
  player2Sets: number;
  player1Games: number[][]; // [setIndex][playerGames]
  player2Games: number[][];
}

export interface Match {
  id: string;
  tournamentId: string;
  roundIndex: number; // 0, 1, 2, ...
  matchIndex: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  loserId: string | null;
  score: MatchScore | null;
  isCompleted: boolean;
  isBye: boolean;
  gamesPlayed: number;
}

export interface Week {
  weekNumber: number;
  name: string;
  tournaments: Tournament[];
  isCompleted: boolean;
}

export interface TourState {
  currentSeason: number;
  currentWeekIndex: number; // 0 to 43
  players: Player[];
  calendar: Week[];
  selectedPlayerId: string | null;
  simulationLog: string[];
  activeTab: 'rankings' | 'calendar' | 'profile' | 'analytics';
}

export interface GymProfile {
  id: string; // e.g. "-zera"
  suffix: string; // e.g. "-zera"
  name: string; // e.g. "Zera High Performance"
  foundedYear: number;
  location: string;
  logoUrl?: string;
  color: string; // Tailwind accent color key, e.g. "sky", "orange", "indigo"
}

export interface HistoricalPlayerStanding {
  id: string;
  name: string;
  nationality: string;
  ranking: number;
  points: number;
  stats: {
    matchWins: number;
    matchLosses: number;
  };
  isFiller?: boolean;
}

export interface HistoricalTournamentWinner {
  tournamentId: string;
  tournamentName: string;
  tier: string;
  winnerId: string;
  winnerName: string;
  winnerNationality: string;
}

export interface HistoricalPlayerTrajectory {
  playerId: string;
  playerName: string;
  rankings: number[];
}

export interface HistoricalRivalry {
  player1Id: string;
  player1Name: string;
  player1Nationality: string;
  player2Id: string;
  player2Name: string;
  player2Nationality: string;
  player1Wins: number;
  player2Wins: number;
  totalMatches: number;
}

export interface SeasonHistoryEntry {
  seasonNumber: number;
  topTen: HistoricalPlayerStanding[];
  winners: HistoricalTournamentWinner[];
  topThreeTrajectories?: HistoricalPlayerTrajectory[];
  topRivalries?: HistoricalRivalry[];
}


