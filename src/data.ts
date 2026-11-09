/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, Tournament, TournamentTier, SurfaceType, WeatherType, SpecTier, Week } from './types';

// Diverse lists of names and nationalities
const FIRST_NAMES = [
  'Roger', 'Rafael', 'Novak', 'Carlos', 'Daniil', 'Alexander', 'Jannik', 'Stefanos', 'Hubert', 'Taylor',
  'Casper', 'Holger', 'Frances', 'Cameron', 'Grigor', 'Andy', 'Stan', 'Milic', 'Kei', 'Marin',
  'Gael', 'Richard', 'Borna', 'Denis', 'Ben', 'Sebastian', 'Lorenzo', 'Alex', 'Ugo', 'Adrian',
  'Francisco', 'Tomas', 'Arthur', 'Jack', 'Emil', 'Yoshihito', 'Jan-Lennard', 'Marton', 'Dominic',
  'Laslo', 'Dusan', 'Benoit', 'Fabio', 'Roberto', 'David', 'Gilles', 'Jo-Wilfried', 'John', 'Reilly',
  'Maxime', 'Brandon', 'Mackenzie', 'Marcos', 'Nick', 'Thanasi', 'Bernabe', 'Jaume', 'Pedro', 'Albert'
];

const SURNAMES = [
  'Federer', 'Nadal', 'Djokovic', 'Alcaraz', 'Medvedev', 'Zverev', 'Sinner', 'Tsitsipas', 'Hurkacz', 'Fritz',
  'Ruud', 'Rune', 'Tiafoe', 'Norrie', 'Dimitrov', 'Murray', 'Wawrinka', 'Milosevic', 'Nishikori', 'Cilic',
  'Monfils', 'Gasquet', 'Coric', 'Shapovalov', 'Shelton', 'Korda', 'Musetti', 'de Minaur', 'Humbert', 'Mannarino',
  'Cerundolo', 'Etcheverry', 'Fils', 'Draper', 'Ruusuvuori', 'Nishioka', 'Struff', 'Fucsovics', 'Thiem', 'Djere',
  'Lajovic', 'Paire', 'Fognini', 'Bautista Agut', 'Ferrer', 'Simon', 'Tsonga', 'Isner', 'Opelka', 'Cressy',
  'Nakashima', 'McDonald', 'Giron', 'Kyrgios', 'Kokkinakis', 'Zapata Miralles', 'Munar', 'Cachin', 'Ramos-Vinolas'
];

const NATIONALITIES = [
  'SUI', 'ESP', 'SRB', 'RUS', 'GER', 'ITA', 'GRE', 'POL', 'USA', 'NOR',
  'DEN', 'FRA', 'GBR', 'BUL', 'CRO', 'CAN', 'AUS', 'JPN', 'AUT', 'ARG',
  'SWE', 'BEL', 'NED', 'CHI', 'CZE', 'SVK', 'KAZ', 'FIN', 'HUN', 'BRA',
  'ALB', 'TUR', 'WAL', 'SCO', 'CRC', 'CUB', 'DOM', 'ECU', 'SLV', 'GTM',
  'HTI', 'JAM', 'PAN', 'PRY', 'URU', 'VEN', 'IND', 'IRN', 'IRQ', 'JOR',
  'KWT', 'LAO', 'MAS', 'QAT', 'THA', 'UZB', 'VIE', 'ALG', 'CPV', 'ANG',
  'BFA', 'BFO', 'CMR', 'EGY', 'GHA', 'CIV', 'SEN', 'FIJ', 'NZL', 'KIR',
  'MLT', 'ENG', 'HKG', 'KOR', 'PHL', 'UKR', 'PSE', 'ZAF', 'SGP', 'MEX',
  'PRT', 'POR', 'MDA', 'IRL', 'COL', 'NGR', 'IDN', 'CHN'
];

const GYM_SUFFIXES = ['-zera', '-cold', '-fury', '-zone', '-edge', '-apex', ''];

export function generateGamerTag(): string {
  const customStems = [
    'Fury', 'Volt', 'Lumi', 'Shadow', 'Ghost', 'Phantom', 'Nexus', 'Blaze', 'Glitch', 'Psycho', 
    'Static', 'Cipher', 'Viper', 'Rogue', 'Titan', 'Apex', 'Helix', 'Nova', 'Storm', 'Chrono', 
    'Pixel', 'Astro', 'Krypto', 'Aero', 'Axe', 'Spike', 'Razor', 'Scythe', 'Grim', 'Frost', 
    'Pyro', 'Echo', 'Tonic', 'Rhythm', 'Cyber', 'Zero', 'Vector', 'Onyx', 'Vortex', 'Saber', 
    'Laser', 'Turbo', 'Giga', 'Mega', 'Slayer', 'Beast', 'Iron', 'Steel', 'Silver', 'Gold', 
    'Bronze', 'Brass', 'Copper', 'Carbon', 'Cobalt', 'Silicon', 'Neon', 'Helium', 'Raptor', 
    'Omega', 'Alpha', 'Delta', 'Sigma', 'Zephyr', 'Zenith', 'Vandal', 'Rebel', 'Havoc', 'Xio',
    'Yuka', 'Red', 'Che', 'Night', 'Soul', 'Cata', 'Apoll', 'Koy', 'Rufa', 'Kassa', 'Aqua',
    'Hydr', 'Faint', 'Reap', 'Wiz', 'Rose', 'Myrd', 'Dark', 'Keon', 'Kimchi'
  ];
  const customEndings = [
    'One', 'Ace', 'King', 'Cold', 'zera', 'Low', '4k', 'Zero', 'Zone', 'Edge', 'Fury', 'Apex', 
    'X', 'zOr', 'z', 'Lord', 'Boy', 'God', 'Pro', 'Elite', 'Master', 'Star', 'Wolf', 'Hawk', 
    'Falcon', 'Eagle', 'Venom', 'Toxin', 'Acid', 'Flame', 'Spark', 'Flow', 'Grip', 'Fist', 'Claw', 
    'Fang', 'Slayer', 'Strike', 'Pulse', 'Wave', 'Shift', 'Blink', 'Crest', 'Soul', 'Mind', 'fall', 'saken'
  ];
  
  const rand = Math.random();
  if (rand < 0.25) {
    return customStems[Math.floor(Math.random() * customStems.length)];
  } else if (rand < 0.7) {
    const stem = customStems[Math.floor(Math.random() * customStems.length)];
    const ending = customEndings[Math.floor(Math.random() * customEndings.length)];
    if (['zera', 'low', 'cold', 'zOr'].includes(ending.toLowerCase())) {
      return `${stem}${ending.toLowerCase()}`;
    }
    return `${stem}${ending.charAt(0).toUpperCase() + ending.slice(1)}`;
  } else {
    const stem = customStems[Math.floor(Math.random() * customStems.length)];
    const ending = customEndings[Math.floor(Math.random() * customEndings.length)];
    let tag = `${stem}${ending}`;
    if (Math.random() < 0.3) {
      tag = tag.replace(/o/g, '0').replace(/a/g, '4').replace(/e/g, '3').replace(/i/g, '1');
    }
    return tag;
  }
}

