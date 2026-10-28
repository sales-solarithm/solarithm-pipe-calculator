'use client';

import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw, Columns, PlusCircle, ArrowUpDown } from 'lucide-react';
import { CategoryRow, PipeProject } from '../lib/types';
import { calculateRowTotal, calculateSizeTotals, calculateGrandTotal } from '../lib/calculator';

interface CategoryTableProps {
  project: PipeProject;
  onChange: (updated: Partial<PipeProject>) => void;
}

export function CategoryTable({ project, onChange }: CategoryTableProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSizeName, setNewSizeName] = useState('');
  const [isAddingSize, setIsAddingSize] = useState(false);

  const activeSizes = project.pipeSizes;
  const rows = project.rows;

  const totals = calculateSizeTotals(rows, activeSizes);
  const grandTotal = calculateGrandTotal(rows, activeSizes);

  // Find max row total for proportional mini progress bar
  const rowTotals = rows.map((r) => calculateRowTotal(r, activeSizes));
  const maxRowTotal = Math.max(1, ...rowTotals);

  // Update cell quantity
  const handleQuantityChange = (rowId: string, size: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    const updatedRows = rows.map((r) => {
      if (r.id === rowId) {
        return {
          ...r,
          quantities: {
            ...r.quantities,
            [size]: num,
          },
        };
      }
      return r;
    });
    onChange({ rows: updatedRows });
  };

  // Add new category row
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const newRow: CategoryRow = {
      id: `row-${Date.now()}`,
      category: trimmed,
      quantities: activeSizes.reduce((acc, s) => ({ ...acc, [s]: 0 }), {}),
    };
    onChange({ rows: [...rows, newRow] });
    setNewCategoryName('');
  };

  // Remove category row
  const handleRemoveCategory = (rowId: string) => {
    if (rows.length <= 1) return;
    onChange({ rows: rows.filter((r) => r.id !== rowId) });
  };

  // Add new pipe size column
  const handleAddSize = () => {
    const trimmed = newSizeName.trim();
    if (!trimmed || activeSizes.includes(trimmed)) return;
    const updatedSizes = [...activeSizes, trimmed];
    onChange({ pipeSizes: updatedSizes });
    setNewSizeName('');
    setIsAddingSize(false);
  };

  // Remove pipe size column
  const handleRemoveSize = (sizeToRemove: string) => {
    if (activeSizes.length <= 1) return;
    const updatedSizes = activeSizes.filter((s) => s !== sizeToRemove);
    onChange({ pipeSizes: updatedSizes });
  };

  return (
    <div className="w-full space-y-3">
      {/* Table Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-[#C9961A] rounded-sm" />
          <h2 className="text-sm lg:text-base font-bold text-white tracking-wide">
            CATEGORY-WISE BREAKDOWN
          </h2>
          <span className="text-xs text-slate-400">
            (Quantities in number of standard commercial pipes)
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingSize(!isAddingSize)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0E2E20] hover:bg-[#154631] text-emerald-300 border border-[#1F6B3F] text-xs font-medium transition cursor-pointer"
          >
            <Columns className="w-3.5 h-3.5 text-[#C9961A]" />
            <span>Add Pipe Size</span>
          </button>
        </div>
      </div>

      {/* Add Size Input Popover */}
      {isAddingSize && (
        <div className="p-3 rounded-lg bg-[#0E2E20] border border-[#1F6B3F] flex items-center gap-2 text-xs">
          <span className="text-slate-300 font-semibold">New Size Designation:</span>
          <input
            type="text"
            value={newSizeName}
            onChange={(e) => setNewSizeName(e.target.value)}
            placeholder="e.g. 50 x 50 or 100 x 50"
            className="px-2.5 py-1 rounded bg-[#06140E] border border-[#1F6B3F] text-white focus:outline-none focus:border-[#C9961A]"
          />
          <button
            onClick={handleAddSize}
            className="px-3 py-1 rounded bg-[#C9961A] text-slate-950 font-bold hover:bg-[#DFAB26]"
          >
            Add Column
          </button>
          <button
            onClick={() => setIsAddingSize(false)}
            className="px-2 py-1 text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* The Table Card - Styled to match ReportLab shadow & geometry */}
      <div className="rounded-xl border border-[#184630] bg-[#091F15] shadow-xl shadow-black/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            {/* Table Header */}
            <thead>
              <tr className="bg-[#063D25] text-[#C9961A] font-bold text-xs uppercase tracking-wider border-b border-[#143D2A]">
                <th className="py-3.5 px-4 pl-6 w-[28%] font-extrabold">CATEGORY</th>
                {activeSizes.map((size) => (
                  <th key={size} className="py-3.5 px-3 text-center font-extrabold group">
                    <div className="flex items-center justify-center gap-1">
                      <span>{size}</span>
                      {activeSizes.length > 1 && (
                        <button
                          onClick={() => handleRemoveSize(size)}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition text-[10px] ml-1"
                          title="Remove size column"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-3.5 px-4 text-right pr-6 w-[24%] font-extrabold">ROW TOTAL</th>
                <th className="w-10"></th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-[#143D2A]/60">
              {rows.map((row, idx) => {
                const rt = calculateRowTotal(row, activeSizes);
                const isEven = idx % 2 === 0;
                const rowBg = isEven ? 'bg-[#091F15]' : 'bg-[#071911]';
                const progressWidth = Math.max(4, Math.round((58 * rt) / maxRowTotal));

                return (
                  <tr
                    key={row.id}
                    className={`${rowBg} hover:bg-[#0E2E20] transition-colors relative group`}
                  >
                    {/* Category Label with 3pt Gold Accent */}
                    <td className="py-2.5 px-4 pl-6 font-semibold text-emerald-100 flex items-center gap-2">
                      <div className="w-1 h-4 bg-[#C9961A] rounded-full shrink-0" />
                      <input
                        type="text"
                        value={row.category}
                        onChange={(e) => {
                          const updated = rows.map((r) =>
                            r.id === row.id ? { ...r, category: e.target.value } : r
                          );
                          onChange({ rows: updated });
                        }}
                        className="bg-transparent text-sm font-semibold text-emerald-200 hover:text-white focus:outline-none focus:bg-[#06140E] px-1 py-0.5 rounded border border-transparent focus:border-[#C9961A]/50 w-full"
                      />
                    </td>

                    {/* Quantity Inputs per Size */}
                    {activeSizes.map((size) => {
                      const qty = row.quantities[size] || 0;
                      return (
                        <td key={size} className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={qty === 0 ? '' : qty}
                            placeholder="-"
                            onChange={(e) => handleQuantityChange(row.id, size, e.target.value)}
                            className={`w-20 text-center py-1 rounded bg-[#06140E] border ${
                              qty > 0
                                ? 'border-[#1F6B3F] text-white font-bold'
                                : 'border-transparent text-slate-500'
                            } hover:border-[#1F6B3F] focus:outline-none focus:border-[#C9961A] text-sm font-mono`}
                          />
                        </td>
                      );
                    })}

                    {/* Row Total & Proportional Mini Progress Bar */}
                    <td className="py-2.5 px-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {/* ReportLab style mini progress indicator */}
                        <div className="w-[58px] h-1.5 bg-[#143D2A] rounded-full overflow-hidden shrink-0">
                          <div
                            className="h-full bg-[#C9961A] rounded-full transition-all duration-300"
                            style={{ width: `${progressWidth}px` }}
                          />
                        </div>
                        <span className="font-extrabold text-sm text-emerald-400 font-mono w-10 text-right">
                          {rt}
                        </span>
                      </div>
                    </td>

                    {/* Delete Row Action */}
                    <td className="py-2.5 pr-3 text-center">
                      {rows.length > 1 && (
                        <button
                          onClick={() => handleRemoveCategory(row.id)}
                          className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition p-1"
                          title="Delete category row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Grand Total Footer Row (Solid Gold Accent matching ReportLab) */}
            <tfoot>
              <tr className="bg-[#C9961A] text-slate-950 font-black text-sm border-t-2 border-[#DFAB26]">
                <td className="py-3.5 px-4 pl-6 tracking-wide font-extrabold text-slate-950 uppercase">
                  GRAND TOTAL
                </td>
                {activeSizes.map((size) => (
                  <td key={size} className="py-3.5 px-3 text-center font-mono font-bold text-base">
                    {totals[size] || 0}
                  </td>
                ))}
                <td className="py-3.5 px-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs uppercase font-extrabold text-slate-800 tracking-wider">
                      TOTAL:
                    </span>
                    <span className="text-xl font-black text-[#063D25] font-mono px-2 py-0.5 rounded bg-white/40">
                      {grandTotal}
                    </span>
                  </div>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Add Category Quick Input */}
        <div className="p-3 bg-[#06140E] border-t border-[#184630] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs flex-1 max-w-md">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="Add structural category (e.g. Bracing, Columns, Anchor)..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#091F15] border border-[#184630] text-white text-xs focus:outline-none focus:border-[#C9961A]"
            />
            <button
              onClick={handleAddCategory}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0E2E20] hover:bg-[#154631] text-emerald-300 border border-[#1F6B3F] text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C9961A]" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            Totals update in real-time and auto-debounce to Firestore.
          </div>
        </div>
      </div>
    </div>
  );
}
