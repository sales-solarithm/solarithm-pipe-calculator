'use client';

import React from 'react';
import {
  Layers,
  Ruler,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { PipeProject } from '../lib/types';
import {
  calculateSizeTotals,
  calculateGrandTotal,
  calculateBuffer,
  calculateRowTotal,
  calculateComponentTotalPieces,
} from '../lib/calculator';

interface ConsolidatedDashboardProps {
  project: PipeProject;
  onOpenPdfPreview: () => void;
  onSelectComponent: (componentId: string) => void;
}

export function ConsolidatedDashboard({
  project,
  onOpenPdfPreview,
  onSelectComponent,
}: ConsolidatedDashboardProps) {
  const activeSizes = project.pipeSizes || [];
  const standardLength = project.standardPipeLength || 20;

  // Totals across project rows
  const totals = calculateSizeTotals(project.rows || [], activeSizes);
  const grandTotal = calculateGrandTotal(project.rows || [], activeSizes);
  const [lo, hi] = calculateBuffer(grandTotal);

  // Total components count (total pieces)
  const totalComponentPieces = (project.componentItems || []).reduce(
    (sum, c) => sum + calculateComponentTotalPieces(c, activeSizes),
    0
  );

  return (
    <div className="space-y-5">
      {/* 1. Metric Cards (Solarithm Insight Rounded 14px Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Components */}
        <div className="rounded-[14px] bg-[#161B26] border border-[#1E2638] p-4 flex flex-col justify-between shadow-lg shadow-black/35">
          <div className="flex items-center justify-between text-[#8A94A6] text-[11px] font-medium tracking-wide uppercase">
            <span>Components</span>
            <Layers className="w-3.5 h-3.5 text-[#8A94A6]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#00D284] font-mono">
              {project.componentItems?.length || 0}
            </span>
            <span className="text-xs text-[#8A94A6]">
              ({totalComponentPieces} cuts)
            </span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#1E2638] text-[11px] text-[#8A94A6]">
            Active structural assemblies
          </div>
        </div>

        {/* Card 2: Standard Pipe Length */}
        <div className="rounded-[14px] bg-[#161B26] border border-[#1E2638] p-4 flex flex-col justify-between shadow-lg shadow-black/35">
          <div className="flex items-center justify-between text-[#8A94A6] text-[11px] font-medium tracking-wide uppercase">
            <span>Standard Length</span>
            <Ruler className="w-3.5 h-3.5 text-[#8A94A6]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#FFFFFF] font-mono">
              {standardLength}
            </span>
            <span className="text-xs text-[#8A94A6] font-medium">
              {project.pipeLengthUnit}
            </span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#1E2638] text-[11px] text-[#8A94A6]">
            Standard commercial stock
          </div>
        </div>

        {/* Card 3: Contingency Buffer */}
        <div className="rounded-[14px] bg-[#161B26] border border-[#1E2638] p-4 flex flex-col justify-between shadow-lg shadow-black/35">
          <div className="flex items-center justify-between text-[#8A94A6] text-[11px] font-medium tracking-wide uppercase">
            <span>Buffer Contingency</span>
            <span className="px-2 py-0.5 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/30 text-[#E5B842] text-[10px] font-mono font-semibold">
              +10-15% EXTRA
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#FFFFFF] font-mono">
              {lo} - {hi}
            </span>
            <span className="text-xs text-[#8A94A6]">pipes</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#1E2638] text-[11px] text-[#8A94A6]">
            On-site cutting variation reserve
          </div>
        </div>

        {/* Card 4: Grand Total Pipes */}
        <div className="rounded-[14px] bg-[#161B26] border border-[#2B354B] p-4 flex flex-col justify-between shadow-lg shadow-black/35">
          <div className="flex items-center justify-between text-[#8A94A6] text-[11px] font-medium tracking-wide uppercase">
            <span>Total Pipes Required</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5B842] shadow-sm shadow-[#E5B842]/50" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-[#E5B842] font-mono">
              {grandTotal}
            </span>
            <span className="text-xs text-[#8A94A6]">pipes</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#1E2638] text-[11px] text-[#8A94A6] flex justify-between">
            <span>With buffer:</span>
            <span className="font-mono text-[#E5B842] font-semibold">{lo}–{hi}</span>
          </div>
        </div>
      </div>

      {/* 2. Size-By-Size Breakdown (Solarithm Insight Cards) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-[#8A94A6]">
          <span className="uppercase tracking-wider font-semibold text-[11px] text-[#CBD5E1]">
            Catalog Size Breakdown
          </span>
          <span className="text-[11px]">
            Based on {standardLength} {project.pipeLengthUnit} stock length
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {activeSizes.map((size) => {
            const count = totals[size] || 0;
            const [sizeLo, sizeHi] = calculateBuffer(count);

            return (
              <div
                key={size}
                className="rounded-xl bg-[#161B26] border border-[#1E2638] p-3.5 flex flex-col justify-between shadow-xs hover:border-[#2B354B] transition-colors"
              >
                <div className="text-[11px] font-mono text-[#8A94A6] uppercase tracking-wide">
                  {size}
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-[#FFFFFF] font-mono">
                    {count}
                  </span>
                  <span className="text-[11px] text-[#8A94A6]">pipes</span>
                </div>
                <div className="mt-2 pt-2 border-t border-[#1E2638] text-[10px] text-[#8A94A6] flex justify-between font-mono">
                  <span>+10-15%:</span>
                  <span className="text-[#E5B842] font-semibold">{sizeLo}–{sizeHi}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Consolidated Matrix Table (Solarithm Insight High-Density Matrix) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-[#8A94A6]">
          <span className="uppercase tracking-wider font-semibold text-[11px] text-[#CBD5E1]">
            Component Specification Matrix
          </span>
          <span className="text-[11px]">Click a row to edit cut details</span>
        </div>

        <div className="rounded-[14px] border border-[#1E2638] bg-[#161B26] shadow-lg shadow-black/35 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#131823] text-[#8A94A6] uppercase tracking-wider font-semibold border-b border-[#1E2638] text-[11px]">
                  <th className="py-2.5 px-4 font-medium text-[11px]">Component</th>
                  {activeSizes.map((size) => (
                    <th key={size} className="py-2.5 px-3 text-right font-semibold text-[11px] font-mono text-[#E5B842]">
                      {size}
                    </th>
                  ))}
                  <th className="py-2.5 px-4 text-right font-semibold text-[11px] font-mono text-[#E5B842]">
                    Total Pipes
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1E2638]">
                {project.rows.map((row, idx) => {
                  const rt = calculateRowTotal(row, activeSizes);
                  const isStriped = idx % 2 === 1;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => onSelectComponent(row.id)}
                      className={`${isStriped ? 'bg-[#131823]' : 'bg-[#161B26]'} hover:bg-[#1E2536] transition-colors cursor-pointer group`}
                    >
                      <td className="py-2.5 px-4 font-medium text-[#FFFFFF] group-hover:text-[#00D284] transition-colors flex items-center justify-between">
                        <span>{row.category}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>

                      {activeSizes.map((size) => {
                        const qty = row.quantities[size] || 0;
                        return (
                          <td key={size} className="py-2.5 px-3 text-right font-mono">
                            <span
                              className={qty > 0 ? 'text-[#FFFFFF] font-medium' : 'text-[#4A5568]'}
                            >
                              {qty > 0 ? qty : '—'}
                            </span>
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-4 text-right font-mono font-bold text-[#E5B842]">
                        {rt > 0 ? rt : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Footer */}
              <tfoot>
                <tr className="bg-[#131823] text-white font-semibold border-t-2 border-[#1E2638]">
                  <td className="py-3 px-4 uppercase tracking-wider text-[11px] text-[#8A94A6]">
                    Grand Total
                  </td>
                  {activeSizes.map((size) => (
                    <td key={size} className="py-3 px-3 text-right font-mono font-bold text-[#FFFFFF]">
                      {totals[size] || 0}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#E5B842] text-sm">
                    {grandTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Notice Banner (Solarithm Insight Gold Left Border) */}
      <div className="rounded-xl bg-[#161B26] border-l-2 border-l-[#E5B842] border border-[#1E2638] p-3 text-xs flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-[#E5B842] font-bold font-mono">NOTICE</span>
          <span className="text-[#CBD5E1]">
            {project.noteText || 'PLEASE QUOTE 10-15% EXTRA PIPES OF ALL SIZES FOR ON-SITE VARIATION.'}
          </span>
        </div>
        <span className="text-[11px] text-[#8A94A6] shrink-0 hidden sm:inline">
          {standardLength} {project.pipeLengthUnit} standard
        </span>
      </div>
    </div>
  );
}
