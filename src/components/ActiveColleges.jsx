import React, { useState, useEffect } from 'react';
import { fetchActiveColleges } from '../data/collegesData';
import { MapPin, ExternalLink, Grid, Building } from 'lucide-react';

export const ActiveColleges = ({ onOpenPortal, onOpenAllColleges }) => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamic load from API service with limit of 4
    fetchActiveColleges(4).then((data) => {
      setColleges(data);
      setLoading(false);
    });
  }, []);

  return (
    <section className="py-10 md:py-12 relative">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Active Pharmacy Colleges
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Select your college below to access its portal.
          </p>
        </div>

        {/* 4 Active Colleges Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse h-48 border border-slate-200/50 dark:border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {colleges.map((college) => (
              <div
                key={college.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Row: Logo & Active Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${college.logoBg} flex items-center justify-center text-white font-extrabold text-xs shadow-md border border-white/20 shrink-0 transform group-hover:scale-105 transition-transform`}>
                      {college.initials}
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </div>

                  {/* College Name & State */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 min-h-[40px]">
                    {college.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{college.state}</span>
                  </div>
                </div>

                {/* Open Portal Button */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => onOpenPortal(college)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <span>Open Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Colleges Button */}
        <div className="text-center mt-8">
          <button
            onClick={onOpenAllColleges}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
          >
            <Grid className="w-3.5 h-3.5 text-emerald-500" />
            <span>View All Colleges</span>
          </button>
        </div>

      </div>
    </section>
  );
};