// Generate 150 players
export function generateInitialRoster(): Player[] {
  const players: Player[] = [];
  
  const predefined: Array<{
    name: string;
    nationality: string;
    age: number;
    baseAbility: number;
    potential: number;
    endurance: number;
    longevity: number;
    spec: SurfaceType;
    tier: SpecTier;
  }> = [
    // Prime Greatest players
    { name: 'XioLin', nationality: 'CHN', age: 25, baseAbility: 10, potential: 10, endurance: 10, longevity: 9, spec: 'Hard', tier: 'Master' },
    { name: 'Titan', nationality: 'FRA', age: 26, baseAbility: 9, potential: 10, endurance: 9, longevity: 9, spec: 'Clay', tier: 'Master' },
    { name: 'Kongzera', nationality: 'BRA', age: 24, baseAbility: 9, potential: 9, endurance: 10, longevity: 9, spec: 'Clay', tier: 'Master' },
    { name: 'Zeta', nationality: 'JPN', age: 27, baseAbility: 9, potential: 8, endurance: 9, longevity: 10, spec: 'Neutral', tier: 'None' },

    // Top level players
    { name: 'Typhoon', nationality: 'JPN', age: 25, baseAbility: 8, potential: 9, endurance: 8, longevity: 8, spec: 'Grass', tier: 'Master' },
    { name: 'QQ Ace', nationality: 'HKG', age: 26, baseAbility: 8, potential: 8, endurance: 9, longevity: 8, spec: 'Hard', tier: 'Master' },
    { name: 'Yuka Ace', nationality: 'JPN', age: 24, baseAbility: 8, potential: 9, endurance: 8, longevity: 9, spec: 'Neutral', tier: 'None' },
    { name: 'Dark Zero', nationality: 'ANG', age: 25, baseAbility: 8, potential: 8, endurance: 9, longevity: 8, spec: 'Clay', tier: 'Master' },
    { name: 'KeonCold', nationality: 'SWE', age: 23, baseAbility: 8, potential: 10, endurance: 8, longevity: 9, spec: 'Grass', tier: 'Specialist' },

    // The field
    { name: 'Koy Ace', nationality: 'KOR', age: 23, baseAbility: 7, potential: 8, endurance: 7, longevity: 8, spec: 'Neutral', tier: 'None' },
    { name: 'Rufa4k', nationality: 'THA', age: 24, baseAbility: 8, potential: 8, endurance: 8, longevity: 8, spec: 'Grass', tier: 'Specialist' },
    { name: 'Kassa4k', nationality: 'PHL', age: 25, baseAbility: 8, potential: 8, endurance: 8, longevity: 7, spec: 'Grass', tier: 'Specialist' },
    { name: 'Dekk', nationality: 'UKR', age: 26, baseAbility: 8, potential: 8, endurance: 8, longevity: 8, spec: 'Neutral', tier: 'None' },
    { name: 'Enemy', nationality: 'GBR', age: 24, baseAbility: 8, potential: 9, endurance: 8, longevity: 8, spec: 'Grass', tier: 'Specialist' },
    { name: 'BLVKHVND', nationality: 'USA', age: 23, baseAbility: 8, potential: 9, endurance: 9, longevity: 8, spec: 'Grass', tier: 'Specialist' },
    { name: 'Zanezera', nationality: 'ARG', age: 26, baseAbility: 8, potential: 8, endurance: 8, longevity: 9, spec: 'Clay', tier: 'Specialist' },
    { name: 'Sharky', nationality: 'AUS', age: 25, baseAbility: 8, potential: 8, endurance: 8, longevity: 8, spec: 'Grass', tier: 'Specialist' },
    { name: 'Amaaz', nationality: 'PSE', age: 24, baseAbility: 7, potential: 8, endurance: 7, longevity: 8, spec: 'Clay', tier: 'Specialist' },
    { name: 'FuryOne', nationality: 'USA', age: 23, baseAbility: 7, potential: 8, endurance: 8, longevity: 8, spec: 'Neutral', tier: 'None' },
    { name: 'SlayerOne', nationality: 'ZAF', age: 25, baseAbility: 7, potential: 8, endurance: 7, longevity: 8, spec: 'Neutral', tier: 'None' },
    { name: 'PandaX', nationality: 'SGP', age: 24, baseAbility: 7, potential: 8, endurance: 8, longevity: 7, spec: 'Neutral', tier: 'None' },
    { name: 'Dexter', nationality: 'CAN', age: 23, baseAbility: 7, potential: 8, endurance: 7, longevity: 9, spec: 'Neutral', tier: 'None' },
    { name: 'Ash', nationality: 'GBR', age: 24, baseAbility: 7, potential: 8, endurance: 8, longevity: 8, spec: 'Grass', tier: 'Specialist' },
    { name: 'JeskoLow', nationality: 'GTM', age: 25, baseAbility: 7, potential: 8, endurance: 7, longevity: 7, spec: 'Clay', tier: 'Specialist' },
    { name: 'BlinkzLow', nationality: 'MEX', age: 23, baseAbility: 7, potential: 8, endurance: 8, longevity: 8, spec: 'Clay', tier: 'Specialist' },
    { name: 'Riddle', nationality: 'USA', age: 22, baseAbility: 6, potential: 7, endurance: 7, longevity: 8, spec: 'Neutral', tier: 'None' },

    // Old Veterans
    { name: 'Ironblood', nationality: 'RUS', age: 32, baseAbility: 7, potential: 6, endurance: 7, longevity: 5, spec: 'Neutral', tier: 'None' },
    { name: '4rule', nationality: 'ITA', age: 31, baseAbility: 6, potential: 5, endurance: 6, longevity: 4, spec: 'Neutral', tier: 'None' },
    { name: 'Omnibus', nationality: 'GER', age: 33, baseAbility: 7, potential: 6, endurance: 6, longevity: 5, spec: 'Neutral', tier: 'None' },
    { name: 'Nochternal', nationality: 'PRT', age: 34, baseAbility: 7, potential: 5, endurance: 7, longevity: 4, spec: 'Clay', tier: 'Specialist' },
    { name: 'WenDel', nationality: 'NLD', age: 32, baseAbility: 7, potential: 6, endurance: 6, longevity: 5, spec: 'Grass', tier: 'Specialist' },
    { name: 'Lazarus', nationality: 'GRE', age: 32, baseAbility: 8, potential: 6, endurance: 8, longevity: 6, spec: 'Neutral', tier: 'None' },

    // Just barely older than New Gen
    { name: 'DemonOne', nationality: 'BFO', age: 22, baseAbility: 8, potential: 9, endurance: 8, longevity: 8, spec: 'Neutral', tier: 'None' },
    { name: 'Hiarka', nationality: 'MDA', age: 21, baseAbility: 8, potential: 10, endurance: 8, longevity: 9, spec: 'Grass', tier: 'Specialist' },
    { name: 'Gale', nationality: 'IRL', age: 22, baseAbility: 6, potential: 7, endurance: 7, longevity: 8, spec: 'Grass', tier: 'Specialist' },
    { name: 'VoltCold', nationality: 'NOR', age: 21, baseAbility: 8, potential: 9, endurance: 8, longevity: 9, spec: 'Grass', tier: 'Specialist' },
    { name: 'Apexzera', nationality: 'COL', age: 22, baseAbility: 8, potential: 9, endurance: 9, longevity: 8, spec: 'Clay', tier: 'Specialist' },

    // New Gen Young Players
    { name: 'soulzOne', nationality: 'NGR', age: 19, baseAbility: 7, potential: 9, endurance: 8, longevity: 8, spec: 'Neutral', tier: 'None' },
    { name: 'CheKing', nationality: 'ESP', age: 18, baseAbility: 6, potential: 10, endurance: 7, longevity: 10, spec: 'Clay', tier: 'Specialist' },
    { name: 'RedKing', nationality: 'SUI', age: 20, baseAbility: 7, potential: 9, endurance: 8, longevity: 9, spec: 'Grass', tier: 'Specialist' },
    { name: 'Nightfall', nationality: 'AUS', age: 18, baseAbility: 6, potential: 9, endurance: 8, longevity: 9, spec: 'Grass', tier: 'Specialist' },
    { name: 'Leviathan', nationality: 'POR', age: 19, baseAbility: 7, potential: 10, endurance: 8, longevity: 9, spec: 'Neutral', tier: 'None' },
    { name: 'Cataklysm', nationality: 'POL', age: 20, baseAbility: 7, potential: 9, endurance: 8, longevity: 9, spec: 'Clay', tier: 'Specialist' },
    { name: 'Ragnarok', nationality: 'DEN', age: 18, baseAbility: 6, potential: 10, endurance: 8, longevity: 10, spec: 'Neutral', tier: 'None' },
    { name: 'elk', nationality: 'GER', age: 19, baseAbility: 7, potential: 9, endurance: 8, longevity: 9, spec: 'Grass', tier: 'Specialist' },
    { name: 'Apollo', nationality: 'EGY', age: 20, baseAbility: 7, potential: 9, endurance: 8, longevity: 9, spec: 'Neutral', tier: 'None' },
    { name: 'Chronicle', nationality: 'IND', age: 18, baseAbility: 6, potential: 10, endurance: 7, longevity: 10, spec: 'Neutral', tier: 'None' },
    { name: 'm00nfall', nationality: 'BEL', age: 19, baseAbility: 7, potential: 9, endurance: 8, longevity: 8, spec: 'Grass', tier: 'Specialist' },
    { name: 'ReijiAce', nationality: 'JPN', age: 20, baseAbility: 7, potential: 9, endurance: 8, longevity: 9, spec: 'Neutral', tier: 'None' },
    { name: 'Kimchi4k', nationality: 'USA', age: 18, baseAbility: 6, potential: 9, endurance: 8, longevity: 10, spec: 'Grass', tier: 'Specialist' },
    { name: '4saken', nationality: 'VIE', age: 19, baseAbility: 7, potential: 10, endurance: 8, longevity: 9, spec: 'Neutral', tier: 'None' },
    { name: 'Wildzera', nationality: 'CHI', age: 20, baseAbility: 7, potential: 9, endurance: 8, longevity: 9, spec: 'Clay', tier: 'Specialist' },
    { name: 'ArcherKing', nationality: 'ARG', age: 18, baseAbility: 6, potential: 10, endurance: 8, longevity: 10, spec: 'Neutral', tier: 'None' },
    { name: 'Beast', nationality: 'MEX', age: 19, baseAbility: 7, potential: 9, endurance: 8, longevity: 9, spec: 'Neutral', tier: 'None' },
    { name: 'Snowyy', nationality: 'FIN', age: 18, baseAbility: 6, potential: 9, endurance: 8, longevity: 9, spec: 'Grass', tier: 'Specialist' },
    { name: 'LumiCold', nationality: 'FIN', age: 19, baseAbility: 7, potential: 10, endurance: 8, longevity: 10, spec: 'Grass', tier: 'Specialist' },
    { name: 'Hydro', nationality: 'CHN', age: 20, baseAbility: 7, potential: 9, endurance: 8, longevity: 9, spec: 'Neutral', tier: 'None' },
    { name: 'Faint4k', nationality: 'IDN', age: 18, baseAbility: 6, potential: 9, endurance: 8, longevity: 9, spec: 'Grass', tier: 'Specialist' },
    { name: 'Reaper', nationality: 'RUS', age: 19, baseAbility: 7, potential: 9, endurance: 8, longevity: 9, spec: 'Clay', tier: 'Specialist' },
    { name: 'Wizard', nationality: 'NZL', age: 20, baseAbility: 7, potential: 9, endurance: 8, longevity: 9, spec: 'Neutral', tier: 'None' },
    { name: 'RoseAce', nationality: 'SGP', age: 18, baseAbility: 6, potential: 10, endurance: 8, longevity: 10, spec: 'Neutral', tier: 'None' },
    { name: 'Myrddin', nationality: 'IRL', age: 19, baseAbility: 7, potential: 9, endurance: 8, longevity: 9, spec: 'Grass', tier: 'Specialist' },
    { name: 'FenZ', nationality: 'CAN', age: 20, baseAbility: 7, potential: 10, endurance: 8, longevity: 10, spec: 'Neutral', tier: 'None' }
  ];

  predefined.forEach((p, index) => {
    players.push({
      id: `p-predefined-${index}`,
      name: p.name,
      nationality: p.nationality,
      age: p.age,
      seasonsOnTour: Math.max(0, p.age - 18),
      baseAbility: p.baseAbility,
      potential: p.potential,
      endurance: p.endurance,
      longevity: p.longevity,
      surfaceProfile: {
        specializationType: p.spec,
        specializationTier: p.tier
      },
      ranking: 0,
      points: 0,
      prevSeasonPoints: 0,
      trophyCabinet: [],
      stats: {
        form: 40 + Math.floor(Math.random() * 30),
        fatigue: 0,
        playedEvents: 0,
        matchWins: 0,
        matchLosses: 0,
        grandSlamWins: 0
      },
      h2h: {},
      isRookie: p.age === 18,
      isRetired: false,
      isTrickyVulture: Math.random() < 0.06,
      historyPoints: [],
      historyRankings: []
    });
  });

  const usedNames = new Set<string>(predefined.map(p => p.name));
  
  // Fill up to 150 players
  const additionalNeeded = 150 - players.length;
  for (let i = 0; i < additionalNeeded; i++) {
    let name = '';
    do {
      name = generateGamerTag();
    } while (usedNames.has(name));
    usedNames.add(name);
    
    const age = 18 + Math.floor(Math.random() * 16); // 18 - 33
    
    // Smooth the abilities curve for non-predefined: 3 to 7
    let baseAbility = 3;
    if (i < 10) baseAbility = 7;
    else if (i < 30) baseAbility = 6;
    else if (i < 60) baseAbility = 5;
    else if (i < 75) baseAbility = 4;
    else baseAbility = 3;

    const potential = 3 + Math.floor(Math.random() * 7); // 3 - 9
    const endurance = 3 + Math.floor(Math.random() * 7); // 3 - 9
    const longevity = 3 + Math.floor(Math.random() * 7); // 3 - 9

    const rand = Math.random();
    let specType: SurfaceType = 'Neutral';
    let specTier: SpecTier = 'None';
    
    if (rand < 0.25) {
      specType = 'Hard';
      specTier = Math.random() < 0.3 ? 'Master' : 'Specialist';
    } else if (rand < 0.5) {
      specType = 'Clay';
      specTier = Math.random() < 0.3 ? 'Master' : 'Specialist';
    } else if (rand < 0.70) {
      specType = 'Grass';
      specTier = Math.random() < 0.3 ? 'Master' : 'Specialist';
    }

    players.push({
      id: `p-roster-additional-${i}`,
      name,
      nationality: NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)],
      age,
      seasonsOnTour: Math.max(0, age - 18),
      baseAbility,
      potential,
      endurance,
      longevity,
      surfaceProfile: {
        specializationType: specType,
        specializationTier: specTier
      },
      ranking: 0,
      points: 0,
      prevSeasonPoints: 0,
      trophyCabinet: [],
      stats: {
        form: 30 + Math.floor(Math.random() * 40),
        fatigue: 0,
        playedEvents: 0,
        matchWins: 0,
        matchLosses: 0,
        grandSlamWins: 0
      },
      h2h: {},
      isRookie: age === 18,
      isRetired: false,
      isTrickyVulture: Math.random() < 0.06,
      historyPoints: [],
      historyRankings: []
    });
  }

  // Generate 25 field filler players
  for (let i = 0; i < 25; i++) {
    let name = '';
    do {
      name = generateGamerTag();
    } while (usedNames.has(name));
    usedNames.add(name);
    
    const age = 18 + Math.floor(Math.random() * 16); // 18 - 33
    const baseAbility = 3 + Math.floor(Math.random() * 4); // 3 to 6
    const potential = 3 + Math.floor(Math.random() * 6);
    const endurance = 3 + Math.floor(Math.random() * 6);
    const longevity = 3 + Math.floor(Math.random() * 6);

    const rand = Math.random();
    let specType: SurfaceType = 'Neutral';
    let specTier: SpecTier = 'None';
    
    if (rand < 0.2) {
      specType = 'Hard';
      specTier = Math.random() < 0.3 ? 'Master' : 'Specialist';
    } else if (rand < 0.4) {
      specType = 'Clay';
      specTier = Math.random() < 0.3 ? 'Master' : 'Specialist';
    } else if (rand < 0.6) {
      specType = 'Grass';
      specTier = Math.random() < 0.3 ? 'Master' : 'Specialist';
    }

    players.push({
      id: `p-filler-${i}`,
      name,
      nationality: NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)],
      age,
      seasonsOnTour: Math.max(0, age - 18),
      baseAbility,
      potential,
      endurance,
      longevity,
      surfaceProfile: {
        specializationType: specType,
        specializationTier: specTier
      },
      ranking: 0,
      points: 0,
      prevSeasonPoints: 0,
      trophyCabinet: [],
      stats: {
        form: 30 + Math.floor(Math.random() * 40),
        fatigue: 0,
        playedEvents: 0,
        matchWins: 0,
        matchLosses: 0,
        grandSlamWins: 0
      },
      h2h: {},
      isRookie: age === 18,
      isRetired: false,
      isFiller: true, // Mark filler properly
      isTrickyVulture: Math.random() < 0.06,
      historyPoints: [],
      historyRankings: []
    });
  }

  // Set initial points randomly or based on capability level to establish a mock dynamic initial rank
  players.forEach((p) => {
    const baseVal = p.baseAbility * 200 + Math.floor(Math.random() * 400);
    p.points = baseVal;
  });

  // Sort and assign initial ranks
  sortPlayersByRank(players);

  return players;
}

