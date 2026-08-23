import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Award, Briefcase, Building2, CheckSquare, Square, Trash2, Calendar, FileText, Save, RotateCcw, X, Loader2, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { fetchPreceptorsFromSupabase, fetchStudentsFromSupabase, fetchAssignmentsFromSupabase, assignStudentsToPreceptorInSupabase } from '../../services/supabaseService';

export const AssignStudentsView = ({ college, onCancel, onSuccess }) => {
  const [preceptors, setPreceptors] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedPreceptorId, setSelectedPreceptorId] = useState('');
  
  // Roll Number Search State
  const [rollSearchQuery, setRollSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Assignment Details
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Active');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!college) return;
      setLoading(true);
      const [precRes, studRes, assignRes] = await Promise.all([
        fetchPreceptorsFromSupabase(college.id),
        fetchStudentsFromSupabase(college.id),
        fetchAssignmentsFromSupabase(college.id)
      ]);

      if (precRes.success) {
        const activePrec = (precRes.data || precRes.preceptors || []).filter(p => p.status === 'Active');
        setPreceptors(activePrec);
      }

      let assignedStudentIds = new Set();
      if (assignRes.success && assignRes.data) {
        assignedStudentIds = new Set(
          assignRes.data
            .filter(a => a.status === 'Active')
            .map(a => a.student_id)
        );
      }

      if (studRes.success) {
        const allActiveStudents = studRes.data || studRes.students || [];
        // Only keep unassigned active students (candidates with NO active preceptor assignment)
        const unassignedStudents = allActiveStudents.filter(
          s => s.status === 'Active' && !assignedStudentIds.has(s.id)
        );
        setStudents(unassignedStudents);
      }

      setLoading(false);
    };

    loadInitialData();
  }, [college]);

  const selectedPreceptor = preceptors.find(p => p.id === selectedPreceptorId);

  // STRICT ROLL NUMBER SEARCH FILTER
  const filteredStudentsByRoll = students.filter(s => 
    s.roll_number?.toLowerCase().includes(rollSearchQuery.trim().toLowerCase())
  );

  const handleSelectAll = () => {
    const visibleIds = filteredStudentsByRoll.map(s => s.id);
    const newSelected = Array.from(new Set([...selectedStudentIds, ...visibleIds]));
    setSelectedStudentIds(newSelected);
  };

  const handleRemoveSelected = () => {
    setSelectedStudentIds([]);
  };

  const handleToggleStudentSelection = (sId) => {
    if (selectedStudentIds.includes(sId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== sId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, sId]);
    }
  };

  const handleReset = () => {
    setSelectedPreceptorId('');
    setRollSearchQuery('');
    setSelectedStudentIds([]);
    setAssignmentDate(new Date().toISOString().split('T')[0]);
    setStatus('Active');
    setRemarks('');
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedPreceptorId) {
      setFormError('Please select a Preceptor.');
      return;
    }

    if (selectedStudentIds.length === 0) {
      setFormError('Please select at least one student by Roll Number to assign.');
      return;
    }

    setSaving(true);
    const res = await assignStudentsToPreceptorInSupabase({
      collegeId: college.id,
      preceptorId: selectedPreceptorId,
      studentIds: selectedStudentIds,
      assignmentDate,
      remarks,
      status
    });
    setSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onSuccess) onSuccess();
      }, 1200);
    } else {
      setFormError(res.error || 'Failed to assign students.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Assign Students to Preceptor</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Map Pharm.D candidates to ward preceptors for <strong className="text-slate-800 dark:text-slate-200">{college?.name}</strong>.
          </p>
        </div>

        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Assignments created successfully! Redirecting to Assignment List...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. PRECEPTOR SELECTION */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            1. Select Preceptor
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Preceptor * (Displays Full Name)
              </label>
              <select
                value={selectedPreceptorId}
                onChange={(e) => setSelectedPreceptorId(e.target.value)}
                required
                className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none font-bold"
              >
                <option value="">-- Choose Clinical Preceptor --</option>
                {preceptors.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Read-Only Preceptor Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Preceptor Information (Read Only)</span>
              {selectedPreceptor ? (
                <div className="grid grid-cols-3 gap-2 font-medium text-slate-700 dark:text-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Qualification</span>
                    <strong className="font-bold">{selectedPreceptor.qualification}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Designation</span>
                    <strong className="font-bold">{selectedPreceptor.designation}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Department</span>
                    <strong className="font-bold text-indigo-600 dark:text-indigo-400">{selectedPreceptor.department}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">Select a preceptor to view details.</p>
              )}
            </div>
          </div>
        </div>

        {/* 2. STUDENT SELECTION (STRICTLY ROLL NUMBER SEARCH) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>2. Select Unassigned Students (Strictly by Roll Number)</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {students.length} Unassigned Candidates
              </span>
            </div>

            {/* Select All / Remove Selected Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleRemoveSelected}
                className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800 transition-colors"
              >
                Remove Selected ({selectedStudentIds.length})
              </button>
            </div>
          </div>

          {/* Search Box strictly by Roll Number */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={rollSearchQuery}
              onChange={(e) => setRollSearchQuery(e.target.value)}
              placeholder="Search strictly by Roll Number (e.g. 26PHD001)..."
              className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
            />
          </div>

          {/* Student Cards List */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {filteredStudentsByRoll.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                No students found matching Roll Number search query.
              </p>
            ) : (
              filteredStudentsByRoll.map(s => {
                const isSelected = selectedStudentIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => handleToggleStudentSelection(s.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-xs'
                        : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="text-emerald-600 dark:text-emerald-400 shrink-0">
                        {isSelected ? <CheckSquare className="w-5 h-5 fill-emerald-600 text-white dark:fill-emerald-500 dark:text-slate-900" /> : <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />}
                      </div>

                      {s.profile_photo_url ? (
                        <img src={s.profile_photo_url} alt={s.full_name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xs shrink-0">
                          {s.full_name ? s.full_name.substring(0, 2).toUpperCase() : 'ST'}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-mono font-extrabold text-slate-900 dark:text-white">{s.roll_number}</strong>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">• {s.full_name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {s.year} • Batch {s.batch} • {s.course} • Mobile: {s.mobile_number || '—'}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                      s.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. ASSIGNMENT DETAILS */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            3. Assignment Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Assignment Date * (Default: Today's Date)
              </label>
              <input
                type="date"
                required
                value={assignmentDate}
                onChange={(e) => setAssignmentDate(e.target.value)}
                className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-[46px] px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-bold text-emerald-600 dark:text-emerald-400"
              >
                <option value="Active">Active Assignment</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add optional notes or clinical ward round guidelines for preceptor..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="h-[48px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Form</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="h-[48px] px-6 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-[48px] px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assigning Students...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Assign Students ({selectedStudentIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};
