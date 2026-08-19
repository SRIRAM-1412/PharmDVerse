import React, { useState, useEffect } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { fetchDocumentBrandingSettingsFromSupabase, fetchCollegeByIdFromSupabase } from '../../services/supabaseService';
import { PharmDVerseBrandedDocumentContainer } from '../branding/PharmDVerseBrandedDocumentContainer';

export const PatientProfilePDFPreviewModal = ({ isOpen, onClose, clinicalCase, student, profile, labInvestigations, prescribedDrugs }) => {
  const [branding, setBranding] = useState(null);
  const [college, setCollege] = useState(student?.colleges);

  useEffect(() => {
    const loadBrandingAndCollege = async () => {
      if (student?.college_id) {
        const [brandingRes, collegeRes] = await Promise.all([
          fetchDocumentBrandingSettingsFromSupabase(student.college_id),
          fetchCollegeByIdFromSupabase(student.college_id)
        ]);

        if (brandingRes.success && brandingRes.settings) {
          setBranding(brandingRes.settings);
        }
        if (collegeRes.success && collegeRes.college) {
          setCollege(collegeRes.college);
        }
      }
    };
    if (isOpen) loadBrandingAndCollege();
  }, [isOpen, student]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const patientName = profile?.patient_name || profile?.patient_initials || '—';
  const ageStr = profile?.age ? `${profile.age} yrs` : '—';
  const sexStr = profile?.gender || '—';
  const ipNo = profile?.ip_no || profile?.ip_op_number || '—';
  const heightStr = profile?.height || profile?.height_cm || '—';
  const weightStr = profile?.weight || profile?.weight_kg || '—';
  const bmiStr = profile?.bmi || '—';
  const wardStr = profile?.ward || profile?.ward_unit || '—';
  const deptStr = profile?.department || '—';
  const doaStr = profile?.doa || profile?.date_of_admission || '—';
  const docStr = profile?.doc || profile?.date_of_collection || '—';
  const dodStr = profile?.dod || profile?.date_of_discharge || '—';
  const physicianStr = profile?.physician || profile?.attending_physician || '—';

  const vitalList = profile?.vital_signs && Array.isArray(profile.vital_signs) && profile.vital_signs.length > 0
    ? profile.vital_signs
    : [{
        date: new Date().toISOString().split('T')[0],
        temp: profile?.temperature_f || '—',
        bp: profile?.bp_sys ? `${profile.bp_sys}/${profile.bp_dia}` : '—',
        pr: profile?.pulse_rate || '—',
        rr: profile?.respiratory_rate || '—',
        spo2: profile?.spo2 || '—'
      }];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL ACTION BAR */}
        <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-extrabold tracking-tight">Patient Documentation Form (Official 3-Page A4 PDF Preview)</h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MULTI-PAGE PDF DOCUMENT WRAPPER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 font-serif text-slate-900 space-y-8 print:p-0 print:bg-white">
          
          {/* ================= PAGE 1: PATIENT DETAILS, HISTORIES, SOCIAL, PHYSICAL EXAM & VITALS ================= */}
          <PharmDVerseBrandedDocumentContainer
            college={college}
            branding={branding}
            documentTitle="PATIENT DOCUMENTATION FORM"
            caseId={clinicalCase?.case_id}
            student={student}
            pageNumber="1 of 3"
            showSignatures={false}
          >
            {/* 1. PATIENT DETAILS GRID TABLE */}
            <div className="space-y-1">
              <strong className="block font-bold text-xs uppercase text-slate-900">Patient details:</strong>
              <table className="w-full text-left border border-slate-900 border-collapse text-[11px]">
                <tbody className="divide-y divide-slate-900 font-serif">
                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 border-r border-slate-900">Name: <strong className="font-bold underline">{patientName}</strong></td>
                    <td className="p-1.5 border-r border-slate-900">Age/ Sex: <strong className="font-bold underline">{ageStr} / {sexStr}</strong></td>
                    <td className="p-1.5 border-r border-slate-900">I.P No: <strong className="font-mono font-bold underline">{ipNo}</strong></td>
                    <td className="p-1.5 border-r border-slate-900">Height: <strong className="font-mono font-bold underline">{heightStr}</strong></td>
                    <td className="p-1.5 border-r border-slate-900">Weight: <strong className="font-mono font-bold underline">{weightStr}</strong></td>
                    <td className="p-1.5">BMI: <strong className="font-mono font-bold underline">{bmiStr}</strong></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border-r border-slate-900">Ward: <strong className="font-bold underline">{wardStr}</strong></td>
                    <td className="p-1.5 border-r border-slate-900">Dept: <strong className="font-bold underline">{deptStr}</strong></td>
                    <td className="p-1.5 border-r border-slate-900">DOA: <strong className="font-mono font-bold underline">{doaStr}</strong></td>
                    <td className="p-1.5 border-r border-slate-900">DOC: <strong className="font-mono font-bold underline">{docStr}</strong></td>
                    <td className="p-1.5 border-r border-slate-900">DOD: <strong className="font-mono font-bold underline">{dodStr}</strong></td>
                    <td className="p-1.5">Physician: <strong className="font-bold underline">{physicianStr}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CHIEF COMPLAINTS */}
            <div className="space-y-1">
              <strong className="block font-bold text-xs uppercase border-b border-slate-900 pb-0.5">Chief Complaints:</strong>
              <p className="p-2 border border-slate-900 bg-slate-50/30 min-h-[40px] font-serif font-bold text-slate-900">
                {profile?.chief_complaints || 'N/A'}
              </p>
            </div>

            {/* PAST MEDICAL HISTORY */}
            <div className="space-y-1">
              <strong className="block font-bold text-xs uppercase border-b border-slate-900 pb-0.5">Past Medical History:</strong>
              <p className="p-2 border border-slate-900 bg-slate-50/30 min-h-[40px] font-serif italic">
                {profile?.past_medical_history || profile?.history_of_present_illness || 'N/A'}
              </p>
            </div>

            {/* PAST MEDICATION HISTORY */}
            <div className="space-y-1">
              <strong className="block font-bold text-xs uppercase border-b border-slate-900 pb-0.5">Past Medication History:</strong>
              <p className="p-2 border border-slate-900 bg-slate-50/30 min-h-[40px] font-serif italic">
                {profile?.past_medication_history || 'N/A'}
              </p>
            </div>

            {/* FAMILY MEDICAL HISTORY */}
            <div className="space-y-1">
              <strong className="block font-bold text-xs uppercase border-b border-slate-900 pb-0.5">Family Medical History:</strong>
              <p className="p-2 border border-slate-900 bg-slate-50/30 min-h-[36px] font-serif italic">
                {profile?.family_history || 'N/A'}
              </p>
            </div>

            {/* SOCIAL HISTORY TABLE */}
            <div className="space-y-1">
              <strong className="block font-bold text-xs uppercase border-b border-slate-900 pb-0.5">Social history:</strong>
              <table className="w-full text-left border border-slate-900 border-collapse text-[11px]">
                <tbody className="divide-y divide-slate-900 font-serif">
                  <tr>
                    <td className="p-2 border-r border-slate-900 w-1/4 align-top">
                      <strong className="block border-b border-slate-900 pb-0.5">Smoker:</strong>
                      <div>Pack/day: <span className="underline font-bold">{profile?.smoker_pack_day || '—'}</span></div>
                      <div>Duration: <span className="underline font-bold">{profile?.smoker_duration || '—'}</span></div>
                    </td>
                    <td className="p-2 border-r border-slate-900 w-1/4 align-top">
                      <strong className="block border-b border-slate-900 pb-0.5">Alcoholic:</strong>
                      <div>Amount/day: <span className="underline font-bold">{profile?.alcoholic_amount_day || '—'}</span></div>
                      <div>Duration: <span className="underline font-bold">{profile?.alcoholic_duration || '—'}</span></div>
                    </td>
                    <td className="p-2 border-r border-slate-900 w-1/4 align-top">
                      <strong className="block border-b border-slate-900 pb-0.5">Allergies:</strong>
                      <div>Food: <span className="underline font-bold">{profile?.allergy_food || 'None'}</span></div>
                      <div>Drugs: <span className="underline font-bold text-rose-800">{profile?.allergy_drugs || profile?.allergies || 'None'}</span></div>
                    </td>
                    <td className="p-2 w-1/4 align-top">
                      <strong className="block border-b border-slate-900 pb-0.5">Marital status:</strong>
                      <span className="font-bold underline text-slate-900">{profile?.marital_status || 'Single'}</span>
                      {profile?.personal_social_history && (
                        <p className="text-[10px] italic mt-1">{profile.personal_social_history}</p>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PHYSICAL EXAMINATION */}
            <div className="space-y-2 border border-slate-900 p-2.5 bg-slate-50/20 text-xs">
              <strong className="block uppercase font-bold border-b border-slate-900 pb-1 text-center">Physical Examination</strong>
              <div className="grid grid-cols-3 gap-2 font-bold text-center border-b border-slate-400 pb-1">
                <div>Cyanosis: <span className="underline">{profile?.cyanosis || 'Absent'}</span></div>
                <div>Icterus: <span className="underline">{profile?.icterus || 'Absent'}</span></div>
                <div>Pallor: <span className="underline">{profile?.pallor || 'Absent'}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2 font-serif pt-1">
                <div>CVS: <span className="underline font-bold">{profile?.cvs || 'Normal'}</span></div>
                <div>GI: <span className="underline font-bold">{profile?.gi || 'Normal'}</span></div>
                <div>RS: <span className="underline font-bold">{profile?.rs || 'Normal'}</span></div>
                <div>CNS: <span className="underline font-bold">{profile?.cns || 'Normal'}</span></div>
              </div>
              {profile?.systemic_examination && (
                <p className="p-1.5 border border-slate-300 bg-white font-serif text-[11px]">{profile.systemic_examination}</p>
              )}
            </div>

            {/* PROVISIONAL DIAGNOSIS */}
            <div className="space-y-1">
              <strong className="block font-bold text-xs uppercase border-b border-slate-900 pb-0.5">Provisional Diagnosis:</strong>
              <p className="p-2 border border-slate-900 bg-white font-serif font-bold text-slate-900">
                {profile?.provisional_diagnosis || 'N/A'}
              </p>
            </div>

            {/* VITAL SIGNS TABLE */}
            <div className="space-y-1">
              <strong className="block font-bold text-xs uppercase border-b border-slate-900 pb-0.5">Vital Signs:</strong>
              <table className="w-full text-left border border-slate-900 border-collapse text-[11px]">
                <thead className="bg-slate-100 font-bold uppercase text-[9px] border-b border-slate-900 text-center">
                  <tr>
                    <th className="p-1 border-r border-slate-900">Date</th>
                    <th className="p-1 border-r border-slate-900">TEMP [°F]</th>
                    <th className="p-1 border-r border-slate-900">BP [mmHg]</th>
                    <th className="p-1 border-r border-slate-900">PR [bpm]</th>
                    <th className="p-1 border-r border-slate-900">RR [cpm]</th>
                    <th className="p-1">SPO2 [%]</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-mono text-center">
                  {vitalList.map((v, i) => (
                    <tr key={i} className="border-b border-slate-900">
                      <td className="p-1 border-r border-slate-900 font-bold">{v.date || '—'}</td>
                      <td className="p-1 border-r border-slate-900">{v.temp || '—'}</td>
                      <td className="p-1 border-r border-slate-900 font-bold">{v.bp || '—'}</td>
                      <td className="p-1 border-r border-slate-900">{v.pr || '—'}</td>
                      <td className="p-1 border-r border-slate-900">{v.rr || '—'}</td>
                      <td className="p-1 font-bold">{v.spo2 || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PharmDVerseBrandedDocumentContainer>

          {/* ================= PAGE 2: LAB INVESTIGATIONS ================= */}
          <PharmDVerseBrandedDocumentContainer
            college={college}
            branding={branding}
            documentTitle="PATIENT DOCUMENTATION FORM (Continued)"
            caseId={clinicalCase?.case_id}
            student={student}
            pageNumber="2 of 3"
            showSignatures={false}
          >
            <div className="space-y-1">
              <strong className="block font-bold text-center text-sm uppercase border-b-2 border-slate-900 pb-1">
                LAB INVESTIGATIONS
              </strong>

              <table className="w-full text-left border-2 border-slate-900 border-collapse text-xs">
                <thead className="bg-slate-100 font-bold uppercase text-[10px] border-b border-slate-900">
                  <tr>
                    <th className="p-1.5 border-r border-slate-900">Category</th>
                    <th className="p-1.5 border-r border-slate-900">Parameter / Date</th>
                    <th className="p-1.5 border-r border-slate-900">Value</th>
                    <th className="p-1.5 border-r border-slate-900">Unit</th>
                    <th className="p-1.5">Ref Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-serif">
                  {labInvestigations && labInvestigations.length > 0 ? (
                    labInvestigations.map((lab, i) => (
                      <tr key={i} className="border-b border-slate-900">
                        <td className="p-1.5 border-r border-slate-900 font-bold text-indigo-950">{lab.category}</td>
                        <td className="p-1.5 border-r border-slate-900 font-semibold">{lab.parameter_name}</td>
                        <td className="p-1.5 border-r border-slate-900 font-mono font-bold text-indigo-900">{lab.test_value || '—'}</td>
                        <td className="p-1.5 border-r border-slate-900 font-mono">{lab.unit || '—'}</td>
                        <td className="p-1.5 font-mono text-[11px]">{lab.reference_range || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="p-3 text-center italic text-slate-500">No laboratory investigations recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </PharmDVerseBrandedDocumentContainer>

          {/* ================= PAGE 3: OTHER INVESTIGATIONS, FINAL DIAGNOSIS, DRUGS PRESCRIBED & SIGNATURES ================= */}
          <PharmDVerseBrandedDocumentContainer
            college={college}
            branding={branding}
            documentTitle="PATIENT DOCUMENTATION FORM (Continued)"
            caseId={clinicalCase?.case_id}
            student={student}
            pageNumber="3 of 3"
            isLastPage={true}
          >
            {/* OTHER INVESTIGATIONS */}
            <div className="space-y-1">
              <strong className="block font-bold text-xs uppercase border-b border-slate-900 pb-0.5">Other Investigations:</strong>
              <p className="p-2 border border-slate-900 bg-white font-serif min-h-[50px]">
                {profile?.other_investigations || 'N/A'}
              </p>
            </div>

            {/* FINAL DIAGNOSIS */}
            <div className="space-y-1">
              <strong className="block font-bold text-xs uppercase border-b border-slate-900 pb-0.5">Final Diagnosis:</strong>
              <p className="p-2.5 border-2 border-slate-900 bg-slate-50/50 font-serif font-bold text-slate-900 min-h-[50px]">
                {profile?.final_diagnosis || 'N/A'}
              </p>
            </div>

            {/* DRUGS PRESCRIBED TABLE */}
            <div className="space-y-1">
              <strong className="block font-bold text-xs uppercase border-b border-slate-900 pb-0.5">Drugs prescribed:</strong>
              <table className="w-full text-left border-2 border-slate-900 border-collapse text-xs">
                <thead className="bg-slate-100 font-bold uppercase text-[10px] border-b border-slate-900">
                  <tr>
                    <th className="p-1.5 border-r border-slate-900 text-center w-10">S.no</th>
                    <th className="p-1.5 border-r border-slate-900">Trade Name</th>
                    <th className="p-1.5 border-r border-slate-900">Generic Name</th>
                    <th className="p-1.5 border-r border-slate-900 text-center">R.O. A</th>
                    <th className="p-1.5 border-r border-slate-900 text-center">Dose</th>
                    <th className="p-1.5 border-r border-slate-900 text-center">FRQ</th>
                    <th className="p-1.5 border-r border-slate-900 text-center">Start Date</th>
                    <th className="p-1.5 text-center">Stop Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-serif">
                  {prescribedDrugs && prescribedDrugs.length > 0 ? (
                    prescribedDrugs.map((d, i) => (
                      <tr key={i} className="border-b border-slate-900">
                        <td className="p-1.5 border-r border-slate-900 font-mono text-center font-bold">{d.s_no || i + 1}</td>
                        <td className="p-1.5 border-r border-slate-900 font-bold text-slate-900">{d.trade_name || '—'}</td>
                        <td className="p-1.5 border-r border-slate-900 italic">{d.generic_name || '—'}</td>
                        <td className="p-1.5 border-r border-slate-900 text-center">{d.route_of_admin || 'Oral'}</td>
                        <td className="p-1.5 border-r border-slate-900 font-mono text-center font-bold">{d.dose || '—'}</td>
                        <td className="p-1.5 border-r border-slate-900 text-center font-bold">{d.frequency || 'OD'}</td>
                        <td className="p-1.5 border-r border-slate-900 font-mono text-[10px] text-center">{d.start_date || '—'}</td>
                        <td className="p-1.5 font-mono text-[10px] text-center">{d.stop_date || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={8} className="p-3 text-center italic text-slate-500">No prescribed drugs recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* DISCHARGE SUMMARY */}
            <div className="space-y-1">
              <strong className="block font-bold text-xs uppercase border-b border-slate-900 pb-0.5">Discharge Summary:</strong>
              <p className="p-3 border border-slate-900 bg-white font-serif min-h-[80px]">
                {profile?.discharge_summary || 'N/A'}
              </p>
            </div>
          </PharmDVerseBrandedDocumentContainer>

        </div>

      </div>
    </div>
  );
};
