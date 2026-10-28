'use client';

import React from 'react';
import { PipeProject } from '../lib/types';
import { calculateSizeTotals, calculateGrandTotal, calculateBuffer } from '../lib/calculator';

interface SummaryCardsProps {
  project: PipeProject;
}

export function SummaryCards({ project }: SummaryCardsProps) {
  const activeSizes = project.pipeSizes.slice(0, 3);
  while (activeSizes.length < 3) {
    activeSizes.push(`Size ${activeSizes.length + 1}`);
  }

  const totals = calculateSizeTotals(project.rows, activeSizes);
  const grandTotal = calculateGrandTotal(project.rows, activeSizes);

  // Matching ReportLab color accents
  const accents = [
    { border: '#063D25', bar: 'bg-[#063D25]' },
    { border: '#1F6B3F', bar: 'bg-[#1F6B3F]' },
    { border: '#C9961A', bar: 'bg-[#C9961A]' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 3 Size Cards */}
      {activeSizes.map((size, idx) => {
        const count = totals[size] || 0;
        const [lo, hi] = calculateBuffer(count);
        const accent = accents[idx] || accents[0];

        return (
          <div
            key={size}
            className="relative rounded-xl bg-[#091F15] border border-[#184630] p-4 pt-5 shadow-lg shadow-black/30 overflow-hidden flex flex-col justify-between"
          >
            {/* Top Color Accent Strip */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${accent.bar}`} />

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {size} PIPES
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  {count}
                </span>
                <span className="text-xs font-medium text-slate-400">pcs</span>
              </div>
            </div>

            {/* Divider and 10-15% Buffer */}
            <div className="mt-4 pt-3 border-t border-[#184630] flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">With 10-15% extra:</span>
              <span className="font-bold text-[#10B981] font-mono text-sm">
                {lo}-{hi}
              </span>
            </div>
          </div>
        );
      })}

      {/* TOTAL PIPES Card - Forest Green Hero Card */}
      {(() => {
        const [lo, hi] = calculateBuffer(grandTotal);
        return (
          <div className="relative rounded-xl bg-gradient-to-br from-[#063D25] to-[#042818] border-2 border-[#C9961A] p-4 pt-5 shadow-xl shadow-[#063D25]/40 overflow-hidden flex flex-col justify-between">
            {/* Sun Rays subtle glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#C9961A]/10 blur-xl pointer-events-none" />

            <div>
              <div className="text-[11px] font-bold text-[#C9961A] uppercase tracking-wider flex items-center justify-between">
                <span>TOTAL PIPES</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C9961A]/20 text-[#F3E3B0] font-mono font-semibold">
                  ESTIMATE
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  {grandTotal}
                </span>
                <span className="text-xs font-semibold text-[#CFE3D6]">pcs</span>
              </div>
            </div>

            {/* Divider and Total Buffer */}
            <div className="mt-4 pt-3 border-t border-[#C9961A]/30 flex items-center justify-between text-xs">
              <span className="text-[#CFE3D6] text-[11px]">With 10-15% extra:</span>
              <span className="font-bold text-[#F59E0B] font-mono text-sm">
                {lo}-{hi}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
