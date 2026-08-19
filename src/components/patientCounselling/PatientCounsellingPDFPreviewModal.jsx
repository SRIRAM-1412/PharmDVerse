import React, { useState, useEffect } from 'react';
import { X, Printer, HeartHandshake } from 'lucide-react';
import { fetchDocumentBrandingSettingsFromSupabase, fetchCollegeByIdFromSupabase } from '../../services/supabaseService';
import { PharmDVerseBrandedDocumentContainer } from '../branding/PharmDVerseBrandedDocumentContainer';

const ALL_CHECKLIST_POINTS = [
  'Name and purpose of medication',
  'Dosage regimen',
  'Advice on missed dose',
  'Potential side effects',
  'Significant interactions (Drug-Drug, Drug-food, drug-Disease)',
  'Precautions to be taken',
  'Storage recommendations',
  'Benefits of completing case',
  'Life style modifications'
];

export const PatientCounsellingPDFPreviewModal = ({ isOpen, onClose, clinicalCase, student, counsellingData }) => {
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

  const pointsCovered = counsellingData?.points_covered || counsellingData?.counselling_points_covered || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL ACTION BAR */}
        <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-extrabold tracking-tight">Patient Counselling Documentation (2-Page A4 PDF Preview)</h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
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
          
          {/* ================= PAGE 1: PATIENT DETAILS & COUNSELLING CHECKLIST ================= */}
          <PharmDVerseBrandedDocumentContainer
            college={college}
            branding={branding}
            documentTitle="Patient Counselling Documentation"
            caseId={clinicalCase?.case_id}
            student={student}
            pageNumber="1 of 2"
            showSignatures={false}
          >
            {/* 1. PATIENT & SESSION OVERVIEW */}
            <div className="space-y-2 border border-slate-900 p-3 bg-slate-50/20 text-xs font-bold">
              <strong className="block uppercase border-b border-slate-900 pb-1 text-indigo-900">1. Session Overview</strong>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>Patient Initials: <span className="underline">{counsellingData?.patient_name || '—'}</span></div>
                <div>Age / Sex: <span className="underline">{counsellingData?.age ? `${counsellingData.age} yrs` : '—'} / {counsellingData?.sex || '—'}</span></div>
                <div>Date: <span className="font-mono underline">{counsellingData?.counselling_date || '—'}</span></div>
                <div>Time: <span className="font-mono underline">{counsellingData?.counselling_time || '—'}</span></div>
                <div>IP/OP No: <span className="font-mono underline">{counsellingData?.ip_op_number || '—'}</span></div>
                <div>Type: <span className="underline">{counsellingData?.patient_type || '—'}</span></div>
                <div>Ward / Unit: <span className="underline">{counsellingData?.unit_ward || counsellingData?.ward_bed || '—'}</span></div>
                <div>Department: <span className="underline">{counsellingData?.department || clinicalCase?.department || '—'}</span></div>
                <div className="col-span-2 sm:col-span-4">Known Allergies: <span className="underline font-bold text-rose-800">{counsellingData?.allergies || 'None'}</span></div>
              </div>
            </div>

            {/* 2. DISEASE & MEDICATION COUNSELLED */}
            <div className="space-y-2 border border-slate-900 p-3 bg-slate-50/20 text-xs">
              <strong className="block uppercase font-bold border-b border-slate-900 pb-1">2. Clinical Focus</strong>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="font-bold block text-slate-900">Disease Condition Counselled:</span>
                  <p className="p-2 border border-slate-900 bg-white font-serif font-bold text-slate-900">{counsellingData?.disease_counselled || counsellingData?.disease_condition || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-bold block text-slate-900">Medications Counselled:</span>
                  <p className="p-2 border border-slate-900 bg-white font-serif text-slate-800 font-mono font-semibold">{counsellingData?.medications_counselled || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* 3. COUNSELLING CHECKLIST (9 POINTS) */}
            <div className="space-y-2 border border-slate-900 p-3 bg-slate-50/20 text-xs font-serif">
              <strong className="block uppercase font-bold border-b border-slate-900 pb-1 text-slate-900">3. Counselling Points Covered Checklist</strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {ALL_CHECKLIST_POINTS.map((point, index) => {
                  const isChecked = pointsCovered.includes(point);
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="font-bold text-sm">{isChecked ? '[ ✓ ]' : '[  ]'}</span>
                      <span className={isChecked ? 'font-bold underline text-slate-900' : 'text-slate-500'}>{point}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </PharmDVerseBrandedDocumentContainer>

          {/* ================= PAGE 2: BARRIERS, RESOLUTION, AIDS & SIGNATURES ================= */}
          <PharmDVerseBrandedDocumentContainer
            college={college}
            branding={branding}
            documentTitle="Patient Counselling Documentation (Continued)"
            caseId={clinicalCase?.case_id}
            student={student}
            pageNumber="2 of 2"
            isLastPage={true}
          >
            {/* 4. BARRIERS TO COMPLIANCE & RESOLUTION */}
            <div className="space-y-2 border border-slate-900 p-3 bg-slate-50/20 text-xs">
              <strong className="block uppercase font-bold border-b border-slate-900 pb-1 text-slate-900">4. Barriers & Resolution</strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="font-bold block text-slate-900">Major Barriers Involved:</span>
                  <p className="p-2 border border-slate-900 bg-white font-bold">{counsellingData?.major_barriers_involved ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="font-bold block text-slate-900">Barrier Overcome Rightly:</span>
                  <p className="p-2 border border-slate-900 bg-white font-bold">{counsellingData?.barrier_overcome ? 'Yes' : 'No / N/A'}</p>
                </div>
                {counsellingData?.major_barriers_involved && (
                  <div className="col-span-2">
                    <span className="font-bold block text-slate-900">Details of Barrier:</span>
                    <p className="p-2 border border-slate-900 bg-white italic">{counsellingData?.barrier_details || counsellingData?.barriers_identified || 'None specified.'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 5. DURATION & RECIPIENT */}
            <div className="space-y-2 border border-slate-900 p-3 bg-slate-50/20 text-xs font-bold">
              <strong className="block uppercase border-b border-slate-900 pb-1">5. Duration & Recipient</strong>
              <div className="grid grid-cols-2 gap-2">
                <div>Session Duration: <span className="font-mono underline">{counsellingData?.time_taken || counsellingData?.duration_minutes || '10 to 20 min.'}</span></div>
                <div>Counselled To: <span className="underline">{counsellingData?.counselling_provided_to || counsellingData?.provided_to || 'Patient'}</span></div>
                {counsellingData?.counselling_provided_to === 'Patient representative' && (
                  <div className="col-span-2 font-normal text-slate-800">
                    <span className="font-bold">Representative Reason:</span> {counsellingData?.representative_reasons?.join(', ')} {counsellingData?.representative_other_reason ? `(${counsellingData.representative_other_reason})` : ''}
                  </div>
                )}
              </div>
            </div>

            {/* 6. MATERIALS & AIDS PROVIDED */}
            <div className="space-y-2 border border-slate-900 p-3 bg-slate-50/20 text-xs">
              <strong className="block uppercase font-bold border-b border-slate-900 pb-1">6. Leaflets & Visual Aids Provided</strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="font-bold block text-slate-900">Aids Used:</span>
                  <p className="p-2 border border-slate-900 bg-white font-serif">{counsellingData?.counselling_aids_used || 'None'}</p>
                </div>
                <div>
                  <span className="font-bold block text-slate-900">Material Provided:</span>
                  <p className="p-2 border border-slate-900 bg-white font-serif">{counsellingData?.counselling_material_provided || counsellingData?.educational_materials_used || 'None'}</p>
                </div>
              </div>
              <div className="pt-1 font-bold">
                Patient Understanding Ascertained: <span className="underline">{counsellingData?.understanding_ascertained ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </PharmDVerseBrandedDocumentContainer>

        </div>

      </div>
    </div>
  );
};
