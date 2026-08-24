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

          {/* Right Side: Enterprise Ecosystem & Live Metrics Gateway */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      PharmDVerse Enterprise Ecosystem
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    Real-time institutional workspace & clinical management gateway.
                  </p>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Platform
                </span>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Metric 1 */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Onboarded</span>
                  </div>
                  <strong className="text-2xl font-black text-slate-900 dark:text-white block">
                    {featuredColleges.length || 3}+
                  </strong>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block mt-0.5">
                    Pharmacy Colleges
                  </span>
                </div>

                {/* Metric 2 */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/80 to-indigo-50/50 dark:from-sky-950/40 dark:to-indigo-950/20 border border-sky-200/80 dark:border-sky-800/60 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-sky-700 dark:text-sky-400">Digital</span>
                  </div>
                  <strong className="text-2xl font-black text-slate-900 dark:text-white block">
                    100%
                  </strong>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block mt-0.5">
                    SOAP & ADR Records
                  </span>
                </div>

                {/* Metric 3 */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/80 to-emerald-50/50 dark:from-teal-950/40 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-800/60 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-teal-700 dark:text-teal-400">Security</span>
                  </div>
                  <strong className="text-2xl font-black text-slate-900 dark:text-white block">
                    SSL/TLS
                  </strong>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block mt-0.5">
                    Encrypted Gateway
                  </span>
                </div>
              </div>

              {/* Direct Action Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <strong className="block text-xs font-extrabold text-slate-900 dark:text-white">
                    Access Dedicated Pharmacy College Portals
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Select your college from our live directory below to enter your workspace.
                  </span>
                </div>

                <a
                  href="#active-colleges"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 shrink-0 flex items-center gap-1.5"
                >
                  <span>Select College Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