// Generate fresh custom rookies to replace retired players
export function generateRookie(id: string, isFiller?: boolean): Player {
  const name = generateGamerTag();

  // Rookies are young and have randomized starter stats
  // We randomize potential first, as it influences starting ability
  const potential = 5 + Math.floor(Math.random() * 6);  // 5 - 10
  const baseAbility = Math.max(2, Math.min(6, Math.floor(potential * 0.4) + Math.floor(Math.random() * 3))); // 2 - 6
  const endurance = 3 + Math.floor(Math.random() * 8);  // 3 - 10
  const longevity = 3 + Math.floor(Math.random() * 8);  // 3 - 10

  const rand = Math.random();
  let specType: SurfaceType = 'Neutral';
  let specTier: SpecTier = 'None';
  
  if (rand < 0.25) {
    specType = 'Hard';
    specTier = Math.random() < 0.3 ? 'Master' : 'Specialist';
  } else if (rand < 0.5) {
    specType = 'Clay';
    specTier = Math.random() < 0.3 ? 'Master' : 'Specialist';
  } else if (rand < 0.75) {
    specType = 'Grass';
    specTier = Math.random() < 0.3 ? 'Master' : 'Specialist';
  }

  return {
    id,
    name,
    nationality: NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)],
    age: 18,
    seasonsOnTour: 0,
    baseAbility,
    potential,
    endurance,
    longevity,
    surfaceProfile: {
      specializationType: specType,
      specializationTier: specTier
    },
    ranking: 0,
    points: 100 + Math.floor(Math.random() * 100), // Minor initial points
    prevSeasonPoints: 0,
    trophyCabinet: [],
    stats: {
      form: 50,
      fatigue: 0,
      playedEvents: 0,
      matchWins: 0,
      matchLosses: 0,
      grandSlamWins: 0
    },
    h2h: {},
    isRookie: true,
    isRetired: false,
    isFiller: !isFiller,
    isTrickyVulture: Math.random() < 0.06,
    historyPoints: [],
    historyRankings: []
  };
}

