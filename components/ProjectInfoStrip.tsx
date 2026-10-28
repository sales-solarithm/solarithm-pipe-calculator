'use client';

import React, { useState } from 'react';
import { Calendar, Building2, Ruler, Edit3, Check, MapPin, AlertTriangle } from 'lucide-react';
import { PipeProject } from '../lib/types';

interface ProjectInfoStripProps {
  project: PipeProject;
  onChange: (updated: Partial<PipeProject>) => void;
}

export function ProjectInfoStrip({ project, onChange }: ProjectInfoStripProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="w-full">
      {/* Main Info Strip (matches ReportLab PDF Info Strip) */}
      <div className="relative rounded-xl bg-[#091F15] border border-[#184630] p-4 lg:p-5 shadow-lg shadow-black/30 overflow-hidden">
        {/* Left Gold Accent Bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#C9961A]" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1 w-full pl-2">
            {/* Col 1: PROJECT */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#C9961A] uppercase">
                <Building2 className="w-3.5 h-3.5" />
                PROJECT
              </div>
              <div className="text-base lg:text-lg font-bold text-white mt-1 truncate">
                {project.projectName || 'Untitled Solar Project'}
              </div>
              {project.clientName && (
                <div className="text-xs text-slate-400">Client: {project.clientName}</div>
              )}
            </div>

            {/* Col 2: DATE */}
            <div className="sm:border-l sm:border-[#184630] sm:pl-6">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#C9961A] uppercase">
                <Calendar className="w-3.5 h-3.5" />
                SUBMISSION DATE
              </div>
              <div className="text-base lg:text-lg font-bold text-emerald-300 mt-1">
                {project.submissionDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div className="text-xs text-slate-400">Solarithm Approved Spec</div>
            </div>

            {/* Col 3: STANDARD PIPE LENGTH */}
            <div className="sm:border-l sm:border-[#184630] sm:pl-6">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#C9961A] uppercase">
                <Ruler className="w-3.5 h-3.5" />
                STANDARD PIPE LENGTH
              </div>
              <div className="text-base lg:text-lg font-bold text-[#F59E0B] mt-1">
                {project.standardPipeLength || 20} {project.pipeLengthUnit || 'ft'}
              </div>
              <div className="text-xs text-slate-400">Commercial Standard Bar</div>
            </div>
          </div>

          {/* Quick Edit Toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="self-end md:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E2E20] hover:bg-[#154631] text-emerald-300 border border-[#1F6B3F] text-xs font-medium transition cursor-pointer"
          >
            {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5 text-[#C9961A]" />}
            <span>{isEditing ? 'Done' : 'Edit Specs'}</span>
          </button>
        </div>

        {/* Collapsible Edit Drawer */}
        {isEditing && (
          <div className="mt-5 pt-4 border-t border-[#184630] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Project Name</label>
              <input
                type="text"
                value={project.projectName}
                onChange={(e) => onChange({ projectName: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-[#06140E] border border-[#1F6B3F] text-sm text-white focus:outline-none focus:border-[#C9961A]"
                placeholder="e.g. Shresth Parisar (E Block)"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Client Name</label>
              <input
                type="text"
                value={project.clientName}
                onChange={(e) => onChange({ clientName: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-[#06140E] border border-[#1F6B3F] text-sm text-white focus:outline-none focus:border-[#C9961A]"
                placeholder="e.g. Shresth Infrastructure"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Submission Date</label>
              <input
                type="text"
                value={project.submissionDate}
                onChange={(e) => onChange({ submissionDate: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-[#06140E] border border-[#1F6B3F] text-sm text-white focus:outline-none focus:border-[#C9961A]"
                placeholder="e.g. 05 Oct 2026"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Standard Pipe Stock Length</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={project.standardPipeLength}
                  onChange={(e) => onChange({ standardPipeLength: parseFloat(e.target.value) || 20 })}
                  className="w-2/3 px-3 py-1.5 rounded-lg bg-[#06140E] border border-[#1F6B3F] text-sm text-white focus:outline-none focus:border-[#C9961A]"
                />
                <select
                  value={project.pipeLengthUnit}
                  onChange={(e) => onChange({ pipeLengthUnit: e.target.value as 'ft' | 'm' })}
                  className="w-1/3 px-2 py-1.5 rounded-lg bg-[#06140E] border border-[#1F6B3F] text-xs text-white focus:outline-none focus:border-[#C9961A]"
                >
                  <option value="ft">ft</option>
                  <option value="m">m</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Company / Engineering Firm</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={project.companyName}
                  onChange={(e) => onChange({ companyName: e.target.value })}
                  className="w-2/3 px-3 py-1.5 rounded-lg bg-[#06140E] border border-[#1F6B3F] text-sm text-white focus:outline-none focus:border-[#C9961A]"
                  placeholder="e.g. Solarithm Design & Engineering"
                />
                <input
                  type="text"
                  value={project.companyCity}
                  onChange={(e) => onChange({ companyCity: e.target.value })}
                  className="w-1/3 px-3 py-1.5 rounded-lg bg-[#06140E] border border-[#1F6B3F] text-sm text-white focus:outline-none focus:border-[#C9961A]"
                  placeholder="e.g. Surat, India"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Important Variation Note</label>
              <input
                type="text"
                value={project.noteText}
                onChange={(e) => onChange({ noteText: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-[#06140E] border border-[#1F6B3F] text-sm text-white focus:outline-none focus:border-[#C9961A]"
                placeholder="PLEASE QUOTE 10-15% EXTRA PIPES OF ALL SIZES FOR ON-SITE VARIATION."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
