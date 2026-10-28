'use client';

import React from 'react';
import {
  Sun,
  FileDown,
  FolderOpen,
  Sparkles,
  Scissors,
  Image as ImageIcon,
  CheckCircle2,
  Cloud,
  CloudOff,
  RefreshCw,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  projectName: string;
  user: User | null;
  saveStatus: 'saved' | 'saving' | 'error' | 'offline';
  onOpenProjectManager: () => void;
  onOpenPdfPreview: () => void;
  onOpenCutOptimizer: () => void;
  onOpenAiAssistant: () => void;
  onOpenLogoUploader: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function Header({
  projectName,
  user,
  saveStatus,
  onOpenProjectManager,
  onOpenPdfPreview,
  onOpenCutOptimizer,
  onOpenAiAssistant,
  onOpenLogoUploader,
  onSignIn,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#143D2A] bg-[#06140E]/95 backdrop-blur-md px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] via-[#C9961A] to-[#063D25] flex items-center justify-center shadow-lg shadow-[#063D25]/40 border border-[#C9961A]/40">
            <Sun className="w-6 h-6 text-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest text-[#C9961A] uppercase">
                Solarithm Engineering
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0E2E20] text-[#10B981] border border-[#1F6B3F] font-mono">
                v2.6 Firestore
              </span>
            </div>
            <h1 className="text-lg lg:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Pipe Requirement Calculator
              <span className="text-xs font-normal text-slate-400 hidden sm:inline">
                / {projectName || 'Current Project'}
              </span>
            </h1>
          </div>
        </div>

        {/* Center / Cloud Save Indicator */}
        <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#0B2117] border border-[#143D2A]">
          {saveStatus === 'saved' && (
            <>
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Synced to Firestore</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <RefreshCw className="w-4 h-4 text-[#C9961A] animate-spin" />
              <span className="text-[#C9961A]">Saving to Cloud...</span>
            </>
          )}
          {saveStatus === 'offline' && (
            <>
              <CloudOff className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400">Offline / Guest</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <CloudOff className="w-4 h-4 text-rose-400" />
              <span className="text-rose-400">Sync Warning</span>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Projects Browser */}
          <button
            onClick={onOpenProjectManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E2E20] hover:bg-[#154631] text-emerald-300 border border-[#1F6B3F]/60 text-xs font-medium transition cursor-pointer shadow-sm"
            title="Manage Projects in Firestore"
          >
            <FolderOpen className="w-4 h-4 text-[#C9961A]" />
            <span className="hidden sm:inline">Projects</span>
          </button>

          {/* Cut-List 1D Optimizer */}
          <button
            onClick={onOpenCutOptimizer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E2E20] hover:bg-[#154631] text-emerald-300 border border-[#1F6B3F]/60 text-xs font-medium transition cursor-pointer shadow-sm"
            title="1D Bin Packing Cut-List Optimizer"
          >
            <Scissors className="w-4 h-4 text-[#C9961A]" />
            <span className="hidden md:inline">Cut Optimizer</span>
          </button>

          {/* Logo Branding */}
          <button
            onClick={onOpenLogoUploader}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E2E20] hover:bg-[#154631] text-emerald-300 border border-[#1F6B3F]/60 text-xs font-medium transition cursor-pointer shadow-sm"
            title="Upload Logos to Firebase Storage"
          >
            <ImageIcon className="w-4 h-4 text-[#C9961A]" />
            <span className="hidden md:inline">Logos</span>
          </button>

          {/* AI Intelligence (Gemini 4 Argon & Flash) */}
          <button
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#C9961A] to-[#B38012] hover:from-[#DFAB26] hover:to-[#C9961A] text-slate-950 text-xs font-bold transition cursor-pointer shadow-md shadow-[#C9961A]/20"
            title="Gemini Engineering Optimization & BOM Parser"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Gemini AI</span>
          </button>

          {/* ReportLab PDF Summary Generation */}
          <button
            onClick={onOpenPdfPreview}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#063D25] hover:bg-[#0A4D30] text-white border border-[#C9961A]/60 text-xs font-semibold transition cursor-pointer shadow-md shadow-[#063D25]/40"
            title="Generate Exact ReportLab Vector PDF"
          >
            <FileDown className="w-4 h-4 text-[#C9961A]" />
            <span>Generate PDF</span>
          </button>

          {/* User Auth Profile */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#143D2A]">
              <div
                className="w-8 h-8 rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-xs font-bold text-white overflow-hidden"
                title={user.email || 'Google User'}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.email?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#143D2A] transition"
                title="Sign out of Firebase"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
              title="Sign in with Google via Firebase Auth"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Google Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
