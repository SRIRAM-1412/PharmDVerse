import React, { useState, useEffect } from 'react';
import { X, Printer, FileSearch } from 'lucide-react';
import { fetchDocumentBrandingSettingsFromSupabase } from '../../services/supabaseService';
import { PharmDVerseBrandedDocumentContainer } from '../branding/PharmDVerseBrandedDocumentContainer';

export const DrugInformationPDFPreviewModal = ({ isOpen, onClose, clinicalCase, student, dirData }) => {
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    const loadBranding = async () => {
      if (student?.college_id) {
        const res = await fetchDocumentBrandingSettingsFromSupabase(student.college_id);
        if (res.success && res.settings) {
          setBranding(res.settings);
        }
      }
    };
    if (isOpen) loadBranding();
  }, [isOpen, student]);

  if (!isOpen) return null;

  const college = student?.colleges;

  const ALL_PROFESSIONAL_STATUS = [
    'Physician', 'Surgeon', 'Resident', 'Interns', 'Pharmacist', 'Nurse', 'Others'
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL ACTION BAR */}
        <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-extrabold tracking-tight">Drug Information Request Form (2-Page A4 PDF Preview)</h3>
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
          
          {/* ================= PAGE 1: REQUESTER & ENQUIRY DETAILS ================= */}
          <PharmDVerseBrandedDocumentContainer
            college={college}
            branding={branding}
            documentTitle="Drug Information Request Documentation"
            caseId={clinicalCase?.case_id}
            student={student}
            pageNumber="1 of 2"
            showSignatures={false}
          >
            {/* DATE & TIME & ENQUIRER DETAILS */}
            <div className="space-y-2 border border-slate-900 p-3 bg-slate-50/20 text-xs">
              <div className="flex justify-between font-bold border-b border-slate-900 pb-2">
                <span>DATE: <span className="font-mono underline">{dirData?.request_date || '—'}</span></span>
                <span>Time: <span className="font-mono underline">{dirData?.request_time || '—'}</span></span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 font-bold">
                <div>Name of the Enquirer: <span className="underline font-extrabold">{dirData?.enquirer_name || '—'}</span></div>
                <div>Designation: <span className="underline">{dirData?.designation || '—'}</span></div>
                <div>Phone NO: <span className="font-mono underline">{dirData?.phone_no || '—'}</span></div>
                <div>Unit/Ward: <span className="underline">{dirData?.unit_ward || '—'}</span></div>
              </div>

              <div className="pt-2 border-t border-slate-900">
                <strong className="block mb-1">Professional Status:</strong>
                <div className="grid grid-cols-3 gap-1 font-serif">
                  {ALL_PROFESSIONAL_STATUS.map((st, i) => (
                    <span key={i}>
                      {dirData?.professional_status === st ? '[ ✓ ]' : '[  ]'} {st}
                    </span>
                  ))}
                  {dirData?.professional_status_other && (
                    <span className="col-span-3 italic">Other: {dirData.professional_status_other}</span>
                  )}
                </div>
              </div>
            </div>

            {/* MODE OF REQUEST & TIMELINE & ENQUIRY DETAILS */}
            <div className="space-y-3 border border-slate-900 p-3 bg-slate-50/20 text-xs">
              <div className="flex justify-between font-bold">
                <span>Mode of Request: <span className="underline">{dirData?.mode_of_request || 'Direct'}</span></span>
                <span>Answer Needed: <span className="underline">{dirData?.answer_needed || 'Immediately'}</span></span>
              </div>

              <div>
                <strong className="block font-serif uppercase font-bold">Details of Enquiry (Question):</strong>
                <p className="p-2 border border-slate-900 rounded-xs min-h-[50px] bg-white font-serif font-bold text-slate-900">
                  {dirData?.details_of_enquiry || 'N/A'}
                </p>
              </div>

              <div className="flex justify-between font-bold">
                <span>Question Category: <span className="underline italic text-indigo-900">{dirData?.question_category || 'General Therapeutics'}</span></span>
                <span>Purpose: <span className="underline">{dirData?.purpose_of_enquiry || 'Better patient care'}</span></span>
              </div>
            </div>

            {/* PATIENT DETAILS (BACKGROUND INFORMATION) */}
            <div className="space-y-2 border border-slate-900 p-3 bg-slate-50/20 text-xs">
              <strong className="block font-bold text-xs uppercase border-b border-slate-900 pb-1">Patient Details (Background Information):</strong>
              
              <div className="flex justify-between font-bold">
                <span>Age: <span className="font-mono underline">{dirData?.age || '—'}</span></span>
                <span>Sex: <span className="underline">{dirData?.sex || '—'}</span></span>
                <span>Weight (Kgs): <span className="font-mono underline">{dirData?.weight_kg || '—'}</span></span>
                <span>Allergies: <span className="underline">{dirData?.allergies || 'None'}</span></span>
              </div>

              <div className="font-bold">
                Current medical problem: <span className="underline italic">{dirData?.current_medical_problem || 'N/A'}</span>
              </div>

              <div className="font-bold">
                Pregnancy/ lactation: <span className="underline">{dirData?.is_pregnant_lactating ? 'YES' : 'NO'}</span> {dirData?.pregnancy_lactation_details ? `(${dirData.pregnancy_lactation_details})` : ''}
              </div>

              <div className="font-bold">
                Other important investigations: <span className="underline italic">{dirData?.other_investigations || 'N/A'}</span>
              </div>

              <div className="font-bold">
                Drug therapy: <span className="underline font-mono">{dirData?.drug_therapy || 'N/A'}</span>
              </div>
            </div>

            {/* TIMELINE GIVEN & MODE OF REPLY */}
            <div className="space-y-1 border border-slate-900 p-3 bg-slate-50/20 text-xs font-bold">
              <div className="flex justify-between">
                <span>Answer given: <span className="underline">{dirData?.answer_given_timeframe || 'Immediately'}</span></span>
                <span>Mode of Reply: <span className="underline">{dirData?.mode_of_reply || 'Written'}</span></span>
              </div>
              {dirData?.reason_for_delay && (
                <div>Reason for Delay (If any): <span className="underline italic">{dirData.reason_for_delay}</span></div>
              )}
            </div>
          </PharmDVerseBrandedDocumentContainer>

          {/* ================= PAGE 2: RESPONSE PROVIDED, REFERENCES & SIGNATURES ================= */}
          <PharmDVerseBrandedDocumentContainer
            college={college}
            branding={branding}
            documentTitle="Drug Information Request Documentation (Continued)"
            caseId={clinicalCase?.case_id}
            student={student}
            pageNumber="2 of 2"
            isLastPage={true}
          >
            {/* RESPONSE PROVIDED (INFORMATION PROVIDED) */}
            <div className="text-xs">
              <strong className="font-bold text-xs uppercase block font-serif mb-1">Information provided (Response):</strong>
              <p className="p-4 border-2 border-slate-900 rounded-xs min-h-[220px] bg-slate-50/50 whitespace-pre-line font-serif leading-relaxed text-slate-900 font-medium">
                {dirData?.information_provided || 'N/A'}
              </p>
            </div>

            {/* REFERENCES */}
            <div className="border-2 border-slate-900 p-4 space-y-2 bg-slate-50/20 font-serif text-xs">
              <strong className="font-bold text-xs uppercase block border-b border-slate-900 pb-1">References:</strong>
              
              {Array.isArray(dirData?.references) && dirData.references.length > 0 ? (
                <ol className="list-decimal pl-5 space-y-1">
                  {dirData.references.map((ref, idx) => (
                    <li key={idx} className="font-bold">
                      <span className="text-slate-700 font-semibold font-sans">[{ref.type || 'Reference'}]:</span> {ref.source || '—'}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="space-y-1">
                  {dirData?.ref_textbooks && <div>Textbook: <span className="font-bold italic">{dirData.ref_textbooks}</span></div>}
                  {dirData?.ref_journals && <div>Journals: <span className="font-bold italic">{dirData.ref_journals}</span></div>}
                  {dirData?.ref_micromedex && <div>Database: <span className="font-bold italic">{dirData.ref_micromedex}</span></div>}
                  {dirData?.ref_website && <div>Website: <span className="font-mono font-bold">{dirData.ref_website}</span></div>}
                </div>
              )}
            </div>
          </PharmDVerseBrandedDocumentContainer>

        </div>

      </div>
    </div>
  );
};
