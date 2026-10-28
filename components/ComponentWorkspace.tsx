'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ComponentItem, ComponentCutRow, PipeProject } from '../lib/types';
import {
  calculateRowPipes,
  calculateComponentPipesPerSize,
  calculateComponentQuantitiesPerSize,
  calculateComponentTotalPipes,
  calculateComponentTotalPieces,
  calculateBuffer,
} from '../lib/calculator';

interface ComponentWorkspaceProps {
  component: ComponentItem;
  project: PipeProject;
  onUpdateComponent: (updatedComponent: ComponentItem) => void;
}

export function ComponentWorkspace({
  component,
  project,
  onUpdateComponent,
}: ComponentWorkspaceProps) {
  const activeSizes = project.pipeSizes;
  const standardLength = project.standardPipeLength || 20;

  // Aggregate quantities and pipes per size for this component
  const quantitiesPerSize = calculateComponentQuantitiesPerSize(component, activeSizes);
  const pipesPerSize = calculateComponentPipesPerSize(component, standardLength, activeSizes);
  const totalPipes = calculateComponentTotalPipes(component, standardLength, activeSizes);
  const totalPieces = calculateComponentTotalPieces(component, activeSizes);
  const [bufferLo, bufferHi] = calculateBuffer(totalPipes);

  // Update a single cut row's length
  const handleLengthChange = (rowId: string, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    const updatedRows = component.cutRows.map((row) =>
      row.id === rowId ? { ...row, length: num } : row
    );
    onUpdateComponent({ ...component, cutRows: updatedRows });
  };

  // Update a single cut row's quantity for a specific size
  const handleQuantityChange = (rowId: string, size: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    const updatedRows = component.cutRows.map((row) => {
      if (row.id === rowId) {
        return {
          ...row,
          quantities: {
            ...row.quantities,
            [size]: num,
          },
        };
      }
      return row;
    });
    onUpdateComponent({ ...component, cutRows: updatedRows });
  };

  // Add new cut row
  const handleAddRow = () => {
    const newRow: ComponentCutRow = {
      id: `cut-${Date.now()}`,
      length: standardLength,
      quantities: activeSizes.reduce((acc, s) => ({ ...acc, [s]: 0 }), {}),
    };
    onUpdateComponent({ ...component, cutRows: [...component.cutRows, newRow] });
  };

  // Delete cut row
  const handleDeleteRow = (rowId: string) => {
    if (component.cutRows.length <= 1) return;
    onUpdateComponent({
      ...component,
      cutRows: component.cutRows.filter((r) => r.id !== rowId),
    });
  };

  return (
    <div className="space-y-4">
      {/* Component Title & Quick Metric Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h2 className="text-lg font-semibold text-[#FFFFFF] tracking-tight">
            {component.name}
          </h2>
        </div>

        {/* Clean Insight metrics */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono">
          <span className="text-[#8A94A6]">
            Pieces: <strong className="text-[#00D284] font-semibold">{totalPieces}</strong>
          </span>
          <span className="text-[#8A94A6]">
            Pipes: <strong className="text-[#E5B842] font-bold">{totalPipes}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/30 text-[#E5B842] font-semibold">
            +10-15% EXTRA: {bufferLo}–{bufferHi}
          </span>
        </div>
      </div>

      {/* Dynamic Component Table - Solarithm Insight Terminal Card */}
      <div className="rounded-[14px] border border-[#1E2638] bg-[#161B26] shadow-lg shadow-black/35 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-mono">
            {/* Header: #131823 background with #8A94A6 subtle uppercase headers and Solarithm Gold pipes */}
            <thead>
              <tr className="bg-[#131823] border-b border-[#1E2638] text-[#8A94A6] font-medium uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-10 text-center font-normal">#</th>
                <th className="py-2.5 px-3 w-32 font-normal">Length ({project.pipeLengthUnit})</th>

                {/* Paired columns per active catalog size: Qty and Pipes */}
                {activeSizes.map((size) => (
                  <React.Fragment key={size}>
                    <th className="py-2.5 px-3 text-right font-normal border-l border-[#1E2638]">
                      Qty ({size})
                    </th>
                    <th className="py-2.5 px-3 text-right font-semibold text-[#E5B842]">
                      Pipes ({size})
                    </th>
                  </React.Fragment>
                ))}

                <th className="py-2.5 px-2 w-10 text-center font-normal"></th>
              </tr>
            </thead>

            {/* Table Rows with row striping #161B26 / #131823 */}
            <tbody className="divide-y divide-[#1E2638]">
              {component.cutRows.map((row, idx) => {
                const isStriped = idx % 2 === 1;

                return (
                  <tr
                    key={row.id}
                    className={`${isStriped ? 'bg-[#131823]' : 'bg-[#161B26]'} hover:bg-[#1E2536] transition-colors group`}
                  >
                    {/* Row Index */}
                    <td className="py-2.5 px-3 text-center text-[#64748B]">
                      {idx + 1}
                    </td>

                    {/* Length in feet */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={row.length}
                          onChange={(e) => handleLengthChange(row.id, e.target.value)}
                          className="w-20 px-2.5 py-1.5 rounded-lg bg-[#1A202E] border border-[#2B354B] text-white text-xs font-mono focus:outline-none focus:border-[#E5B842]"
                        />
                        <span className="text-[#8A94A6] text-[11px]">{project.pipeLengthUnit}</span>
                      </div>
                    </td>

                    {/* Paired Quantity and Calculated Pipes per active size */}
                    {activeSizes.map((size) => {
                      const qty = Number(row.quantities[size]) || 0;
                      const calculatedPipes = calculateRowPipes(row.length, qty, standardLength);

                      return (
                        <React.Fragment key={`cell-${row.id}-${size}`}>
                          {/* Quantity (editable input) */}
                          <td className="py-2.5 px-3 text-right border-l border-[#1E2638]">
                            <input
                              type="number"
                              min="0"
                              value={qty === 0 ? '' : qty}
                              placeholder="0"
                              onChange={(e) => handleQuantityChange(row.id, size, e.target.value)}
                              className={`w-20 text-right px-2.5 py-1.5 rounded-lg bg-[#1A202E] border ${
                                qty > 0 ? 'border-[#3B4761] text-white font-medium' : 'border-[#2B354B] text-[#64748B]'
                              } text-xs font-mono focus:outline-none focus:border-[#E5B842]`}
                            />
                          </td>

                          {/* Calculated Pipes (read-only with Solarithm Gold or subtle dash) */}
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`text-xs font-mono ${
                                calculatedPipes > 0 ? 'text-[#E5B842] font-bold' : 'text-[#4A5568]'
                              }`}
                            >
                              {calculatedPipes > 0 ? calculatedPipes : '—'}
                            </span>
                          </td>
                        </React.Fragment>
                      );
                    })}

                    {/* Row Deletion Action */}
                    <td className="py-2.5 px-2 text-center">
                      {component.cutRows.length > 1 && (
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#64748B] hover:text-rose-400 p-1 transition"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Column Totals Sticky Footer - #131823 with #1E2638 border */}
            <tfoot className="sticky bottom-0">
              <tr className="bg-[#131823] border-t-2 border-[#1E2638] text-white font-medium text-xs font-mono">
                <td className="py-2.5 px-3 text-center text-[#8A94A6]">Σ</td>
                <td className="py-2.5 px-3 uppercase tracking-wider text-[#8A94A6]">
                  Total
                </td>

                {activeSizes.map((size) => {
                  const totalQty = quantitiesPerSize[size] || 0;
                  const aggregatePipes = pipesPerSize[size] || 0;

                  return (
                    <React.Fragment key={`foot-${size}`}>
                      {/* Aggregate Quantity */}
                      <td className="py-2.5 px-3 text-right border-l border-[#1E2638] text-[#CBD5E1] font-semibold">
                        {totalQty > 0 ? totalQty : <span className="text-[#4A5568] font-normal">—</span>}
                      </td>

                      {/* Aggregate Calculated Pipes in Warm Gold */}
                      <td className="py-2.5 px-3 text-right text-[#E5B842] font-bold">
                        {aggregatePipes > 0 ? aggregatePipes : <span className="text-[#4A5568] font-normal">—</span>}
                      </td>
                    </React.Fragment>
                  );
                })}

                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Action Toolbar */}
        <div className="p-3 bg-[#131823] border-t border-[#1E2638] flex items-center justify-between">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1A202E] hover:bg-[#222B3D] text-[#E2E8F0] border border-[#2B354B] text-xs font-medium transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#1D72FE]" />
            <span>+ Add Row</span>
          </button>

          <span className="text-[11px] text-[#8A94A6]">
            Standard bar length: {standardLength} {project.pipeLengthUnit}
          </span>
        </div>
      </div>
    </div>
  );
}
