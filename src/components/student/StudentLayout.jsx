import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Stethoscope, User, LogOut, Sun, Moon, Menu, X, UserCheck, ShieldCheck, ClipboardList, FilePlus2, FolderKanban, Bell, Sparkles, FileSearch } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

import { StudentDashboardView } from './StudentDashboardView';
import { StudentMyPreceptorView } from './StudentMyPreceptorView';
import { StudentProfileView } from './StudentProfileView';
import { AddNewCaseView } from './AddNewCaseView';
import { MyClinicalCasesView } from './MyClinicalCasesView';
import { StudentAiAnalysisView } from './StudentAiAnalysisView';
import { StudentDocReviewView } from './StudentDocReviewView';
import { PatientProfileFormView } from '../patientProfile/PatientProfileFormView';
import { PatientCounsellingFormView } from '../patientCounselling/PatientCounsellingFormView';
import { PharmacistInterventionFormView } from '../pharmacistIntervention/PharmacistInterventionFormView';
import { DrugInformationFormView } from '../drugInformationRequest/DrugInformationFormView';
import { ADRDocumentationFormView } from '../adrDocumentation/ADRDocumentationFormView';
import { NotificationsView } from '../common/NotificationsView';
import { LeaveWorkspaceModal } from '../modals/LeaveWorkspaceModal';
import { LogoutConfirmModal } from '../modals/LogoutConfirmModal';
import { LogoPreviewModal } from '../modals/LogoPreviewModal';
import { useWorkspaceHistory } from '../../hooks/useWorkspaceHistory';

import { fetchUnreadNotificationsCountFromSupabase } from '../../services/supabaseService';

