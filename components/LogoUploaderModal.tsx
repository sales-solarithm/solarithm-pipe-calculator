'use client';

import React, { useState } from 'react';
import { Upload, X, Check, Image as ImageIcon, Trash2 } from 'lucide-react';
import { PipeProject } from '../lib/types';
import { uploadLogoToStorage } from '../lib/firebase';
import { SOLARITHM_LOGO_DATA_URL } from '../lib/solarithmLogo';

interface LogoUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PipeProject;
  onChange: (updated: Partial<PipeProject>) => void;
}

export function LogoUploaderModal({
  isOpen,
  onClose,
  project,
  onChange,
}: LogoUploaderModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isClient: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const url = await uploadLogoToStorage(file, isClient ? 'client-logos' : 'company-logos');
      if (isClient) {
        onChange({ clientLogoUrl: url });
      } else {
        onChange({ logoUrl: url });
      }
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error('Logo upload error:', err);
      alert('Error uploading logo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-[#161B26] border border-[#1E2638] shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1E2638] bg-[#131823] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-4 h-4 text-[#1D72FE]" />
            <h2 className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wide">
              Branding & Logos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#8A94A6] hover:text-[#FFFFFF] hover:bg-[#1E2536] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Company Logo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#8A94A6] font-medium text-[11px] uppercase tracking-wider">
                Company Logo
              </span>
              {project.logoUrl && (
                <button
                  onClick={() => onChange({ logoUrl: '' })}
                  className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="rounded-lg border border-[#2B354B] bg-white p-3 flex items-center justify-center min-h-[76px]">
              <img
                src={project.logoUrl || SOLARITHM_LOGO_DATA_URL}
                alt="Company Logo"
                className="max-h-14 max-w-full object-contain"
              />
            </div>

            <label className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-[#1A202E] hover:bg-[#222B3D] text-[#E2E8F0] border border-[#2B354B] text-xs font-medium cursor-pointer transition shadow-xs">
              <Upload className="w-3.5 h-3.5 text-[#1D72FE]" />
              <span>{isUploading ? 'Uploading...' : 'Upload Company Logo'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => handleFileUpload(e, false)}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Client Logo */}
          <div className="space-y-2 pt-3.5 border-t border-[#1E2638]">
            <div className="flex items-center justify-between">
              <span className="text-[#8A94A6] font-medium text-[11px] uppercase tracking-wider">
                Client / Sponsor Logo (Optional)
              </span>
              {project.clientLogoUrl && (
                <button
                  onClick={() => onChange({ clientLogoUrl: '' })}
                  className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {project.clientLogoUrl && (
              <div className="rounded-lg border border-[#2B354B] bg-white p-2.5 flex items-center justify-center min-h-[50px]">
                <img
                  src={project.clientLogoUrl}
                  alt="Client Logo"
                  className="max-h-10 max-w-full object-contain"
                />
              </div>
            )}

            <label className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-[#1A202E] hover:bg-[#222B3D] text-[#CBD5E1] border border-[#2B354B] text-xs font-medium cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-[#8A94A6]" />
              <span>Upload Client Logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, true)}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {uploadSuccess && (
            <div className="p-2.5 rounded-lg bg-[#00D284]/15 border border-[#00D284]/35 text-[#00D284] text-[11px] flex items-center gap-2 font-medium">
              <Check className="w-3.5 h-3.5 text-[#00D284] shrink-0" />
              <span>Logo uploaded and saved to Firestore.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1E2638] bg-[#131823] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1D72FE] hover:bg-[#1862DE] text-white text-xs font-semibold transition cursor-pointer shadow-sm shadow-[#1D72FE]/25"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
