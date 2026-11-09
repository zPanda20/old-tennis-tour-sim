/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player } from '../types';
import { getFlagEmoji } from './TourDashboard';

interface RankingRowProps {
  player: Player;
  isSelectedForCompare: boolean;
  onCompareToggle: (playerId: string) => void;
  onSelectPlayer: (playerId: string) => void;
}

const RankingRowComponent: React.FC<RankingRowProps> = ({
  player: p,
  isSelectedForCompare,
  onCompareToggle,
  onSelectPlayer,
}) => {
  // Style surface badge colors
  let specColor = 'text-slate-400 bg-slate-950 border-slate-800';
  if (p.surfaceProfile.specializationType === 'Hard') specColor = 'text-sky-400 bg-sky-500/5 border-sky-500/10';
  else if (p.surfaceProfile.specializationType === 'Clay') specColor = 'text-orange-400 bg-orange-500/5 border-orange-500/10';
  else if (p.surfaceProfile.specializationType === 'Grass') specColor = 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10';

  // Style form indicator bar color
  let formColor = 'bg-slate-600';
  if (p.stats.form >= 80) formColor = 'bg-emerald-500';
  else if (p.stats.form >= 50) formColor = 'bg-sky-500';
  else if (p.stats.form < 30) formColor = 'bg-rose-500';

  // Style fatigue indicator
  let fatColor = 'bg-emerald-500';
  if (p.stats.fatigue > 70) fatColor = 'bg-rose-500';
  else if (p.stats.fatigue > 45) fatColor = 'bg-amber-500';

  return (
    <tr
      id={`player-row-${p.id}`}
      onClick={() => onSelectPlayer(p.id)}
      className="hover:bg-slate-850/55 cursor-pointer transition-colors text-slate-300 text-[11px] group"
    >
      {/* Compare Checkbox */}
      <td 
        className="py-1 px-2 text-center w-12"
        onClick={(e) => {
          e.stopPropagation(); // Avoid triggering details navigation row click!
          onCompareToggle(p.id);
        }}
      >
        <div className="flex justify-center items-center">
          <button
            type="button"
            className={`w-5 h-5 border rounded flex items-center justify-center transition-all cursor-pointer ${
              isSelectedForCompare
                ? 'bg-indigo-600 border-indigo-500 text-slate-950 hover:bg-indigo-500 font-bold shadow'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
            }`}
            title={isSelectedForCompare ? "Selected for comparison" : "Select to compare"}
          >
            {isSelectedForCompare ? (
              <span className="text-[10px] font-black leading-none">✓</span>
            ) : (
              <span className="text-[9px] font-bold leading-none opacity-0 group-hover:opacity-100">+</span>
            )}
          </button>
        </div>
      </td>

      {/* Rank */}
      <td className="py-1 px-2 text-center font-bold font-mono w-14">
        <div className="flex justify-center items-center">
          {p.ranking === 1 ? (
            <span className="inline-flex items-center justify-center w-10 h-5 text-[9.5px] bg-gradient-to-r from-amber-500/20 to-yellow-500/25 text-yellow-300 border border-yellow-500/50 rounded font-black shadow shadow-yellow-500/10">
              #1
            </span>
          ) : p.ranking === 2 ? (
            <span className="inline-flex items-center justify-center w-10 h-5 text-[9.5px] bg-gradient-to-r from-slate-400/15 to-slate-200/20 text-slate-100 border border-slate-300/40 rounded font-bold shadow shadow-slate-300/5">
              #2
            </span>
          ) : p.ranking === 3 ? (
            <span className="inline-flex items-center justify-center w-10 h-5 text-[9.5px] bg-gradient-to-r from-amber-800/20 to-amber-600/15 text-orange-400 border border-amber-600/40 rounded font-bold shadow shadow-amber-600/5">
              #3
            </span>
          ) : p.ranking <= 10 ? (
            <span className="inline-flex items-center justify-center w-10 h-5 text-[9.5px] bg-sky-950/40 text-sky-400 border border-sky-500/20 rounded font-bold">
              #{p.ranking}
            </span>
          ) : (
            <span className="inline-flex items-center justify-center w-10 h-5 text-[10px] text-slate-500 font-bold font-mono">
              #{p.ranking}
            </span>
          )}
        </div>
      </td>

      {/* Name */}
      <td className="py-1 px-3 font-semibold text-slate-100 hover:text-indigo-400 transition-colors border-l border-transparent">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded border border-slate-850 overflow-hidden bg-slate-950 shrink-0 flex items-center justify-center select-none">
            {p.portraitUrl ? (
              <img src={p.portraitUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as any).style.display = 'none'; }} />
            ) : (
              <span className="text-[12px]">{getFlagEmoji(p.nationality)}</span>
            )}
          </div>
          <span className="truncate max-w-[140px] sm:max-w-xs">{p.name}</span>
          {p.isRookie && (
            <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-0.5 rounded uppercase tracking-tight">ROOK</span>
          )}
          {p.isRetired && (
            <span className="text-[8px] font-mono font-bold text-red-400 bg-red-500/5 border border-red-500/10 px-1 rounded uppercase tracking-tight shrink-0">🕊️ RETIRED</span>
          )}
        </div>
      </td>

      {/* Nationality */}
      <td className="py-1 px-2 text-center text-base select-none w-12" title={p.nationality}>
        {getFlagEmoji(p.nationality)}
      </td>

      {/* Points */}
      <td className="py-1 px-3 text-right font-extrabold font-mono text-yellow-500">
        {p.points.toLocaleString()}
      </td>

      {/* Base Ability */}
      <td className="py-1 px-2 text-center font-mono font-bold shrink-0">
        <span className={`inline-block px-1 py-0.2 rounded text-[10px] ${
          p.baseAbility >= 9 ? 'text-amber-400 bg-amber-500/5 border border-amber-500/20 font-extrabold' : p.baseAbility === 8 ? 'text-indigo-400 bg-indigo-500/5 border border-indigo-500/10' : 'text-slate-400 bg-slate-950'
        }`}>
          {p.baseAbility}
        </span>
      </td>

      {/* Spec Tier Profile */}
      <td className="py-1 px-2 text-center border-box">
        {p.surfaceProfile.specializationType === 'Neutral' ? (
          <span className="text-slate-500 text-[9px] font-mono px-1 rounded bg-slate-950 border border-slate-800">
            NEUT
          </span>
        ) : (
          <span className={`inline-block border text-[9px] font-mono px-1 rounded ${specColor} font-bold`}>
            {p.surfaceProfile.specializationType.toUpperCase().substring(0, 4)} {p.surfaceProfile.specializationTier === 'Master' ? '👑' : '★'}
          </span>
        )}
      </td>

      {/* Form Bar Indicator */}
      <td className="py-1 px-2 text-slate-100 text-center">
        <div className="flex items-center justify-center space-x-1.5">
          <span className="font-mono text-[10px] font-bold text-slate-400 w-5 text-right">{Math.round(p.stats.form)}</span>
          <div className="w-10 h-1 bg-slate-950 rounded-full overflow-hidden shrink-0">
            <div className={`h-full ${formColor}`} style={{ width: `${Math.min(100, p.stats.form)}%` }}></div>
          </div>
        </div>
      </td>

      {/* Fatigue Bar Indicator */}
      <td className="py-1 px-2 text-center">
        <div className="flex items-center justify-center space-x-1.5">
          <span className="font-mono text-[10px] font-bold text-slate-400 w-5 text-right">{Math.round(p.stats.fatigue)}</span>
          <div className="w-10 h-1 bg-slate-950 rounded-full overflow-hidden shrink-0">
            <div className={`h-full ${fatColor}`} style={{ width: `${Math.min(100, p.stats.fatigue)}%` }}></div>
          </div>
        </div>
      </td>

      {/* Events count */}
      <td className="py-1 px-2 text-center">
        <div className="flex items-center justify-center space-x-1">
          <span className={`font-mono font-bold text-[10px] ${
            p.stats.playedEvents === 26 ? 'text-emerald-400 bg-emerald-500/15 px-1 rounded' : p.stats.playedEvents >= 20 ? 'text-indigo-400 font-bold' : 'text-slate-300'
          }`}>
            {p.stats.playedEvents}
          </span>
          <span className="text-slate-600">/26</span>
          {p.stats.playedEvents < 20 && (
            <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" title="Needs events!"></div>
          )}
        </div>
      </td>
    </tr>
  );
};

export const RankingRow = React.memo(
  RankingRowComponent,
  (prev, next) => {
    return (
      prev.isSelectedForCompare === next.isSelectedForCompare &&
      prev.player.ranking === next.player.ranking &&
      prev.player.points === next.player.points &&
      prev.player.stats.form === next.player.stats.form &&
      prev.player.stats.fatigue === next.player.stats.fatigue &&
      prev.player.stats.playedEvents === next.player.stats.playedEvents &&
      prev.player.id === next.player.id &&
      prev.player.name === next.player.name &&
      prev.player.isRetired === next.player.isRetired &&
      prev.player.isRookie === next.player.isRookie &&
      prev.player.isTrickyVulture === next.player.isTrickyVulture &&
      prev.player.baseAbility === next.player.baseAbility &&
      prev.player.surfaceProfile.specializationType === next.player.surfaceProfile.specializationType &&
      prev.player.surfaceProfile.specializationTier === next.player.surfaceProfile.specializationTier
    );
  }
);