// Sort utility for ranking and tie breaker logic
export function sortPlayersByRank(players: Player[]) {
  players.sort((a, b) => {
    // Primary: Points (Rolling Points)
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    
    // Tie Breaker 1: Most current tournament titles (trophies) won
    const trophiesA = a.trophyCabinet.length;
    const trophiesB = b.trophyCabinet.length;
    if (trophiesB !== trophiesA) {
      return trophiesB - trophiesA;
    }
    
    // Tie Breaker 2: Most Grand Slam main draw match victories
    const gsWinsA = a.stats.grandSlamWins;
    const gsWinsB = b.stats.grandSlamWins;
    if (gsWinsB !== gsWinsA) {
      return gsWinsB - gsWinsA;
    }
    
    // Tie Breaker 3: Head-to-head match records (if they competed against each other)
    const h2hAB = a.h2h?.[b.id] || 0;
    const h2hBA = b.h2h?.[a.id] || 0;
    if (h2hAB !== h2hBA) {
      // If a won more matches against b, b - a would be negative so we return h2hBA - h2hAB
      return h2hBA - h2hAB; 
    }

    // Tie Breaker 4: Total matches won within the rolling calendar
    const matchWinsA = a.stats.matchWins;
    const matchWinsB = b.stats.matchWins;
    if (matchWinsB !== matchWinsA) {
      return matchWinsB - matchWinsA;
    }
    
    // Tie Breaker 5: Inherent Base Ability
    if (b.baseAbility !== a.baseAbility) {
      return b.baseAbility - a.baseAbility;
    }
    
    // Tie Breaker 6: Standard lexical sort fallback
    return a.name.localeCompare(b.name);
  });

  // Assign rankings
  players.forEach((p, idx) => {
    p.ranking = idx + 1;
  });
}

