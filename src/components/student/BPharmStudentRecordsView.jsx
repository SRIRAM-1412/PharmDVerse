import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { BookOpen, Activity, Clock, Loader2, Download, FileCheck, Search, ChevronRight, CheckCircle2, FileSearch } from 'lucide-react';
import { BPharmOfficialPDFModal } from '../modals/BPharmOfficialPDFModal';

export const BPharmStudentRecordsView = ({ student }) => {
  const [activeTab, setActiveTab] = useState('experiments'); // 'experiments' or 'exams'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfRecord, setPdfRecord] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bpharm_student_records')
        .select(`
          *,
          assignment:bpharm_assignments(*),
          master:bpharm_master_experiments(*)
        `)
        .eq('student_id', student.id)
        .in('status', ['Submitted', 'Graded'])
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (student?.id) {
      fetchRecords();
    }
  }, [student]);

  const experiments = records.filter(r => r.assignment?.mode !== 'Exam');
  const exams = records.filter(r => r.assignment?.mode === 'Exam');
  
  const displayList = activeTab === 'experiments' ? experiments : exams;

  const handleDownloadPDF = (record) => {
    setPdfRecord(record);
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-[500px] flex flex-col h-full rounded-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-2">
          <FileCheck className="w-7 h-7 text-emerald-500" />
          My Official Records
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          View your submitted practicals, track grading status, and download official university records.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col overflow-hidden">
        
        {/* TABS */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 gap-2">
          <button 
            onClick={() => setActiveTab('experiments')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${
              activeTab === 'experiments' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-transparent'
            }`}
          >
            <Activity className="w-4 h-4" /> Completed Experiments
          </button>
          
          <button 
            onClick={() => setActiveTab('exams')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${
              activeTab === 'exams' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm border border-slate-200 dark:border-slate-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-transparent'
            }`}
          >
            <Clock className="w-4 h-4" /> Exam Results
          </button>
        </div>

        {/* LIST */}
        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <FileSearch className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Records Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                You haven't submitted any {activeTab === 'experiments' ? 'experiments' : 'exams'} yet. Complete them in the Practicals tab.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayList.map(record => (
                <div key={record.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                       <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                         record.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                       }`}>
                         {record.status === 'Graded' ? 'Graded / Approved' : 'Under Review'}
                       </span>
                       <span className="text-xs text-slate-400 font-bold">â€¢</span>
                       <span className="text-xs text-slate-500 font-medium">
                         Submitted: {new Date(record.submitted_at || record.updated_at).toLocaleDateString()}
                       </span>
                    </div>
                    <h4 className="font-black text-lg text-slate-800 dark:text-white leading-tight truncate">
                      {record.master?.experiment_title || 'Untitled'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Subject: {record.master?.subject_name} | Mode: {record.assignment?.mode}
                    </p>

                    {record.status === 'Graded' && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Preceptor Feedback</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                          {record.preceptor_feedback || 'Approved.'}
                        </p>
                        {record.grade && (
                          <div className="mt-2 text-xs font-black text-indigo-600 dark:text-indigo-400">
                            Grade Awarded: {record.grade}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="shrink-0 flex items-center justify-end">
                    {record.status === 'Graded' ? (
                      <button 
                        onClick={() => handleDownloadPDF(record)}
                        className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20 transition-all w-full sm:w-auto"
                      >
                        <Download className="w-4 h-4" /> Download PDF
                      </button>
                    ) : (
                      <div className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm font-bold flex items-center justify-center gap-2 w-full sm:w-auto opacity-70 cursor-not-allowed">
                        <Clock className="w-4 h-4" /> Pending Review
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <BPharmOfficialPDFModal 
        isOpen={!!pdfRecord} 
        onClose={() => setPdfRecord(null)} 
        record={pdfRecord} 
        student={student} 
      />
    </div>
  );
};

