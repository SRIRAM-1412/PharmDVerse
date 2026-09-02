import React, { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Power, Trash2, AlignLeft, Image as ImageIcon, Table, ChevronUp, ChevronDown, Save, X, FlaskConical, Activity, Code, GitCommit, ListOrdered, CheckCircle2, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useInlineNotification } from '../../hooks/useInlineNotification';

export const BPharmExperimentMasterView = ({ subjectName }) => {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [previewExp, setPreviewExp] = useState(null); // State for Preview Mode
  
  const { notification, showNotification, clearNotification } = useInlineNotification();

  
  // Word Paste Sanitizer
  const handleTextPaste = (e, blockId) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const html = clipboardData.getData('text/html');
    const plainText = clipboardData.getData('text/plain');

    let cleaned = '';

    if (html) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        doc.querySelectorAll('script, style, meta, xml').forEach(el => el.remove());

        const lines = [];
        doc.body.childNodes.forEach(node => {
          let text = node.textContent ? node.textContent.trim() : '';
          if (!text) return;
          lines.push(text);
        });

        cleaned = lines.join('\n\n').replace(/\n{3,}/g, '\n\n');
      } catch (err) {
        cleaned = plainText;
      }
    }

    if (!cleaned && plainText) {
      cleaned = plainText;
    }

    if (cleaned) {
      e.preventDefault();
      const currentText = blocks.find(b => b.id === blockId)?.content || '';
      updateBlock(blockId, 'content', currentText ? `${currentText}\n\n${cleaned}` : cleaned);
    }
  };

  // Convert Text block list to Flowchart steps
  const convertTextToFlowchart = (textBlockContent) => {
    if (!textBlockContent || typeof textBlockContent !== 'string') return [];
    const lines = textBlockContent.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.map((line, idx) => {
      const cleanStep = line.replace(/^[0-9]+[.\)]\s*/, '').replace(/^[-•*]\s*/, '');
      return {
        id: (Date.now() + idx).toString(),
        step: `Step ${idx + 1}`,
        detail: cleanStep
      };
    });
  };

  // Builder State
  const [editingId, setEditingId] = useState(null);
  const [experimentTitle, setExperimentTitle] = useState('');
  const [blocks, setBlocks] = useState([]);

  // Fetch from DB
  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bpharm_master_experiments')
        .select('*')
        .eq('subject_name', subjectName)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setExperiments(data || []);
    } catch (err) {
      console.log("Table likely doesn't exist yet.", err.message);
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, [subjectName]);

  // Block Management
  const addBlock = (type) => {
    let content = '';
    if (type === 'table') content = [];
    if (type === 'graph') content = { xAxis: '', yAxis: '' };
    if (type === 'flowchart') content = [{ id: Date.now().toString(), step: 'Step 1', detail: 'Procedure detail...' }];
    
    const newBlock = {
      id: Date.now().toString(),
      type,
      heading: '',
      content
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id, field, value) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlock = (id) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    setBlocks(newBlocks);
  };

  // Save Experiment
  const handleSave = async () => {
    if (!experimentTitle.trim()) {
      showNotification({ type: 'error', message: 'Experiment Title is required.' });
      return;
    }
    
    try {
      const payload = {
        subject_name: subjectName,
        experiment_title: experimentTitle,
        experiment_content: blocks
      };

      if (editingId) {
        const { error } = await supabase.from('bpharm_master_experiments').update(payload).eq('id', editingId);
        if (error) throw error;
        showNotification({ type: 'success', message: 'Experiment updated successfully!' });
      } else {
        const { error } = await supabase.from('bpharm_master_experiments').insert([payload]);
        if (error) throw error;
        showNotification({ type: 'success', message: 'Experiment created successfully!' });
      }

      setShowBuilder(false);
      fetchExperiments();
    } catch (err) {
      showNotification({ type: 'error', message: `Database error: (${err.message})` });
    }
  };

  // Actions
  const handleToggleActive = async (exp) => {
    try {
      const { error } = await supabase
        .from('bpharm_master_experiments')
        .update({ is_active: !exp.is_active })
        .eq('id', exp.id);
      if (error) throw error;
      showNotification({ type: 'success', message: `Experiment ${exp.is_active ? 'deactivated' : 'activated'} successfully!` });
      fetchExperiments();
    } catch (err) {
      showNotification({ type: 'error', message: 'Failed to update status.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this experiment?")) return;
    try {
      const { error } = await supabase
        .from('bpharm_master_experiments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      showNotification({ type: 'success', message: 'Experiment deleted successfully!' });
      fetchExperiments();
    } catch (err) {
      showNotification({ type: 'error', message: 'Failed to delete experiment.' });
    }
  };

  const openBuilder = (exp = null) => {
    clearNotification();
    if (exp) {
      setEditingId(exp.id);
      setExperimentTitle(exp.experiment_title);
      setBlocks(exp.experiment_content || []);
    } else {
      setEditingId(null);
      setExperimentTitle('');
      setBlocks([]);
    }
    setShowBuilder(true);
  };

  // RENDER PREVIEW MODE
  if (previewExp) {
    const blocksToRender = previewExp.experiment_content || [];
    return (
      <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                Student Preview Mode
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white">
              {previewExp.experiment_title}
            </h2>
          </div>
          <button onClick={() => setPreviewExp(null)} className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="max-w-4xl mx-auto w-full space-y-8 pb-20">
          {blocksToRender.length === 0 && (
            <div className="text-center text-slate-500 font-bold p-10">This experiment has no content yet.</div>
          )}
          {blocksToRender.map((block, idx) => (
            <div key={block.id} className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              {block.heading && (
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
                  {block.heading}
                </h3>
              )}
              
              {block.type === 'text' && (
                <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                  {block.content || <span className="italic opacity-50">Empty text block</span>}
                </div>
              )}

              {block.type === 'media' && (
                <div className="flex justify-center bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                  {block.content ? (
                    block.content.includes('youtube.com') || block.content.includes('youtu.be') ? (
                       <div className="text-slate-500 font-bold text-sm">YouTube Video Placeholder</div>
                    ) : (
                       <img src={block.content} alt="Media" className="max-h-80 rounded-lg shadow-sm" onError={(e) => e.target.style.display = 'none'} />
                    )
                  ) : <span className="italic opacity-50 text-slate-500">No media URL provided</span>}
                </div>
              )}

              {block.type === 'table' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        {Array.isArray(block.content) && block.content.map((col, i) => (
                          <th key={i} className="px-4 py-3 text-sm font-black text-slate-700 dark:text-slate-300">{col || `Column ${i+1}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        {Array.isArray(block.content) && block.content.map((_, i) => (
                          <td key={i} className="p-3"><input type="text" disabled placeholder="Student types here..." className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50" /></td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {block.type === 'graph' && (
                <div className="h-64 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-500">
                  <Activity className="w-10 h-10 mb-3 opacity-50" />
                  <div className="font-black text-lg">Dynamic Graph Area</div>
                  <div className="text-sm font-medium mt-1">Y-Axis: {block.content?.yAxis || '?'} | X-Axis: {block.content?.xAxis || '?'}</div>
                  <div className="text-xs mt-2 opacity-75">Graph will auto-plot when student enters data</div>
                </div>
              )}

              
              {block.type === 'flowchart' && (
                <div className="flex flex-col items-center justify-center max-w-2xl mx-auto py-4 space-y-3">
                  {Array.isArray(block.content) && block.content.map((stepItem, sIdx) => (
                    <React.Fragment key={stepItem.id || sIdx}>
                      <div className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-950 p-4 rounded-2xl shadow-xs text-center relative hover:border-indigo-400 transition-all">
                        <span className="px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider mb-1 inline-block">
                          {stepItem.step || `Step ${sIdx + 1}`}
                        </span>
                        <p className="text-slate-800 dark:text-white font-bold text-sm leading-relaxed">
                          {stepItem.detail || stepItem.title || 'Step description'}
                        </p>
                      </div>
                      {sIdx < block.content.length - 1 && (
                        <ArrowDown className="w-5 h-5 text-indigo-500 animate-bounce my-1" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {block.type === 'code' && (
                <div className="h-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-sm">
                   [ Interactive Simulation / Custom Code Rendered Here ]
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // RENDER BUILDER MODE
  if (showBuilder) {
    return (
      <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              {editingId ? 'Edit Experiment' : 'Create New Experiment'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Subject: {subjectName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowBuilder(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 font-bold hover:bg-slate-100 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-md shadow-emerald-600/20">
              <Save className="w-4 h-4" /> Save Experiment
            </button>
          </div>
        </div>

        {notification && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-bold border ${notification.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {notification.message}
          </div>
        )}

        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Experiment Title</label>
          <input 
            type="text" 
            value={experimentTitle}
            onChange={(e) => setExperimentTitle(e.target.value)}
            placeholder="e.g., Effect of drugs on rabbit eye" 
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
          />
        </div>

        <div className="space-y-4 mb-8">
          {blocks.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
              <p className="text-slate-500 dark:text-slate-400 font-bold mb-2">No blocks added yet.</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">Use the buttons below to start building your experiment structure.</p>
            </div>
          ) : (
            blocks.map((block, index) => (
              <div key={block.id} className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs">
                      {index + 1}
                    </span>
                    <input 
                      type="text" 
                      value={block.heading}
                      onChange={(e) => updateBlock(block.id, 'heading', e.target.value)}
                      placeholder="Section Heading (e.g., Aim, Principle)" 
                      className="text-lg font-black bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none text-slate-800 dark:text-white transition-colors"
                    />
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      {block.type === 'text' && <><AlignLeft className="w-3 h-3"/> Text Block</>}
                      {block.type === 'media' && <><ImageIcon className="w-3 h-3"/> Media Block</>}
                      {block.type === 'table' && <><Table className="w-3 h-3"/> Table Block</>}
                      {block.type === 'graph' && <><Activity className="w-3 h-3"/> Graph Config</>}
                      {block.type === 'code' && <><Code className="w-3 h-3"/> Custom Embed</>}
                      {block.type === 'flowchart' && <><GitCommit className="w-3 h-3"/> Procedure Flowchart</>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => removeBlock(block.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 ml-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {block.type === 'text' && (
                  <textarea 
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                    onPaste={(e) => handleTextPaste(e, block.id)}
                    placeholder="Enter text content here (Word paste auto-cleaned)..."
                    rows={4}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
                  />
                )}
                
                {block.type === 'media' && (
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                      placeholder="Paste Image/Video URL or YouTube Link..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium font-mono text-sm"
                    />
                  </div>
                )}

                {block.type === 'table' && (
                  <div>
                    <input 
                      type="text" 
                      value={Array.isArray(block.content) ? block.content.join(', ') : block.content}
                      onChange={(e) => updateBlock(block.id, 'content', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="Enter column names separated by commas (e.g., Time, Pupil Size, Heart Rate)"
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
                    />
                  </div>
                )}

                {block.type === 'graph' && (
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={block.content?.xAxis || ''}
                        onChange={(e) => updateBlock(block.id, 'content', { ...block.content, xAxis: e.target.value })}
                        placeholder="X-Axis Label (e.g., Dose)"
                        className="w-1/2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
                      />
                      <input 
                        type="text" 
                        value={block.content?.yAxis || ''}
                        onChange={(e) => updateBlock(block.id, 'content', { ...block.content, yAxis: e.target.value })}
                        placeholder="Y-Axis Label (e.g., Response)"
                        className="w-1/2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
                      />
                    </div>
                  </div>
                )}

                {block.type === 'code' && (
                  <textarea 
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                    placeholder="<iframe src='...' width='100%' height='500px'></iframe>"
                    rows={5}
                    className="w-full p-4 rounded-xl border border-slate-800 bg-slate-900 text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Block Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => addBlock('text')} className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md font-bold text-sm transition-all flex items-center gap-2">
            <AlignLeft className="w-4 h-4" /> Text
          </button>
          <button onClick={() => addBlock('media')} className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md font-bold text-sm transition-all flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Media
          </button>
          <button onClick={() => addBlock('table')} className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md font-bold text-sm transition-all flex items-center gap-2">
            <Table className="w-4 h-4" /> Table
          </button>
          <button onClick={() => addBlock('graph')} className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:shadow-md font-bold text-sm transition-all flex items-center gap-2">
            <Activity className="w-4 h-4" /> Graph Config
          </button>
          <button onClick={() => addBlock('flowchart')} className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md font-bold text-sm transition-all flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-indigo-600" /> Procedure Flowchart
          </button>
          <button onClick={() => addBlock('code')} className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-400 hover:shadow-md font-bold text-sm transition-all flex items-center gap-2">
            <Code className="w-4 h-4" /> Code Embed
          </button>
        </div>
      </div>
    );
  }

  // RENDER LIST VIEW
  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-1">
            {subjectName} Master
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage master experiment templates for this subject.</p>
        </div>
        <button 
          onClick={() => openBuilder()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Build New Experiment
        </button>
      </div>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-bold border ${notification.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {notification.message}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : experiments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-4">
            <FlaskConical className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">No Experiments Found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            Click "Build New Experiment" to create your first master template.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Experiment Title</th>
                <th className="p-4">Sections</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">
              {experiments.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white">{exp.experiment_title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Created: {new Date(exp.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold">
                      {Array.isArray(exp.experiment_content) ? exp.experiment_content.length : 0} Blocks
                    </span>
                  </td>
                  <td className="p-4">
                    {exp.is_active ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span> Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* PREVIEW BUTTON */}
                      <button 
                        onClick={() => setPreviewExp(exp)}
                        className="p-2 rounded-xl text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/30 transition-colors"
                        title="Student Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* EDIT BUTTON */}
                      <button 
                        onClick={() => openBuilder(exp)}
                        className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
                        title="Edit Master Template"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {/* TOGGLE ACTIVE BUTTON */}
                      <button 
                        onClick={() => handleToggleActive(exp)}
                        className={`p-2 rounded-xl transition-colors ${exp.is_active ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-500 dark:hover:bg-amber-900/30' : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-900/30'}`}
                        title={exp.is_active ? "Deactivate Experiment" : "Activate Experiment"}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      {/* DELETE BUTTON */}
                      <button 
                        onClick={() => handleDelete(exp.id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 transition-colors"
                        title="Permanently Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

