import React, { useState, useEffect } from 'react';
import { X, Printer, ShieldAlert } from 'lucide-react';
import { fetchDocumentBrandingSettingsFromSupabase, fetchCollegeByIdFromSupabase } from '../../services/supabaseService';
import { PharmDVerseBrandedDocumentContainer } from '../branding/PharmDVerseBrandedDocumentContainer';

export const PharmacistInterventionPDFPreviewModal = ({ isOpen, onClose, clinicalCase, student, interventionData }) => {
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

  const rxDetails = interventionData?.prescription_details || [];
  const rxProblems = Array.isArray(interventionData?.prescription_problems) ? interventionData.prescription_problems : (interventionData?.prescription_problems ? [interventionData.prescription_problems] : []);
  const actionsTaken = Array.isArray(interventionData?.action_taken) ? interventionData.action_taken : (interventionData?.action_taken ? [interventionData.action_taken] : []);
  const recommendations = Array.isArray(interventionData?.recommendations) ? interventionData.recommendations : (interventionData?.recommendations ? [interventionData.recommendations] : []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL ACTION BAR */}
        <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-extrabold tracking-tight">Pharmacist Intervention Documentation (2-Page A4 PDF Preview)</h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
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
          
          {/* ================= PAGE 1: PATIENT, DIAGNOSIS, RX DETAILS & PROBLEM DESCRIPTION ================= */}
          <PharmDVerseBrandedDocumentContainer
            college={college}
            branding={branding}
            documentTitle="Pharmacist Intervention Documentation"
            caseId={clinicalCase?.case_id}
            student={student}
            pageNumber="1 of 2"
            showSignatures={false}
          >
            {/* 1. PATIENT INFORMATION */}
            <div className="space-y-2 border border-slate-900 p-3 bg-slate-50/20 text-xs font-bold">
              <strong className="block uppercase border-b border-slate-900 pb-1 text-teal-900">1. Patient Information</strong>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>Patient Initials: <span className="underline">{interventionData?.patient_name || '—'}</span></div>
                <div>Age / Sex: <span className="underline">{interventionData?.age ? `${interventionData.age} yrs` : '—'} / {interventionData?.sex || '—'}</span></div>
                <div>Date of Intervention: <span className="font-mono underline">{interventionData?.date_of_intervention || '—'}</span></div>
                <div>IP/OP No: <span className="font-mono underline">{interventionData?.ip_op_no || '—'}</span></div>
                <div className="col-span-2">Ward / Unit: <span className="underline">{interventionData?.ward || '—'}</span></div>
                <div className="col-span-2">Department: <span className="underline">{clinicalCase?.department || '—'}</span></div>
              </div>
            </div>

            {/* 2. PRESENT DIAGNOSIS */}
            <div className="space-y-1 border border-slate-900 p-3 bg-slate-50/20 text-xs">
              <strong className="block uppercase font-bold text-teal-900 border-b border-slate-900 pb-1">2. Present Diagnosis</strong>
              <p className="p-2 border border-slate-900 bg-white font-serif font-bold">{interventionData?.present_diagnosis || 'N/A'}</p>
            </div>

            {/* 3. PRESCRIPTION DETAILS */}
            <div className="space-y-1 text-xs">
              <strong className="block uppercase font-bold border-b border-slate-900 pb-1 text-slate-900">3. Prescription Details</strong>
              <table className="w-full text-left border border-slate-900 border-collapse text-xs">
                <thead className="bg-slate-100 font-bold uppercase text-[10px] border-b border-slate-900">
                  <tr>
                    <th className="p-1.5 w-12 text-center border-r border-slate-900">S.No</th>
                    <th className="p-1.5 border-r border-slate-900">Name of the Drug</th>
                    <th className="p-1.5">Dose & Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-serif">
                  {rxDetails && rxDetails.length > 0 ? (
                    rxDetails.map((rx, i) => (
                      <tr key={i} className="border-b border-slate-900">
                        <td className="p-1.5 text-center font-mono font-bold border-r border-slate-900">{rx.s_no || i + 1}</td>
                        <td className="p-1.5 border-r border-slate-900 font-bold uppercase">{rx.drug_name}</td>
                        <td className="p-1.5 font-mono font-bold uppercase">{rx.dose_frequency || `${rx.dose || ''} ${rx.frequency || ''}`.trim()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="p-2 text-center italic text-slate-500">No prescription details recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 4. PRESCRIPTION PROBLEMS */}
            <div className="space-y-1 border border-slate-900 p-3 bg-slate-50/20 text-xs font-bold">
              <strong className="block uppercase border-b border-slate-900 pb-1 text-slate-900">4. Identified Prescription Problems</strong>
              <p className="underline text-indigo-900">{rxProblems.join(', ')} {interventionData?.prescription_problem_other ? `(${interventionData.prescription_problem_other})` : ''}</p>
            </div>

            {/* 5. DESCRIPTION OF PROBLEM */}
            <div className="space-y-1 border border-slate-900 p-3 bg-slate-50/20 text-xs">
              <strong className="block uppercase font-bold text-teal-900 border-b border-slate-900 pb-1">5. Description of Problem</strong>
              <p className="p-2 border border-slate-900 bg-white font-serif font-bold text-slate-900">
                {interventionData?.description_of_problem || 'N/A'}
              </p>
            </div>
          </PharmDVerseBrandedDocumentContainer>

          {/* ================= PAGE 2: ACTIONS, RECOMMENDATIONS, OUTCOME & SIGNATURES ================= */}
          <PharmDVerseBrandedDocumentContainer
            college={college}
            branding={branding}
            documentTitle="Pharmacist Intervention Documentation (Continued)"
            caseId={clinicalCase?.case_id}
            student={student}
            pageNumber="2 of 2"
            isLastPage={true}
          >
            {/* 6. ACTION TAKEN & 7. RECOMMENDATIONS */}
            <div className="grid grid-cols-2 gap-3 border border-slate-900 p-3 bg-slate-50/20 text-xs font-bold">
              <div>
                <strong className="block border-b border-slate-900 pb-1 uppercase text-slate-900">6. Action Taken</strong>
                <p className="underline font-normal text-slate-800">{actionsTaken.join(', ')} {interventionData?.action_taken_other ? `(${interventionData.action_taken_other})` : ''}</p>
              </div>

              <div>
                <strong className="block border-b border-slate-900 pb-1 uppercase text-slate-900">7. Recommendations</strong>
                <p className="underline font-normal text-slate-800">{recommendations.join(', ')} {interventionData?.recommendation_other ? `(${interventionData.recommendation_other})` : ''}</p>
              </div>
            </div>

            {/* 8. ACCEPTANCE & OUTCOME */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-900 p-3 bg-slate-50/30 text-xs font-bold">
              <div>Discussed with Physician: <span className="underline">{interventionData?.discussed_with_physician ? 'YES' : 'NO'}</span></div>
              <div>Suggestions at Right Time: <span className="underline">{interventionData?.suggestions_appropriate_time ? 'YES' : 'NO'}</span></div>
              <div>Accepted: <span className="underline text-emerald-800">{interventionData?.accepted ? 'YES' : 'NO'}</span></div>
              <div>Changed: <span className="underline text-emerald-800">{interventionData?.changed ? 'YES' : 'NO'}</span></div>
              <div>Significance: <span className="underline text-indigo-900">{interventionData?.significance_of_intervention || 'Moderate'}</span></div>
              <div>Outcome: <span className="underline text-emerald-800">{interventionData?.outcome || 'Positive'}</span></div>
            </div>

            {/* 9. FOLLOW-UP & REFERENCES */}
            {interventionData?.follow_up && (
              <div className="space-y-1 border border-slate-900 p-3 bg-slate-50/20 text-xs">
                <strong className="block uppercase font-bold border-b border-slate-900 pb-1">9. Follow-Up Notes</strong>
                <p className="p-2 border border-slate-900 bg-white font-serif">{interventionData.follow_up}</p>
              </div>
            )}

            {interventionData?.references_text && (
              <div className="space-y-1 border border-slate-900 p-3 bg-slate-50/20 text-xs font-serif">
                <strong className="block uppercase font-bold text-xs">References:</strong>
                <p className="italic">{interventionData.references_text}</p>
              </div>
            )}
          </PharmDVerseBrandedDocumentContainer>

        </div>

      </div>
    </div>
  );
};
