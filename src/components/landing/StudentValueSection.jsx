import React from 'react';
import { 
  FolderKanban, Activity, Brain, CheckCircle2, 
  Stethoscope, UserCheck, FileDown, Sparkles, ShieldCheck, GraduationCap
} from 'lucide-react';

export const StudentValueSection = () => {
  const valuePoints = [
    {
      title: "1. Structured Clinical Case Learning",
      description: "Create and organize complete clinical cases systematically instead of maintaining scattered notes and forms.",
      icon: FolderKanban,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800"
    },
    {
      title: "2. Understand Patient Data",
      description: "Bring patient history, laboratory investigations, other investigations and medications together in one clinical case.",
      icon: Activity,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-100/80 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800"
    },
    {
      title: "3. Build Clinical Reasoning",
      description: "Use laboratory interpretation, drug knowledge and AI-assisted case analysis as learning support.",
      icon: Brain,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-100/80 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800"
    },
    {
      title: "4. Improve & Export Documentation",
      description: "Pre-Submission Review identifies documentation gaps and generates organized PDF/PPT case files for academic use.",
      icon: FileDown,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-100/80 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800"
    },
    {
      title: "5. Develop Pharm.D Skills",
      description: "Practice ADR documentation, patient counselling and pharmacist interventions.",
      icon: Stethoscope,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100/80 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800"
    },
    {
      title: "6. Learn Through Preceptor Feedback",
      description: "Submit cases for structured preceptor review, correction and approval.",
      icon: UserCheck,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100/80 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800"
    }
  ];

  return (
    <section id="student-value" className="py-16 md:py-24 bg-slate-50 dark:bg-[#080d1a] border-y border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300 relative overflow-hidden">
      
      {/* Soft background ambient gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-500/5 via-teal-500/5 to-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full px-4 sm:px-8 lg:px-12 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300/70 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold tracking-wide shadow-xs">
            <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Pharm.D Academic & Clinical Excellence</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            From Case Learning to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 dark:from-emerald-400 dark:via-teal-300 dark:to-sky-400">Clinical Confidence</span>
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
            One platform to document, analyse, review and improve your Pharm.D clinical learning.
          </p>
        </div>

        {/* 7 Value Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {valuePoints.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-md backdrop-blur-sm flex flex-col justify-between space-y-4 group hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300"
              >
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} border flex items-center justify-center shrink-0 transform group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Highlighted Statement */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-sky-500/15 dark:from-slate-900 dark:via-slate-800/90 dark:to-teal-950/60 bg-white/95 dark:bg-slate-900/95 border border-emerald-200/80 dark:border-slate-700/60 text-center shadow-lg relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-4xl mx-auto">
            <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-relaxed">
              "PharmDVerse brings your Pharm.D clinical learning journey together — from patient case documentation to analysis, preceptor review and final case records."
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
