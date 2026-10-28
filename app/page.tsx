'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  auth,
  saveProjectToFirestore,
  fetchUserProjectsFromFirestore,
} from '../lib/firebase';
import { PipeProject, ComponentItem } from '../lib/types';
import {
  getDefaultProject,
  createBlankProject,
  syncCategoryRowsFromComponentItems,
} from '../lib/calculator';
import { LeftNavRail } from '../components/LeftNavRail';
import { ComponentWorkspace } from '../components/ComponentWorkspace';
import { ConsolidatedDashboard } from '../components/ConsolidatedDashboard';
import { SettingsModal } from '../components/SettingsModal';
import { ProjectManagerModal } from '../components/ProjectManagerModal';
import { PdfPreviewModal } from '../components/PdfPreviewModal';
import { LogoUploaderModal } from '../components/LogoUploaderModal';
import { generatePipeSummaryPdf } from '../lib/pdfGenerator';
import {
  Settings,
  FileDown,
  Save,
  Menu,
  X,
  Check,
  Loader2,
} from 'lucide-react';

export default function PipeCalculatorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<PipeProject>(() => getDefaultProject());
  const [activeTab, setActiveTab] = useState<string>('summary'); // 'summary' or component.id
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'offline'>('saved');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Modals
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isLogoUploaderOpen, setIsLogoUploaderOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial project load from Firestore/cache & optional auth listener
  useEffect(() => {
    let isMounted = true;

    void fetchUserProjectsFromFirestore('guest_user').then((projects) => {
      if (!isMounted) return;
      if (projects.length > 0) {
        const active =
          projects.find((p) => p.id === project.id) || projects[0];
        if (active) {
          setProject(active);
        }
      } else {
        void saveProjectToFirestore(project, false);
      }
      setSaveStatus('saved');
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && isMounted) {
        setUser(currentUser);
        setProject((prev) => ({
          ...prev,
          userId: currentUser.uid,
          userEmail: currentUser.email || '',
        }));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optimistic auto-save: writes to localStorage immediately, shows "Saving..." briefly (250ms), then "✓ Saved"
  const saveToFirestoreDebounced = useCallback(
    (projToSave: PipeProject) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setSaveStatus('saving');
      void saveProjectToFirestore(projToSave, false);

      debounceTimerRef.current = setTimeout(() => {
        setSaveStatus('saved');
      }, 250);
    },
    []
  );

  // Explicit manual save trigger (optimistic 250ms transition)
  const handleManualSave = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSaveStatus('saving');
    void saveProjectToFirestore(project, false);
    debounceTimerRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 250);
  };

  // Atomic "+ New Project" workspace reset
  const handleNewProject = useCallback((): PipeProject => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const freshProject = createBlankProject(user?.uid || 'guest_user');
    setProject(freshProject);
    setActiveTab('summary');
    setSaveStatus('saving');
    void saveProjectToFirestore(freshProject, true);
    debounceTimerRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 250);
    return freshProject;
  }, [user]);

  // Update whole project and keep category rows synchronized
  const updateProject = useCallback(
    (updatedFields: Partial<PipeProject>) => {
      setProject((prev) => {
        const next = {
          ...prev,
          ...updatedFields,
          updatedAt: new Date().toISOString(),
        };

        if (
          updatedFields.componentItems ||
          updatedFields.standardPipeLength ||
          updatedFields.pipeSizes
        ) {
          next.rows = syncCategoryRowsFromComponentItems(
            next.componentItems || [],
            next.standardPipeLength || 20,
            next.pipeSizes || []
          );
        }

        saveToFirestoreDebounced(next);
        return next;
      });
    },
    [saveToFirestoreDebounced]
  );

  // Update a single component's cutRows
  const handleUpdateComponent = useCallback(
    (updatedComp: ComponentItem) => {
      setProject((prev) => {
        const updatedList = prev.componentItems.map((c) =>
          c.id === updatedComp.id ? updatedComp : c
        );
        const next = {
          ...prev,
          componentItems: updatedList,
          rows: syncCategoryRowsFromComponentItems(
            updatedList,
            prev.standardPipeLength || 20,
            prev.pipeSizes || []
          ),
          updatedAt: new Date().toISOString(),
        };
        saveToFirestoreDebounced(next);
        return next;
      });
    },
    [saveToFirestoreDebounced]
  );

  // Add new component tab
  const handleAddComponent = useCallback(
    (name: string) => {
      const newCompId = `comp-${Date.now()}`;
      const newComp: ComponentItem = {
        id: newCompId,
        name,
        cutRows: [
          {
            id: `cut-${Date.now()}`,
            length: project.standardPipeLength || 20,
            quantities: project.pipeSizes.reduce((acc, s) => ({ ...acc, [s]: 0 }), {}),
          },
        ],
      };

      const updatedList = [...project.componentItems, newComp];
      setProject((prev) => {
        const next = {
          ...prev,
          components: [...prev.components, name],
          componentItems: updatedList,
          rows: syncCategoryRowsFromComponentItems(
            updatedList,
            prev.standardPipeLength || 20,
            prev.pipeSizes || []
          ),
          updatedAt: new Date().toISOString(),
        };
        saveToFirestoreDebounced(next);
        return next;
      });
      setActiveTab(newCompId);
    },
    [project.standardPipeLength, project.pipeSizes, project.componentItems, saveToFirestoreDebounced]
  );

  // Delete component tab
  const handleDeleteComponent = useCallback(
    (componentId: string) => {
      if (project.componentItems.length <= 1) return;
      const updatedList = project.componentItems.filter((c) => c.id !== componentId);
      setProject((prev) => {
        const next = {
          ...prev,
          components: updatedList.map((c) => c.name),
          componentItems: updatedList,
          rows: syncCategoryRowsFromComponentItems(
            updatedList,
            prev.standardPipeLength || 20,
            prev.pipeSizes || []
          ),
          updatedAt: new Date().toISOString(),
        };
        saveToFirestoreDebounced(next);
        return next;
      });
      if (activeTab === componentId) {
        setActiveTab('summary');
      }
    },
    [project.componentItems, activeTab, saveToFirestoreDebounced]
  );

  // Direct PDF download with fallback to preview
  const handleDirectPdfDownload = () => {
    try {
      const doc = generatePipeSummaryPdf(project);
      doc.save(`${project.projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Pipe_Summary.pdf`);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setIsPdfPreviewOpen(true);
    }
  };

  const activeComponent = project.componentItems.find((c) => c.id === activeTab);

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F1F5F9] flex flex-col md:flex-row font-sans selection:bg-[#1D72FE]/30 selection:text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-[#131823] border-b border-[#1E2638]">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="p-1.5 rounded-md bg-[#161B26] text-[#CBD5E1] border border-[#2B354B]"
          >
            {isMobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-[#8A94A6]">Solarithm Pipe Calculator</span>
            <span className="text-[#444B59]">/</span>
            <span className="font-semibold text-white truncate max-w-[130px]">{project.projectName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDirectPdfDownload}
            className="px-2.5 py-1 rounded-md bg-[#1D72FE] text-white text-xs font-semibold flex items-center gap-1 shadow-sm shadow-[#1D72FE]/25"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Left Navigation Rail (Solarithm Pipe Calculator Sidebar) */}
      <div className={`md:block ${isMobileNavOpen ? 'block' : 'hidden'} z-40`}>
        <LeftNavRail
          project={project}
          activeTab={activeTab}
          onSelectTab={(tabId) => {
            setActiveTab(tabId);
            setIsMobileNavOpen(false);
          }}
          onOpenProjectManager={() => setIsProjectManagerOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenPdfPreview={() => setIsPdfPreviewOpen(true)}
          onAddComponent={handleAddComponent}
          onDeleteComponent={handleDeleteComponent}
          saveStatus={saveStatus}
          onManualSave={handleManualSave}
        />
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#10141D] overflow-y-auto">
        {/* Solarithm Pipe Calculator Minimal Header Bar */}
        <header className="h-13 sm:h-14 border-b border-[#1E2638] bg-[#131823] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
          {/* Top Breadcrumb Bar: Solarithm Pipe Calculator / [Project Name] with subtle #444B59 slashes */}
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs sm:text-sm font-semibold text-[#8A94A6] tracking-tight">
              Solarithm Pipe Calculator
            </span>
            <span className="text-[#444B59] font-medium text-sm">/</span>
            <button
              onClick={() => setIsProjectManagerOpen(true)}
              className="text-xs sm:text-sm font-semibold text-[#FFFFFF] hover:text-[#00D284] transition truncate max-w-[200px] sm:max-w-xs cursor-pointer flex items-center gap-1.5"
              title="Click to switch project"
            >
              <span>{project.projectName}</span>
            </button>
          </div>

          {/* Right: Insight Action Buttons: [ Settings ], [ ✓ Saved ], [ Download PDF ] */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* [ Settings ] */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A202E] hover:bg-[#222B3D] text-[#CBD5E1] hover:text-white border border-[#2B354B] text-xs font-medium transition cursor-pointer shadow-xs"
              title="Engineering & Project Settings"
            >
              <Settings className="w-3.5 h-3.5 text-[#8A94A6]" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* [ ✓ Saved / ✓ Saved (Offline) ] status pill */}
            <button
              onClick={handleManualSave}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              title="Save project to Firestore"
            >
              {saveStatus === 'saving' ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  <span className="hidden sm:inline">Saving...</span>
                </div>
              ) : saveStatus === 'saved' ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00D284]/15 border border-[#00D284]/35 text-[#00D284]">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span className="hidden sm:inline">Saved</span>
                </div>
              ) : saveStatus === 'offline' ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300">
                  <Check className="w-3 h-3 stroke-[2.5] text-amber-400" />
                  <span className="hidden sm:inline">Saved (Offline)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1A202E] border border-[#2B354B] text-[#8A94A6] hover:text-[#FFFFFF]">
                  <Save className="w-3 h-3 text-[#8A94A6]" />
                  <span className="hidden sm:inline">Save</span>
                </div>
              )}
            </button>

            {/* [ Download PDF ] solid vibrant blue button */}
            <button
              onClick={handleDirectPdfDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1D72FE] hover:bg-[#1862DE] text-white text-xs font-bold transition cursor-pointer shadow-md shadow-[#1D72FE]/25"
              title="Download Vector PDF Summary"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-7xl w-full mx-auto space-y-5">
          {activeTab === 'summary' ? (
            <ConsolidatedDashboard
              project={project}
              onOpenPdfPreview={() => setIsPdfPreviewOpen(true)}
              onSelectComponent={(compNameOrId) => {
                const target = project.componentItems.find(
                  (c) => c.id === compNameOrId || c.name === compNameOrId
                );
                if (target) setActiveTab(target.id);
              }}
            />
          ) : activeComponent ? (
            <ComponentWorkspace
              key={activeComponent.id}
              component={activeComponent}
              project={project}
              onUpdateComponent={handleUpdateComponent}
            />
          ) : (
            <div className="py-16 text-center text-[#666666] text-xs font-mono">
              Component not found. Please select a component from the left sidebar.
            </div>
          )}
        </main>
      </div>

      {/* Minimal Modals */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        currentProject={project}
        user={user}
        onSelectProject={(selected) => {
          setProject(selected);
          setActiveTab('summary');
        }}
        onCreateNewProject={handleNewProject}
        onSignInPrompt={() => {}}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        project={project}
        onChange={updateProject}
        onOpenLogoUploader={() => {
          setIsSettingsOpen(false);
          setIsLogoUploaderOpen(true);
        }}
      />

      <PdfPreviewModal
        isOpen={isPdfPreviewOpen}
        onClose={() => setIsPdfPreviewOpen(false)}
        project={project}
      />

      <LogoUploaderModal
        isOpen={isLogoUploaderOpen}
        onClose={() => setIsLogoUploaderOpen(false)}
        project={project}
        onChange={updateProject}
      />
    </div>
  );
}
