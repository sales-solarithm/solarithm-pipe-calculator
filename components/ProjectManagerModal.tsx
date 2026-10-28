'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Download,
  Upload,
  X,
  Check,
  RefreshCw,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { PipeProject } from '../lib/types';
import {
  fetchUserProjectsFromFirestore,
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  getLocalCachedProjects,
} from '../lib/firebase';
import { createBlankProject, calculateGrandTotal } from '../lib/calculator';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: PipeProject;
  user: User | null;
  onSelectProject: (project: PipeProject) => void;
  onCreateNewProject?: () => PipeProject;
  onSignInPrompt?: () => void;
}

function mergeProjectsList(currentProject: PipeProject, list: PipeProject[]): PipeProject[] {
  const map = new Map<string, PipeProject>();
  map.set(currentProject.id, currentProject);
  for (const item of list) {
    if (item && item.id) {
      map.set(item.id, item.id === currentProject.id ? currentProject : item);
    }
  }
  return Array.from(map.values());
}

export function ProjectManagerModal({
  isOpen,
  onClose,
  currentProject,
  user,
  onSelectProject,
  onCreateNewProject,
}: ProjectManagerModalProps) {
  const [projects, setProjects] = useState<PipeProject[]>(() =>
    mergeProjectsList(currentProject, getLocalCachedProjects())
  );
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Refresh projects from cloud in background with strict 2-second spinner ceiling
  const loadProjects = useCallback(async () => {
    const cached = mergeProjectsList(currentProject, getLocalCachedProjects());
    setProjects(cached);

    // Only show top refresh icon spin, never block the list if we have cached projects
    setIsLoading(true);
    const maxSpinnerTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    try {
      const list = await fetchUserProjectsFromFirestore(user?.uid || 'guest_user');
      if (list.length === 0) {
        void saveProjectToFirestore(currentProject, true);
        setProjects(cached);
      } else {
        setProjects(mergeProjectsList(currentProject, list));
      }
    } catch (err) {
      console.warn('Could not fetch from Firestore, keeping local cached projects:', err);
      setProjects(cached);
    } finally {
      clearTimeout(maxSpinnerTimer);
      setIsLoading(false);
    }
  }, [user, currentProject]);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Immediately populate from localStorage + currentProject (zero blocking spinner)
    const initialCached = mergeProjectsList(currentProject, getLocalCachedProjects());
    setProjects(initialCached);
    setIsLoading(false);
    setConfirmDeleteId(null);
    setErrorNotice(null);

    // 2. Background cloud sync with 2-second safety ceiling
    let isCancelled = false;
    fetchUserProjectsFromFirestore(user?.uid || 'guest_user')
      .then((list) => {
        if (isCancelled) return;
        if (list.length === 0) {
          void saveProjectToFirestore(currentProject, true);
        } else {
          setProjects(mergeProjectsList(currentProject, list));
        }
      })
      .catch(() => {
        // fail silently and keep displaying cached list
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, user, currentProject]);

  if (!isOpen) return null;

  // Create new blank project atomically and close modal immediately
  const handleCreateNew = () => {
    const newProj = onCreateNewProject
      ? onCreateNewProject()
      : createBlankProject(user?.uid || 'guest_user');

    void saveProjectToFirestore(newProj, true);
    setProjects((prev) => [newProj, ...prev.filter((p) => p.id !== newProj.id)]);
    onSelectProject(newProj);
    onClose();
  };

  // Duplicate project optimistically
  const handleDuplicate = (source: PipeProject) => {
    const cloned: PipeProject = {
      ...source,
      id: `proj_${Date.now()}`,
      projectName: `${source.projectName} (Copy)`,
      userId: user?.uid || source.userId || 'guest_user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    void saveProjectToFirestore(cloned, true);
    setProjects((prev) => [cloned, ...prev]);
  };

  // Rename project optimistically
  const handleSaveRename = (projId: string) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    const target = projects.find((p) => p.id === projId);
    if (!target) return;

    const updated = { ...target, projectName: trimmed, updatedAt: new Date().toISOString() };
    void saveProjectToFirestore(updated, false);

    setProjects((prev) => prev.map((p) => (p.id === projId ? updated : p)));
    if (currentProject.id === projId) {
      onSelectProject(updated);
    }
    setEditingId(null);
  };

  // Delete project optimistically
  const handleDelete = (projId: string) => {
    if (projects.length <= 1) {
      setErrorNotice('Cannot delete the last remaining project.');
      return;
    }

    void deleteProjectFromFirestore(projId);

    const remaining = projects.filter((p) => p.id !== projId);
    setProjects(remaining);
    setConfirmDeleteId(null);

    if (currentProject.id === projId && remaining.length > 0) {
      onSelectProject(remaining[0]);
    }
  };

  // Export JSON
  const handleExportJson = (proj: PipeProject) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(proj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${proj.projectName.replace(/\s+/g, '_')}_backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (!parsed.projectName || !Array.isArray(parsed.rows)) {
          setErrorNotice('Invalid project JSON structure.');
          return;
        }
        const importedProj: PipeProject = {
          ...parsed,
          id: `proj_${Date.now()}`,
          userId: user?.uid || 'guest_user',
          updatedAt: new Date().toISOString(),
        };

        void saveProjectToFirestore(importedProj, true);
        setProjects((prev) => [importedProj, ...prev]);
        onSelectProject(importedProj);
        onClose();
      } catch {
        setErrorNotice('Failed to parse uploaded JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl bg-[#161B26] border border-[#1E2638] shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#1E2638] flex items-center justify-between bg-[#131823]">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-4 h-4 text-[#1D72FE]" />
            <h2 className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wide">
              Project Management
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#8A94A6] hover:text-[#FFFFFF] hover:bg-[#1E2536] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2.5 border-b border-[#1E2638] flex items-center justify-between gap-2 bg-[#131823]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D72FE] hover:bg-[#1862DE] text-white text-xs font-semibold cursor-pointer transition shadow-sm shadow-[#1D72FE]/25"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>

            <button
              onClick={loadProjects}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1A202E] hover:bg-[#222B3D] text-[#8A94A6] hover:text-white border border-[#2B354B] text-xs font-medium cursor-pointer transition"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A202E] hover:bg-[#222B3D] text-[#CBD5E1] hover:text-white border border-[#2B354B] text-xs font-medium cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-[#1D72FE]" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>

            <button
              onClick={() => handleExportJson(currentProject)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A202E] hover:bg-[#222B3D] text-[#CBD5E1] hover:text-white border border-[#2B354B] text-xs font-medium cursor-pointer transition"
              title="Download active project JSON backup"
            >
              <Download className="w-3.5 h-3.5 text-[#E5B842]" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Project List */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
          {errorNotice && (
            <div className="px-3 py-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>{errorNotice}</span>
              <button onClick={() => setErrorNotice(null)} className="text-rose-300 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {projects.length === 0 && isLoading ? (
            <div className="py-12 text-center text-[#8A94A6] text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1D72FE]" />
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-[#8A94A6] text-xs">
              No projects found. Click &quot;New Project&quot; to create one.
            </div>
          ) : (
            projects.map((proj) => {
              const isActive = currentProject.id === proj.id;
              const isRenaming = editingId === proj.id;
              const grandPipes = calculateGrandTotal(proj.rows || [], proj.pipeSizes || []);

              return (
                <div
                  key={proj.id}
                  className={`rounded-xl border px-3.5 py-3 transition flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-[#1E2536] border-[#00D284] shadow-sm'
                      : 'bg-[#161B26] border-[#1E2638] hover:border-[#2B354B]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isRenaming ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(proj.id)}
                            className="px-2.5 py-1 rounded bg-[#1A202E] border border-[#1D72FE] text-xs text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(proj.id)}
                            className="p-1.5 rounded bg-[#1D72FE] text-white"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 truncate">
                          <button
                            onClick={() => {
                              onSelectProject(proj);
                              onClose();
                            }}
                            className="text-xs font-semibold text-[#FFFFFF] hover:text-[#00D284] truncate cursor-pointer text-left transition"
                          >
                            {proj.projectName}
                          </button>
                          {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D284]/15 border border-[#00D284]/30 text-[#00D284] font-semibold">
                              Active
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-[#8A94A6] font-mono mt-1 flex items-center gap-3">
                      <span>Total: <strong className="text-[#E5B842] font-bold">{grandPipes}</strong> pipes</span>
                      {proj.clientName && <span>Client: {proj.clientName}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => {
                          onSelectProject(proj);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-md bg-[#1A202E] hover:bg-[#222B3D] border border-[#2B354B] text-[#CBD5E1] hover:text-white text-[11px] transition"
                      >
                        Open
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setEditingId(proj.id);
                        setEditName(proj.projectName);
                      }}
                      className="p-1.5 text-[#8A94A6] hover:text-[#FFFFFF] transition"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDuplicate(proj)}
                      className="p-1.5 text-[#8A94A6] hover:text-[#FFFFFF] transition"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {projects.length > 1 && (
                      confirmDeleteId === proj.id ? (
                        <button
                          onClick={() => handleDelete(proj.id)}
                          className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-semibold transition"
                          title="Confirm Delete"
                        >
                          Confirm
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(proj.id)}
                          className="p-1.5 text-[#8A94A6] hover:text-rose-400 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
