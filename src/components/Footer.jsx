import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { LogoPreviewModal } from './modals/LogoPreviewModal';

export const Footer = ({ onOpenInfoModal, onOpenSuperAdmin }) => {
  const { platformSettings } = usePlatform();
  const [showLogoModal, setShowLogoModal] = useState(false);

  const platformName = platformSettings?.platform_name || 'PharmDVerse';
  const logoUrl = platformSettings?.logo_url || '/pharmdverse-logo.png';
  const footerText = platformSettings?.footer_text || `© 2026 ${platformName}. All rights reserved.`;

  return (
    <>
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 pt-10 pb-6 transition-colors">
        <div className="w-full px-4 sm:px-8 lg:px-12">
          
          {/* Main Footer Links Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-slate-200/60 dark:border-slate-800/60">
            
            {/* Company Column */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Company
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => onOpenInfoModal('about')}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    About
                  </button>
                </li>
              </ul>
            </div>

            {/* Platform Column */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Platform
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => onOpenInfoModal('features')}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Features
                  </button>
                </li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Support
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => onOpenInfoModal('help')}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Help Center
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Legal
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => onOpenInfoModal('privacy')}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenInfoModal('terms')}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Terms & Conditions
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Info Bar & Super Admin Login Link at Bottom-Right */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            
            {/* Bottom Left: Logo & Copyright */}
            <div className="flex items-center gap-2">
              <img
                src={logoUrl}
                alt={`${platformName} Logo`}
                className="w-6 h-6 object-contain cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setShowLogoModal(true)}
                title="Click to view official logo"
                onError={(e) => { e.target.src = '/pharmdverse-logo.png'; }}
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">{footerText}</span>
            </div>

            {/* Bottom Center: Tagline */}
            <div className="flex items-center gap-2 italic text-slate-500 dark:text-slate-400 font-medium">
              <span>{platformSettings?.tagline || 'From Case Collection to Clinical Excellence'}</span>
            </div>

            {/* Bottom Right: Super Admin Login Link */}
            <div>
              <button
                onClick={onOpenSuperAdmin}
                className="text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors focus:outline-none"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
                <span>Super Admin Login</span>
              </button>
            </div>

          </div>

        </div>
      </footer>
      <LogoPreviewModal isOpen={showLogoModal} onClose={() => setShowLogoModal(false)} />
    </>
  );
};
