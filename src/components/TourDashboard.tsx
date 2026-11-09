/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Player, SurfaceType, Week, SeasonHistoryEntry } from '../types';
import { Search, Trophy, Sparkles, User, X, Calendar, Award, Clock } from 'lucide-react';
import { RankingRow } from './RankingRow';

export function getFlagEmoji(nationality: string): string {
  if (!nationality) return '🏳️';
  const norm = nationality.toUpperCase().trim();
  
  // Special subnational flags or overrides
  const specialFlags: Record<string, string> = {
    ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ENGLAND: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', WALES: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', SCOTLAND: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    UK: '🇬🇧', GBR: '🇬🇧',
  };

  if (specialFlags[norm]) {
    return specialFlags[norm];
  }

  // Map of 3-letter codes / full names to 2-letter standard country codes
  const nameOr3To2: Record<string, string> = {
    // 3-letter tennis/common codes
    SUI: 'CH', SWITZERLAND: 'CH',
    ESP: 'ES', SPAIN: 'ES',
    SRB: 'RS', SERBIA: 'RS',
    RUS: 'RU', RUSSIA: 'RU',
    GER: 'DE', GERMANY: 'DE',
    ITA: 'IT', ITALY: 'IT',
    GRE: 'GR', GREECE: 'GR',
    POL: 'PL', POLAND: 'PL',
    USA: 'US',
    NOR: 'NO', NORWAY: 'NO',
    DEN: 'DK', DENMARK: 'DK',
    FRA: 'FR', FRANCE: 'FR',
    BUL: 'BG', BULGARIA: 'BG',
    CRO: 'HR', CROATIA: 'HR',
    CAN: 'CA', CANADA: 'CA',
    AUS: 'AU', AUSTRALIA: 'AU',
    JPN: 'JP', JAPAN: 'JP',
    AUT: 'AT', AUSTRIA: 'AT',
    ARG: 'AR', ARGENTINA: 'AR',
    SWE: 'SE', SWEDEN: 'SE',
    BEL: 'BE', BELGIUM: 'BE',
    NED: 'NL', NLD: 'NL', NETHERLANDS: 'NL',
    CHI: 'CL', CHILE: 'CL',
    CZE: 'CZ', 'CZECH': 'CZ', 'CZECH REPUBLIC': 'CZ',
    SVK: 'SK', SLOVAKIA: 'SK',
    KAZ: 'KZ', KAZAKHSTAN: 'KZ',
    FIN: 'FI', FINLAND: 'FI',
    HUN: 'HU', HUNGARY: 'HU',
    BRA: 'BR', BRAZIL: 'BR',
    ALB: 'AL', ALBANIA: 'AL',
    TUR: 'TR', TURKEY: 'TR',
    CRC: 'CR', 'COSTA RICA': 'CR',
    CUB: 'CU', CUBA: 'CU',
    DOM: 'DO', 'DOMINICAN REPUBLIC': 'DO',
    ECU: 'EC', ECUADOR: 'EC',
    SLV: 'SV', ESA: 'SV', 'EL SALVADOR': 'SV',
    GTM: 'GT', GUA: 'GT', GUATEMALA: 'GT',
    HTI: 'HT', HAITI: 'HT',
    JAM: 'JM', JAMICA: 'JM', JAMAICA: 'JM',
    PAN: 'PA', PANAMA: 'PA',
    PRY: 'PY', PARAGUAY: 'PY',
    URU: 'UY', URY: 'UY', URUAY: 'UY', URUGUAY: 'UY',
    VEN: 'VE', VENEZUELA: 'VE',
    IND: 'IN', INDIA: 'IN', INDIAN: 'IN',
    IRN: 'IR', IRAN: 'IR',
    IRQ: 'IQ', IRAQ: 'IQ',
    JOR: 'JO', JORDAN: 'JO',
    KWT: 'KW', KUWAIT: 'KW',
    LAO: 'LA', LAOS: 'LA',
    MAS: 'MY', MYS: 'MY', MALAYSIA: 'MY',
    QAT: 'QA', QATAR: 'QA',
    THA: 'TH', THAILAND: 'TH',
    UZB: 'UZ', UZBEKISTAN: 'UZ',
    VIE: 'VN', VNM: 'VN', VIETNAM: 'VN',
    ALG: 'DZ', DZA: 'DZ', ALGERIA: 'DZ',
    CPV: 'CV', 'CAPE VERDE': 'CV',
    ANG: 'AO', ANGOLA: 'AO',
    BFA: 'BF', BFO: 'BF', 'BURKINA FASO': 'BF',
    CMR: 'CM', CAMEROON: 'CM',
    EGY: 'EG', EGYPT: 'EG',
    GHA: 'GH', GHANA: 'GH',
    CIV: 'CI', 'IVORY COAST': 'CI',
    SEN: 'SN', SENEGAL: 'SN',
    FIJ: 'FJ', FIJI: 'FJ',
    NZL: 'NZ', 'NEW ZEALAND': 'NZ',
    KIR: 'KI', KIRIBATI: 'KI',
    MLT: 'MT', MALTA: 'MT',
    HKG: 'HK', 'HONG KONG': 'HK',
    KOR: 'KR', 'SOUTH KOR': 'KR', 'SOUTH KOREA': 'KR',
    PHL: 'PH', PHI: 'PH', PHILIPPINES: 'PH',
    UKR: 'UA', UKRAINE: 'UA',
    PSE: 'PS', PALESTINE: 'PS',
    ZAF: 'ZA', RSA: 'ZA', 'SOUTH AFRICA': 'ZA',
    SGP: 'SG', SINGAPORE: 'SG',
    MEX: 'MX', MEXICO: 'MX',
    PRT: 'PT', POR: 'PT', PORTUGAL: 'PT',
    MDA: 'MD', MOLDOVA: 'MD',
    IRL: 'IE', IRELAND: 'IE',
    COL: 'CO', COLOMBIA: 'CO',
    NGR: 'NG', NIGERIA: 'NG',
    IDN: 'ID', INDONESIA: 'ID',
    CHN: 'CN', CHINA: 'CN',
    SLO: 'SI', SLOVENIA: 'SI',
    LAT: 'LV', LATVIA: 'LV',
    EST: 'EE', ESTONIA: 'EE',
    LTU: 'LT', LITHUANIA: 'LT',
    ROU: 'RO', ROMANIA: 'RO',
    LUX: 'LU', LUXEMBOURG: 'LU',
    MAR: 'MA', MOROCCO: 'MA',
    TUN: 'TN', TUNISIA: 'TN',
    KEN: 'KE', KENYA: 'KE',
    TPE: 'TW', TAIWAN: 'TW',
    ISR: 'IL', ISRAEL: 'IL',
    ISL: 'IS', ICELAND: 'IS',
    CYP: 'CY', CYPRUS: 'CY',
    GEO: 'GE', GEORGIA: 'GE',
    ARM: 'AM', ARMENIA: 'AM',
    AZE: 'AZ', AZERBAIJAN: 'AZ',
    MNE: 'ME', MONTENEGRO: 'ME',
    BIH: 'BA', BOSNIA: 'BA',
    MKD: 'MK', MACEDONIA: 'MK',
    PUR: 'PR', 'PUERTO RICO': 'PR',
    BAH: 'BS', BAHAMAS: 'BS',
    BGD: 'BD', BANGLADESH: 'BD',
    PER: 'PE', PERU: 'PE',
    BOL: 'BO', BOLIVIA: 'BO',
    SGP_T: 'SG',
  };

  const code2 = nameOr3To2[norm] || (norm.length === 2 ? norm : null);
  
  if (code2) {
    const charCodeAtZero = code2.charCodeAt(0);
    const charCodeAtOne = code2.charCodeAt(1);
    
    if (charCodeAtZero >= 65 && charCodeAtZero <= 90 && charCodeAtOne >= 65 && charCodeAtOne <= 90) {
      return String.fromCodePoint(
        127397 + charCodeAtZero,
        127397 + charCodeAtOne
      );
    }
  }

  return '🏳️';
}

