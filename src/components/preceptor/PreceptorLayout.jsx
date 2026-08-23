import React, { useState, useEffect } from 'react';
import { LayoutDashboard, GraduationCap, User, LogOut, Sun, Moon, Menu, X, Stethoscope, ShieldCheck, Bell, FolderKanban, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

import { PreceptorDashboardView } from './PreceptorDashboardView';
import { PreceptorAssignedStudentsView } from './PreceptorAssignedStudentsView';
import { PreceptorCaseReviewView } from './PreceptorCaseReviewView';
import { PreceptorProfileView } from './PreceptorProfileView';
import { NotificationsView } from '../common/NotificationsView';
import { LeaveWorkspaceModal } from '../modals/LeaveWorkspaceModal';
import { LogoutConfirmModal } from '../modals/LogoutConfirmModal';
import { LogoPreviewModal } from '../modals/LogoPreviewModal';
import { useWorkspaceHistory } from '../../hooks/useWorkspaceHistory';
import { usePlatform } from '../../context/PlatformContext';

import { fetchUnreadNotificationsCountFromSupabase } from '../../services/supabaseService';

export const PreceptorLayout = ({ preceptor, onLogout }) => {
  const { isDark, toggleTheme } = useTheme();
  const { platformSettings } = usePlatform();
  const platformLogoUrl = platformSettings?.logo_url || '/pharmdverse-logo.png';
  const { activeTab, setActiveTab, pushTab, popTab, showLeaveModal, setShowLeaveModal } = useWorkspaceHistory('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [preceptorCaseFilter, setPreceptorCaseFilter] = useState('All');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [forcePasswordReset, setForcePasswordReset] = useState(preceptor?.force_password_reset || false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Body scroll lock effect when mobile sidebar drawer is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  const isCollapsedOnDesktop = sidebarCollapsed && !mobileSidebarOpen;

  const loadUnreadCount = async () => {
    if (!preceptor?.id) return;
    const res = await fetchUnreadNotificationsCountFromSupabase(preceptor.id);
    if (res.success) {
      setUnreadCount(res.count || 0);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [preceptor?.id, activeTab]);

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
    setPreceptorCaseFilter(filter);
    setTargetCaseId(caseId || null);
    pushTab(tab);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadUnreadCount();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-300">
      
      {/* 1. SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 ease-in-out lg:translate-x-0 ${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
      } ${
        mobileSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
      }`}>
        <div className="h-full flex flex-col justify-between">
          
          {/* SIDEBAR BRANDING HEADER */}
          <div className="h-16 px-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
            {isCollapsedOnDesktop ? (
              <div className="w-full flex items-center justify-center">
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition-all cursor-pointer flex items-center justify-center"
                  title="Expand sidebar"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  {preceptor?.profile_photo_url ? (
                    <img
                      src={preceptor.profile_photo_url}
                      alt={preceptor.full_name}
                      className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-extrabold text-xs shadow-xs shrink-0">
                      {preceptor?.full_name ? preceptor.full_name.substring(0, 2).toUpperCase() : 'PR'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <strong className="block text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[130px]">
                      {preceptor?.full_name || 'Preceptor'}
                    </strong>
                    <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 block truncate">
                      {preceptor?.department || 'Clinical Evaluator'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (window.innerWidth <= 1024) {
                      setMobileSidebarOpen(false);
                    } else {
                      setSidebarCollapsed(true);
                    }
                  }}
                  className="p-2 ml-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition-all cursor-pointer shrink-0"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* SIDEBAR NAVIGATION ITEMS */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto min-h-0 text-xs font-semibold">
            
            {/* Dashboard */}
            <button
              onClick={() => handleNavigate('dashboard')}
              title="Dashboard"
              className={`w-full h-11 rounded-xl flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3.5 gap-3'} transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isCollapsedOnDesktop && <span>Dashboard</span>}
            </button>

            {/* Assigned Students */}
            <button
              onClick={() => handleNavigate('assigned-students')}
              title="Assigned Students"
              className={`w-full h-11 rounded-xl flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3.5 gap-3'} transition-all ${
                activeTab === 'assigned-students'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              {!isCollapsedOnDesktop && <span>Assigned Students</span>}
            </button>

            {/* Clinical Case Review */}
            <button
              onClick={() => handleNavigate('case-review')}
              title="Clinical Case Review"
              className={`w-full h-11 rounded-xl flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3.5 gap-3'} transition-all ${
                activeTab === 'case-review'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderKanban className="w-4 h-4 shrink-0" />
              {!isCollapsedOnDesktop && <span>Clinical Case Review</span>}
            </button>

            {/* Notifications */}
            <button
              onClick={() => handleNavigate('notifications')}
              title="Notifications"
              className={`w-full h-11 rounded-xl flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0 relative' : 'px-3.5 justify-between'} transition-all ${
                activeTab === 'notifications'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`flex items-center ${isCollapsedOnDesktop ? 'justify-center' : 'gap-3'}`}>
                <Bell className="w-4 h-4 shrink-0" />
                {!isCollapsedOnDesktop && <span>Notifications</span>}
              </div>
              {unreadCount > 0 && (
                <span className={`h-5 px-1.5 min-w-[20px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm leading-none shrink-0 animate-pulse ${
                  isCollapsedOnDesktop ? 'absolute -top-1 -right-1' : ''
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* My Profile */}
            <button
              onClick={() => handleNavigate('profile')}
              title="My Profile"
              className={`w-full h-11 rounded-xl flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3.5 gap-3'} transition-all ${
                activeTab === 'profile'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              {!isCollapsedOnDesktop && <span>My Profile</span>}
            </button>

          </nav>

          {/* SIDEBAR FOOTER (LOGOUT & LIGHT/DARK TOGGLE) */}
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2 shrink-0">
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className={`w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center ${isCollapsedOnDesktop ? 'justify-center px-0' : 'px-3 justify-between'} transition-colors cursor-pointer`}
            >
              <div className={`flex items-center ${isCollapsedOnDesktop ? 'justify-center' : 'gap-2'}`}>
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                {!isCollapsedOnDesktop && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
              </div>
              {!isCollapsedOnDesktop && (
                <span className="text-[10px] uppercase font-bold text-slate-400">{isDark ? 'ON' : 'OFF'}</span>
              )}
            </button>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
              className={`w-full h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center ${isCollapsedOnDesktop ? 'px-0' : 'px-3 gap-2'} transition-colors cursor-pointer`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isCollapsedOnDesktop && <span>Logout</span>}
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
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* TOPBAR */}
        <header className="h-16 px-4 sm:px-8 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              {(preceptor?.colleges?.college_logo_url || preceptor?.colleges?.logoUrl) ? (
                <img
                  src={preceptor?.colleges?.college_logo_url || preceptor?.colleges?.logoUrl}
                  alt={preceptor?.colleges?.college_name || 'College Logo'}
                  className="w-8 h-8 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-0.5 shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-teal-700 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-xs border border-white/20">
                  {(preceptor?.colleges?.college_name || 'CLG').substring(0, 3).toUpperCase()}
                </div>
              )}
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {preceptor?.colleges?.college_name || 'Pharmacy College'} <span className="text-slate-400 font-normal text-xs hidden sm:inline">| Preceptor Portal</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
              <img
                src={platformLogoUrl}
                alt="Platform Logo"
                className="w-4 h-4 object-contain shrink-0"
                onError={(e) => { e.target.src = '/pharmdverse-logo.png'; }}
              />
              <span>Preceptor Workspace</span>
            </span>
          </div>
        </header>

        {/* VIEW ROUTER */}
        <main className="flex-1 p-4 sm:p-8">
          {activeTab !== 'dashboard' && (
            <div className="mb-6 mt-1">
              <button
                onClick={() => popTab ? popTab() : handleNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Back</span>
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <PreceptorDashboardView preceptor={preceptor} onNavigate={handleNavigate} />
          )}

          {activeTab === 'assigned-students' && (
            <PreceptorAssignedStudentsView preceptor={preceptor} />
          )}

          {activeTab === 'case-review' && (
            <PreceptorCaseReviewView
              preceptor={preceptor}
              initialFilter={preceptorCaseFilter}
              targetCaseId={targetCaseId}
              onClearTargetCase={() => setTargetCaseId(null)}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              userId={preceptor.id}
              userRole="Preceptor"
              onNavigate={(route, caseId) => {
                handleNavigate('case-review', 'All', caseId);
              }}
              onBack={() => handleNavigate('dashboard')}
            />
          )}

          {activeTab === 'profile' && (
            <PreceptorProfileView preceptor={preceptor} onLogout={onLogout} forcePasswordReset={forcePasswordReset} />
          )}
        </main>

        {/* FOOTER */}
        <footer className="py-4 px-6 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 PharmDVerse Cloud. Preceptor Module for {preceptor?.full_name}. All rights reserved.</p>
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
        userType="Preceptor"
      />

      <LogoPreviewModal isOpen={showLogoModal} onClose={() => setShowLogoModal(false)} />

    </div>
  );
};
