import React, { useState, useRef } from 'react';
import { 
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, 
  X, Loader2, ArrowRight, RefreshCw, FileText, Check, ShieldAlert
} from 'lucide-react';
import { ModalWrapper } from '../modals/ModalWrapper';
import { parseAndValidateMasterExcel } from '../../services/masterDataImportService';
import {
  bulkInsertDrugKnowledgeInSupabase,
  bulkInsertLabParametersInSupabase,
  bulkInsertOtherInvestigationsInSupabase,
  bulkInsertDrugDrugInteractionsInSupabase,
  bulkInsertDrugFoodInteractionsInSupabase
} from '../../services/supabaseService';

export const MasterBulkImportModal = ({ isOpen, onClose, masterType, masterTitle, existingRecords, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationReport, setValidationReport] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'VALID' | 'DUPLICATE' | 'ERROR'
  const [importSummary, setImportSummary] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValidationReport(null);
    setImportSummary(null);
    setGeneralError(null);
    await runValidation(selectedFile);
  };

  const runValidation = async (selectedFile) => {
    setValidating(true);
    setGeneralError(null);

    const report = await parseAndValidateMasterExcel(selectedFile, masterType, existingRecords);
    setValidating(false);

    if (report.success) {
      setValidationReport(report);
    } else {
      setGeneralError(report.error || 'Failed to validate uploaded Excel file.');
    }
  };

  const handleExecuteImport = async () => {
    if (!validationReport || validationReport.validRecords.length === 0) return;

    setImporting(true);
    setGeneralError(null);

    let res;
    switch (masterType) {
      case 'drug_knowledge':
        res = await bulkInsertDrugKnowledgeInSupabase(validationReport.validRecords);
        break;
      case 'lab_knowledge':
        res = await bulkInsertLabParametersInSupabase(validationReport.validRecords);
        break;
      case 'other_inv_knowledge':
        res = await bulkInsertOtherInvestigationsInSupabase(validationReport.validRecords);
        break;
      case 'ddi_knowledge':
        res = await bulkInsertDrugDrugInteractionsInSupabase(validationReport.validRecords);
        break;
      case 'dfi_knowledge':
        res = await bulkInsertDrugFoodInteractionsInSupabase(validationReport.validRecords);
        break;
      default:
        res = { success: false, error: 'Unknown master type' };
    }

    setImporting(false);

    if (res.success) {
      setImportSummary({
        totalUploaded: validationReport.totalRows,
        importedCount: validationReport.validRecords.length,
        skippedDuplicates: validationReport.duplicateCount,
        skippedErrors: validationReport.errorCount
      });
      if (onSuccess) onSuccess();
    } else {
      setGeneralError(res.error || 'Failed to insert valid records into Supabase database.');
    }
  };

  const filteredRows = (validationReport?.rowsWithStatus || []).filter(r => {
    if (activeFilter === 'ALL') return true;
    return r.status === activeFilter;
  });

  const getRecordTitle = (rawData) => {
    if (masterType === 'drug_knowledge') return rawData.generic_name || 'Drug Record';
    if (masterType === 'lab_knowledge') return rawData.parameter_name || 'Lab Parameter';
    if (masterType === 'other_inv_knowledge') return rawData.investigation_name || 'Investigation';
    if (masterType === 'ddi_knowledge') return `${rawData.drug_a_generic || 'Drug A'} + ${rawData.drug_b_generic || 'Drug B'}`;
    if (masterType === 'dfi_knowledge') return `${rawData.drug_generic || 'Drug'} + ${rawData.food_or_beverage || 'Food'}`;
    return 'Record';
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">Bulk Import — {masterTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload Excel file (.xlsx, .xls, .csv) to validate and batch insert master knowledge records.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 font-bold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Success Completion Summary */}
        {importSummary ? (
          <div className="p-6 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-lg font-extrabold text-emerald-900 dark:text-emerald-200">
                Bulk Import Completed Successfully!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Master data records have been safely inserted into public repository.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto text-xs font-bold">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900">
                <span className="text-slate-400 block text-[10px]">TOTAL ROWS</span>
                <span className="text-base text-slate-800 dark:text-slate-200">{importSummary.totalUploaded}</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800">
                <span className="text-emerald-600 block text-[10px]">IMPORTED</span>
                <span className="text-base text-emerald-600">{importSummary.importedCount}</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900">
                <span className="text-amber-600 block text-[10px]">DUPLICATES</span>
                <span className="text-base text-amber-600">{importSummary.skippedDuplicates}</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">ERRORS</span>
                <span className="text-base text-rose-500">{importSummary.skippedErrors}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md cursor-pointer transition-all"
              >
                Close & Refresh Master View
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Step 1: File Dropzone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Select Master Excel File (.xlsx, .xls, .csv)
              </label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-3xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50/30 dark:hover:bg-slate-800/60 transition-all cursor-pointer space-y-3"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx,.xls,.csv" 
                  className="hidden" 
                />
                
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    {file ? file.name : 'Click or drop your Excel file here'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Supports .xlsx, .xls, and .csv files formatted according to the official template.
                  </p>
                </div>
              </div>
            </div>

            {/* Validation Loading Indicator */}
            {validating && (
              <div className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  Parsing Excel file and validating against existing Supabase database...
                </p>
              </div>
            )}

            {/* Validation Results & Preview Table */}
            {validationReport && !validating && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Stats Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px]">TOTAL ROWS</span>
                    <span className="text-base text-slate-800 dark:text-slate-200">{validationReport.totalRows}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-emerald-600 block text-[10px]">VALID (TO IMPORT)</span>
                    <span className="text-base text-emerald-600">{validationReport.validCount}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                    <span className="text-amber-600 block text-[10px]">DUPLICATES (SKIPPED)</span>
                    <span className="text-base text-amber-600">{validationReport.duplicateCount}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                    <span className="text-rose-600 block text-[10px]">ERRORS (SKIPPED)</span>
                    <span className="text-base text-rose-600">{validationReport.errorCount}</span>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
                  <span className="text-slate-400 text-[11px] mr-2">Filter View:</span>
                  <button
                    onClick={() => setActiveFilter('ALL')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${activeFilter === 'ALL' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    All ({validationReport.totalRows})
                  </button>

                  <button
                    onClick={() => setActiveFilter('VALID')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${activeFilter === 'VALID' ? 'bg-emerald-600 text-white' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'}`}
                  >
                    Valid ({validationReport.validCount})
                  </button>

                  <button
                    onClick={() => setActiveFilter('DUPLICATE')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${activeFilter === 'DUPLICATE' ? 'bg-amber-600 text-white' : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'}`}
                  >
                    Duplicates ({validationReport.duplicateCount})
                  </button>

                  <button
                    onClick={() => setActiveFilter('ERROR')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${activeFilter === 'ERROR' ? 'bg-rose-600 text-white' : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'}`}
                  >
                    Errors ({validationReport.errorCount})
                  </button>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold sticky top-0">
                      <tr>
                        <th className="p-3 w-16 text-center">Row</th>
                        <th className="p-3 w-28">Status</th>
                        <th className="p-3">Record Title</th>
                        <th className="p-3">Validation Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400">
                            No records match the active filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 text-center font-mono font-bold text-slate-400">#{r.rowNum}</td>
                            <td className="p-3">
                              {r.status === 'VALID' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                                  <Check className="w-3 h-3" /> Valid
                                </span>
                              )}
                              {r.status === 'DUPLICATE' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                                  <AlertTriangle className="w-3 h-3" /> Duplicate
                                </span>
                              )}
                              {r.status === 'ERROR' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[10px]">
                                  <XCircle className="w-3 h-3" /> Error
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-extrabold text-slate-800 dark:text-slate-200">
                              {getRecordTitle(r.rawData)}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {r.errorDetails.length > 0 ? (
                                <span className="text-rose-600 dark:text-rose-400 font-medium">
                                  {r.errorDetails.join(' ')}
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  Ready for database insertion.
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {validationReport.validCount > 0 
                      ? `${validationReport.validCount} valid record(s) ready to insert into Supabase.`
                      : 'No valid records found in the uploaded file.'}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleExecuteImport}
                      disabled={importing || validationReport.validCount === 0}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Importing to Supabase...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Confirm Import ({validationReport.validCount})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </ModalWrapper>
  );
};
