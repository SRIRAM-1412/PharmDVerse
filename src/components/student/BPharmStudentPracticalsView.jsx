import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useInlineNotification } from '../../hooks/useInlineNotification';
import { FlaskConical, BookOpen, Activity, Clock, Loader2, ChevronRight, FileEdit, PlayCircle, FolderOpen } from 'lucide-react';
import { BPharmExperimentEngine } from './BPharmExperimentEngine';

export const BPharmStudentPracticalsView = ({ student }) => {
  const [activeSubject, setActiveSubject] = useState('General Pharmacology');
  const [activeMode, setActiveMode] = useState('Learning');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for opening an experiment
  const [activeExperiment, setActiveExperiment] = useState(null);

  const { notification, showNotification } = useInlineNotification();

  const subjects = [
    'General Pharmacology',
    'Systemic Pharmacology-I',
    'Systemic Pharmacology-II'
  ];

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      // In production, you would match student.batch or student.academic_year
      // For now, we'll fetch all assignments for the college to demonstrate the flow
      const { data, error } = await supabase
        .from('bpharm_assignments')
        .select(`
          *,
          master:bpharm_master_experiments(*)
        `)
        .eq('college_id', student.college_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setAssignments(data || []);
    } catch (err) {
      console.log('Error fetching assignments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (student?.college_id && !activeExperiment) {
      fetchAssignments();
    }
  }, [student, activeSubject, activeExperiment]);

  // Filter assignments by current subject and mode, and remove any duplicates
  const displayedAssignments = assignments.filter(a => 
    a.master?.subject_name === activeSubject && 
    a.mode === activeMode
  ).reduce((unique, item) => {
    if (!unique.find(i => i.master?.id === item.master?.id)) {
      unique.push(item);
    }
    return unique;
  }, []);

  // If a student clicks an experiment, we render the Engine instead of the list
  if (activeExperiment) {
    return (
      <BPharmExperimentEngine 
        student={student} 
        assignment={activeExperiment} 
        onBack={() => setActiveExperiment(null)}
      />
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-[500px] flex flex-col h-full rounded-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-2">
          <FlaskConical className="w-7 h-7 text-indigo-500" />
          My Pharmacology Practicals
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Select a subject and choose your execution mode to begin your assigned experiments.
        </p>
      </div>

      {/* 1. SUBJECT FOLDERS */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {subjects.map(subject => (
          <button
            key={subject}
            onClick={() => setActiveSubject(subject)}
            className={`px-5 py-3 rounded-2xl text-sm font-black whitespace-nowrap transition-all flex items-center gap-2 ${
              activeSubject === subject 
                ? 'bg-white dark:bg-slate-950 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-md' 
                : 'bg-white dark:bg-slate-800 border-2 border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shadow-sm hover:shadow'
            }`}
          >
            <FolderOpen className="w-4 h-4" /> {subject}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col overflow-hidden">
        
        {/* 2. MODE TABS */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            onClick={() => setActiveMode('Learning')}
            className={`flex-1 p-4 flex items-center justify-center gap-2 font-bold text-sm transition-colors border-b-2 ${
              activeMode === 'Learning' ? 'border-sky-500 text-sky-600 bg-sky-50/30' : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeMode === 'Learning' ? 'text-sky-500' : ''}`} /> Learning
          </button>
          
          <button 
            onClick={() => setActiveMode('Experimentation')}
            className={`flex-1 p-4 flex items-center justify-center gap-2 font-bold text-sm transition-colors border-b-2 border-l border-slate-200 dark:border-slate-800 ${
              activeMode === 'Experimentation' ? 'border-b-indigo-500 text-indigo-600 bg-indigo-50/30' : 'border-b-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Activity className={`w-4 h-4 ${activeMode === 'Experimentation' ? 'text-indigo-500' : ''}`} /> Experimentation
          </button>
          
          <button 
            onClick={() => setActiveMode('Exam')}
            className={`flex-1 p-4 flex items-center justify-center gap-2 font-bold text-sm transition-colors border-b-2 border-l border-slate-200 dark:border-slate-800 ${
              activeMode === 'Exam' ? 'border-b-rose-500 text-rose-600 bg-rose-50/30' : 'border-b-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Clock className={`w-4 h-4 ${activeMode === 'Exam' ? 'text-rose-500' : ''}`} /> Exam
          </button>
        </div>

        {/* 3. ASSIGNMENT LIST */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-900/20">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : displayedAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <FileEdit className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Assignments Yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                Your preceptor has not assigned any experiments in {activeMode} mode for {activeSubject}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedAssignments.map(assignment => (
                <div key={assignment.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-shadow group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                       <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                         activeMode === 'Learning' ? 'bg-sky-100 text-sky-700' :
                         activeMode === 'Experimentation' ? 'bg-indigo-100 text-indigo-700' :
                         'bg-rose-100 text-rose-700'
                       }`}>
                         {activeMode} Mode
                       </span>
                    </div>
                    <h4 className="font-black text-lg text-slate-800 dark:text-white leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                      {assignment.master?.experiment_title || 'Untitled Experiment'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Assigned Batch: {assignment.target_batch}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => setActiveExperiment(assignment)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" /> Start {activeMode}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

