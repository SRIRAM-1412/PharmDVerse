import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useInlineNotification } from '../../hooks/useInlineNotification';
import { FlaskConical, Eye, Send, Loader2, Search, X, Check, Activity, BookOpen, Clock, FolderOpen } from 'lucide-react';

export const BPharmExperimentAssignmentView = ({ preceptor }) => {
  const [activeSubject, setActiveSubject] = useState('General Pharmacology');
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notification, showNotification, clearNotification } = useInlineNotification();

  // Modals
  const [previewExp, setPreviewExp] = useState(null);
  const [assignExp, setAssignExp] = useState(null);

  // Assign Form State
  const [targetBatch, setTargetBatch] = useState('2nd Year B.Pharm');
  const [assignMode, setAssignMode] = useState('Experimentation');
  const [isAssigning, setIsAssigning] = useState(false);

  const subjects = [
    'General Pharmacology',
    'Systemic Pharmacology-I',
    'Systemic Pharmacology-II'
  ];

  const fetchExperiments = async (subject) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bpharm_master_experiments')
        .select('*')
        .eq('subject_name', subject)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setExperiments(data || []);
    } catch (err) {
      console.log('Error fetching experiments', err);
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments(activeSubject);
  }, [activeSubject]);

  const handleAssignSubmit = async () => {
    if (!targetBatch) {
      showNotification({ type: 'error', message: 'Please specify a target batch.' });
      return;
    }
    
    setIsAssigning(true);
    try {
      // PREVENT DUPLICATION
      const { data: existing, error: checkError } = await supabase
        .from('bpharm_assignments')
        .select('id')
        .eq('experiment_id', assignExp.id)
        .eq('target_batch', targetBatch)
        .eq('mode', assignMode)
        .eq('college_id', preceptor.college_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        showNotification({ type: 'error', message: `This experiment is already assigned to ${targetBatch} in ${assignMode} mode!` });
        setAssignExp(null);
        setIsAssigning(false);
        return;
      }

      const payload = {
        experiment_id: assignExp.id,
        college_id: preceptor.college_id,
        preceptor_id: preceptor.id,
        target_batch: targetBatch,
        mode: assignMode,
        is_active: true
      };

      const { error } = await supabase.from('bpharm_assignments').insert([payload]);
      if (error) throw error;

      showNotification({ type: 'success', message: `Experiment successfully assigned to ${targetBatch} in ${assignMode} mode!` });
      setAssignExp(null);
    } catch (err) {
      showNotification({ type: 'error', message: `Assignment failed: ${err.message}` });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full min-h-[500px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-500" />
            Assign Master Experiments
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Browse Super Admin templates and assign them to your B.Pharm batches.
          </p>
        </div>
      </div>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-bold border ${notification.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {notification.message}
        </div>
      )}

      {/* Subject Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
        {subjects.map(subject => (
          <button
            key={subject}
            onClick={() => setActiveSubject(subject)}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeSubject === subject 
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <FolderOpen className="w-4 h-4" /> {subject}
          </button>
        ))}
      </div>

      {/* Experiment List */}
      <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : experiments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <FlaskConical className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Active Experiments</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              There are no active master experiments available for {activeSubject} yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {experiments.map(exp => (
              <div key={exp.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight">
                      {exp.experiment_title}
                    </h4>
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                      {Array.isArray(exp.experiment_content) ? exp.experiment_content.length : 0} Blocks
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                    Master template created on {new Date(exp.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  <button 
                    onClick={() => setPreviewExp(exp)}
                    className="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button 
                    onClick={() => setAssignExp(exp)}
                    className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ASSIGNMENT MODAL */}
      {assignExp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-500" /> Assign Experiment
              </h3>
              <button onClick={() => setAssignExp(null)} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Experiment Title</label>
                <div className="font-bold text-slate-800 dark:text-white p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  {assignExp.experiment_title}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Target Student Batch</label>
                <input 
                  type="text" 
                  value={targetBatch}
                  onChange={(e) => setTargetBatch(e.target.value)}
                  placeholder="e.g., 2nd Year B.Pharm"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Execution Mode</label>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => setAssignMode('Learning')}
                    className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${assignMode === 'Learning' ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-sky-300'}`}
                  >
                    <BookOpen className={`w-5 h-5 shrink-0 ${assignMode === 'Learning' ? 'text-sky-600' : 'text-slate-400'}`} />
                    <div>
                      <div className={`font-bold ${assignMode === 'Learning' ? 'text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'}`}>Learning Mode</div>
                      <div className="text-[10px] font-medium text-slate-500">Read-only tables. For studying theory only.</div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setAssignMode('Experimentation')}
                    className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${assignMode === 'Experimentation' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                  >
                    <Activity className={`w-5 h-5 shrink-0 ${assignMode === 'Experimentation' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div>
                      <div className={`font-bold ${assignMode === 'Experimentation' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>Experimentation Mode</div>
                      <div className="text-[10px] font-medium text-slate-500">Unlocked tables. Graphs plot dynamically.</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setAssignMode('Exam')}
                    className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${assignMode === 'Exam' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-rose-300'}`}
                  >
                    <Clock className={`w-5 h-5 shrink-0 ${assignMode === 'Exam' ? 'text-rose-600' : 'text-slate-400'}`} />
                    <div>
                      <div className={`font-bold ${assignMode === 'Exam' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-300'}`}>Exam Mode</div>
                      <div className="text-[10px] font-medium text-slate-500">Theory and videos hidden. Assessment only.</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <button 
                onClick={() => setAssignExp(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignSubmit}
                disabled={isAssigning}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-70"
              >
                {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewExp && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
             <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-400 text-[10px] font-black uppercase tracking-widest block mb-1 w-max">
                    Preceptor Preview Mode
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
                    {previewExp.experiment_title}
                  </h3>
                </div>
                <button onClick={() => setPreviewExp(null)} className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shrink-0">
                  <X className="w-6 h-6" />
                </button>
             </div>
             <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900 space-y-6">
                {(!previewExp.experiment_content || previewExp.experiment_content.length === 0) ? (
                  <div className="text-center text-slate-500 font-bold p-10">This master experiment is empty.</div>
                ) : (
                  previewExp.experiment_content.map((block) => (
                    <div key={block.id} className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                      {block.heading && (
                        <h4 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block"></span>
                          {block.heading}
                        </h4>
                      )}
                      
                      {block.type === 'text' && (
                        <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-medium">
                          {block.content || <span className="italic opacity-50">Empty text</span>}
                        </div>
                      )}
                      
                      {block.type === 'media' && (
                         <div className="flex justify-center bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                           {block.content ? (
                              block.content.includes('youtube.com') || block.content.includes('youtu.be') ? (
                                <div className="text-slate-500 font-bold text-sm">YouTube Video Included</div>
                              ) : (
                                <img src={block.content} alt="Media" className="max-h-64 rounded-lg shadow-sm" onError={(e) => e.target.style.display='none'} />
                              )
                           ) : <span className="italic text-slate-500">No media</span>}
                         </div>
                      )}
                      
                      {block.type === 'table' && (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                          <table className="w-full text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                              <tr>
                                {Array.isArray(block.content) && block.content.map((col, i) => (
                                  <th key={i} className="px-4 py-3 text-sm font-black text-slate-700 dark:text-slate-300">{col || `Col ${i+1}`}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {Array.isArray(block.content) && block.content.map((_, i) => (
                                  <td key={i} className="p-3 bg-slate-50 dark:bg-slate-900"><div className="h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded opacity-50"></div></td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {block.type === 'graph' && (
                        <div className="h-48 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 flex flex-col items-center justify-center text-indigo-700 dark:text-indigo-500">
                          <Activity className="w-8 h-8 mb-2 opacity-50" />
                          <div className="font-bold text-sm">Auto-Plotting Graph Region</div>
                          <div className="text-xs mt-1">X-Axis: {block.content?.xAxis} | Y-Axis: {block.content?.yAxis}</div>
                        </div>
                      )}

                      {block.type === 'code' && (
                        <div className="h-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-xs p-4 text-center">
                           [ Custom Interactive Embed Rendered Here ]
                        </div>
                      )}
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

