'use client';

import React, { useState } from 'react';
import { Settings, X, Plus, Trash2, Ruler, Building2, ShieldCheck } from 'lucide-react';
import { PipeProject } from '../lib/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PipeProject;
  onChange: (updated: Partial<PipeProject>) => void;
  onOpenLogoUploader: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  project,
  onChange,
  onOpenLogoUploader,
}: SettingsModalProps) {
  const [newSize, setNewSize] = useState('');

  if (!isOpen) return null;

  const handleAddSize = () => {
    const trimmed = newSize.trim();
    if (!trimmed || project.pipeSizes.includes(trimmed)) return;
    onChange({ pipeSizes: [...project.pipeSizes, trimmed] });
    setNewSize('');
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    if (project.pipeSizes.length <= 1) return;
    onChange({ pipeSizes: project.pipeSizes.filter((s) => s !== sizeToRemove) });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-xl bg-[#161B26] border border-[#1E2638] shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1E2638] bg-[#131823] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-[#1D72FE]" />
            <h2 className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wide">
              Engineering & Project Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#8A94A6] hover:text-[#FFFFFF] hover:bg-[#1E2536] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Section 1: Standard Pipe Specification */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-[#CBD5E1] font-semibold uppercase tracking-wider text-[11px]">
              <Ruler className="w-3.5 h-3.5 text-[#E5B842]" />
              <span>Standard Stock Specifications</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#8A94A6] text-[11px] mb-1">
                  Standard Stock Length
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={project.standardPipeLength}
                    onChange={(e) => onChange({ standardPipeLength: parseFloat(e.target.value) || 20 })}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#1A202E] border border-[#2B354B] text-white font-mono focus:border-[#E5B842] outline-none"
                  />
                  <select
                    value={project.pipeLengthUnit}
                    onChange={(e) => onChange({ pipeLengthUnit: e.target.value as 'ft' | 'm' })}
                    className="w-18 px-2.5 py-1.5 rounded-lg bg-[#1A202E] border border-[#2B354B] text-white font-mono focus:border-[#E5B842] outline-none"
                  >
                    <option value="ft">ft</option>
                    <option value="m">m</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#8A94A6] text-[11px] mb-1">
                  Catalog Sizes
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {project.pipeSizes.map((size) => (
                    <span
                      key={size}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#1A202E] border border-[#2B354B] text-[#E5B842] font-mono text-[10px] font-semibold"
                    >
                      <span>{size}</span>
                      {project.pipeSizes.length > 1 && (
                        <button
                          onClick={() => handleRemoveSize(size)}
                          className="text-[#64748B] hover:text-[#EE5555] ml-0.5"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    placeholder="e.g. 50 x 50"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#1A202E] border border-[#2B354B] text-white text-xs focus:border-[#E5B842] outline-none font-mono"
                  />
                  <button
                    onClick={handleAddSize}
                    className="px-3 py-1.5 rounded-lg bg-[#1E2536] hover:bg-[#283248] text-[#CBD5E1] hover:text-white border border-[#2B354B] text-[11px] font-medium transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Project Metadata */}
          <div className="space-y-3 pt-3.5 border-t border-[#1E2638]">
            <div className="flex items-center gap-1.5 text-[#CBD5E1] font-semibold uppercase tracking-wider text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-[#1D72FE]" />
              <span>Project & Client Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#8A94A6] text-[11px] mb-1">Project Name</label>
                <input
                  type="text"
                  value={project.projectName}
                  onChange={(e) => onChange({ projectName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1A202E] border border-[#2B354B] text-white focus:border-[#E5B842] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8A94A6] text-[11px] mb-1">Client Name</label>
                <input
                  type="text"
                  value={project.clientName}
                  onChange={(e) => onChange({ clientName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1A202E] border border-[#2B354B] text-white focus:border-[#E5B842] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8A94A6] text-[11px] mb-1">Submission Date</label>
                <input
                  type="text"
                  value={project.submissionDate}
                  onChange={(e) => onChange({ submissionDate: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1A202E] border border-[#2B354B] text-white focus:border-[#E5B842] outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Branding */}
          <div className="space-y-3 pt-3.5 border-t border-[#1E2638]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#CBD5E1] font-semibold uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00D284]" />
                <span>Firm Details & Notes</span>
              </div>
              <button
                onClick={onOpenLogoUploader}
                className="text-[#1D72FE] hover:underline text-[11px] font-medium"
              >
                Upload Logos
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#8A94A6] text-[11px] mb-1">Company Name</label>
                <input
                  type="text"
                  value={project.companyName}
                  onChange={(e) => onChange({ companyName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1A202E] border border-[#2B354B] text-white focus:border-[#E5B842] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8A94A6] text-[11px] mb-1">Location / City</label>
                <input
                  type="text"
                  value={project.companyCity}
                  onChange={(e) => onChange({ companyCity: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1A202E] border border-[#2B354B] text-white focus:border-[#E5B842] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#8A94A6] text-[11px] mb-1">PDF Note</label>
                <input
                  type="text"
                  value={project.noteText}
                  onChange={(e) => onChange({ noteText: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1A202E] border border-[#2B354B] text-white focus:border-[#E5B842] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1E2638] bg-[#131823] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1D72FE] hover:bg-[#1862DE] text-white text-xs font-semibold transition cursor-pointer shadow-sm shadow-[#1D72FE]/25"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
