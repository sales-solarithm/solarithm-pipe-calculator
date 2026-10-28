'use client';

import React, { useState } from 'react';
import { X, Download, Printer, Check, FileText, Sun } from 'lucide-react';
import { PipeProject } from '../lib/types';
import { generatePipeSummaryPdf } from '../lib/pdfGenerator';
import { SOLARITHM_LOGO_DATA_URL } from '../lib/solarithmLogo';
import { calculateSizeTotals, calculateGrandTotal, calculateBuffer, calculateRowTotal } from '../lib/calculator';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PipeProject;
}

export function PdfPreviewModal({ isOpen, onClose, project }: PdfPreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const activeSizes = project.pipeSizes.slice(0, 3);
  while (activeSizes.length < 3) {
    activeSizes.push(`Size ${activeSizes.length + 1}`);
  }

  const totals = calculateSizeTotals(project.rows, activeSizes);
  const grandTotal = calculateGrandTotal(project.rows, activeSizes);
  const rowTotals = project.rows.map((r) => calculateRowTotal(r, activeSizes));
  const maxRowTotal = Math.max(1, ...rowTotals);

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    try {
      const doc = generatePipeSummaryPdf(project);
      const filename = `${project.projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Pipe_Summary.pdf`;
      doc.save(filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl rounded-xl bg-[#161B26] border border-[#1E2638] shadow-2xl shadow-black/50 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Modal Toolbar */}
        <div className="px-5 py-3.5 border-b border-[#1E2638] bg-[#131823] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-[#1D72FE]" />
            <div>
              <h2 className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wide">
                PDF Engineering Summary Preview
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1D72FE] hover:bg-[#1862DE] text-white text-xs font-semibold transition cursor-pointer shadow-sm shadow-[#1D72FE]/25"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloading ? 'Building PDF...' : 'Download PDF'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#8A94A6] hover:text-[#FFFFFF] hover:bg-[#1E2536] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable A4 Document Sheet (Replicating exact ReportLab canvas layout) */}
        <div className="overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950/70">
          <div
            id="reportlab-pdf-sheet"
            className="w-full max-w-[720px] bg-[#FAF6EA] text-[#1B2A22] shadow-2xl rounded-sm overflow-hidden border border-[#E6DFC8] font-sans relative"
          >
            {/* 1. Header (Green HH=205pt, Sun rays, Logo box, Title block) */}
            <div className="relative bg-[#063D25] text-white p-6 pb-8 border-b-4 border-[#C9961A] overflow-hidden">
              {/* Sun rays graphic background (faint 10% gold stroke / 7% fill) */}
              <div className="absolute top-3 right-8 w-44 h-44 rounded-full bg-[#C9961A]/[0.05] border border-[#C9961A]/10 pointer-events-none flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-[#C9961A]/[0.07] border border-[#C9961A]/10 flex items-center justify-center">
                  <Sun className="w-16 h-16 text-[#C9961A]/10" />
                </div>
              </div>

              {/* Top Row: Logo Card + Title Block */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                {/* Logo Card */}
                <div className="bg-white rounded-xl py-3 px-4 shadow-lg flex items-center justify-center border border-slate-100 w-[244px] h-[96px]">
                  <img
                    src={project.logoUrl || SOLARITHM_LOGO_DATA_URL}
                    alt="Solarithm Design & Engineering"
                    className="max-h-[72px] max-w-[214px] w-full h-full object-contain"
                  />
                </div>

                {/* Right Title Block */}
                <div className="text-right relative z-10">
                  <div className="text-[10px] font-bold tracking-widest text-[#C9961A] uppercase">
                    S O L A R I T H M &nbsp; D E S I G N &nbsp; & &nbsp; E N G I N E E R I N G
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 leading-none">
                    PIPE REQUIREMENT
                  </h1>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#C9961A] tracking-tight leading-none mt-0.5">
                    SUMMARY
                  </h2>
                  <div className="w-24 h-0.5 bg-[#C9961A] ml-auto my-1.5" />
                  <div className="text-xs text-[#CFE3D6] font-normal">
                    Structure pipe quantity estimate
                  </div>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* 2. Info Strip */}
              <div className="relative rounded-lg bg-white border border-[#E6DFC8] p-4 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#C9961A] rounded-l" />

                <div className="pl-3 flex-1">
                  <div className="text-[9px] font-bold tracking-wider text-[#C9961A] uppercase">
                    PROJECT
                  </div>
                  <div className="text-base font-bold text-[#063D25] mt-0.5">
                    {project.projectName}
                  </div>
                </div>

                <div className="sm:border-l sm:border-[#E6DFC8] sm:pl-6 flex-1">
                  <div className="text-[9px] font-bold tracking-wider text-[#C9961A] uppercase">
                    DATE
                  </div>
                  <div className="text-base font-bold text-[#063D25] mt-0.5">
                    {project.submissionDate}
                  </div>
                </div>

                <div className="sm:border-l sm:border-[#E6DFC8] sm:pl-6 flex-1">
                  <div className="text-[9px] font-bold tracking-wider text-[#C9961A] uppercase">
                    STANDARD PIPE LENGTH
                  </div>
                  <div className="text-base font-bold text-[#063D25] mt-0.5">
                    {project.standardPipeLength} {project.pipeLengthUnit}
                  </div>
                </div>
              </div>

              {/* 3. Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {activeSizes.map((size, idx) => {
                  const count = totals[size] || 0;
                  const [lo, hi] = calculateBuffer(count);
                  const topBarColor =
                    idx === 0 ? 'bg-[#063D25]' : idx === 1 ? 'bg-[#1F6B3F]' : 'bg-[#C9961A]';

                  return (
                    <div
                      key={size}
                      className="relative bg-white rounded-lg border border-[#E6DFC8] p-3 pt-4 shadow-sm flex flex-col justify-between"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t ${topBarColor}`} />
                      <div>
                        <div className="text-[9px] font-bold text-[#9AA39D] uppercase tracking-wider">
                          {size} PIPES
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl sm:text-3xl font-extrabold text-[#063D25]">
                            {count}
                          </span>
                          <span className="text-[10px] text-[#9AA39D]">pcs</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[#E6DFC8] flex items-center justify-between text-[10px]">
                        <span className="text-[#9AA39D] text-[9px]">With 10-15% extra:</span>
                        <span className="font-bold text-[#063D25] font-mono">{lo}-{hi}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Total Pipes Card (Solid Green) */}
                {(() => {
                  const [lo, hi] = calculateBuffer(grandTotal);
                  return (
                    <div className="relative bg-[#063D25] text-white rounded-lg border border-[#C9961A] p-3 pt-4 shadow-md flex flex-col justify-between">
                      <div>
                        <div className="text-[9px] font-bold text-[#C9961A] uppercase tracking-wider">
                          TOTAL PIPES
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl sm:text-3xl font-extrabold text-white">
                            {grandTotal}
                          </span>
                          <span className="text-[10px] text-[#CFE3D6]">pcs</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[#C9961A]/40 flex items-center justify-between text-[10px]">
                        <span className="text-[#CFE3D6] text-[9px]">With 10-15% extra:</span>
                        <span className="font-bold text-[#C9961A] font-mono">{lo}-{hi}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 4. Category-Wise Breakdown Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3.5 bg-[#C9961A]" />
                    <span className="text-xs font-bold text-[#063D25] tracking-wide">
                      CATEGORY-WISE BREAKDOWN
                    </span>
                  </div>
                  <span className="text-[10px] text-[#9AA39D]">Quantities in number of pipes</span>
                </div>

                <div className="rounded-lg border border-[#E6DFC8] overflow-hidden shadow-sm bg-white">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#063D25] text-[#C9961A] font-bold">
                        <th className="py-2.5 px-3 pl-4 text-left font-bold">CATEGORY</th>
                        {activeSizes.map((size) => (
                          <th key={size} className="py-2.5 px-2 text-center font-bold">
                            {size}
                          </th>
                        ))}
                        <th className="py-2.5 px-3 pr-4 text-right font-bold">ROW TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6DFC8]">
                      {project.rows.map((row, idx) => {
                        const rt = calculateRowTotal(row, activeSizes);
                        const isEven = idx % 2 === 0;
                        const rowBg = isEven ? 'bg-white' : 'bg-[#FAF6EA]';
                        const barWidth = Math.max(3, Math.round((58 * rt) / maxRowTotal));

                        return (
                          <tr key={row.id} className={rowBg}>
                            <td className="py-2 px-3 pl-4 font-bold text-[#063D25] flex items-center gap-1.5">
                              <span className="w-1 h-3 bg-[#C9961A] inline-block" />
                              <span>{row.category}</span>
                            </td>
                            {activeSizes.map((size) => {
                              const qty = row.quantities[size] || 0;
                              return (
                                <td
                                  key={size}
                                  className={`py-2 px-2 text-center font-bold ${
                                    qty > 0 ? 'text-[#1B2A22]' : 'text-[#C5CBC7]'
                                  }`}
                                >
                                  {qty > 0 ? qty : '-'}
                                </td>
                              );
                            })}
                            <td className="py-2 px-3 pr-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-[58px] h-1.5 bg-[#E6DFC8] rounded-full overflow-hidden shrink-0">
                                  <div
                                    className="h-full bg-[#C9961A] rounded-full"
                                    style={{ width: `${barWidth}px` }}
                                  />
                                </div>
                                <span className="font-bold text-[#063D25] font-mono">{rt}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#C9961A] text-white font-extrabold text-xs">
                        <td className="py-2.5 px-3 pl-4 uppercase tracking-wider font-extrabold">
                          GRAND TOTAL
                        </td>
                        {activeSizes.map((size) => (
                          <td key={size} className="py-2.5 px-2 text-center font-bold text-sm">
                            {totals[size] || 0}
                          </td>
                        ))}
                        <td className="py-2.5 px-3 pr-4 text-right">
                          <span className="text-[#063D25] font-black text-sm bg-white/40 px-2 py-0.5 rounded">
                            {grandTotal}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 5. Important Note Card */}
              <div className="rounded-lg bg-[#FDF1F1] border-l-4 border-l-[#9B1C1C] border border-[#F8D7D7] p-3 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#9B1C1C] text-white font-black text-sm flex items-center justify-center shrink-0">
                  !
                </div>
                <div className="flex-1">
                  <div className="text-[9px] font-bold text-[#9B1C1C] uppercase tracking-wider">
                    IMPORTANT NOTE
                  </div>
                  <div className="text-xs font-bold text-[#9B1C1C] mt-0.5">
                    {project.noteText || 'PLEASE QUOTE 10-15% EXTRA PIPES OF ALL SIZES FOR ON-SITE VARIATION.'}
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-[#9AA39D] italic -mt-2">
                Calculation based on standard pipe length of {project.standardPipeLength}{' '}
                {project.pipeLengthUnit}.
              </div>
            </div>

            {/* 6. Document Footer */}
            <div className="bg-[#063D25] border-t-2 border-[#C9961A] px-6 py-3 text-white text-[10px] flex items-center justify-between">
              <div>
                <span className="font-bold">{project.companyName || 'Solarithm Design & Engineering'}</span>{' '}
                <span className="text-[#C9961A]">| {project.companyCity || 'Surat, India'}</span>
              </div>
              <div className="text-[#CFE3D6]">
                Pipe Requirement Summary &nbsp;|&nbsp; {project.projectName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
