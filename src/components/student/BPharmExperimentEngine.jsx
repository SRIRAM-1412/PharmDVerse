import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useInlineNotification } from '../../hooks/useInlineNotification';
import { ChevronLeft, Save, Loader2, Send, Activity, Table as TableIcon, Lock, ArrowDown, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


  const PALETTE = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

  const parseMultiCurveGraphData = (cols = [], rows = []) => {
    if (!cols.length || !rows.length) return { data: [], lines: [] };

    const isPaired = cols.length >= 4 && cols.length % 2 === 0;

    if (isPaired) {
      const lines = [];
      const numPairs = cols.length / 2;
      for (let p = 0; p < numPairs; p++) {
        const xName = cols[p * 2] || `X${p+1}`;
        const yName = cols[p * 2 + 1] || `Y${p+1}`;
        lines.push({
          key: `y${p}`,
          name: `${xName} / ${yName}`,
          color: PALETTE[p % PALETTE.length],
          xCol: p * 2,
          yCol: p * 2 + 1
        });
      }

      const formattedData = rows.map((r, rIdx) => {
        const point = { rowIdx: rIdx, x: parseFloat(r[0]) || 0 };
        lines.forEach(line => {
          const xVal = parseFloat(r[line.xCol]);
          const yVal = parseFloat(r[line.yCol]);
          if (!isNaN(xVal) && !isNaN(yVal)) {
            point[line.key] = yVal;
          }
        });
        return point;
      }).sort((a, b) => a.x - b.x);

      return { data: formattedData, lines, mode: 'paired' };
    } else {
      const lines = [];
      for (let c = 1; c < cols.length; c++) {
        lines.push({
          key: `y${c-1}`,
          name: cols[c] || `Response ${c}`,
          color: PALETTE[(c - 1) % PALETTE.length]
        });
      }

      const formattedData = rows.map((r) => {
        const xVal = parseFloat(r[0]);
        const point = { x: isNaN(xVal) ? 0 : xVal };
        lines.forEach((line, idx) => {
          const yVal = parseFloat(r[idx + 1]);
          if (!isNaN(yVal)) {
            point[line.key] = yVal;
          }
        });
        return point;
      }).sort((a, b) => a.x - b.x);

      return { data: formattedData, lines, mode: 'shared' };
    }
  };

export const BPharmExperimentEngine = ({ student, assignment, onBack }) => {
  const { master, mode } = assignment;
  const blocks = master?.experiment_content || [];
  
  const [tableData, setTableData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notification, showNotification } = useInlineNotification();
  const [existingRecord, setExistingRecord] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});

  // Initialize table data structures based on the master blocks
  useEffect(() => {
    const initData = {};
    blocks.forEach(block => {
      if (block.type === 'table') {
        const defaultRows = Array.isArray(block.defaultRows) ? block.defaultRows : [];
        if (defaultRows.length > 0) {
          initData[block.id] = defaultRows.map((r, idx) => ({
            id: (Date.now() + idx).toString(),
            values: Array.isArray(r) ? r : []
          }));
        } else {
          initData[block.id] = [{ id: Date.now().toString(), values: Array(Array.isArray(block.content) ? block.content.length : 2).fill('') }];
        }
      }
    });

    const checkExisting = async () => {
      try {
        const { data, error } = await supabase
          .from('bpharm_student_records')
          .select('*')
          .eq('assignment_id', assignment.id)
          .eq('student_id', student.id)
          .maybeSingle();

        if (data) {
          setExistingRecord(data);
          if (data.student_answers) {
            setTableData(data.student_answers);
          }
        } else {
          setTableData(initData);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkExisting();
  }, [assignment, student, blocks]);

  const handleCellChange = (blockId, rowIndex, colIndex, value) => {
    if (mode === 'Learning' || existingRecord?.status === 'Submitted') return;
    
    setTableData(prev => {
      const newData = { ...prev };
      if (!newData[blockId]) return prev;
      
      const newRows = [...newData[blockId]];
      const newRowValues = [...newRows[rowIndex].values];
      newRowValues[colIndex] = value;
      newRows[rowIndex] = { ...newRows[rowIndex], values: newRowValues };
      newData[blockId] = newRows;
      return newData;
    });
  };

  const addRow = (blockId, numCols) => {
    if (mode === 'Learning' || existingRecord?.status === 'Submitted') return;
    setTableData(prev => ({
      ...prev,
      [blockId]: [...(prev[blockId] || []), { id: Date.now().toString(), values: Array(numCols).fill('') }]
    }));
  };

  const removeRow = (blockId, rowIndex) => {
    if (mode === 'Learning' || existingRecord?.status === 'Submitted') return;
    setTableData(prev => {
      const newRows = [...prev[blockId]];
      if (newRows.length <= 1) return prev; // Keep at least one row
      newRows.splice(rowIndex, 1);
      return { ...prev, [blockId]: newRows };
    });
  };

  // Convert tableData to graphable format
  const getGraphData = (block) => {
    const tableBlockId = blocks.find(b => b.type === 'table')?.id; // Find the first table
    if (!tableBlockId || !tableData[tableBlockId]) return [];

    const rows = tableData[tableBlockId];
    return rows.map(row => {
      const xVal = parseFloat(row.values[0]) || 0; // Assume col 0 is X
      const yVal = parseFloat(row.values[1]) || 0; // Assume col 1 is Y
      return { x: xVal, y: yVal };
    }).sort((a, b) => a.x - b.x); // Sort by X for proper line graphing
  };

  
  const toggleStepCompletion = (blockId, stepId) => {
    setCompletedSteps(prev => {
      const current = prev[blockId] || [];
      const updated = current.includes(stepId)
        ? current.filter(id => id !== stepId)
        : [...current, stepId];
      return { ...prev, [blockId]: updated };
    });
  };

  const handleSave = async (submit = false) => {
    const loadingState = submit ? setIsSubmitting : setIsSaving;
    loadingState(true);
    try {
      const payload = {
        assignment_id: assignment.id,
        experiment_id: master.id,
        student_id: student.id,
        college_id: student.college_id,
        student_answers: tableData,
        status: submit ? 'Submitted' : 'In Progress',
        updated_at: new Date().toISOString()
      };

      if (submit) payload.submitted_at = new Date().toISOString();

      if (existingRecord) {
        const { error } = await supabase.from('bpharm_student_records').update(payload).eq('id', existingRecord.id);
        if (error) throw error;
        setExistingRecord({ ...existingRecord, ...payload });
      } else {
        const { data, error } = await supabase.from('bpharm_student_records').insert([payload]).select().single();
        if (error) throw error;
        setExistingRecord(data);
      }

      showNotification({ type: 'success', message: submit ? 'Experiment submitted for grading!' : 'Progress saved successfully.' });
    } catch (err) {
      showNotification({ type: 'error', message: `Failed to save: ${err.message}` });
    } finally {
      loadingState(false);
    }
  };

  const isReadOnly = mode === 'Learning' || existingRecord?.status === 'Submitted';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                 mode === 'Learning' ? 'bg-sky-100 text-sky-700' :
                 mode === 'Experimentation' ? 'bg-indigo-100 text-indigo-700' :
                 'bg-rose-100 text-rose-700'
               }`}>
                 {mode} Mode
              </span>
              {existingRecord?.status === 'Submitted' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                  Submitted
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight flex items-center gap-2">
              {master?.experiment_number && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                  Exp {master.experiment_number}
                </span>
              )}
              {master?.experiment_title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <>
              <button 
                onClick={() => handleSave(false)}
                disabled={isSaving || isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Draft
              </button>
              <button 
                onClick={() => handleSave(true)}
                disabled={isSaving || isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit
              </button>
            </>
          )}
        </div>
      </div>

      {notification && (
        <div className={`m-6 mb-0 p-4 rounded-xl text-sm font-bold border ${notification.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {notification.message}
        </div>
      )}

      {/* Engine Canvas */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
          
          {mode === 'Exam' && (
             <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-center gap-3 text-amber-800 dark:text-amber-400">
               <Lock className="w-5 h-5 shrink-0" />
               <p className="text-sm font-medium">Exam Mode Active: Theory, instructions, and media blocks are hidden. Complete the observation tables from memory.</p>
             </div>
          )}

          {blocks.map((block) => {
            // EXAM MODE LOGIC: HIDE THEORY & MEDIA
            if (mode === 'Exam' && (block.type === 'text' || block.type === 'media')) {
              return null;
            }

            return (
              <div key={block.id} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/70 dark:border-slate-800">
                {block.heading && (
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <span className={`w-1.5 h-6 rounded-full inline-block ${
                      block.type === 'table' ? 'bg-emerald-500' :
                      block.type === 'graph' ? 'bg-indigo-500' : 'bg-slate-400'
                    }`}></span>
                    {block.heading}
                  </h3>
                )}
                
                {block.type === 'text' && (
                  <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                    {block.content}
                  </div>
                )}

                {block.type === 'media' && (
                  <div className="flex justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-2 sm:p-4 border border-slate-100 dark:border-slate-800">
                     {block.content ? (
                        block.content.includes('youtube.com') || block.content.includes('youtu.be') ? (
                          <iframe 
                            src={block.content.replace('watch?v=', 'embed/')} 
                            className="w-full aspect-video rounded-xl"
                            allowFullScreen
                          />
                        ) : (
                          <img src={block.content} alt="Experiment Media" className="max-h-96 rounded-xl shadow-sm object-contain" />
                        )
                     ) : null}
                  </div>
                )}

                {block.type === 'table' && (() => {
                  const cols = Array.isArray(block.content) ? block.content : typeof block.content === 'string' ? block.content.split(',').map(s=>s.trim()) : [];
                  const currentRows = (tableData[block.id] || []).map(r => r.values || []);
                  const { data: parsedData, lines: parsedLines } = parseMultiCurveGraphData(cols, currentRows, block.customCurves);

                  return (
                    <div className="space-y-4">
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              {cols.map((col, i) => (
                                <th key={i} className="px-4 py-3 text-sm font-black text-slate-700 dark:text-slate-300 whitespace-nowrap">{col}</th>
                              ))}
                              {!isReadOnly && <th className="px-4 py-3 w-10"></th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(tableData[block.id] || []).map((row, rowIndex) => (
                              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                {cols.map((_, colIndex) => (
                                  <td key={colIndex} className="p-2 sm:p-3">
                                    <input 
                                      type="text" 
                                      disabled={isReadOnly}
                                      value={row.values[colIndex] || ''}
                                      onChange={(e) => handleCellChange(block.id, rowIndex, colIndex, e.target.value)}
                                      placeholder={isReadOnly ? '-' : 'Type...'}
                                      className="w-full p-2 text-sm bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none disabled:opacity-70 disabled:bg-slate-50 dark:disabled:bg-slate-900 transition-all font-mono" 
                                    />
                                  </td>
                                ))}
                                {!isReadOnly && (
                                  <td className="p-2 sm:p-3 text-center">
                                    <button onClick={() => removeRow(block.id, rowIndex)} className="text-rose-400 hover:text-rose-600 font-bold p-1">✕</button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {!isReadOnly && (
                        <button 
                          onClick={() => addRow(block.id, cols.length)}
                          className="mt-3 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center gap-1.5"
                        >
                          <TableIcon className="w-3.5 h-3.5" /> Add Row
                        </button>
                      )}

                      {parsedData.length > 0 && parsedLines.length > 0 && (
                        <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                            <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                              Plotted Observation Graph Curve
                            </span>
                          </div>
                          <div className="h-64 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={parsedData} margin={{ top: 25, right: 30, bottom: 25, left: 25 }}>
                                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" opacity={0.2} />
                                <XAxis dataKey="x" tick={{ fontSize: 10 }} label={{ value: block.xAxis || cols[0] || 'Dose', position: 'insideBottom', offset: -15, fontSize: 11, fontWeight: 'black', fill: '#475569' }} />
                                <YAxis tick={{ fontSize: 10 }} label={{ value: block.yAxis || cols[1] || 'Response', angle: -90, position: 'insideLeft', offset: -10, fontSize: 11, fontWeight: 'black', fill: '#475569' }} />
                                <Tooltip />
                                <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: 11, fontWeight: 'bold', paddingBottom: 15 }} />
                                {parsedLines.map(line => (
                                  <Line key={line.key} type="monotone" dataKey={line.key} name={line.name} stroke={line.color} strokeWidth={3} dot={{ r: 5, fill: line.color }} />
                                ))}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                
                {block.type === 'procedure' && (
                  <div className="flex flex-col items-center justify-center max-w-xl mx-auto py-4 space-y-3">
                    {Array.isArray(block.content) && block.content.map((stepItem, sIdx) => {
                      const stepId = stepItem.id || `step-${sIdx}`;
                      const isDone = (completedSteps[block.id] || []).includes(stepId);
                      
                      return (
                        <React.Fragment key={stepId}>
                          <div className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 text-center relative shadow-xs ${
                            isDone 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-300' 
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white hover:border-indigo-400'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isDone ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                              }`}>
                                Step {sIdx + 1}
                              </span>

                              <button
                                type="button"
                                onClick={() => toggleStepCompletion(block.id, stepId)}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  isDone 
                                    ? 'bg-emerald-600 text-white shadow-xs' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {isDone ? 'Done ✓' : 'Mark as Completed'}
                              </button>
                            </div>

                            <p className="font-extrabold text-base leading-relaxed text-center">
                              {stepItem.instruction || stepItem.detail || stepItem.title || 'Step instruction...'}
                            </p>
                          </div>

                          {sIdx < block.content.length - 1 && (
                            <ArrowDown className={`w-5 h-5 transition-colors my-1 ${
                              isDone ? 'text-emerald-500' : 'text-indigo-400 animate-bounce'
                            }`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

                {block.type === 'graph' && (
                  <div className="h-[350px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getGraphData(block)} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                        <Line type="monotone" dataKey="y" stroke="#4f46e5" strokeWidth={3} dot={{ r: 5, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" opacity={0.2} />
                        <XAxis dataKey="x" label={{ value: block.content?.xAxis || 'X Axis', position: 'insideBottom', offset: -10 }} tick={{fontSize: 12}} />
                        <YAxis label={{ value: block.content?.yAxis || 'Y Axis', angle: -90, position: 'insideLeft' }} tick={{fontSize: 12}} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {block.type === 'code' && (
                  <div 
                    className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900"
                    dangerouslySetInnerHTML={{ __html: block.content }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