interface TourDashboardProps {
  players: Player[];
  onSelectPlayer: (id: string) => void;
  calendar?: Week[];
  seasonHistory?: SeasonHistoryEntry[];
}

const grandSlamsMetadata = [
  {
    label: 'Lion City Slam',
    shortLabel: 'Lion City Slam',
    emoji: '🇸🇬',
    location: 'Singapore',
    surface: 'Hard',
    weather: 'Normal',
    defaultWeek: 19,
    description: 'Pristine opening hardcourt major of the season under the tropical night sky. Styled with a custom Sapphire Blue theme representing Singapore\'s iconic glittering waterfront.',
    trophyColor: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] fill-cyan-500/10',
    themeClass: 'from-cyan-600/10 to-blue-500/10 outline-cyan-500/25 text-cyan-400',
    accentColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
    svgTrophy: (
      <svg viewBox="0 0 120 180" className="w-36 h-36">
        <defs>
          <linearGradient id="sapphireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <ellipse cx="60" cy="165" rx="35" ry="10" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        <rect x="42" y="140" width="36" height="20" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="2" />
        <line x1="48" y1="150" x2="72" y2="150" stroke="#06b6d4" strokeWidth="1" />
        <path d="M52 140 L52 110 Q60 115 68 110 L68 140 Z" fill="url(#sapphireGrad)" />
        <path d="M25 50 Q10 40 25 80 Q35 110 45 95 Q38 80 32 60" fill="none" stroke="url(#sapphireGrad)" strokeWidth="4" strokeLinecap="round" />
        <path d="M95 50 Q110 40 95 80 Q85 110 75 95 Q82 80 88 60" fill="none" stroke="url(#sapphireGrad)" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 45 C 30 110, 90 110, 90 45 Z" fill="url(#sapphireGrad)" stroke="#1e293b" strokeWidth="1" />
        <path d="M30 45 Q60 30 90 45 Z" fill="url(#sapphireGrad)" />
        <circle cx="60" cy="30" r="6" fill="url(#sapphireGrad)" />
        <path d="M57 30 L63 30 M60 27 L60 33" stroke="#1e293b" strokeWidth="1.5" />
        <path d="M45 60 Q60 70 75 60" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.6" />
        <ellipse cx="60" cy="85" rx="10" ry="4" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.4" />
      </svg>
    )
  },
  {
    label: 'La Terre Rouge',
    shortLabel: 'La Terre Rouge',
    emoji: '🇫🇷',
    location: 'Paris, France',
    surface: 'Clay',
    weather: 'Normal',
    defaultWeek: 28,
    description: 'The absolute pinnacle clay court championship. Grind-it-out baseline slugfests and sliding baseline defense over slow, dusty clay courts set against a deep, vibrant Ruby Red aesthetic.',
    trophyColor: 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] fill-red-500/10',
    themeClass: 'from-red-600/10 to-rose-500/10 outline-rose-500/25 text-red-550',
    accentColor: 'text-rose-450 border-red-500/30 bg-red-500/5',
    svgTrophy: (
      <svg viewBox="0 0 120 180" className="w-36 h-36">
        <defs>
          <linearGradient id="rubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
        </defs>
        <polygon points="20,165 100,165 92,135 28,135" fill="#020617" stroke="#475569" strokeWidth="2.5" />
        <rect x="25" y="145" width="70" height="15" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
        <rect x="50" y="115" width="20" height="20" fill="url(#rubyGrad)" stroke="#334155" strokeWidth="1" />
        <circle cx="60" cy="125" r="7" fill="url(#rubyGrad)" />
        <path d="M22 65 Q5 55 12 85 Q18 105 32 95 Q25 80 18 70" fill="none" stroke="url(#rubyGrad)" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M98 65 Q115 55 108 85 Q102 105 88 95 Q95 80 102 70" fill="none" stroke="url(#rubyGrad)" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M22 55 Q22 115 60 115 Q98 115 98 55 Z" fill="url(#rubyGrad)" stroke="#1e293b" strokeWidth="1" />
        <ellipse cx="60" cy="55" rx="38" ry="8" fill="url(#rubyGrad)" stroke="#475569" strokeWidth="1" />
        <ellipse cx="60" cy="55" rx="32" ry="5" fill="#475569" opacity="0.3" />
        <rect x="40" y="75" width="40" height="12" rx="1" fill="#475569" opacity="0.2" />
        <line x1="45" y1="81" x2="75" y2="81" stroke="#fda4af" strokeWidth="1" />
      </svg>
    )
  },
  {
    label: 'The Crown',
    shortLabel: 'The Crown',
    emoji: '🇬🇧',
    location: 'London, Great Britain',
    surface: 'Grass',
    weather: 'Windy',
    defaultWeek: 34,
    description: 'Highly legendary grass lawns requiring lightning reflexes and clinical slice/volley capability. Embodies the iconic and traditional Emerald Green aesthetic of lawns at the peak of summer.',
    trophyColor: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] fill-emerald-500/10',
    themeClass: 'from-emerald-600/10 to-teal-500/10 outline-emerald-500/25 text-emerald-400',
    accentColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
    svgTrophy: (
      <svg viewBox="0 0 120 180" className="w-36 h-36">
        <defs>
          <linearGradient id="emeraldCupGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        <ellipse cx="60" cy="165" rx="42" ry="12" fill="#022c22" stroke="#047857" strokeWidth="2.5" />
        <ellipse cx="60" cy="158" rx="38" ry="9" fill="#1c1917" />
        <path d="M54 150 L54 115 Q60 120 66 115 L66 150 Z" fill="url(#emeraldCupGrad)" />
        <path d="M26 60 C 12 40, 12 100, 40 100" fill="none" stroke="url(#emeraldCupGrad)" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M94 60 C 108 40, 108 100, 80 100" fill="none" stroke="url(#emeraldCupGrad)" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M28 50 C 28 115, 92 115, 92 50 Z" fill="url(#emeraldCupGrad)" stroke="#047857" strokeWidth="1" />
        <path d="M28 50 Q60 32 92 50 Z" fill="url(#emeraldCupGrad)" />
        <g transform="translate(56, 12)">
          <rect x="1" y="10" width="6" height="10" rx="3" fill="#10b981" />
          <path d="M1 12 L7 18 M7 12 L1 18" stroke="#047857" strokeWidth="1" />
          <path d="M4 10 L4 4 M4 10 L0 5 M4 10 L8 5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
        </g>
        <path d="M38 70 Q60 80 82 70" fill="none" stroke="#6ee7b7" strokeWidth="2" opacity="0.8" />
        <path d="M44 90 Q60 100 76 90" fill="none" stroke="#6ee7b7" strokeWidth="1.5" opacity="0.5" />
      </svg>
    )
  },
  {
    label: 'The Empire',
    shortLabel: 'The Empire',
    emoji: '🇺🇸',
    location: 'New York, USA',
    surface: 'Hard',
    weather: 'Normal',
    defaultWeek: 43,
    description: 'The monumental final major of the season set under dazzling neon night lights in New York. Adorned with a clean, high-clarity White Topaz aesthetic, testing elite endurance.',
    trophyColor: 'text-slate-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] fill-slate-200/10',
    themeClass: 'from-slate-100/10 to-zinc-200/10 outline-slate-300/25 text-slate-200',
    accentColor: 'text-slate-200 border-slate-700/30 bg-slate-500/5',
    svgTrophy: (
      <svg viewBox="0 0 120 180" className="w-36 h-36">
        <defs>
          <linearGradient id="topazGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#e2e8f0" />
            <stop offset="75%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>
        <rect x="25" y="150" width="70" height="20" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="2" />
        <rect x="30" y="132" width="60" height="18" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        <polygon points="50,132 70,132 66,105 54,105" fill="url(#topazGrad)" />
        <path d="M28 50 L10 50 L10 110 L38 110" fill="none" stroke="url(#topazGrad)" strokeWidth="3" strokeLinecap="round" />
        <path d="M92 50 L110 50 L110 110 L82 110" fill="none" stroke="url(#topazGrad)" strokeWidth="3" strokeLinecap="round" />
        <path d="M28 35 L92 35 C 92 105, 28 105, 28 35 Z" fill="url(#topazGrad)" stroke="#334155" strokeWidth="1" />
        <line x1="40" y1="35" x2="40" y2="90" stroke="#cbd5e1" strokeWidth="1" opacity="0.3" />
        <line x1="60" y1="35" x2="60" y2="100" stroke="#ffffff" strokeWidth="1.5" opacity="0.5" />
        <line x1="80" y1="35" x2="80" y2="90" stroke="#94a3b8" strokeWidth="1" opacity="0.4" />
        <ellipse cx="60" cy="35" rx="32" ry="5" fill="url(#topazGrad)" stroke="#cbd5e1" strokeWidth="1" />
      </svg>
    )
  }
];

