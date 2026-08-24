import React, { useState, useEffect } from 'react';
import { Building2, Stethoscope, UserCheck, ShieldCheck, ExternalLink, ArrowLeft, MapPin, CheckCircle2, Globe, LogIn, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { LogoPreviewModal } from '../modals/LogoPreviewModal';

export const CollegePortalView = ({ college: rawCollege, onBackToLanding, onOpenAdminLogin, onOpenPreceptorLogin, onOpenStudentLogin }) => {
  const { isDark, toggleTheme } = useTheme();
  const [showLogoModal, setShowLogoModal] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [rawCollege]);

  if (!rawCollege) return null;

  const college = {
    ...rawCollege,
    name: rawCollege.name || rawCollege.college_name || 'Pharmacy College',
    code: rawCollege.code || rawCollege.college_code || 'CLG',
    description: rawCollege.description || rawCollege.college_description || '',
    logoUrl: rawCollege.logoUrl || rawCollege.college_logo_url || '',
    logoBg: rawCollege.logoBg || 'from-emerald-500 to-teal-600',
    initials: rawCollege.initials || (rawCollege.name || rawCollege.college_name || 'CLG').substring(0, 3).toUpperCase(),
    city: rawCollege.city || '',
    state: rawCollege.state || '',
    district: rawCollege.district || '',
    websiteUrl: rawCollege.websiteUrl || rawCollege.website_url || `https://${(rawCollege.code || rawCollege.college_code || 'clg').toLowerCase()}.pharmdverse.com`,
    status: rawCollege.status || 'Active'
  };

  const baseUrl = college.websiteUrl || `https://${(college.code || 'clg').toLowerCase()}.pharmdverse.com`;
  const locationText = [college.city, college.district, college.state].filter(Boolean).join(', ');

  const logins = [
    {
      id: 'admin',
      name: 'College Admin Login',
      subtitle: 'Institutional Administration & Governance',
      description: 'Central management login for Principal, HODs, Academic Coordinators, and Institutional Admin to manage faculty, students, and hospital affiliations.',
      icon: Building2,
      onOpen: () => onOpenAdminLogin(college),
      badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      id: 'preceptor',
      name: 'Preceptor Login',
      subtitle: 'Clinical Evaluators & Hospital Doctors',
      description: 'Dedicated evaluation login workspace for Hospital Doctors, Ward Preceptors, and Clinical Faculty to review student patient cases, logbooks, and ward rounds.',
      icon: Stethoscope,
      onOpen: () => onOpenPreceptorLogin(college),
      badgeBg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      btnBg: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-600/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400'
    },
    {
      id: 'student',
      name: 'Student Login',
      subtitle: 'PharmD Candidates & Interns (1st - 6th Year)',
      description: 'Comprehensive digital logbook login for PharmD students to document clinical cases, SOAP notes, drug interactions, ADR reports, and ward round activities.',
      icon: UserCheck,
      onOpen: () => onOpenStudentLogin(college),
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-300">
        
        {/* 1. TOP HEADER NAVIGATION */}
        <header className="h-16 px-4 sm:px-8 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <img src="/pharmdverse-logo.png" alt="PharmDVerse" className="w-6 h-6 object-contain cursor-pointer hover:scale-105 transition-transform shrink-0" onClick={() => setShowLogoModal(true)} title="Click to view official logo" />
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              PharmD<span className="text-emerald-600 dark:text-emerald-400">Verse</span>
              <span className="text-[10px] text-slate-400 font-normal ml-1.5 hidden md:inline">Cloud Gateway</span>
            </span>
          </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden sm:inline-flex text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {college.code}
          </span>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            title="Toggle Light/Dark Mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          <button
            onClick={onBackToLanding}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors shrink-0 cursor-pointer"
          >
            <span className="hidden sm:inline">Main </span>Landing Page
          </button>
        </div>
      </header>

      {/* 2. MAIN DEDICATED COLLEGE LANDING CONTENT */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-12 space-y-10">
        
        {/* COLLEGE BRANDING HERO BANNER */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/70 dark:from-[#0f172a] dark:via-slate-900 dark:to-emerald-950/40 text-slate-900 dark:text-white relative overflow-hidden shadow-md border border-slate-200/80 dark:border-slate-800">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start gap-6 relative z-10">
            
            {/* Logo Image or Initials Placeholder */}
            {college.logoUrl ? (
              <img
                src={college.logoUrl}
                alt={college.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-contain bg-white p-2 border-2 border-emerald-400/60 shadow-md shrink-0"
              />
            ) : (
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${college.logoBg || 'from-emerald-500 to-teal-600'} flex items-center justify-center text-white font-extrabold text-xl shadow-md border-2 border-emerald-400/60 shrink-0`}>
                {college.initials}
              </div>
            )}

            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {college.status || 'Active'} Login Portal
                </span>

                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                  Code: {college.code}
                </span>
              </div>

              {/* SINGLE CLEAN COLLEGE NAME */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {college.name}
              </h1>

              {/* Dynamic College Description */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal max-w-3xl">
                {college.description ? college.description : 'No college description available.'}
              </p>

              {/* Location Badge */}
              <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{locationText}</span>
                </div>

                <span>•</span>

                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="font-mono text-emerald-300">{baseUrl}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 3 LOGIN GATEWAYS SECTION */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <LogIn className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span>Select Dedicated Login Gateway</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Choose your role below to log in to {college.name}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {logins.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-xs">
                        <IconComponent className={`w-6 h-6 ${item.iconColor}`} />
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${item.badgeBg}`}>
                        Login
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                        {item.subtitle}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={item.onOpen}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md transform hover:-translate-y-0.5 ${item.btnBg}`}
                    >
                      <span>{item.name}</span>
                      <LogIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECURITY NOTICE BAR */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <strong className="block font-bold text-slate-900 dark:text-white">
                SSL Encryption Enabled
              </strong>
              <span className="text-slate-500 dark:text-slate-400">
                All portal communications are secured using HTTPS with industry-standard SSL/TLS encryption.
              </span>
            </div>
          </div>

          <a
            href={baseUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Direct Domain</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </main>

      {/* 3. CLEAN FOOTER */}
      <footer className="py-6 px-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© 2026 PharmDVerse. Dedicated Gateway for {college.name}. All rights reserved.</p>
      </footer>

    </div>
    <LogoPreviewModal isOpen={showLogoModal} onClose={() => setShowLogoModal(false)} />
    </>
  );
};
