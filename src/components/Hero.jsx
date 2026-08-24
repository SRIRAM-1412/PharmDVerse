import React from 'react';
import { useColleges } from '../context/CollegeContext';
import { usePlatform } from '../context/PlatformContext';
import { ShieldCheck, Check, MapPin, ExternalLink, Grid, Building2, ArrowRight } from 'lucide-react';

export const Hero = ({ onOpenPortal, onOpenAllColleges, onOpenRegisterModal }) => {
  const { activeColleges } = useColleges();
  const { platformSettings } = usePlatform();
  const featuredColleges = activeColleges.slice(0, 4);

  const platformName = platformSettings?.platform_name || 'PharmDVerse';
  const tagline = platformSettings?.tagline || 'Clinical Case Management Platform';

  return (
    <section id="hero" className="relative pt-20 pb-8 md:pt-24 md:pb-10 overflow-hidden">
      {/* Soft background ambient gradient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/10 via-sky-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full px-4 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Copy + 3 Badges + Register Your College Section */}
          <div className="lg:col-span-5 space-y-4 text-left">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold tracking-wide shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{tagline}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              Empowering Pharmacy Education Through{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 dark:from-emerald-400 dark:via-teal-300 dark:to-sky-400">
                Clinical Excellence
              </span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-xl">
              {platformName} is a cloud-based ERP platform built exclusively for pharmacy colleges to streamline clinical case documentation, academic management, preceptor collaboration, and institutional workflows through one secure platform.
            </p>

            {/* Display ONLY Three Badges Below Description */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs">
                <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                <span>Secure Cloud</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs">
                <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                <span>AI Ready</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs">
                <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                <span>Multi-College Platform</span>
              </div>
            </div>

            {/* REGISTER YOUR COLLEGE SECTION */}
            <div className="pt-2">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-sky-500/15 dark:from-slate-900 dark:via-slate-800/90 dark:to-teal-950/60 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white shadow-xl relative overflow-hidden border border-emerald-200/80 dark:border-slate-700/60 space-y-3">
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 space-y-2">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Register Your College Today
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    Digitize your pharmacy college with PharmDVerse and provide students, faculty, and preceptors with one unified clinical education platform.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={onOpenRegisterModal}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      <span>Register Your College</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Side: Active Pharmacy Colleges Grid */}
          <div className="lg:col-span-7">
            <div className="p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-sm">
              
              {/* Card Container Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Active Pharmacy Colleges
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    Select your college below to access its portal.
                  </p>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Portals
                </span>
              </div>

              {/* 4 Active Colleges Grid or Empty State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {featuredColleges.length === 0 ? (
                  <div className="py-12 px-4 text-center bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 col-span-full">
                    <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      No Active Pharmacy Colleges Available
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Registered pharmacy colleges will appear here once approved by Super Admin.
                    </p>
                  </div>
                ) : (
                  featuredColleges.map((college) => {
                    const locationText = [college.city, college.district, college.state]
                      .filter(Boolean)
                      .join(', ');

                    return (
                      <div
                        key={college.id}
                        className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                      >
                        <div>
                          {/* Top: Logo & Active Badge */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            {college.logoUrl ? (
                              <img
                                src={college.logoUrl}
                                alt={college.name}
                                className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 p-0.5 shadow-xs shrink-0 transform group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${college.logoBg || 'from-emerald-600 to-teal-700'} flex items-center justify-center text-white font-extrabold text-[11px] shadow-sm border border-white/20 shrink-0 transform group-hover:scale-105 transition-transform`}>
                                {college.initials}
                              </div>
                            )}

                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100/90 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {college.status || 'Active'}
                            </span>
                          </div>

                          {/* College Name */}
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 min-h-[36px]">
                            {college.name}
                          </h3>

                          {/* CITY NAME, DISTRICT, STATE NAME */}
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{locationText}</span>
                          </div>
                        </div>

                        {/* Open Portal Button */}
                        <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                          <button
                            onClick={() => onOpenPortal(college)}
                            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-emerald-600 dark:bg-slate-700 dark:hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                          >
                            <span>Open Portal</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* View All Colleges Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Looking for another pharmacy college portal?
                </span>
                <button
                  onClick={onOpenAllColleges}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
                >
                  <Grid className="w-3.5 h-3.5 text-emerald-500" />
                  <span>View All Colleges</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
