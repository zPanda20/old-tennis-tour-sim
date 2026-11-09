import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { HistoricalPlayerTrajectory } from '../types';
import { TrendingUp, Info } from 'lucide-react';

interface SeasonRankingGraphProps {
  trajectories?: HistoricalPlayerTrajectory[];
  seasonNumber: number;
}

export default function SeasonRankingGraph({ trajectories = [], seasonNumber }: SeasonRankingGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 260 });
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  // ResizeObserver to handle container-driven fluidity cleanly
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // enforce dynamic height bound
      const calculatedHeight = Math.max(220, Math.min(300, window.innerWidth < 640 ? 220 : 260));
      setDimensions({
        width: Math.max(300, width),
        height: calculatedHeight
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Main D3 Rendering effect
  useEffect(() => {
    if (!svgRef.current || trajectories.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Flush previous nodes

    const margin = { top: 25, right: 25, bottom: 35, left: 35 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // G element holder
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Data points are indexes from 0 to 42 representing weeks 1 to 43
    const totalWeeks = 43;

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, totalWeeks - 1])
      .range([0, width]);

    // Find min and max rank observed amongst the top 3 players
    // Top is rank 1, so Y scale will be inverted!
    const allRanks = trajectories.flatMap((t) => t.rankings);
    const maxRank = d3.max(allRanks) || 10;
    const minRank = d3.min(allRanks) || 1;

    // Invert the Y-scale: Rank 1 goes to Y-coordinate 0 (top), maxRank goes to bottom (height)
    const yScale = d3
      .scaleLinear()
      .domain([1, Math.max(5, maxRank)]) // Pad to minimum of 5 for scaling elegance
      .range([0, height]);

    // Add Gridlines
    g.append('g')
      .attr('class', 'grid-lines stroke-slate-800/40')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', '1')
      .attr('stroke-dasharray', '2 4')
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(() => '')
      );

    // Axes definitions
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(window.innerWidth < 640 ? 5 : 12)
      .tickFormat((d) => `W${(d as number) + 1}`);

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(Math.min(5, maxRank))
      .tickFormat((d) => `#${d}`);

    // Call Axes
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .attr('class', 'x-axis text-slate-500 font-mono text-[9px]')
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8');

    g.append('g')
      .attr('class', 'y-axis text-slate-500 font-mono text-[9px]')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8');

    // Remove raw domain axis bars for clean modern flat design
    g.selectAll('.domain').remove();
    g.selectAll('.tick line').attr('stroke', '#334155');

    // Line builder
    const lineGenerator = d3
      .line<{ week: number; rank: number }>()
      .x((d) => xScale(d.week))
      .y((d) => yScale(d.rank))
      .curve(d3.curveMonotoneX); // Smooth interpolation curves

    // Colors mapping for top 3 players
    const colorMap = ['#818cf8', '#38bdf8', '#34d399']; // Indigo, Sky, Emerald

    // Render curves
    trajectories.forEach((trajectory, idx) => {
      const dataPoints = trajectory.rankings.map((rank, week) => ({ week, rank }));
      const strokeColor = colorMap[idx] || '#cbd5e1';

      // Drawing path
      g.append('path')
        .datum(dataPoints)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', hoveredWeek === null ? '2' : '1.5')
        .attr('opacity', hoveredWeek === null ? '0.9' : '0.45')
        .attr('d', lineGenerator);

      // Add a subtle glowing shadow background behind active lines
      g.append('path')
        .datum(dataPoints)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', '6')
        .attr('opacity', '0.04')
        .attr('d', lineGenerator);
    });

    // Interactive Hover vertical overlay bar
    if (hoveredWeek !== null) {
      const xPos = xScale(hoveredWeek);
      
      // Draw vertical indicator line
      g.append('line')
        .attr('x1', xPos)
        .attr('x2', xPos)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#6366f1')
        .attr('stroke-width', '1')
        .attr('stroke-dasharray', '3 3')
        .attr('opacity', '0.6');

      // Draw active circular highlights for each player on this week
      trajectories.forEach((trajectory, idx) => {
        const rank = trajectory.rankings[hoveredWeek];
        if (rank === undefined) return;

        const strokeColor = colorMap[idx] || '#cbd5e1';

        g.append('circle')
          .attr('cx', xPos)
          .attr('cy', yScale(rank))
          .attr('r', '5')
          .attr('fill', '#020617')
          .attr('stroke', strokeColor)
          .attr('stroke-width', '2.5');
      });
    }

    // Outer invisible rect for hover tracking interactions
    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', function (event) {
        const [mouseX] = d3.pointer(event);
        const relativeWeekVal = xScale.invert(mouseX);
        const weekIndex = Math.max(0, Math.min(totalWeeks - 1, Math.round(relativeWeekVal)));
        setHoveredWeek(weekIndex);
      })
      .on('mouseleave', () => {
        setHoveredWeek(null);
      });

  }, [dimensions, trajectories, hoveredWeek]);

  if (trajectories.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center font-mono text-[11px] text-slate-500">
        No trajectory dataset found for Season {seasonNumber}. Record trajectories by running games.
      </div>
    );
  }

  const colors = ['bg-indigo-400', 'bg-sky-400', 'bg-emerald-400'];
  const textColors = ['text-indigo-400', 'text-sky-400', 'text-emerald-400'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Top 3 Ranking Trajectory Trails</span>
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">
            Tracks week-by-week standings races over the course of Season {seasonNumber}. Hover inside to inspect positions.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono text-[10px]">
          {trajectories.slice(0, 3).map((t, idx) => (
            <div key={t.playerId} className="flex items-center space-x-1.5 uppercase font-bold text-slate-300">
              <span className={`w-2.5 h-2.5 rounded-full ${colors[idx] || 'bg-slate-500'}`}></span>
              <span>{t.playerName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Canvas Holder */}
      <div ref={containerRef} className="relative w-full overflow-hidden bg-slate-950/45 p-1 rounded-xl border border-slate-950/80">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="mx-auto block overflow-visible"
        />

        {/* Interactive Hover Telemetry Portal HUD */}
        {hoveredWeek !== null && (
          <div className="absolute top-2.5 right-2.5 bg-slate-950/90 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-[9px] shadow-2xl backdrop-blur-sm space-y-1 z-10 text-slate-300 min-w-[120px]">
            <div className="text-slate-500 font-black border-b border-slate-850 pb-0.5 mb-1 text-center uppercase">
              WEEK {hoveredWeek + 1} HUD
            </div>
            {trajectories.map((t, idx) => (
              <div key={t.playerId} className="flex items-center justify-between space-x-2">
                <span className="truncate max-w-[80px] text-slate-400">{t.playerName}:</span>
                <span className={`font-black ${textColors[idx] || 'text-slate-200'}`}>
                  #{t.rankings[hoveredWeek] ?? '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1 text-[9px] text-slate-500 leading-normal font-sans">
        <Info className="w-3 h-3 text-indigo-500/80 shrink-0" />
        <span>Rank 1 is plotted at the top of the chart axes. Steeper gradients indicate faster rankings ascents.</span>
      </div>

    </div>
  );
}
