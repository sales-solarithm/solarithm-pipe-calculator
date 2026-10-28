'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { PipeProject } from '../lib/types';

interface ImportantNoteCardProps {
  project: PipeProject;
}

export function ImportantNoteCard({ project }: ImportantNoteCardProps) {
  return (
    <div className="relative rounded-xl bg-gradient-to-r from-[#240D0D] via-[#1F0A0A] to-[#170808] border-l-4 border-l-[#9B1C1C] border border-[#3D1414] p-4 lg:p-5 shadow-lg shadow-black/40 flex items-start sm:items-center gap-4">
      {/* Red Circular Badge with Exclamation */}
      <div className="w-10 h-10 rounded-full bg-[#9B1C1C] flex items-center justify-center text-white font-extrabold text-xl shrink-0 shadow-md shadow-[#9B1C1C]/40">
        !
      </div>

      <div className="flex-1">
        <div className="text-[11px] font-bold text-[#EF4444] tracking-wider uppercase">
          IMPORTANT NOTE
        </div>
        <div className="text-sm lg:text-base font-bold text-rose-100 mt-0.5">
          {project.noteText || 'PLEASE QUOTE 10-15% EXTRA PIPES OF ALL SIZES FOR ON-SITE VARIATION.'}
        </div>
        <div className="text-xs text-slate-400 italic mt-1">
          Calculation based on standard pipe length of {project.standardPipeLength || 20}{' '}
          {project.pipeLengthUnit || 'ft'}.
        </div>
      </div>
    </div>
  );
}
