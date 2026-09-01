import React from 'react';
import { ModalWrapper } from './ModalWrapper';
import { usePlatform } from '../../context/PlatformContext';

export const LogoPreviewModal = ({ isOpen, onClose }) => {
  const { platformSettings } = usePlatform();
  const platformName = platformSettings?.platform_name || 'PharmDVerse';
  const logoUrl = platformSettings?.logo_url || '/pharmdverse-logo.png';
  const tagline = platformSettings?.platform_tagline || 'Clinical Documentation Platform';
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      hideDefaultHeader={true}
      rounded="rounded-3xl"
    >
      <div className="p-6 sm:p-8 bg-white text-center flex flex-col items-center justify-center relative">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors z-20 font-bold text-lg"
          title="Close"
          aria-label="Close dialog"
        >
          ✕
        </button>

        {/* ENLARGED HIGH QUALITY OFFICIAL LOGO */}
        <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm my-2">
          <img src={logoUrl}
            alt="PharmDVerse Official Logo"
            className="max-w-full max-h-full object-contain filter drop-shadow-md transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* OPTIONAL POPUP DETAILS */}
        <div className="mt-4 space-y-1">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            PharmD<span className="text-emerald-600">Verse</span>
          </h3>
          <p className="text-xs font-bold text-slate-600">
            Clinical Documentation Platform
          </p>
          <div className="pt-2">
            <span className="inline-block px-3.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-mono font-bold border border-slate-200">
              Version: Current Production Release
            </span>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
