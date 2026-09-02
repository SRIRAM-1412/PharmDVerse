import React, { useEffect, useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { ShieldCheck } from 'lucide-react';

export const SplashScreen = ({ onComplete }) => {
  const { platformSettings } = usePlatform();
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start progress bar animation
    setTimeout(() => setProgress(100), 50);

    // Start fading out the entire screen at 1.8s
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1800);

    // Completely unmount splash screen at 2.2s (after 400ms fade duration)
    const removeTimer = setTimeout(() => {
      if (typeof onComplete === 'function') onComplete();
    }, 2200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []); // Run ONCE on mount to prevent infinite re-render loop

  const platformName = platformSettings?.platform_name || 'PharmDVerse';
  const logoUrl = platformSettings?.logo_url || '/pharmdverse-logo.png';
  const tagline = platformSettings?.tagline || 'Clinical Documentation Platform';

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center justify-center transform transition-transform duration-1000 scale-100">
        
        {/* LOGO BOX WITH GLOW & ENTRANCE ANIMATION */}
        <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center p-6 bg-white rounded-3xl shadow-xl shadow-indigo-900/5 mb-8 animate-[pulse_2s_ease-in-out_infinite] border border-slate-100 dark:border-slate-800">
          <img 
            src={logoUrl} 
            alt={`${platformName} Logo`} 
            className="max-w-full max-h-full object-contain drop-shadow-md"
          />
        </div>

        {/* PLATFORM NAME & TAGLINE */}
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight text-center px-4">
          {platformName}
        </h1>
        <p className="mt-3 text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase text-center px-4">
          {tagline}
        </p>

      </div>
      
      {/* LOADING PROGRESS INDICATOR AT BOTTOM */}
      <div className="absolute bottom-12 flex flex-col items-center space-y-4 w-full px-8">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <ShieldCheck className="w-4 h-4 animate-bounce" />
          <span className="text-xs font-bold tracking-widest uppercase opacity-80">
            Securing Workspace
          </span>
        </div>
        <div className="w-48 sm:w-64 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-[1700ms] ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
    </div>
  );
};
