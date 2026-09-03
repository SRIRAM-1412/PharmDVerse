import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle2, AlertTriangle, Loader2, X, RefreshCw } from 'lucide-react';
import { ModalWrapper } from '../modals/ModalWrapper';
import { insertBatchStudentsToSupabase } from '../../services/supabaseService';

export const BulkStudentImportModal = ({ isOpen, onClose, college, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Download official CSV template
  const handleDownloadTemplate = () => {
    const headers = "Roll Number,Full Name,Course,Batch,Year,Semester,Academic Year,Gender,Phone,Email,Password\n";
    const sample1 = "22PH001,Sai Teja,Pharm.D,Y22,5th Year,,2026-2027,Male,9876543210,saiteja@college.edu,Student@123\n";
    const sample2 = "23BP015,Anjali Sharma,B.Pharm,Y23,3rd Year,Semester 5,2026-2027,Female,9123456789,anjali@college.edu,Student@123\n";
    const blob = new Blob([headers + sample1 + sample2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Students_Bulk_Import_Template_${college?.code || 'CLG'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV file content
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setErrorMsg('');
    setImportResult(null);
    setFile(selectedFile);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');

        if (lines.length <= 1) {
          setErrorMsg('CSV file is empty or missing data rows.');
          setIsParsing(false);
          return;
        }

        const valid = [];
        const invalid = [];

        // Parse rows starting from line 1 (skipping headers)
        for (let i = 1; i < lines.length; i++) {
          const rowText = lines[i];
          const cols = rowText.split(',').map(c => c.trim().replace(/^"|"$/g, ''));

          if (cols.length < 2 || (!cols[0] && !cols[1])) continue;

          const rollNumber = cols[0] || '';
          const fullName = cols[1] || '';
          const course = (cols[2] || 'Pharm.D').trim();
          const batch = (cols[3] || 'Y26').trim();
          const year = (cols[4] || '1st Year').trim();
          const semester = (cols[5] || '').trim() || null;
          const academicYear = (cols[6] || '2026–2027').trim();
          const gender = (cols[7] || 'Male').trim();
          const phone = cols[8] || '';
          const email = cols[9] || '';
          const password = cols[10] || '';

          const record = {
            rowNum: i + 1,
            rollNumber,
            fullName,
            course: course.includes('B') ? 'B.Pharm' : 'Pharm.D',
            batch,
            year,
            semester: course.includes('B') ? (semester || 'Semester 1') : null,
            academicYear,
            gender: ['Male', 'Female', 'Other'].includes(gender) ? gender : 'Male',
            mobileNumber: phone,
            email: email || `${rollNumber.toLowerCase()}@student.edu`,
            password
          };

          if (!rollNumber || !fullName) {
            invalid.push({ ...record, reason: 'Missing Roll Number or Full Name' });
          } else {
            valid.push(record);
          }
        }

        setValidRows(valid);
        setInvalidRows(invalid);
      } catch (err) {
        setErrorMsg('Failed to parse CSV file. Please check file format.');
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsText(selectedFile);
  };

  // Perform Batch Import
  const handleStartImport = async () => {
    if (validRows.length === 0) return;
    setIsImporting(true);
    setErrorMsg('');

    const res = await insertBatchStudentsToSupabase(college.id, validRows);
    setIsImporting(false);

    if (res.success) {
      setImportResult({
        total: validRows.length,
        imported: res.count,
        failed: invalidRows.length
      });
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(res.error || 'Failed to import students to database.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setValidRows([]);
    setInvalidRows([]);
    setImportResult(null);
    setErrorMsg('');
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Bulk Import Candidates (CSV / Excel)" maxWidth="max-w-2xl">
      <div className="space-y-5">
        
        {/* TEMPLATE DOWNLOAD HEADER */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-extrabold text-emerald-900 dark:text-emerald-300 block">
              Step 1: Download Official CSV Template
            </span>
            <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
              Pre-formatted for Pharm.D & B.Pharm roll numbers, semesters & academic years.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* UPLOAD FILE ZONE */}
        {!importResult && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Step 2: Upload Completed CSV File *
            </label>
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center transition-all bg-slate-50/50 dark:bg-slate-900/50">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {file ? file.name : 'Drag and drop your CSV file here, or click to browse'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Supports .CSV files formatted with UTF-8 encoding
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PARSING INDICATOR */}
        {isParsing && (
          <div className="p-4 text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
              Parsing and validating candidate rows...
            </span>
          </div>
        )}

        {/* ERROR MSG */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PARSED PREVIEW & VALIDATION SUMMARY */}
        {!importResult && validRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold px-1">
              <span className="text-slate-800 dark:text-slate-200">
                Ready to Import: <strong className="text-emerald-600">{validRows.length} Valid Candidates</strong>
              </span>
              {invalidRows.length > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  Skipped {invalidRows.length} incomplete rows
                </span>
              )}
            </div>

            {/* PREVIEW TABLE */}
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 sticky top-0">
                  <tr>
                    <th className="p-2.5">Roll No</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Course</th>
                    <th className="p-2.5">Batch</th>
                    <th className="p-2.5">Year/Sem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {validRows.slice(0, 10).map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-2.5 font-mono font-bold text-emerald-600">{r.rollNumber}</td>
                      <td className="p-2.5 font-bold">{r.fullName}</td>
                      <td className="p-2.5">{r.course}</td>
                      <td className="p-2.5 font-mono">{r.batch}</td>
                      <td className="p-2.5">{r.year} {r.semester ? `(${r.semester})` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validRows.length > 10 && (
                <div className="p-2 text-center text-[11px] text-slate-400 font-medium bg-slate-50 dark:bg-slate-900">
                  + {validRows.length - 10} more candidate rows...
                </div>
              )}
            </div>
          </div>
        )}

        {/* IMPORT SUCCESS RESULT */}
        {importResult && (
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h3 className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">
              Bulk Candidates Enrolled Successfully!
            </h3>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {importResult.imported} candidate records have been registered for {college?.name}.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Import Another File</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* FOOTER ACTIONS */}
        {!importResult && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartImport}
              disabled={validRows.length === 0 || isImporting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing Candidates...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Start Batch Import ({validRows.length})</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </ModalWrapper>
  );
};
