import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { usePlatform } from '../context/PlatformContext';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { LogoPreviewModal } from './modals/LogoPreviewModal';

export const Header = ({ onOpenPricing, onOpenContact }) => {
  const { isDark, toggleTheme } = useTheme() || {};
  const { platformSettings = {} } = usePlatform() || {};
  const [scrolled, setScrolled] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHomeClick = (e) => {
    setMobileMenuOpen(false);
    if (window.location.pathname !== '/') {
      e.preventDefault();
      window.location.href = '/';
    }
  };

  const platformName = platformSettings?.platform_name || 'PharmDVerse ERP';
  const logoUrl = platformSettings?.logo_url || '/pharmdverse-logo.png';

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#080d1a]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-3.5">
          <div className="flex items-center justify-between">
            
            {/* Left: Platform Logo */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setShowLogoModal(true)}
                className="relative flex items-center justify-center p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group focus:outline-none shrink-0"
                title="Click to view official logo"
              >
                <img
                  src={logoUrl}
                  alt={`${platformName} Logo`}
                  className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
                  onError={(e) => { e.target.src = '/pharmdverse-logo.png'; }}
                />
              </button>
              <a
                href="#hero"
                onClick={handleHomeClick}
                className="flex flex-col group focus:outline-none min-w-0"
              >
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none truncate">
                  {platformName}
                </span>
              </a>
            </div>

            {/* Center Navigation - Desktop Only */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-2 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-full border border-slate-200/60 dark:border-slate-800/80 backdrop-blur-md shadow-inner">
              <a
                href="#hero"
                onClick={handleHomeClick}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                Home
              </a>

              <a
                href="#workflow"
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                Workflow
              </a>

              <button
                onClick={onOpenPricing}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                Pricing
              </button>

              <button
                onClick={onOpenContact}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                Contact
              </button>
            </nav>

            {/* Right: Theme Toggle & Mobile Menu Trigger */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={toggleTheme}
                className="relative p-2 sm:px-3.5 sm:py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/80 dark:border-slate-700/80 focus:outline-none shadow-xs flex items-center gap-2 cursor-pointer group"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle Light and Dark Mode"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
                    <span className="text-xs font-semibold text-slate-200 hidden sm:inline">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-700 group-hover:-rotate-12 transition-transform" />
                    <span className="text-xs font-semibold text-slate-700 hidden sm:inline">Dark Mode</span>
                  </>
                )}
              </button>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors focus:outline-none cursor-pointer"
                title="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#080d1a]/95 backdrop-blur-lg px-4 py-4 space-y-2 animate-fadeIn shadow-lg">
            <a
              href="#hero"
              onClick={handleHomeClick}
              className="block px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Home
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Workflow
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPricing();
              }}
              className="w-full text-left block px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContact();
              }}
              className="w-full text-left block px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Contact
            </button>
          </div>
        )}
      </header>
      <LogoPreviewModal isOpen={showLogoModal} onClose={() => setShowLogoModal(false)} />
    </>
  );
};