export default function TourDashboard({ players, onSelectPlayer, calendar, seasonHistory }: TourDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRetired, setShowRetired] = useState(false);
  const [surfaceFilter, setSurfaceFilter] = useState<SurfaceType | 'All'>('All');
  const [abilityFilter, setAbilityFilter] = useState<number | 'All'>('All');
  const [selectedSlamIndex, setSelectedSlamIndex] = useState<number | null>(null);

  // Comparison state
  const [comparePlayerIds, setComparePlayerIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Custom Trophy and Logo style store customized by end users
  const [customTrophiesStyle, setCustomTrophiesStyle] = useState<Record<number, {
    cupStyle: 'chalice' | 'salver' | 'shield' | 'urn';
    metalFinish: 'gold' | 'silver' | 'bronze' | 'emerald' | 'cobalt';
    customTrophyUrl?: string;
    customLogoUrl?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('tennis_custom_trophies_styles_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Ignored
    }
    return {
      0: { cupStyle: 'chalice', metalFinish: 'gold' },
      1: { cupStyle: 'shield', metalFinish: 'silver' },
      2: { cupStyle: 'urn', metalFinish: 'emerald' },
      3: { cupStyle: 'salver', metalFinish: 'cobalt' }
    };
  });

  const handleUpdateCustomStyle = (slamIndex: number, fields: Partial<{
    cupStyle: 'chalice' | 'salver' | 'shield' | 'urn';
    metalFinish: 'gold' | 'silver' | 'bronze' | 'emerald' | 'cobalt';
    customTrophyUrl: string;
    customLogoUrl: string;
  }>) => {
    const updated = {
      ...customTrophiesStyle,
      [slamIndex]: {
        ...(customTrophiesStyle[slamIndex] || {
          cupStyle: slamIndex === 0 ? 'chalice' : slamIndex === 1 ? 'shield' : slamIndex === 2 ? 'urn' : 'salver',
          metalFinish: slamIndex === 0 ? 'gold' : slamIndex === 1 ? 'silver' : slamIndex === 2 ? 'emerald' : 'cobalt'
        }),
        ...fields
      }
    };
    setCustomTrophiesStyle(updated);
    try {
      localStorage.setItem('tennis_custom_trophies_styles_v3', JSON.stringify(updated));
    } catch (e) {
      // Ignored
    }
  };

  // Filter players
  const filteredPlayers = players.filter((p) => {
    if (p.isRetired && !showRetired) return false;

    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.nationality.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSurface = surfaceFilter === 'All' || p.surfaceProfile.specializationType === surfaceFilter;
    const matchesAbility = abilityFilter === 'All' || p.baseAbility === Number(abilityFilter);

    return matchesSearch && matchesSurface && matchesAbility;
  });

  // Calculate some analytics for headers
  const topSeeds = players.slice(0, 10);
  const eliteCount = players.filter(p => p.baseAbility >= 9).length;

  return (
    <div id="tab-rankings" className="space-y-3">
      {/* Top Banner Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 w-full">
        {/* World No. 1 Mini-Card */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center space-x-3 shadow-sm select-none">
          <div className="relative w-11 h-11 rounded border border-slate-700 overflow-hidden bg-slate-950 shrink-0 flex items-center justify-center shadow-inner">
            {players[0]?.portraitUrl ? (
              <img 
                src={players[0].portraitUrl} 
                alt={players[0].name} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
                onError={(e) => { (e.target as any).style.display = 'none'; }} 
              />
            ) : (
              <span className="text-[12px] font-bold font-mono text-slate-400">{players[0] ? getFlagEmoji(players[0].nationality) : '🏳️'}</span>
            )}
            <div className="absolute bottom-0 right-0 p-0.5 bg-yellow-500 rounded-tl text-slate-950 shadow">
              <Trophy className="w-2.5 h-2.5 fill-current" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[9px] text-yellow-500 font-mono font-bold uppercase tracking-wider">WORLD NO. 1</div>
            <div className="text-[11px] font-black text-slate-100 truncate max-w-[170px]" title={players[0]?.name}>
              {players[0]?.name || 'N/A'}
            </div>
            <div className="text-[9px] text-slate-400 font-mono leading-none mt-1">
              CURRENT POINTS: <span className="text-yellow-400 font-bold">{players[0]?.points || 0} PTS</span>
            </div>
          </div>
        </div>

        {/* Grand Slam Winners Tracking Widget (Added as requested) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col justify-between shadow-sm">
          <div>
            <div className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest flex items-center space-x-1.5 pb-1 select-none">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              <span>CURRENT SEASON GRAND SLAM MAJORS</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
            {[
              { label: 'Lion City Slam', shortLabel: 'Lion City', surface: 'Hard', emoji: '🇸🇬', defaultWeek: 19, defaultTrophyColor: 'text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.5)] fill-cyan-500/10' },
              { label: 'La Terre Rouge', shortLabel: 'Terre Rouge', surface: 'Clay', emoji: '🇫🇷', defaultWeek: 28, defaultTrophyColor: 'text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)] fill-red-500/10' },
              { label: 'The Crown', shortLabel: 'The Crown', surface: 'Grass', emoji: '🇬🇧', defaultWeek: 34, defaultTrophyColor: 'text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)] fill-emerald-550/10' },
              { label: 'The Empire', shortLabel: 'The Empire', surface: 'Hard', emoji: '🇺🇸', defaultWeek: 43, defaultTrophyColor: 'text-slate-100 drop-shadow-[0_0_4px_rgba(255,255,255,0.7)] fill-slate-200/10' }
            ].map((meta, idx) => {
              // Find matching Grand Slam from calendar state
              const gs = calendar 
                ? calendar.flatMap(w => w.tournaments).find(t => t.tier === 'Grand Slam' && t.week === meta.defaultWeek)
                : null;
              
              const isCompleted = gs?.isCompleted ?? false;
              const winnerPlayer = gs?.winnerId ? players.find(p => p.id === gs.winnerId) : null;
              
              let surfaceBg = "border-cyan-500/30 text-cyan-400 bg-cyan-950/25";
              if (idx === 1) surfaceBg = "border-red-500/30 text-red-405 bg-red-950/25";
              if (idx === 2) surfaceBg = "border-emerald-500/30 text-emerald-400 bg-emerald-950/25";
              if (idx === 3) surfaceBg = "border-slate-350/30 text-slate-100 bg-slate-900/30";

              // Custom logo and color finish mappings
              const customLogo = customTrophiesStyle[idx]?.customLogoUrl || gs?.logoUrl;
              const customFinish = customTrophiesStyle[idx]?.metalFinish;
              
              let computedTrophyColor = meta.defaultTrophyColor;
              if (customFinish === 'gold') {
                computedTrophyColor = 'text-yellow-450 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)] fill-yellow-500/15';
              } else if (customFinish === 'silver') {
                computedTrophyColor = 'text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.4)] fill-slate-300/10';
              } else if (customFinish === 'bronze') {
                computedTrophyColor = 'text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.4)] fill-orange-550/10';
              } else if (customFinish === 'emerald') {
                computedTrophyColor = 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)] fill-emerald-500/10';
              } else if (customFinish === 'cobalt') {
                computedTrophyColor = 'text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.4)] fill-blue-500/10';
              }

               return (
                <div key={idx} className={`bg-slate-950 border p-2 rounded-lg flex flex-col justify-between min-w-0 space-y-2 group transition-all duration-300 hover:scale-[1.02] ${
                  idx === 0 ? 'border-cyan-500/30 hover:border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.05)] hover:shadow-[0_0_12px_rgba(6,182,212,0.1)]' :
                  idx === 1 ? 'border-red-500/30 hover:border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.05)] hover:shadow-[0_0_12px_rgba(239,68,68,0.1)]' :
                  idx === 2 ? 'border-emerald-500/30 hover:border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.05)] hover:shadow-[0_0_12px_rgba(16,185,129,0.1)]' :
                  'border-slate-350/35 hover:border-slate-200 shadow-[0_0_8px_rgba(255,255,255,0.05)] hover:shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                }`}>
                  <div className="flex justify-between items-center gap-1.5 select-none min-w-0">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      {customLogo ? (
                        <img 
                          src={customLogo} 
                          alt="Logo" 
                          className="w-4 h-4 rounded object-cover border border-slate-850 shrink-0" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <span className="text-xs shrink-0">{meta.emoji}</span>
                      )}
                      <span className="text-[10px] font-bold text-slate-200 truncate" title={gs?.name || meta.label}>
                        {meta.shortLabel}
                      </span>
                    </div>
                    <span className={`text-[7px] font-mono px-1 py-0.2 rounded font-bold tracking-tight shrink-0 border ${surfaceBg}`}>
                      {meta.surface.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-around py-1.5 bg-slate-900/60 rounded border border-slate-900/80 p-1">
                    {/* Trophy slot with high-contrast hover onboarding descriptive tooltip */}
                    <div 
                      onClick={() => setSelectedSlamIndex(idx)}
                      className={`w-9 h-9 rounded-md flex items-center justify-center border transition-all cursor-pointer hover:scale-110 hover:shadow-lg active:scale-95 duration-150 relative group/tooltip ${
                        isCompleted 
                          ? 'bg-amber-500/5 border-amber-500/30' 
                          : 'bg-slate-950/50 border-slate-850/60 border-dashed hover:border-slate-700'
                      }`}
                      title="Click to view full Major history"
                    >
                      <Trophy className={`w-5 h-5 ${isCompleted ? computedTrophyColor : 'text-slate-800'}`} />
                      
                      {/* Floating hover tooltip satisfying onboarding prompt */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-950 text-slate-100 text-[9px] font-mono rounded border border-slate-850 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap z-50 shadow-xl scale-90 group-hover/tooltip:scale-100 font-bold tracking-tight">
                        Click to view full Major history
                      </div>
                    </div>

                    {/* Winner layout avatar/image slot */}
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all overflow-hidden relative ${
                        isCompleted && winnerPlayer
                          ? 'border-indigo-500/50 bg-slate-900 shadow-sm shadow-indigo-500/10'
                          : 'border-slate-850/60 border-dashed bg-slate-950/50'
                      }`}
                      title={isCompleted && winnerPlayer ? `Champion portrait: ${winnerPlayer.name}` : `Awaiting champion portrait`}
                    >
                      {isCompleted && winnerPlayer ? (
                        winnerPlayer.portraitUrl ? (
                          <img 
                            src={winnerPlayer.portraitUrl} 
                            alt={winnerPlayer.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                            onError={(e) => { (e.target as any).style.display = 'none'; }} 
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-slate-800 text-[8px] font-extrabold text-indigo-400 font-mono">
                            {winnerPlayer.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )
                      ) : (
                        <User className="w-4 h-4 text-slate-800" />
                      )}
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-900 flex items-center justify-center min-w-0">
                    {isCompleted && winnerPlayer ? (
                      <div className="flex items-center justify-center space-x-1 min-w-0" title={`Winner: ${winnerPlayer.name}`}>
                        <span className="text-[10px] shrink-0">{getFlagEmoji(winnerPlayer.nationality)}</span>
                        <span className="text-[9px] font-black text-yellow-400 truncate leading-tight">
                          {winnerPlayer.name.split(' ').pop()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9.5px] font-mono text-slate-500 font-bold leading-tight uppercase tracking-wider select-none">
                        Week {gs?.week ?? meta.defaultWeek}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded flex flex-col md:flex-row gap-2 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
          <input
            id="search-players-input"
            type="text"
            placeholder="Search players by name, country (e.g. ESP, ITA)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <div>
            <select
              id="filter-surface-select"
              value={surfaceFilter}
              onChange={(e) => setSurfaceFilter(e.target.value as SurfaceType | 'All')}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
            >
              <option value="All">All Specialties</option>
              <option value="Hard">Hardcourt Specs</option>
              <option value="Clay">Clay Specs</option>
              <option value="Grass">Grass Specs</option>
              <option value="Neutral">Neutral All-Round</option>
            </select>
          </div>

          <div>
            <select
              id="filter-ability-select"
              value={abilityFilter}
              onChange={(e) => setAbilityFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
            >
              <option value="All">All Abilities</option>
              <option value="10">A10 (Legends)</option>
              <option value="9">A9 (Superstars)</option>
              <option value="8">A8 (Contenders)</option>
              <option value="7">A7 (Class)</option>
              <option value="6">A6 (Challengers)</option>
              <option value="5">A5 (Spars)</option>
              <option value="4">A4 (Base)</option>
              <option value="3">A3 (Rookies)</option>
            </select>
          </div>

          <label className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded px-2.5 h-[24px] cursor-pointer hover:border-slate-700 transition-all select-none shrink-0">
            <input 
              id="toggle-retired-checkbox"
              type="checkbox"
              checked={showRetired}
              onChange={(e) => setShowRetired(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 focus:ring-0 bg-slate-950 border-slate-800 rounded cursor-pointer accent-indigo-600"
            />
            <span className="text-[10px] font-mono text-slate-400 font-black uppercase">Include Retired</span>
          </label>
        </div>
      </div>

      {/* Compare State Panel */}
      {comparePlayerIds.length > 0 && (
        <div className="bg-indigo-950/25 border border-indigo-500/30 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-none">
          <div className="flex items-center space-x-2 text-slate-200">
            <span className="inline-flex items-center justify-center bg-indigo-500 text-slate-950 font-mono text-[9px] font-black h-4.5 w-4.5 rounded-full select-none shrink-0 shadow">
              {comparePlayerIds.length}
            </span>
            <span className="font-mono text-[10px] tracking-wider text-indigo-400 font-bold uppercase select-none shrink-0">Comparison Pool:</span>
            <span className="text-slate-250 font-bold truncate">
              {comparePlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean).join('  vs.  ')}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 shrink-0">
            {comparePlayerIds.length === 2 ? (
              <button
                type="button"
                onClick={() => setShowComparisonModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-slate-950 px-3 py-1 font-extrabold text-[10px] font-mono rounded tracking-wider uppercase cursor-pointer transition-all shadow"
              >
                ⚖️ Compare Now
              </button>
            ) : (
              <span className="text-[10.5px] text-slate-400 font-mono italic animate-pulse">Select 2 players to compare</span>
            )}
            
            <button
              type="button"
              onClick={() => setComparePlayerIds([])}
              className="text-slate-400 hover:text-slate-250 p-1 font-mono text-[9px] underline uppercase cursor-pointer transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-500 text-[10px] font-mono uppercase tracking-wider select-none">
                <th className="py-1.5 px-2 text-center font-extrabold w-12 text-indigo-400">⚖</th>
                <th className="py-1.5 px-2 text-center font-extrabold w-12">RANK</th>
                <th className="py-1.5 px-3 font-extrabold">PLAYER NAME</th>
                <th className="py-1.5 px-2 text-center font-extrabold w-12">NAT</th>
                <th className="py-1.5 px-3 text-right font-extrabold text-yellow-500 w-24">POINTS</th>
                <th className="py-1.5 px-2 text-center font-extrabold w-16">ABILITY</th>
                <th className="py-1.5 px-2 text-center font-extrabold w-28">SPECIALTY</th>
                <th className="py-1.5 px-2 text-center font-extrabold w-24">FORM</th>
                <th className="py-1.5 px-2 text-center font-extrabold w-24">FATIGUE</th>
                <th className="py-1.5 px-2 text-center font-extrabold w-24">EVENTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-6 text-slate-600 font-mono text-[11px]">
                    No matching tennis records discovered.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((p) => (
                  <RankingRow
                    key={p.id}
                    player={p}
                    isSelectedForCompare={comparePlayerIds.includes(p.id)}
                    onSelectPlayer={onSelectPlayer}
                    onCompareToggle={(playerId) => {
                      if (comparePlayerIds.includes(playerId)) {
                        setComparePlayerIds(comparePlayerIds.filter(id => id !== playerId));
                      } else {
                        const newPool = [...comparePlayerIds, playerId];
                        if (newPool.length > 2) {
                          setComparePlayerIds([newPool[1], newPool[2]]);
                          setShowComparisonModal(true);
                        } else {
                          setComparePlayerIds(newPool);
                          if (newPool.length === 2) {
                            setShowComparisonModal(true);
                          }
                        }
                      }
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grand Slam Trophy Details and History Modal */}
      {selectedSlamIndex !== null && (() => {
        const currentSlam = grandSlamsMetadata[selectedSlamIndex];
        const gs = calendar 
          ? calendar.flatMap(w => w.tournaments).find(t => t.tier === 'Grand Slam' && t.week === currentSlam.defaultWeek)
          : null;
        
        const isCompletedNow = gs?.isCompleted ?? false;
        const winnerPlayerNow = gs?.winnerId ? players.find(p => p.id === gs.winnerId) : null;
        const currentSeasonNo = (seasonHistory?.length || 0) + 1;

        const getHistoricalWinnerForSlam = (winnersList: any[], index: number) => {
          if (index === 0) {
            return winnersList.find(w => w.tournamentId === 'm-gs-1' || w.tournamentId?.includes('gs1') || w.tournamentName.toLowerCase().includes('melbourne') || w.tournamentName.toLowerCase().includes('lion city'));
          } else if (index === 1) {
            return winnersList.find(w => w.tournamentId === 'm-gs-2' || w.tournamentId?.includes('gs2') || w.tournamentName.toLowerCase().includes('paris') || w.tournamentName.toLowerCase().includes('red sands') || w.tournamentName.toLowerCase().includes('terre rouge'));
          } else if (index === 2) {
            return winnersList.find(w => w.tournamentId === 'm-gs-3' || w.tournamentId?.includes('gs3') || w.tournamentName.toLowerCase().includes('london') || w.tournamentName.toLowerCase().includes('the crown'));
          } else {
            return winnersList.find(w => w.tournamentId === 'm-gs-4' || w.tournamentId?.includes('gs4') || w.tournamentName.toLowerCase().includes('new york') || w.tournamentName.toLowerCase().includes('the empire'));
          }
        };

        const pastWinners = (seasonHistory || []).map((entry) => {
          const histWinner = getHistoricalWinnerForSlam(entry.winners || [], selectedSlamIndex);
          return {
            seasonNumber: entry.seasonNumber,
            winnerName: histWinner?.winnerName || 'Unknown Player',
            winnerNationality: histWinner?.winnerNationality || 'N/A',
            winnerId: histWinner?.winnerId || null,
          };
        });

        const totalWinsSum = pastWinners.length + (isCompletedNow && winnerPlayerNow ? 1 : 0);

        // Customize properties
        const slamStyle = customTrophiesStyle[selectedSlamIndex] || {
          cupStyle: selectedSlamIndex === 0 ? 'chalice' : selectedSlamIndex === 1 ? 'shield' : selectedSlamIndex === 2 ? 'urn' : 'salver',
          metalFinish: selectedSlamIndex === 0 ? 'gold' : selectedSlamIndex === 1 ? 'silver' : selectedSlamIndex === 2 ? 'emerald' : 'cobalt'
        };

        const activeLogoUrl = slamStyle.customLogoUrl || gs?.logoUrl;

        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            {/* Modal Body card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full flex flex-col md:flex-row relative overflow-hidden shadow-2xl max-h-[90vh] md:max-h-[650px] text-slate-100 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Close Button top corner */}
              <button 
                onClick={() => setSelectedSlamIndex(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/50 border border-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors z-10 cursor-pointer"
                title="Dismiss details"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Left Column - Beautiful Trophy Presentation Showcase */}
              <div className="md:w-5/12 bg-slate-950/30 p-5 border-b md:border-b-0 md:border-r border-slate-800/80 flex flex-col items-center justify-center text-center relative min-h-[300px] overflow-y-auto scrollbar-thin">
                
                {/* Backdrop decorative gradient glowing disk */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 blur-3xl animate-pulse"></div>
                </div>

                <div className="relative z-10 w-full mb-6">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase">
                    Tournament Asset Showcase
                  </span>
                  <h3 className="text-xs font-black text-slate-100 mt-2 tracking-tight flex items-center justify-center space-x-1.5 uppercase">
                    <span>{currentSlam.emoji}</span>
                    <span>{currentSlam.shortLabel}</span>
                  </h3>
                </div>

                {/* Main responsive image centering tour logo & trophy */}
                <div className="relative z-10 py-3 flex flex-col items-center justify-center space-y-4 w-full">
                  {gs && (
                    <div className="flex flex-col items-center space-y-6">
                      <div className="flex items-center justify-center space-x-8">
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-mono uppercase tracking-widest text-slate-500 mb-1.5">EVENT LOGO</span>
                          <img 
                            src={gs.smallLogoUrl} 
                            alt={`${currentSlam.label} Logo`} 
                            className="w-16 h-16 object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="w-px h-12 bg-slate-800"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-mono uppercase tracking-widest text-slate-500 mb-1.5">CHAMPION TROPHY</span>
                          <img 
                            src={gs.largeTrophyUrl} 
                            alt={`${currentSlam.label} Trophy`} 
                            className="w-20 h-20 object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative z-10 space-y-1 mt-6 select-text">
                  <div className="text-[10px] font-mono text-slate-400 max-w-[200px]" style={{ fontStyle: 'italic' }}>
                    "{currentSlam.description}"
                  </div>
                </div>
              </div>

              {/* Right Column - Tournament Info & Archives Timeline */}
              <div className="md:w-7/12 p-6 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-none bg-slate-900 select-text">
                <div>
                  <div className="pb-3 border-b border-slate-800 flex items-center justify-between gap-4 select-none">
                    <div className="min-w-0">
                      <h2 className="text-base font-black text-yellow-500 tracking-tight leading-snug truncate" title={currentSlam.label}>
                        {currentSlam.label}
                      </h2>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400 font-mono">
                        <span className="flex items-center space-x-1">
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded border border-slate-800 text-slate-350 bg-slate-950 font-bold">
                            {currentSlam.surface.toUpperCase()}
                          </span>
                        </span>
                        <span>•</span>
                        <span className="text-[10px] flex items-center space-x-1">
                          <span className="text-indigo-400">🏟️</span>
                          <span>{currentSlam.location.split(',')[0]}</span>
                        </span>
                      </div>
                    </div>

                    {/* Integrated tournament logo as requested */}
                    <div className="shrink-0">
                      {activeLogoUrl ? (
                        <img 
                          src={activeLogoUrl} 
                          alt="Tournament Logo" 
                          className="w-12 h-12 rounded-lg object-cover border border-slate-800 bg-slate-950 p-0.5 shadow-md"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-indigo-950/40 border border-indigo-500/10 flex items-center justify-center text-indigo-400 font-black font-mono text-lg shrink-0 shadow">
                          {currentSlam.label.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Slam stats grid */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-800/60 select-none">
                    <div className="bg-slate-950/40 p-1.5 rounded border border-slate-800/40 text-center">
                      <div className="text-[8px] text-slate-500 font-mono font-bold uppercase">Reward</div>
                      <div className="text-xs font-black text-yellow-455 font-mono mt-0.5">2,000 P</div>
                    </div>
                    <div className="bg-slate-950/40 p-1.5 rounded border border-slate-800/40 text-center">
                      <div className="text-[8px] text-slate-500 font-mono font-bold uppercase">Format</div>
                      <div className="text-xs font-black text-slate-200 mt-0.5">Best 5s</div>
                    </div>
                    <div className="bg-slate-950/40 p-1.5 rounded border border-slate-800/40 text-center">
                      <div className="text-[8px] text-slate-500 font-mono font-bold uppercase">Laureates</div>
                      <div className="text-xs font-black text-slate-200 font-mono mt-0.5">{totalWinsSum} Champs</div>
                    </div>
                  </div>

                  {/* Current Season Champion/Status info */}
                  <div className="py-3 border-b border-slate-800/60">
                    <h4 className="text-[9.5px] text-slate-400 font-mono font-black tracking-wider uppercase mb-2 flex items-center space-x-1.5 select-none">
                      <Award className="w-3.5 h-3.5 text-yellow-500" />
                      <span>SEASON {currentSeasonNo} CAMPAIGN</span>
                    </h4>

                    {isCompletedNow && winnerPlayerNow ? (
                      <div className="flex items-center space-x-3 bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/20 p-2.5 rounded-lg select-text">
                        <div className="relative w-10 h-10 rounded-full border border-amber-500/40 bg-slate-950 overflow-hidden flex items-center justify-center shadow">
                          {winnerPlayerNow.portraitUrl ? (
                            <img 
                              src={winnerPlayerNow.portraitUrl} 
                              alt={winnerPlayerNow.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">{getFlagEmoji(winnerPlayerNow.nationality)}</span>
                          )}
                          <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-slate-950 p-0.5 rounded-full scale-75">
                            <Trophy className="w-3 h-3 fill-current" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[9px] text-yellow-500 font-mono font-bold uppercase leading-none">REIGNING CHAMPION</div>
                          <div className="text-xs font-black text-white truncate max-w-[200px] mt-0.5 leading-tight animate-in slide-in-from-left duration-200">
                            {winnerPlayerNow.name}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                            Nationality: <span className="font-bold text-slate-300">{getFlagEmoji(winnerPlayerNow.nationality)} {winnerPlayerNow.nationality}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 bg-slate-950/40 border border-slate-850/80 p-2.5 rounded-lg select-none">
                        <div className="w-10 h-10 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-slate-600 bg-slate-950">
                          <Clock className="w-4 h-4 text-slate-400 animate-pulse" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[9px] text-slate-400 font-mono font-bold uppercase leading-none">STATUS: IN PROGRESS</div>
                          <div className="text-xs font-black text-slate-300 mt-1 leading-tight flex items-center space-x-1.5">
                            <span>Awaiting Championship Week {currentSlam.defaultWeek}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Championship Chronicles Timeline */}
                  <div className="pt-3 pb-2">
                    <h4 className="text-[9.5px] text-slate-400 font-mono font-black tracking-wider uppercase mb-2 flex items-center space-x-1.5 select-none">
                      <Trophy className="w-3.5 h-3.5 text-slate-500" />
                      <span>CHAMPIONSHIP CHRONICLES (ARCHIVES)</span>
                    </h4>

                    {pastWinners.length === 0 ? (
                      <div className="text-center py-4 bg-slate-950/25 border border-slate-850/60 rounded-lg text-slate-500 font-mono text-[10px]">
                        No historic seasonal records archived yet.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                        {pastWinners.map((winnerRow, rIdx) => {
                          return (
                            <div 
                              key={rIdx} 
                              className="flex items-center justify-between p-1.5 rounded bg-slate-950/40 border border-slate-800/40 hover:bg-slate-950 transition-colors"
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                {activeLogoUrl ? (
                                  <img 
                                    src={activeLogoUrl} 
                                    alt="Tournament Logo" 
                                    className="w-5 h-5 rounded object-cover border border-slate-800 bg-slate-950 p-0.5 shrink-0" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[7.5px] text-yellow-500 font-bold shrink-0">
                                    {currentSlam.label.split(' ').map(n => n[0]).join('')}
                                  </div>
                                )}
                                <div className="text-[9px] font-mono font-bold text-indigo-400 px-1 bg-slate-900 border border-slate-800 rounded">
                                  S{winnerRow.seasonNumber}
                                </div>
                                <span className="text-[12px]">{getFlagEmoji(winnerRow.winnerNationality)}</span>
                                <span className="text-[11px] font-bold text-slate-200 truncate max-w-[150px] leading-tight title={winnerRow.winnerName}">
                                  {winnerRow.winnerName}
                                </span>
                              </div>
                              <span className="text-[7.5px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0">
                                Champion
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between select-none">
                  <div className="text-[8.5px] text-slate-500 font-mono">
                    All styles synced dynamically to local storage layers.
                  </div>
                  <button 
                    onClick={() => setSelectedSlamIndex(null)}
                    className="bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-1.5 border border-slate-800 text-[10px] font-mono font-extrabold rounded-lg tracking-wider cursor-pointer transition-colors uppercase"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
      {/* Dynamic Player Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="border-b border-slate-800 bg-slate-105 p-3.5 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-500 text-lg">⚖️</span>
                <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-slate-200">
                  PLAYER COMPARISON RADAR
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-950 border border-slate-800 cursor-pointer"
                title="Close Comparison"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4">
              {(() => {
                const p1 = players.find(p => p.id === comparePlayerIds[0]);
                const p2 = players.find(p => p.id === comparePlayerIds[1]);

                if (!p1 || !p2) {
                  return (
                    <div className="text-center py-12 text-slate-500 font-mono text-[11px]">
                      Please select exactly two players to compare.
                    </div>
                  );
                }

                // H2H wins
                const p1H2hWins = p1.h2h?.[p2.id] || 0;
                const p2H2hWins = p2.h2h?.[p1.id] || 0;

                // Win Ratio calculator
                const getRatio = (wins: number, losses: number) => {
                  const total = wins + losses;
                  if (total === 0) return '0%';
                  return `${Math.round((wins / total) * 100)}%`;
                };

                // Surface specialties strings
                const getSpecialtyString = (player: typeof p1) => {
                  const spec = player.surfaceProfile.specializationType;
                  const tier = player.surfaceProfile.specializationTier;
                  if (tier === 'None') return 'All-Rounder';
                  return `${spec} (${tier})`;
                };

                return (
                  <div className="space-y-4">
                    {/* Head-to-Head Highlight Banner */}
                    <div className="bg-slate-950 border border-slate-850 rounded p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-1 text-[8px] font-mono text-slate-600 bg-slate-900 border-l border-b border-slate-850">
                        OFFICIAL TOUR LOG
                      </div>
                      <span className="text-[9px] text-indigo-400 font-mono font-bold uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 mb-2">
                        HEAD-TO-HEAD RECORDBYTE
                      </span>
                      
                      <div className="flex items-center space-x-6 sm:space-x-12 my-2 select-none">
                        <div className="text-right">
                          <div className="text-lg font-black text-white">{p1.name.split(' ').pop()}</div>
                          <div className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{p1.nationality}</div>
                        </div>
                        
                        <div className="flex items-center justify-center space-x-4">
                          <span className="text-4xl font-black text-slate-105 font-mono">{p1H2hWins}</span>
                          <span className="text-slate-600 text-sm font-mono uppercase tracking-widest font-extrabold">VS</span>
                          <span className="text-4xl font-black text-slate-105 font-mono">{p2H2hWins}</span>
                        </div>

                        <div className="text-left">
                          <div className="text-lg font-black text-white">{p2.name.split(' ').pop()}</div>
                          <div className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{p2.nationality}</div>
                        </div>
                      </div>

                      <div className="text-[11px] font-bold mt-1 text-slate-300 font-sans">
                        {p1H2hWins > p2H2hWins ? (
                          <span className="text-emerald-400">🔥 {p1.name} leads the matchup</span>
                        ) : p2H2hWins > p1H2hWins ? (
                          <span className="text-emerald-400">🔥 {p2.name} leads the matchup</span>
                        ) : (
                          <span className="text-slate-400">⚖️ Matchup is currently tied</span>
                        )}
                        <span className="text-slate-500 ml-1 font-mono font-normal">({p1H2hWins + p2H2hWins} matches played)</span>
                      </div>
                    </div>

                    {/* Side-by-Side Stats Comparison */}
                    <div className="bg-slate-950 border border-slate-850 rounded overflow-hidden">
                      <div className="bg-slate-900/60 border-b border-slate-850 px-3.5 py-2 flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">CORE ATTRIBUTES & METRICS</span>
                        <span className="text-[9px] text-slate-500 font-mono">Comparing current season</span>
                      </div>
                      
                      <div className="divide-y divide-slate-900 text-xs font-mono">
                        {/* Headers */}
                        <div className="grid grid-cols-12 gap-2 p-2 bg-slate-950 text-slate-500 font-bold uppercase text-[9px] tracking-wide select-none">
                          <div className="col-span-5 text-indigo-400">{p1.name.split(' ').pop()}</div>
                          <div className="col-span-2 text-center text-slate-600">CATEGORY</div>
                          <div className="col-span-5 text-right text-indigo-400">{p2.name.split(' ').pop()}</div>
                        </div>

                        {/* Rank Row */}
                        <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-slate-900/30">
                          <div className={`col-span-5 font-black text-sm ${p1.ranking < p2.ranking ? 'text-amber-400' : 'text-slate-300'}`}>
                            #{p1.ranking}
                          </div>
                          <div className="col-span-2 text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">RANKING</div>
                          <div className={`col-span-5 text-right font-black text-sm ${p2.ranking < p1.ranking ? 'text-amber-400' : 'text-slate-300'}`}>
                            #{p2.ranking}
                          </div>
                        </div>

                        {/* Points Row */}
                        <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-slate-900/30">
                          <div className={`col-span-5 font-extrabold ${p1.points > p2.points ? 'text-yellow-400 font-black' : 'text-slate-400'}`}>
                            {p1.points.toLocaleString()} PTS
                          </div>
                          <div className="col-span-2 text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">POINTS</div>
                          <div className={`col-span-5 text-right font-extrabold ${p2.points > p1.points ? 'text-yellow-400 font-black' : 'text-slate-400'}`}>
                            {p2.points.toLocaleString()} PTS
                          </div>
                        </div>

                        {/* Age Row */}
                        <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-slate-900/30">
                          <div className="col-span-5 text-slate-300">{p1.age} Y/O</div>
                          <div className="col-span-2 text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">AGE</div>
                          <div className="col-span-5 text-right text-slate-300">{p2.age} Y/O</div>
                        </div>

                        {/* Base Ability Row */}
                        <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-slate-900/30">
                          <div className={`col-span-5 font-bold ${p1.baseAbility > p2.baseAbility ? 'text-emerald-400' : 'text-slate-300'}`}>
                            A{p1.baseAbility} / Potential P{p1.potential}
                          </div>
                          <div className="col-span-2 text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">ABILITY</div>
                          <div className={`col-span-5 text-right font-bold ${p2.baseAbility > p1.baseAbility ? 'text-emerald-400' : 'text-slate-300'}`}>
                            A{p2.baseAbility} / Potential P{p2.potential}
                          </div>
                        </div>

                        {/* Specialty Row */}
                        <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-slate-900/30">
                          <div className="col-span-5 text-slate-300 font-sans font-semibold">{getSpecialtyString(p1)}</div>
                          <div className="col-span-2 text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">SPECIALTY</div>
                          <div className="col-span-5 text-right text-slate-300 font-sans font-semibold">{getSpecialtyString(p2)}</div>
                        </div>

                        {/* Form Row */}
                        <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-slate-900/30">
                          <div className="col-span-5 flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${p1.stats.form >= 70 ? 'bg-emerald-500' : p1.stats.form >= 45 ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                            <span className="font-bold">{p1.stats.form}/100</span>
                          </div>
                          <div className="col-span-2 text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">FORM</div>
                          <div className="col-span-5 flex items-center justify-end space-x-2">
                            <span className="font-bold">{p2.stats.form}/100</span>
                            <span className={`w-2 h-2 rounded-full ${p2.stats.form >= 70 ? 'bg-emerald-500' : p2.stats.form >= 45 ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                          </div>
                        </div>

                        {/* Fatigue Row */}
                        <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-slate-900/30">
                          <div className="col-span-5 flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${p1.stats.fatigue > 60 ? 'bg-rose-500' : p1.stats.fatigue > 35 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                            <span className="font-bold">{p1.stats.fatigue}/100</span>
                          </div>
                          <div className="col-span-2 text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">FATIGUE</div>
                          <div className="col-span-5 flex items-center justify-end space-x-2">
                            <span className="font-bold">{p2.stats.fatigue}/100</span>
                            <span className={`w-2 h-2 rounded-full ${p2.stats.fatigue > 60 ? 'bg-rose-500' : p2.stats.fatigue > 35 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                          </div>
                        </div>

                        {/* Event Win Ratio Row */}
                        <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-slate-900/30">
                          <div className="col-span-5 text-slate-300">
                            {p1.stats.matchWins} W - {p1.stats.matchLosses} L <span className="text-[10px] text-indigo-400 font-bold ml-1">({getRatio(p1.stats.matchWins, p1.stats.matchLosses)})</span>
                          </div>
                          <div className="col-span-2 text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">RECORD RATIO</div>
                          <div className="col-span-5 text-right text-slate-300">
                            <span className="text-[10px] text-indigo-400 font-bold mr-1">({getRatio(p2.stats.matchWins, p2.stats.matchLosses)})</span> {p2.stats.matchWins} W - {p2.stats.matchLosses} L
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trophy Cabinets Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Player 1 Trophy Cabinet */}
                      <div className="bg-slate-950 border border-slate-850 rounded p-3 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2 select-none">
                          <h4 className="text-[10px] font-black text-indigo-400 font-mono tracking-wider uppercase">
                            🏆 {p1.name.split(' ').pop()}'s TROPHIES ({p1.trophyCabinet.length})
                          </h4>
                          <span className="text-[9px] text-slate-400 font-mono">
                            Slam Titles: {p1.trophyCabinet.filter(t => t.tierString === 'Grand Slam').length}
                          </span>
                        </div>
                        
                        {p1.trophyCabinet.length === 0 ? (
                          <div className="text-center py-6 text-[10px] font-mono text-slate-600">
                            No championship trophies won yet.
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                            {p1.trophyCabinet.map((trophy, index) => {
                              let tierCol = 'text-slate-400 bg-slate-905 border-slate-800';
                              if (trophy.tierString === 'Grand Slam') tierCol = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                              else if (trophy.tierString === 'Masters 1000') tierCol = 'text-violet-400 bg-violet-500/10 border-violet-500/20';

                              return (
                                <div key={index} className="bg-slate-900/40 border border-slate-900 p-1.5 rounded flex items-center justify-between gap-2 text-[10px] font-mono">
                                  <div className="flex items-center space-x-1.5 truncate">
                                    <span className="text-yellow-500 font-bold">🏆</span>
                                    <span className="text-slate-300 truncate font-semibold" title={trophy.tournamentName}>{trophy.tournamentName}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 shrink-0">
                                    <span className={`px-1 py-0.2 rounded text-[7.5px] uppercase font-bold leading-none ${tierCol}`}>
                                      {trophy.tierString.split(' ')[0]}
                                    </span>
                                    <span className="text-[8px] text-slate-500 font-bold">S{trophy.season}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Player 2 Trophy Cabinet */}
                      <div className="bg-slate-950 border border-slate-850 rounded p-3 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2 select-none">
                          <h4 className="text-[10px] font-black text-indigo-400 font-mono tracking-wider uppercase">
                            🏆 {p2.name.split(' ').pop()}'s TROPHIES ({p2.trophyCabinet.length})
                          </h4>
                          <span className="text-[9px] text-slate-400 font-mono">
                            Slam Titles: {p2.trophyCabinet.filter(t => t.tierString === 'Grand Slam').length}
                          </span>
                        </div>
                        
                        {p2.trophyCabinet.length === 0 ? (
                          <div className="text-center py-6 text-[10px] font-mono text-slate-600">
                            No championship trophies won yet.
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                            {p2.trophyCabinet.map((trophy, index) => {
                              let tierCol = 'text-slate-400 bg-slate-905 border-slate-800';
                              if (trophy.tierString === 'Grand Slam') tierCol = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                              else if (trophy.tierString === 'Masters 1000') tierCol = 'text-violet-400 bg-violet-500/10 border-violet-500/20';

                              return (
                                <div key={index} className="bg-slate-900/40 border border-slate-900 p-1.5 rounded flex items-center justify-between gap-2 text-[10px] font-mono">
                                  <div className="flex items-center space-x-1.5 truncate">
                                    <span className="text-yellow-500 font-bold">🏆</span>
                                    <span className="text-slate-300 truncate font-semibold" title={trophy.tournamentName}>{trophy.tournamentName}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 shrink-0">
                                    <span className={`px-1 py-0.2 rounded text-[7.5px] uppercase font-bold leading-none ${tierCol}`}>
                                      {trophy.tierString.split(' ')[0]}
                                    </span>
                                    <span className="text-[8px] text-slate-500 font-bold">S{trophy.season}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 bg-slate-950 p-3 flex justify-end items-center shrink-0">
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="bg-slate-850 hover:bg-slate-800 text-slate-200 px-4 py-1.5 text-xs font-mono font-bold tracking-wider rounded uppercase border border-slate-800 cursor-pointer hover:text-white transition-colors"
              >
                Dismiss Comparison
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
