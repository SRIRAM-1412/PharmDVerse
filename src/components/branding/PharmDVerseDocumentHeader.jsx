import React, { useState, useEffect } from 'react';
import { fetchCollegeByIdFromSupabase } from '../../services/supabaseService';

export const PharmDVerseDocumentHeader = ({ college: initialCollege, branding, documentTitle, caseId, status = 'APPROVED' }) => {
  const [currentCollege, setCurrentCollege] = useState(initialCollege);

  useEffect(() => {
    setCurrentCollege(initialCollege);
  }, [initialCollege]);

  // LIVE SYNCHRONIZATION FOR COLLEGE IDENTITY (AUTONOMOUS STATUS, LOGOS, NAMES)
  useEffect(() => {
    const handleCollegeUpdated = (e) => {
      if (e.detail) {
        setCurrentCollege(e.detail);
      }
    };

    window.addEventListener('pharmdverse_college_updated', handleCollegeUpdated);
    return () => window.removeEventListener('pharmdverse_college_updated', handleCollegeUpdated);
  }, []);

  // ALSO FETCH FRESH COLLEGE RECORD DIRECTLY FROM SUPABASE IF ID EXISTS
  useEffect(() => {
    const fetchFreshCollege = async () => {
      if (initialCollege?.id) {
        const res = await fetchCollegeByIdFromSupabase(initialCollege.id);
        if (res.success && res.college) {
          setCurrentCollege(res.college);
        }
      }
    };
    fetchFreshCollege();
  }, [initialCollege?.id]);

  const showCollegeLogo = branding?.show_college_logo ?? true;
  const showCollegeName = branding?.show_college_name ?? true;
  const showAutonomous = branding?.show_autonomous ?? true;
  const showHospitalLogo = branding?.show_hospital_logo ?? true;
  const showHospitalName = branding?.show_hospital_name ?? true;

  const collegeName = currentCollege?.college_name || currentCollege?.name || 'Pharmacy College';
  const collegeLogoUrl = currentCollege?.college_logo_url || currentCollege?.logoUrl || currentCollege?.logo_url;
  const hospitalName = currentCollege?.hospital_name || currentCollege?.hospitalName || currentCollege?.primary_hospital_name || 'Primary Teaching Hospital';
  const hospitalLogoUrl = currentCollege?.hospital_logo_url || currentCollege?.hospitalLogoUrl;
  
  // SINGLE SOURCE OF TRUTH FOR AUTONOMOUS STATUS
  const isAutonomous = Boolean(currentCollege?.is_autonomous ?? currentCollege?.isAutonomous);

  const displayStatus = String(status || 'APPROVED').toUpperCase();

  return (
    <div className="space-y-2 mb-6 text-slate-900 font-serif">
      
      {/* HEADER ROW 1 */}
      <div className="border-2 border-slate-900 p-2.5 sm:p-3 text-center flex items-center justify-between min-h-[80px] relative gap-2">
        
        {/* LEFT: COLLEGE LOGO */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
          {showCollegeLogo && collegeLogoUrl ? (
            <img src={collegeLogoUrl} alt={collegeName} className="max-w-12 max-h-12 sm:max-w-14 sm:max-h-14 object-contain" />
          ) : null}
        </div>

        {/* CENTER: COLLEGE NAME (SINGLE LINE), AUTONOMOUS, HOSPITAL NAME */}
        <div className="flex-1 text-center px-1 sm:px-3 space-y-0.5 min-w-0">
          {showCollegeName && (
            <h1 className="branded-title font-black uppercase tracking-tight leading-tight text-center">
              {collegeName}
            </h1>
          )}

          {showAutonomous && isAutonomous && (
            <div className="text-[10px] sm:text-xs font-bold italic text-indigo-900 tracking-wide">
              (Autonomous)
            </div>
          )}

          {showHospitalName && (
            <h2 className="text-[11px] sm:text-xs md:text-sm font-extrabold uppercase text-slate-800 tracking-wider text-center">
              {hospitalName}
            </h2>
          )}
        </div>

        {/* RIGHT: HOSPITAL LOGO */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
          {showHospitalLogo && hospitalLogoUrl ? (
            <img src={hospitalLogoUrl} alt={hospitalName} className="max-w-12 max-h-12 sm:max-w-14 sm:max-h-14 object-contain" />
          ) : null}
        </div>

      </div>

      {/* HEADER ROW 2 */}
      <div className={`flex items-start text-xs font-extrabold font-mono border-b-2 border-slate-900 pb-1.5 px-1 gap-2 ${documentTitle ? 'justify-between' : 'justify-end'}`}>
        {documentTitle && (
          <span className="font-serif font-black uppercase tracking-wider text-slate-900 text-xs sm:text-sm truncate max-w-[65%] self-center">
            {documentTitle}
          </span>
        )}
        <div className="flex flex-col items-end shrink-0 text-right">
          <span className="text-slate-900 text-xs sm:text-sm font-mono font-black whitespace-nowrap">
            (CASE ID: {caseId || 'CLG-2026-000001'})
          </span>
          <span className="text-[11px] sm:text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mt-0.5">
            {displayStatus}
          </span>
        </div>
      </div>

    </div>
  );
};
