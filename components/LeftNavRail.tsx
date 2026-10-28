'use client';

import React, { useState } from 'react';
import {
  FolderOpen,
  Settings,
  Plus,
  Trash2,
  FileDown,
  ChevronRight,
  Cloud,
  Layers,
  Save,
} from 'lucide-react';
import { PipeProject, ComponentItem } from '../lib/types';
import { calculateComponentTotalPipes, calculateGrandTotal } from '../lib/calculator';

interface LeftNavRailProps {
  project: PipeProject;
  activeTab: string; // 'summary' or componentId
  onSelectTab: (tabId: string) => void;
  onOpenProjectManager: () => void;
  onOpenSettings: () => void;
  onOpenPdfPreview: () => void;
  onAddComponent: (name: string) => void;
  onDeleteComponent: (componentId: string) => void;
  saveStatus: 'saved' | 'saving' | 'error' | 'offline';
  onManualSave?: () => void;
}

export function LeftNavRail({
  project,
  activeTab,
  onSelectTab,
  onOpenProjectManager,
  onOpenSettings,
  onOpenPdfPreview,
  onAddComponent,
  onDeleteComponent,
  saveStatus,
  onManualSave,
}: LeftNavRailProps) {
  const [isAddingComponent, setIsAddingComponent] = useState(false);
  const [newComponentName, setNewComponentName] = useState('');

  const grandPipes = calculateGrandTotal(project.rows || [], project.pipeSizes || []);

  const handleCreateComponent = () => {
    const trimmed = newComponentName.trim();
    if (!trimmed) return;
    onAddComponent(trimmed);
    setNewComponentName('');
    setIsAddingComponent(false);
  };

  return (
    <aside className="w-68 lg:w-72 shrink-0 bg-[#131823] border-r border-[#1E2638] flex flex-col h-screen sticky top-0 overflow-y-auto select-none">
      {/* Solarithm Pipe Calculator Brand Header */}
      <div className="p-4 border-b border-[#1E2638] bg-[#131823]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* 4-Box / 2x2 Grid Icon Badge inside sleek dark container with hairline border */}
            <div className="w-8 h-8 rounded-lg bg-[#161B26] border border-[#2B354B] flex items-center justify-center p-1.5 shadow-sm shrink-0">
              <div className="grid grid-cols-2 gap-1 w-4 h-4">
                <span className="w-1.5 h-1.5 rounded-[2px] bg-[#1D72FE]" />
                <span className="w-1.5 h-1.5 rounded-[2px] bg-[#00D284]" />
                <span className="w-1.5 h-1.5 rounded-[2px] bg-[#E5B842]" />
                <span className="w-1.5 h-1.5 rounded-[2px] bg-[#60A5FA]" />
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-[#FFFFFF] tracking-tight block">
                Solarithm Pipe Calculator
              </span>
              <span className="text-[9.5px] text-[#8A94A6] uppercase tracking-wide block font-medium whitespace-nowrap">
                Structure & Pipe Engineering Console
              </span>
            </div>
          </div>
        </div>

        {/* Project Selector Box */}
        <div className="mt-3.5">
          <button
            onClick={onOpenProjectManager}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#161B26] hover:bg-[#1E2536] border border-[#1E2638] text-xs text-[#CBD5E1] transition-all cursor-pointer group shadow-xs"
            title="Open Projects"
          >
            <div className="flex items-center gap-2 truncate">
              <FolderOpen className="w-3.5 h-3.5 text-[#1D72FE] shrink-0" />
              <span className="truncate font-medium text-[#F1F5F9]">{project.projectName}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#FFFFFF] shrink-0 transition-colors" />
          </button>
        </div>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 px-2.5 py-3.5 space-y-4">
        {/* Consolidated Summary */}
        <div>
          <button
            onClick={() => onSelectTab('summary')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border-l-2 ${
              activeTab === 'summary'
                ? 'border-[#E5B842] bg-[#1E2536] text-[#FFFFFF] shadow-xs'
                : 'border-transparent text-[#8A94A6] hover:bg-white/[0.04] hover:text-[#FFFFFF]'
            }`}
          >
            <span className="font-medium">Consolidated Summary</span>
            <span className="font-mono text-xs text-[#E5B842] font-bold">
              {grandPipes}
            </span>
          </button>
        </div>

        {/* Components List */}
        <div>
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#8A94A6] flex items-center justify-between">
            <span>Components</span>
            <span className="font-mono text-[10px] text-[#00D284] bg-[#00D284]/10 px-1.5 py-0.5 rounded border border-[#00D284]/20 font-semibold">
              {project.componentItems?.length || 0}
            </span>
          </div>

          <div className="space-y-1 mt-1.5">
            {(project.componentItems || []).map((comp) => {
              const isActive = activeTab === comp.id;
              const compPipes = calculateComponentTotalPipes(
                comp,
                project.standardPipeLength || 20,
                project.pipeSizes
              );

              return (
                <div
                  key={comp.id}
                  className="group flex items-center justify-between relative"
                >
                  <button
                    onClick={() => onSelectTab(comp.id)}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all cursor-pointer text-left border-l-2 ${
                      isActive
                        ? 'border-[#E5B842] bg-[#1E2536] text-[#FFFFFF] font-medium shadow-xs'
                        : 'border-transparent text-[#8A94A6] hover:bg-white/[0.04] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <span className="truncate">{comp.name}</span>
                    <span
                      className={`font-mono text-xs ml-2 ${
                        isActive ? 'text-[#E5B842] font-bold' : 'text-[#64748B]'
                      }`}
                    >
                      {compPipes}
                    </span>
                  </button>

                  {(project.componentItems?.length || 0) > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteComponent(comp.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#64748B] hover:text-rose-400 transition mr-1"
                      title={`Delete ${comp.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Component Form */}
          {isAddingComponent ? (
            <div className="mt-2.5 p-2.5 rounded-lg bg-[#161B26] border border-[#2B354B] space-y-2">
              <input
                type="text"
                value={newComponentName}
                onChange={(e) => setNewComponentName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateComponent()}
                placeholder="Component name..."
                className="w-full px-2.5 py-1.5 rounded bg-[#1A202E] border border-[#2B354B] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#E5B842]"
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setIsAddingComponent(false)}
                  className="px-2.5 py-1 text-[11px] text-[#8A94A6] hover:text-[#FFFFFF]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateComponent}
                  className="px-3 py-1 rounded-md bg-[#1D72FE] text-white text-[11px] font-semibold hover:bg-[#1862DE]"
                >
                  Add
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingComponent(true)}
              className="w-full mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#8A94A6] hover:text-[#FFFFFF] hover:bg-white/[0.04] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#1D72FE]" />
              <span>Add Component</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Utilities */}
      <div className="p-3.5 border-t border-[#1E2638] bg-[#131823] space-y-2">
        <div className="flex items-center justify-between text-[11px] px-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                saveStatus === 'saved'
                  ? 'bg-[#00D284] animate-pulse shadow-sm shadow-[#00D284]/50'
                  : saveStatus === 'saving'
                  ? 'bg-amber-400 animate-pulse'
                  : saveStatus === 'offline'
                  ? 'bg-amber-400'
                  : 'bg-[#64748B]'
              }`}
            />
            <span
              className={`font-medium ${
                saveStatus === 'offline' ? 'text-amber-300' : 'text-[#00D284]'
              }`}
            >
              {saveStatus === 'saved'
                ? 'Synced with Cloud'
                : saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'offline'
                ? 'Saved (Offline)'
                : saveStatus}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#8A94A6]">
            {project.standardPipeLength} {project.pipeLengthUnit} stock
          </span>
        </div>
      </div>
    </aside>
  );
}