export const StudentLayout = ({ student, onLogout }) => {
  const { isDark, toggleTheme } = useTheme();
  const { activeTab, setActiveTab, pushTab, showLeaveModal, setShowLeaveModal } = useWorkspaceHistory('dashboard');
  const [caseFilter, setCaseFilter] = useState('All');
  const [selectedCaseForForm, setSelectedCaseForForm] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [forcePasswordReset, setForcePasswordReset] = useState(student?.force_password_reset || false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const loadUnreadCount = async () => {
    if (!student?.id) return;
    const res = await fetchUnreadNotificationsCountFromSupabase(student.id);
    if (res.success) {
      setUnreadCount(res.count || 0);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    // Poll notifications every 30 seconds for real-time feel
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [student?.id, activeTab]);

  // Force Password Reset: auto-navigate to profile tab and block other navigation
  useEffect(() => {
    if (forcePasswordReset) {
      setActiveTab('profile');
    }
  }, [forcePasswordReset]);

  const [targetCaseId, setTargetCaseId] = useState(null);

  const handleNavigate = (tab, filter = 'All', caseId = null) => {
    // Block navigation if force password reset is active
    if (forcePasswordReset && tab !== 'profile') return;
    setCaseFilter(filter);
    setTargetCaseId(caseId || null);
    pushTab(tab);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadUnreadCount();
  };

  const [navSourceTab, setNavSourceTab] = useState(null);
  const [targetHighlightField, setTargetHighlightField] = useState(null);

  const handleOpenPatientProfile = (clinicalCase, sourceTab = null, highlightFieldId = null) => {
    setSelectedCaseForForm(clinicalCase);
    if (sourceTab) setNavSourceTab(sourceTab);
    setTargetHighlightField(highlightFieldId || null);
    handleNavigate('patient-profile');
  };

  const handleOpenPatientCounselling = (clinicalCase, sourceTab = null, highlightFieldId = null) => {
    setSelectedCaseForForm(clinicalCase);
    if (sourceTab) setNavSourceTab(sourceTab);
    setTargetHighlightField(highlightFieldId || null);
    handleNavigate('patient-counselling');
  };

  const handleOpenPharmacistIntervention = (clinicalCase, sourceTab = null, highlightFieldId = null) => {
    setSelectedCaseForForm(clinicalCase);
    if (sourceTab) setNavSourceTab(sourceTab);
    setTargetHighlightField(highlightFieldId || null);
    handleNavigate('pharmacist-intervention');
  };

  const handleOpenDrugInformationRequest = (clinicalCase, sourceTab = null, highlightFieldId = null) => {
    setSelectedCaseForForm(clinicalCase);
    if (sourceTab) setNavSourceTab(sourceTab);
    setTargetHighlightField(highlightFieldId || null);
    handleNavigate('drug-info-request');
  };

  const handleOpenADRDocumentation = (clinicalCase, sourceTab = null, highlightFieldId = null) => {
    setSelectedCaseForForm(clinicalCase);
    if (sourceTab) setNavSourceTab(sourceTab);
    setTargetHighlightField(highlightFieldId || null);
    handleNavigate('adr-documentation');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 font-sans flex transition-colors duration-300">
      
      {/* 1. SIDEBAR (DESKTOP & MOBILE DRAWER) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 transform lg:translate-x-0 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          
          {/* SIDEBAR BRANDING HEADER */}
          <div className="h-16 px-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {student?.profile_photo_url ? (
                <img
                  src={student.profile_photo_url}
                  alt={student.full_name}
                  className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                  {student?.full_name ? student.full_name.substring(0, 2).toUpperCase() : 'ST'}
                </div>
              )}
              <div>
                <strong className="block text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[130px]">
                  {student?.full_name || 'Student'}
                </strong>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Roll: {student?.roll_number}
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SIDEBAR NAVIGATION ITEMS */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto text-xs font-semibold">
            
            {/* Dashboard */}
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`w-full h-11 px-3.5 rounded-xl flex items-center gap-3 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              } ${forcePasswordReset ? 'pointer-events-none opacity-40' : ''}`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>

            {/* CLINICAL CASE MANAGEMENT SECTION */}
            <div className="pt-2">
              <span className="px-3 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                Clinical Case Management
              </span>

              <div className="space-y-1 pl-1">
                <button
                  onClick={() => handleNavigate('add-new-case')}
                  className={`w-full h-10 px-3.5 rounded-xl flex items-center gap-3 transition-all ${
                    activeTab === 'add-new-case'
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${forcePasswordReset ? 'pointer-events-none opacity-40' : ''}`}
                >
                  <FilePlus2 className="w-4 h-4 shrink-0" />
                  <span>Add New Case</span>
                </button>

                <button
                  onClick={() => handleNavigate('my-cases')}
                  className={`w-full h-10 px-3.5 rounded-xl flex items-center gap-3 transition-all ${
                    activeTab === 'my-cases' || activeTab === 'patient-profile' || activeTab === 'patient-counselling' || activeTab === 'pharmacist-intervention' || activeTab === 'drug-info-request' || activeTab === 'adr-documentation'
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${forcePasswordReset ? 'pointer-events-none opacity-40' : ''}`}
                >
                  <FolderKanban className="w-4 h-4 shrink-0" />
                  <span>My Clinical Cases</span>
                </button>

                <button
                  onClick={() => handleNavigate('doc-review')}
                  className={`w-full h-10 px-3.5 rounded-xl flex items-center gap-3 transition-all ${
                    activeTab === 'doc-review'
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${forcePasswordReset ? 'pointer-events-none opacity-40' : ''}`}
                >
                  <FileSearch className="w-4 h-4 shrink-0" />
                  <span>Pre-Submission Review</span>
                </button>

                <button
                  onClick={() => handleNavigate('ai-analysis')}
                  className={`w-full h-10 px-3.5 rounded-xl flex items-center gap-3 transition-all ${
                    activeTab === 'ai-analysis'
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  } ${forcePasswordReset ? 'pointer-events-none opacity-40' : ''}`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>AI Clinical Case Analysis</span>
                </button>
              </div>
            </div>

            {/* My Preceptor */}
            <button
              onClick={() => handleNavigate('my-preceptor')}
              className={`w-full h-11 px-3.5 rounded-xl flex items-center gap-3 transition-all ${
                activeTab === 'my-preceptor'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              } ${forcePasswordReset ? 'pointer-events-none opacity-40' : ''}`}
            >
              <Stethoscope className="w-4 h-4 shrink-0" />
              <span>My Preceptor</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => handleNavigate('notifications')}
              className={`w-full h-11 px-3.5 rounded-xl flex items-center justify-between transition-all ${
                activeTab === 'notifications'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              } ${forcePasswordReset ? 'pointer-events-none opacity-40' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 shrink-0" />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="h-5 px-1.5 min-w-[20px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm leading-none shrink-0 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* My Profile */}
            <button
              onClick={() => handleNavigate('profile')}
              className={`w-full h-11 px-3.5 rounded-xl flex items-center gap-3 transition-all ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>My Profile</span>
            </button>

          </nav>

          {/* SIDEBAR FOOTER (LOGOUT & LIGHT/DARK TOGGLE) */}
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
            <button
              onClick={toggleTheme}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{isDark ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full h-10 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        
        {/* TOPBAR */}
        <header className="h-16 px-4 sm:px-8 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              {(student?.colleges?.college_logo_url || student?.colleges?.logoUrl) ? (
                <img
                  src={student?.colleges?.college_logo_url || student?.colleges?.logoUrl}
                  alt={student?.colleges?.college_name || 'College Logo'}
                  className="w-8 h-8 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-0.5 shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-xs border border-white/20">
                  {(student?.colleges?.college_name || 'CLG').substring(0, 3).toUpperCase()}
                </div>
              )}
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {student?.colleges?.college_name || 'Pharmacy College'} <span className="text-slate-400 font-normal text-xs hidden sm:inline">| Student Portal</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Student Workspace</span>
            </span>
          </div>
        </header>

        {/* VIEW ROUTER */}
        <main className="flex-1 p-4 sm:p-8">
          {activeTab === 'dashboard' && (
            <StudentDashboardView student={student} onNavigate={handleNavigate} />
          )}

          {activeTab === 'add-new-case' && (
            <AddNewCaseView
              student={student}
              onCancel={() => handleNavigate('my-cases')}
              onSuccess={() => handleNavigate('my-cases')}
            />
          )}

          {activeTab === 'my-cases' && (
            <MyClinicalCasesView
              student={student}
              initialFilter={caseFilter}
              targetCaseId={targetCaseId}
              onClearTargetCase={() => setTargetCaseId(null)}
              onAddNew={() => handleNavigate('add-new-case')}
              onOpenPatientProfile={handleOpenPatientProfile}
              onOpenPatientCounselling={handleOpenPatientCounselling}
              onOpenPharmacistIntervention={handleOpenPharmacistIntervention}
              onOpenDrugInformationRequest={handleOpenDrugInformationRequest}
              onOpenADRDocumentation={handleOpenADRDocumentation}
            />
          )}

          {activeTab === 'patient-profile' && (
            <PatientProfileFormView
              clinicalCase={selectedCaseForForm}
              student={student}
              highlightField={targetHighlightField}
              onBack={() => handleNavigate(navSourceTab === 'doc-review' ? 'doc-review' : 'my-cases')}
            />
          )}

          {activeTab === 'patient-counselling' && (
            <PatientCounsellingFormView
              clinicalCase={selectedCaseForForm}
              student={student}
              highlightField={targetHighlightField}
              onBack={() => handleNavigate(navSourceTab === 'doc-review' ? 'doc-review' : 'my-cases')}
            />
          )}

          {activeTab === 'pharmacist-intervention' && (
            <PharmacistInterventionFormView
              clinicalCase={selectedCaseForForm}
              student={student}
              highlightField={targetHighlightField}
              onBack={() => handleNavigate(navSourceTab === 'doc-review' ? 'doc-review' : 'my-cases')}
            />
          )}

          {activeTab === 'drug-info-request' && (
            <DrugInformationFormView
              clinicalCase={selectedCaseForForm}
              student={student}
              highlightField={targetHighlightField}
              onBack={() => handleNavigate(navSourceTab === 'doc-review' ? 'doc-review' : 'my-cases')}
            />
          )}

          {activeTab === 'adr-documentation' && (
            <ADRDocumentationFormView
              clinicalCase={selectedCaseForForm}
              student={student}
              highlightField={targetHighlightField}
              onBack={() => handleNavigate(navSourceTab === 'doc-review' ? 'doc-review' : 'my-cases')}
            />
          )}

          {activeTab === 'doc-review' && (
            <StudentDocReviewView
              student={student}
              onNavigate={handleNavigate}
              onOpenPatientProfile={(c, fId) => handleOpenPatientProfile(c, 'doc-review', fId)}
              onOpenPatientCounselling={(c, fId) => handleOpenPatientCounselling(c, 'doc-review', fId)}
              onOpenPharmacistIntervention={(c, fId) => handleOpenPharmacistIntervention(c, 'doc-review', fId)}
              onOpenDrugInformationRequest={(c, fId) => handleOpenDrugInformationRequest(c, 'doc-review', fId)}
              onOpenADRDocumentation={(c, fId) => handleOpenADRDocumentation(c, 'doc-review', fId)}
            />
          )}

          {activeTab === 'ai-analysis' && (
            <StudentAiAnalysisView student={student} onNavigate={handleNavigate} />
          )}

          {activeTab === 'my-preceptor' && (
            <StudentMyPreceptorView student={student} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              userId={student.id}
              userRole="Student"
              onNavigate={(route, caseId) => {
                const targetTab = route || 'my-cases';
                handleNavigate(targetTab, 'All', caseId);
              }}
              onBack={() => handleNavigate('dashboard')}
            />
          )}

          {activeTab === 'profile' && (
            <StudentProfileView student={student} onLogout={onLogout} forcePasswordReset={forcePasswordReset} />
          )}
        </main>
        {/* FOOTER */}
        <footer className="py-4 px-6 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 PharmDVerse Cloud. Student Module for {student?.full_name}. All rights reserved.</p>
        </footer>

      </div>

      <LeaveWorkspaceModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirmLeave={onLogout}
        leaveButtonText="Go to College Landing Page"
      />

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirmLogout={onLogout}
        userType="Student"
      />

      <LogoPreviewModal isOpen={showLogoModal} onClose={() => setShowLogoModal(false)} />

    </div>
  );
};