// Full schedule generator (88 tournaments across 43 weeks)
export function generateCalendar(): Week[] {
  const weeks: Week[] = [];

  // Tournament Names lists for realistic feel
  const SLAM_NAMES = [
    { name: 'Lion City Slam', surface: 'Hard', weather: 'Normal' },
    { name: 'La Terre Rouge', surface: 'Clay', weather: 'Normal' },
    { name: 'The Crown', surface: 'Grass', weather: 'Windy' },
    { name: 'The Empire', surface: 'Hard', weather: 'Normal' }
  ];

  const MASTERS_1000_POOL: Record<SurfaceType, Array<{ name: string }>> = {
    Hard: [
      { name: 'Desert Crown' },
      { name: 'Sakura Masters' },
      { name: 'Cathedral Masters' },
      { name: 'Table Mountain Masters' },
      { name: 'Danube Classic' },
      { name: 'The Summit' }
    ],
    Clay: [
      { name: 'Carnival Masters' },
      { name: 'Maghreb Masters' }
    ],
    Grass: [
      { name: 'The Emerald' },
      { name: 'The Harbour' },
      { name: 'Southern Cross Classic' }
    ],
    Neutral: []
  };

  const MASTERS_500_POOL: Record<SurfaceType, Array<{ name: string; format?: string }>> = {
    Hard: [
      { name: 'Han River Classic', format: '1-Set' },
      { name: 'The Pearl', format: '3-Set' },
      { name: 'Huangpu Classic', format: '1-Set' },
      { name: 'The Mirage', format: '3-Set' },
      { name: 'The Castle', format: '1-Set' }
    ],
    Clay: [
      { name: 'Costa Brava Open' },
      { name: 'The Pacific Classic' },
      { name: 'Pampas Classic' }
    ],
    Grass: [
      { name: 'Winelands Open' }
    ],
    Neutral: []
  };

  const MASTERS_250_NAMES = [
    { name: 'Auckland Volcanic', surface: 'Hard', isFarm: false },
    { name: 'Adelaide Sunray', surface: 'Hard', isFarm: false }, 
    { name: 'Estoril Cliffs', surface: 'Clay', isFarm: false },
    { name: 'Munich Bavarian', surface: 'Clay', isFarm: false },
    { name: 'Mallorca Breeze', surface: 'Grass', isFarm: false },
    { name: 'Newport Casino', surface: 'Grass', isFarm: false },
    { name: 'Delray Surf', surface: 'Hard', isFarm: false },
    { name: 'Atlanta Peach Open', surface: 'Hard', isFarm: false },
    { name: 'Los Cabos Sunset', surface: 'Hard', isFarm: false },
    { name: 'Winston-Salem Apex', surface: 'Hard', isFarm: false },
    { name: 'Chengdu Panda Classic', surface: 'Hard', isFarm: false },
    { name: 'Zhuhai Bay Sands', surface: 'Hard', isFarm: false },
    { name: 'Montpellier Arch', surface: 'Hard', isFarm: false },
    { name: 'Marseille Harbor', surface: 'Hard', isFarm: false },
    { name: 'Santiago Chilean Cup', surface: 'Clay', isFarm: false },
    { name: 'Houston Maroon', surface: 'Clay', isFarm: false },
    // Special consecutive low fatigue 1-set "Form Farms", Weeks 8, 9, 10
    { name: 'Geneva Lakeside Farm', surface: 'Clay', isFarm: true },
    { name: 'Lyon Gilded Farm', surface: 'Hard', isFarm: true },
    { name: 'Birmingham Meadow Farm', surface: 'Grass', isFarm: true }
  ]; // 19 tournaments total

  const CHALLENGER_175_NAMES = [
    'Phoenix Desert Challenger', 'Bordeaux Estate Challenger', 'Turin Alpine Challenger',
    'Heilbronn Neckar Challenger', 'Perugia Umbrian Challenger', 'Cali Sugar Challenger',
    'Aix-en-Provence Challenger', 'Sarasota Sand Challenger', 'Surbiton Grass Challenger'
  ]; // 9 tournaments

  const CHALLENGER_125_NAMES = [
    'Canberra Capital Shield', 'Quimper Coastliner', 'Koblenz Castle Cup',
    'Cherbourg Terminal', 'Lille Flanders Gate', 'Lugano Foothills',
    'Barletta Roman Walls', 'Split Adriatic Coast', 'Girona Pyrenees',
    'Sanremo Riviera', 'Prague Vitava Cup', 'Aix-les-Bains Challenger'
  ]; // 12 tournaments

  const CHALLENGER_100_NAMES = [
    'Noumea Tropical', 'Tenerife Island Cup', 'Ottignies Court',
    'Burnie Grasslands', 'Rovereto Indoor', 'Pau Pyrenees Classic',
    'Zadar Roman Harbour', 'San Luis Potosí High-Altitude', 'Sarasota Clay Ground',
    'Split Clay Coast', 'Ostrava Tech Ground', 'New York Bubbler Cup'
  ]; // 12 tournaments

  const weatherOptions: WeatherType[] = ['Normal', 'Hot', 'Windy', 'Rain-Delayed'];

  function makeTokenId(prefix: string, weekNum: number): string {
    return `t-${prefix}-${weekNum}`;
  }

  function pickWeather(surface: SurfaceType): WeatherType {
    const r = Math.random();
    if (surface === 'Clay' && r < 0.15) return 'Hot';
    if (surface === 'Grass' && r < 0.25) return 'Rain-Delayed';
    if (r < 0.1) return 'Windy';
    if (r < 0.2) return 'Hot';
    return 'Normal';
  }

  let m1000Idx = 0;
  let m500Idx = 0;
  const m1000IndexBySurf: Record<SurfaceType, number> = {
    Hard: 0,
    Clay: 0,
    Grass: 0,
    Neutral: 0
  };
  const m500IndexBySurf: Record<SurfaceType, number> = {
    Hard: 0,
    Clay: 0,
    Grass: 0,
    Neutral: 0
  };
  let m250Idx = 0;
  let c175Idx = 0;
  let c125Idx = 0;
  let c100Idx = 0;

  // Let's sweep week-by-week and schedule tournaments
  for (let w = 1; w <= 43; w++) {
    const tournaments: any[] = [];
    let name = `Week ${w}`;

    if (w === 1) {
      name = 'Week 1: Opening Week';
      // Challenger 200 (Bottom 64 players)
      tournaments.push({
        id: makeTokenId('c200', w),
        name: 'Challenger 200 Season Opener',
        week: w,
        tier: 'Challenger 200',
        drawSize: 64,
        surface: 'Hard',
        weather: 'Normal',
        points: 200,
        matchFormat: '3-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
    } 
    else if (w === 18) {
      name = 'Week 18: Last Chance Qualifier';
      // Challenger LCQ 150 (8 draw, inside / outside bubble)
      tournaments.push({
        id: makeTokenId('lcq150', w),
        name: 'Challenger LCQ Bubble-Burst 150',
        week: w,
        tier: 'Challenger LCQ 150',
        drawSize: 8,
        surface: 'Hard',
        weather: 'Windy',
        points: 150,
        matchFormat: '3-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
      // Plus Challenger 100 to make the remaining 16 slots
      const c100Name = CHALLENGER_100_NAMES[c100Idx % CHALLENGER_100_NAMES.length];
      tournaments.push({
        id: makeTokenId('c100', w),
        name: c100Name,
        week: w,
        tier: 'Challenger 100',
        drawSize: 16,
        surface: 'Hard',
        weather: pickWeather('Hard'),
        points: 100,
        matchFormat: '3-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
      c100Idx++;
    } 
    else if (w === 19) {
      name = 'Week 19: Lion City Slam';
      // Grand Slam 1
      const slamInfo = SLAM_NAMES[0];
      tournaments.push({
        id: makeTokenId('gs1', w),
        name: slamInfo.name,
        week: w,
        tier: 'Grand Slam',
        drawSize: 128,
        surface: slamInfo.surface as SurfaceType,
        weather: slamInfo.weather as WeatherType,
        points: 2000,
        matchFormat: '5-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
    } 
    else if (w === 28) {
      name = 'Week 28: La Terre Rouge';
      // Grand Slam 2
      const slamInfo = SLAM_NAMES[1];
      tournaments.push({
        id: makeTokenId('gs2', w),
        name: slamInfo.name,
        week: w,
        tier: 'Grand Slam',
        drawSize: 128,
        surface: slamInfo.surface as SurfaceType,
        weather: slamInfo.weather as WeatherType,
        points: 2000,
        matchFormat: '5-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
    } 
    else if (w === 34) {
      name = 'Week 34: The Crown';
      // Grand Slam 3
      const slamInfo = SLAM_NAMES[2];
      tournaments.push({
        id: makeTokenId('gs3', w),
        name: slamInfo.name,
        week: w,
        tier: 'Grand Slam',
        drawSize: 128,
        surface: slamInfo.surface as SurfaceType,
        weather: slamInfo.weather as WeatherType,
        points: 2000,
        matchFormat: '5-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
    } 
    else if (w === 43) {
      name = 'Week 43: The Empire';
      // Grand Slam 4
      const slamInfo = SLAM_NAMES[3];
      tournaments.push({
        id: makeTokenId('gs4', w),
        name: slamInfo.name,
        week: w,
        tier: 'Grand Slam',
        drawSize: 128,
        surface: slamInfo.surface as SurfaceType,
        weather: slamInfo.weather as WeatherType,
        points: 2000,
        matchFormat: '5-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });

      // Parallel Challenger 100: reverse rank priority invitation so bubble non-qualified players can fulfill matches.
      const lastC100Name = CHALLENGER_100_NAMES[c100Idx % CHALLENGER_100_NAMES.length];
      tournaments.push({
        id: makeTokenId('c100', w),
        name: `${lastC100Name} parallel (bubble-safe)`,
        week: w,
        tier: 'Challenger 100',
        drawSize: 16,
        surface: 'Hard',
        weather: 'Normal',
        points: 100,
        matchFormat: '3-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
      c100Idx++;
    } 
    // Form Farms - Weeks 8, 9, 10
    else if (w === 8) {
      name = 'Week 8: Spring Swing (Form Farm I)';
      // Masters 250 clay farm [1-set]
      const m250Info = MASTERS_250_NAMES.find(x => x.isFarm && x.surface === 'Clay') || MASTERS_250_NAMES[0];
      tournaments.push({
        id: makeTokenId('m250', w),
        name: m250Info.name,
        week: w,
        tier: 'Masters 250',
        drawSize: 16,
        surface: 'Clay',
        weather: 'Normal',
        points: 250,
        matchFormat: '1-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
      // Plus Challenger 125
      tournaments.push({
        id: makeTokenId('c125', w),
        name: CHALLENGER_125_NAMES[c125Idx++ % CHALLENGER_125_NAMES.length],
        week: w,
        tier: 'Challenger 125',
        drawSize: 16,
        surface: 'Clay',
        weather: 'Normal',
        points: 125,
        matchFormat: '3-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
      // Plus Challenger 100
      tournaments.push({
        id: makeTokenId('c100', w),
        name: CHALLENGER_100_NAMES[c100Idx++ % CHALLENGER_100_NAMES.length],
        week: w,
        tier: 'Challenger 100',
        drawSize: 16,
        surface: 'Clay',
        weather: 'Normal',
        points: 100,
        matchFormat: '3-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
    } 
    else if (w === 9) {
      name = 'Week 9: Spring Swing (Form Farm II)';
      // Masters 250 hard farm [1-set]
      const m250Info = MASTERS_250_NAMES.find(x => x.isFarm && x.surface === 'Hard') || MASTERS_250_NAMES[0];
      tournaments.push({
        id: makeTokenId('m250', w),
        name: m250Info.name,
        week: w,
        tier: 'Masters 250',
        drawSize: 16,
        surface: 'Hard',
        weather: 'Normal',
        points: 250,
        matchFormat: '1-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
      // Plus Challenger 125
      tournaments.push({
        id: makeTokenId('c125', w),
        name: CHALLENGER_125_NAMES[c125Idx++ % CHALLENGER_125_NAMES.length],
        week: w,
        tier: 'Challenger 125',
        drawSize: 16,
        surface: 'Hard',
        weather: 'Normal',
        points: 125,
        matchFormat: '3-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
      // Plus Challenger 100
      tournaments.push({
        id: makeTokenId('c100', w),
        name: CHALLENGER_100_NAMES[c100Idx++ % CHALLENGER_100_NAMES.length],
        week: w,
        tier: 'Challenger 100',
        drawSize: 16,
        surface: 'Hard',
        weather: 'Normal',
        points: 100,
        matchFormat: '3-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
    } 
    else if (w === 10) {
      name = 'Week 10: Spring Swing (Form Farm III)';
      // Masters 250 grass farm [1-set]
      const m250Info = MASTERS_250_NAMES.find(x => x.isFarm && x.surface === 'Grass') || MASTERS_250_NAMES[0];
      tournaments.push({
        id: makeTokenId('m250', w),
        name: m250Info.name,
        week: w,
        tier: 'Masters 250',
        drawSize: 16,
        surface: 'Grass',
        weather: 'Normal',
        points: 250,
        matchFormat: '1-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
      // Plus Challenger 125
      tournaments.push({
        id: makeTokenId('c125', w),
        name: CHALLENGER_125_NAMES[c125Idx++ % CHALLENGER_125_NAMES.length],
        week: w,
        tier: 'Challenger 125',
        drawSize: 16,
        surface: 'Grass',
        weather: 'Normal',
        points: 125,
        matchFormat: '3-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
      // Plus Challenger 100
      tournaments.push({
        id: makeTokenId('c100', w),
        name: CHALLENGER_100_NAMES[c100Idx++ % CHALLENGER_100_NAMES.length],
        week: w,
        tier: 'Challenger 100',
        drawSize: 16,
        surface: 'Grass',
        weather: 'Normal',
        points: 100,
        matchFormat: '3-Set',
        isCompleted: false,
        bracket: null,
        winnerId: null,
        runnerUpId: null,
        entrants: []
      });
    } 
    // Standard weeks
    else {
      // Pick a surface based on calendar stretch
      let surf: SurfaceType = 'Hard';
      if (w >= 6 && w <= 10) surf = 'Clay';
      else if (w >= 20 && w <= 28) surf = 'Clay';
      else if (w >= 29 && w <= 34) surf = 'Grass';
      
      const stretchName = surf === 'Clay' ? 'Clay Swing' : surf === 'Grass' ? 'Grass Swing' : w <= 18 ? 'Hardcourt Autumn' : 'Late Sprint';
      name = `Week ${w}: ${stretchName}`;

      // Let's schedule based on our exact tier allocations.
      // We have available tournaments:
      // M1000s: 15. Standard: Weeks 2, 4, 6, 11, 13, 15, 17, 20, 22, 24, 26, 29, 31, 35, 39. (All of these 15)
      // M500s: 15. Standard: Weeks 3, 5, 7, 12, 14, 16, 21, 23, 25, 30, 32, 36, 37, 38, 40. (All of these 15)
      // M250s: 19. (3 are farm, leaving 16). Scheduled in weeks: 11, 20, 27, 29, 32, 33, 37, 38, 39, 40, 41 (3 in parallel), 42 (3 in parallel). Let's sum: 1+1+1+1+1+1+1+1+1+1+3+3 = 16.
      // C175s: 9. Scheduled in weeks: 5, 7, 12, 14, 16, 21, 23, 25, 30. (All of these 9)
      // C125s: 12. (3 are farmed in weeks 8,9,10, leaving 9). Weeks: 3, 6, 13, 15, 17, 22, 24, 26, 36.
      // C100s: 12. (3 are farmed in weeks 8,9,10, 2 are specialty in weeks 18, 43, leaving 7). Weeks: 2, 4, 20, 27, 29, 33, 35.

      // Now determine the pair of tournaments for the week:
      const m1000Weeks = [2, 4, 6, 11, 13, 15, 17, 20, 22, 24, 26, 29, 31, 35, 39];
      const m500Weeks = [3, 5, 7, 12, 14, 16, 21, 23, 25, 30, 32, 36, 37, 38, 40];
      const c175Weeks = [5, 7, 12, 14, 16, 21, 23, 25, 30];
      const c125Weeks = [3, 6, 13, 15, 17, 22, 24, 26, 36];
      const c100Weeks = [2, 4, 20, 27, 29, 33, 35];

      // Add Masters 1000
      if (m1000Weeks.includes(w)) {
        const pool = MASTERS_1000_POOL[surf];
        const idxVal = m1000IndexBySurf[surf];
        const info = pool[idxVal % pool.length];
        m1000IndexBySurf[surf]++;
        tournaments.push({
          id: makeTokenId('m1000', w),
          name: info.name,
          week: w,
          tier: 'Masters 1000',
          drawSize: 64,
          surface: surf,
          weather: pickWeather(surf),
          points: 1000,
          matchFormat: '3-Set',
          isCompleted: false,
          bracket: null,
          winnerId: null,
          runnerUpId: null,
          entrants: []
        });
      }

      // Add Masters 500
      if (m500Weeks.includes(w)) {
        const pool = MASTERS_500_POOL[surf];
        const idxVal = m500IndexBySurf[surf];
        const info = pool[idxVal % pool.length];
        m500IndexBySurf[surf]++;
        tournaments.push({
          id: makeTokenId('m500', w),
          name: info.name,
          week: w,
          tier: 'Masters 500',
          drawSize: 32,
          surface: surf,
          weather: pickWeather(surf),
          points: 500,
          matchFormat: (info.format as any) || '3-Set',
          isCompleted: false,
          bracket: null,
          winnerId: null,
          runnerUpId: null,
          entrants: []
        });
      }

      // Add Masters 250 (ordinary ones)
      const specialM250Weeks = [11, 20, 27, 29, 32, 33, 37, 38, 39, 40];
      if (specialM250Weeks.includes(w)) {
        // Just take a non-farm 250 name
        const nonFarmArray = MASTERS_250_NAMES.filter(x => !x.isFarm);
        const info = nonFarmArray[m250Idx % nonFarmArray.length];
        m250Idx++;
        tournaments.push({
          id: makeTokenId('m250', w),
          name: info.name,
          week: w,
          tier: 'Masters 250',
          drawSize: 16,
          surface: surf,
          weather: pickWeather(surf),
          points: 250,
          matchFormat: '3-Set',
          isCompleted: false,
          bracket: null,
          winnerId: null,
          runnerUpId: null,
          entrants: []
        });
      }

      // Weeks 41 and 42 have 3 parallel M250s
      if (w === 41 || w === 42) {
        const nonFarmArray = MASTERS_250_NAMES.filter(x => !x.isFarm);
        for (let k = 0; k < 3; k++) {
          const info = nonFarmArray[m250Idx % nonFarmArray.length];
          m250Idx++;
          tournaments.push({
            id: makeTokenId(`m250-${k}`, w),
            name: `${info.name} (Grid-${k + 1})`,
            week: w,
            tier: 'Masters 250',
            drawSize: 16,
            surface: surf,
            weather: pickWeather(surf),
            points: 250,
            matchFormat: '3-Set',
            isCompleted: false,
            bracket: null,
            winnerId: null,
            runnerUpId: null,
            entrants: []
          });
        }
      }

      // Add Challenger 175
      if (c175Weeks.includes(w)) {
        const infoName = CHALLENGER_175_NAMES[c175Idx % CHALLENGER_175_NAMES.length];
        c175Idx++;
        tournaments.push({
          id: makeTokenId('c175', w),
          name: infoName,
          week: w,
          tier: 'Challenger 175',
          drawSize: 32,
          surface: surf,
          weather: pickWeather(surf),
          points: 175,
          matchFormat: '3-Set',
          isCompleted: false,
          bracket: null,
          winnerId: null,
          runnerUpId: null,
          entrants: []
        });
      }

      // Add Challenger 125
      if (c125Weeks.includes(w)) {
        const infoName = CHALLENGER_125_NAMES[c125Idx % CHALLENGER_125_NAMES.length];
        c125Idx++;
        tournaments.push({
          id: makeTokenId('c125', w),
          name: infoName,
          week: w,
          tier: 'Challenger 125',
          drawSize: 16,
          surface: surf,
          weather: pickWeather(surf),
          points: 125,
          matchFormat: '3-Set',
          isCompleted: false,
          bracket: null,
          winnerId: null,
          runnerUpId: null,
          entrants: []
        });
      }

      // Add Challenger 100
      if (c100Weeks.includes(w)) {
        const infoName = CHALLENGER_100_NAMES[c100Idx % CHALLENGER_100_NAMES.length];
        c100Idx++;
        tournaments.push({
          id: makeTokenId('c100', w),
          name: infoName,
          week: w,
          tier: 'Challenger 100',
          drawSize: 16,
          surface: surf,
          weather: pickWeather(surf),
          points: 100,
          matchFormat: '3-Set',
          isCompleted: false,
          bracket: null,
          winnerId: null,
          runnerUpId: null,
          entrants: []
        });
      }
    }

    weeks.push({
      weekNumber: w,
      name,
      tournaments: tournaments.map(t => ({
        ...t,
        smallLogoUrl: '/assets/logos/event_sm.png',
        largeTrophyUrl: '/assets/trophies/event_lg.png'
      })),
      isCompleted: false
    });
  }

  return weeks;
}
