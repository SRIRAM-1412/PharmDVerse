import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useInlineNotification } from '../../hooks/useInlineNotification';
import { FileSearch, CheckCircle2, X, Activity, Loader2, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const BPharmPreceptorSubmissionsView = ({ preceptor }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notification, showNotification } = useInlineNotification();

  const [gradingRecord, setGradingRecord] = useState(null);
  const [feedback, setFeedback] = useState('Excellent work. Approved.');
  const [grade, setGrade] = useState('A');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bpharm_student_records')
        .select(`
          *,
          student:students(full_name, roll_number),
          assignment:bpharm_assignments(mode, target_batch),
          master:bpharm_master_experiments(*)
        `)
        .eq('college_id', preceptor.college_id)
        .in('status', ['Submitted', 'Graded'])
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error('Error fetching submissions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preceptor?.college_id) {
      fetchSubmissions();
    }
  }, [preceptor]);

  const handleGradeSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('bpharm_student_records')
        .update({
          status: 'Graded',
          grade: grade,
          preceptor_feedback: feedback,
          graded_at: new Date().toISOString()
        })
        .eq('id', gradingRecord.id);

      if (error) throw error;
      
      showNotification({ type: 'success', message: 'Practical record successfully graded and approved!' });
      setGradingRecord(null);
      fetchSubmissions();
    } catch (err) {
      showNotification({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGraphData = (tableData, blocks) => {
    const tableBlockId = blocks?.find(b => b.type === 'table')?.id;
    if (!tableBlockId || !tableData || !tableData[tableBlockId]) return [];
    
    return tableData[tableBlockId].map(row => ({
      x: parseFloat(row.values[0]) || 0,
      y: parseFloat(row.values[1]) || 0
    })).sort((a, b) => a.x - b.x);
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-[500px] flex flex-col h-full rounded-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-2">
          <FileSearch className="w-7 h-7 text-indigo-500" />
          Evaluate B.Pharm Submissions
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Review student observations, verify auto-plotted graphs, and approve practical records.
        </p>
      </div>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-bold border ${notification.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {notification.message}
        </div>
      )}

      {/* LIST VIEW */}
      {!gradingRecord && (
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <CheckCircle2 className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">All caught up!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                There are no pending B.Pharm submissions waiting for your evaluation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {submissions.map(record => (
                <div key={record.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${record.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {record.status}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{record.assignment?.mode} Mode</span>
                    </div>
                    <h4 className="font-black text-lg text-slate-800 dark:text-white truncate">
                      {record.student?.full_name} ({record.student?.roll_number})
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium truncate">
                      {record.master?.experiment_title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Submitted: {new Date(record.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => setGradingRecord(record)}
                      className={`w-full sm:w-auto py-2.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        record.status === 'Graded' 
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                      }`}
                    >
                      {record.status === 'Graded' ? 'View Evaluation' : 'Evaluate Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GRADING / REVIEW MODAL (FULL SCREEN OVERLAY INSIDE CONTAINER) */}
      {gradingRecord && (
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
            <div>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">
                Student Evaluation
              </span>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">
                {gradingRecord.student?.full_name} - {gradingRecord.master?.experiment_title}
              </h3>
            </div>
            <button onClick={() => setGradingRecord(null)} className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-slate-900/30">
            {/* LEFT SIDE: EXPERIMENT CONTENT & DATA */}
            <div className="lg:col-span-2 space-y-6">
              {gradingRecord.master?.experiment_content?.map((block) => {
                // Skip theory in grading view to save space, focus on results
                if (block.type === 'text' || block.type === 'media') return null;

                if (block.type === 'table') {
                  const sData = gradingRecord.student_answers?.[block.id] || [];
                  return (
                    <div key={block.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                      <h4 className="text-lg font-black text-slate-800 dark:text-white mb-4">Observation Table</h4>
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-left">
                          <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              {block.content.map((col, i) => (
                                <th key={i} className="px-4 py-3 text-sm font-black text-slate-700 dark:text-slate-300">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sData.map((row, rIdx) => (
                              <tr key={rIdx} className="bg-white dark:bg-slate-950">
                                {block.content.map((_, cIdx) => (
                                  <td key={cIdx} className="p-3 text-sm font-mono text-slate-800 dark:text-slate-300">
                                    {row.values[cIdx] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }

                if (block.type === 'graph') {
                  const gData = getGraphData(gradingRecord.student_answers, gradingRecord.master.experiment_content);
                  return (
                    <div key={block.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                      <h4 className="text-lg font-black text-slate-800 dark:text-white mb-4">Plotted Graph</h4>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={gData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                            <Line type="monotone" dataKey="y" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" opacity={0.2} />
                            <XAxis dataKey="x" label={{ value: block.content?.xAxis, position: 'insideBottom', offset: -10 }} />
                            <YAxis label={{ value: block.content?.yAxis, angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            {/* RIGHT SIDE: GRADING PANEL */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 sticky top-0">
                <h4 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Evaluation Panel
                </h4>

                {gradingRecord.status === 'Graded' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">Grade Awarded</div>
                      <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{gradingRecord.grade}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-500 mb-1">Preceptor Feedback</div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                        {gradingRecord.preceptor_feedback}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Assign Grade</label>
                      <select 
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="A+">A+ (Outstanding)</option>
                        <option value="A">A (Excellent)</option>
                        <option value="B">B (Good)</option>
                        <option value="C">C (Satisfactory)</option>
                        <option value="F">F (Fail / Redo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Preceptor Feedback</label>
                      <textarea 
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Leave constructive feedback..."
                      />
                    </div>

                    <button 
                      onClick={handleGradeSubmit}
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-70"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      Approve & Finalize
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

