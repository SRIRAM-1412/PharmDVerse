import React, { useState, useEffect } from 'react';
import { useColleges } from '../../context/CollegeContext';
import { useTheme } from '../../context/ThemeContext';
import { EditCollegeModal } from '../modals/EditCollegeModal';
import { ModalWrapper } from '../modals/ModalWrapper';
import { logoutSuperAdmin } from '../../services/authService';
import { formatSubscriptionDate } from '../../utils/subscriptionUtils';

import { 
  Building2, CheckCircle2, Clock, XCircle, Edit3, 
  ExternalLink, Search, AlertTriangle, ShieldCheck, Pill, FlaskConical, FileSearch, Layers, Utensils,
  Sun, Moon, ChevronLeft, ChevronRight, LogOut, ArrowLeft, Trash2, CheckSquare, Square, Loader2, MessageSquare, Power, Menu, User, Globe
} from 'lucide-react';

import { LeaveWorkspaceModal } from '../modals/LeaveWorkspaceModal';
import { LogoutConfirmModal } from '../modals/LogoutConfirmModal';
import { LogoPreviewModal } from '../modals/LogoPreviewModal';
import { useWorkspaceHistory } from '../../hooks/useWorkspaceHistory';
import { usePlatform } from '../../context/PlatformContext';
import { getActiveAdminSession } from '../../services/authService';
import { DrugKnowledgeManagementView } from './DrugKnowledgeManagementView';
import { LabKnowledgeManagementView } from './LabKnowledgeManagementView';
import { OtherInvestigationManagementView } from './OtherInvestigationManagementView';
import { DrugDrugInteractionManagementView } from './DrugDrugInteractionManagementView';
import { DrugFoodInteractionManagementView } from './DrugFoodInteractionManagementView';
import { SuperAdminProfileView } from './SuperAdminProfileView';
import { PlatformSettingsManagementView } from './PlatformSettingsManagementView';

export const SuperAdminDashboard = ({ onExitToLanding }) => {
  const { isDark, toggleTheme } = useTheme();
  const { platformSettings } = usePlatform();
  const platformLogoUrl = platformSettings?.logo_url || '/pharmdverse-logo.png';
  const platformName = platformSettings?.platform_name || 'PharmDVerse ERP';
  const { activeTab, setActiveTab, pushTab, popTab, showLeaveModal, setShowLeaveModal } = useWorkspaceHistory('requests');
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { 
    pendingRequests, 
    activeColleges, 
    inactiveColleges, 
    expiredSubscriptions,
    approveCollege, 
    rejectCollege, 
    updateCollegeProfile,
    updateCollegeStatus,
    deleteCollege,
    deleteMultipleColleges
  } = useColleges();

  // Sidebar & View States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
  const [editingCollege, setEditingCollege] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvingId, setApprovingId] = useState(null);

  // Rejection Remarks Modal State
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Bulk Selection State (Select to Delete for Colleges)
  const [selectedIds, setSelectedIds] = useState([]);
  const [collegeToDelete, setCollegeToDelete] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Subscription Deactivation / Reactivation Confirmation Modals
  const [deactivatingCollege, setDeactivatingCollege] = useState(null);
  const [reactivatingCollege, setReactivatingCollege] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleConfirmDeactivate = async () => {
    if (!deactivatingCollege) return;
    setIsUpdatingStatus(true);
    await updateCollegeStatus(deactivatingCollege.id, 'Inactive');
    setIsUpdatingStatus(false);
    setDeactivatingCollege(null);
  };

  const handleConfirmReactivate = async () => {
    if (!reactivatingCollege) return;
    setIsUpdatingStatus(true);
    await updateCollegeStatus(reactivatingCollege.id, 'Active');
    setIsUpdatingStatus(false);
    setReactivatingCollege(null);
  };

  const pendingCount = pendingRequests.filter(r => r.status === 'Pending').length;

  const filteredRequests = pendingRequests.filter(req => 
    req.collegeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActive = activeColleges.filter(clg => 
    clg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clg.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clg.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInactive = inactiveColleges.filter(c =>
    (c.name || c.collegeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.state || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpired = expiredSubscriptions.filter(c =>
    (c.name || c.collegeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper for current tab items
  const getCurrentTabItems = () => {
    if (activeTab === 'active') return filteredActive;
    if (activeTab === 'inactive') return filteredInactive;
    if (activeTab === 'expired') return filteredExpired;
    return [];
  };

  const currentTabItems = getCurrentTabItems();
  const allCurrentSelected = currentTabItems.length > 0 && currentTabItems.every(item => selectedIds.includes(item.id));

  // Toggle single item selection
  const toggleSelectItem = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Toggle select all items in current tab
  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      const currentIds = new Set(currentTabItems.map(i => i.id));
      setSelectedIds(prev => prev.filter(id => !currentIds.has(id)));
    } else {
      const currentIds = currentTabItems.map(i => i.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds([]);
  };

  // ASYNC APPROVE & AUTO-FETCH INTO EDIT PROFILE VIEW
  const handleApproveAndEdit = async (requestId) => {
    setApprovingId(requestId);
    try {
      const approvedClg = await approveCollege(requestId);
      setApprovingId(null);
      if (approvedClg) {
        setEditingCollege(approvedClg);
        setActiveTab('edit_profile');
      }
    } catch (err) {
      setApprovingId(null);
      console.error('Failed to approve and edit college:', err);
    }
  };

  // REJECT WITH COMMENTS DIALOG
  const handleConfirmRejection = async () => {
    if (!rejectingRequest) return;
    setIsRejecting(true);
    try {
      await rejectCollege(rejectingRequest.id, rejectionRemarks);
      setIsRejecting(false);
      setRejectingRequest(null);
      setRejectionRemarks('');
    } catch (err) {
      setIsRejecting(false);
      console.error('Failed to reject college request:', err);
    }
  };

  const handleStartEditProfile = (college) => {
    setEditingCollege(college);
    setActiveTab('edit_profile');
  };

  const handleSaveProfile = async (collegeId, formData) => {
    const res = await updateCollegeProfile(collegeId, formData);
    if (res && res.success && res.college) {
      setEditingCollege(res.college);
    }
    return res;
  };

  const handleConfirmSingleDelete = async () => {
    if (collegeToDelete) {
      await deleteCollege(collegeToDelete.id);
      setSelectedIds(prev => prev.filter(id => id !== collegeToDelete.id));
      setCollegeToDelete(null);
      if (editingCollege && editingCollege.id === collegeToDelete.id) {
        setEditingCollege(null);
        setActiveTab('active');
      }
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length > 0) {
      await deleteMultipleColleges(selectedIds);
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
    }
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sidebar Brand Header */}
      <div className="h-16 px-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
        {!isMobile && sidebarCollapsed ? (
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
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={platformLogoUrl}
                alt={`${platformName} Logo`}
                className="w-8 h-8 object-contain shrink-0 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  if (isMobile) setMobileSidebarOpen(false);
                  setShowLogoModal(true);
                }}
                onError={(e) => { e.target.src = '/pharmdverse-logo.png'; }}
                title="Click to view official logo"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate max-w-[130px]">
                  {platformName}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Super Admin</span>
              </div>
            </div>

            {isMobile ? (
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 ml-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition-all cursor-pointer shrink-0"
                title="Close menu"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-2 ml-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition-all cursor-pointer shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Navigation Menu - Scrollable */}
      <div className="p-3 space-y-4 overflow-y-auto min-h-0 flex-1">
          <div>
            {(isMobile || !sidebarCollapsed) && (
              <span className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                College Management
              </span>
            )}

            <nav className="space-y-1">
              {/* 1. Registration Requests */}
              <button
                onClick={() => {
                  pushTab('requests');
                  setEditingCollege(null);
                  clearSelection();
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'requests'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Registration Requests"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Clock className="w-4 h-4 shrink-0" />
                  {(isMobile || !sidebarCollapsed) && <span className="truncate">Registration Requests</span>}
                </div>
                {(isMobile || !sidebarCollapsed) && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
                    activeTab === 'requests' 
                      ? 'bg-white text-emerald-700 shadow-xs' 
                      : pendingCount > 0 
                      ? 'bg-amber-500 text-white shadow-xs' 
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>

              {/* 2. Active Colleges */}
              <button
                onClick={() => {
                  pushTab('active');
                  setEditingCollege(null);
                  clearSelection();
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Active Colleges"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {(isMobile || !sidebarCollapsed) && <span className="truncate">Active Colleges</span>}
                </div>
                {(isMobile || !sidebarCollapsed) && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
                    activeTab === 'active'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {activeColleges.length}
                  </span>
                )}
              </button>

              {/* 3. Inactive Colleges */}
              <button
                onClick={() => {
                  pushTab('inactive');
                  setEditingCollege(null);
                  clearSelection();
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'inactive'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Inactive Colleges"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {(isMobile || !sidebarCollapsed) && <span className="truncate">Inactive Colleges</span>}
                </div>
                {(isMobile || !sidebarCollapsed) && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
                    activeTab === 'inactive'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {inactiveColleges.length}
                  </span>
                )}
              </button>

              {/* 4. Expired Subscriptions */}
              <button
                onClick={() => {
                  pushTab('expired');
                  setEditingCollege(null);
                  clearSelection();
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'expired'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Expired Subscriptions"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {(isMobile || !sidebarCollapsed) && <span className="truncate">Expired Subscriptions</span>}
                </div>
                {(isMobile || !sidebarCollapsed) && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
                    activeTab === 'expired'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : expiredSubscriptions.length > 0
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {expiredSubscriptions.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Master Data Management */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {(isMobile || !sidebarCollapsed) && (
              <span className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                Master Data
              </span>
            )}
            <nav className="space-y-1">
              <button
                onClick={() => {
                  pushTab('drug_knowledge');
                  setEditingCollege(null);
                  clearSelection();
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'drug_knowledge'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Drug Knowledge Master"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Pill className="w-4 h-4 shrink-0" />
                  {(isMobile || !sidebarCollapsed) && <span className="truncate">Drug Knowledge Master</span>}
                </div>
              </button>

              <button
                onClick={() => {
                  pushTab('lab_knowledge');
                  setEditingCollege(null);
                  clearSelection();
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'lab_knowledge'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Lab Parameter Master"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FlaskConical className="w-4 h-4 shrink-0" />
                  {(isMobile || !sidebarCollapsed) && <span className="truncate">Lab Parameter Master</span>}
                </div>
              </button>

              <button
                onClick={() => {
                  pushTab('other_inv_knowledge');
                  setEditingCollege(null);
                  clearSelection();
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'other_inv_knowledge'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Other Investigation Master"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileSearch className="w-4 h-4 shrink-0" />
                  {(isMobile || !sidebarCollapsed) && <span className="truncate">Other Investigation Master</span>}
                </div>
              </button>

              <button
                onClick={() => {
                  pushTab('ddi_knowledge');
                  setEditingCollege(null);
                  clearSelection();
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ddi_knowledge'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Drug-Drug Interaction Master"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Layers className="w-4 h-4 shrink-0" />
                  {(isMobile || !sidebarCollapsed) && <span className="truncate">Drug–Drug Interaction Master</span>}
                </div>
              </button>

              <button
                onClick={() => {
                  pushTab('dfi_knowledge');
                  setEditingCollege(null);
                  clearSelection();
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'dfi_knowledge'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Drug-Food Interaction Master"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Utensils className="w-4 h-4 shrink-0" />
                  {(isMobile || !sidebarCollapsed) && <span className="truncate">Drug–Food Interaction Master</span>}
                </div>
              </button>
            </nav>
          </div>

          {/* Account & Security Management */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {(isMobile || !sidebarCollapsed) && (
              <span className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                Account & Security
              </span>
            )}
            <nav className="space-y-1">
              <button
                onClick={() => {
                  pushTab('super_admin_profile');
                  setEditingCollege(null);
                  clearSelection();
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'super_admin_profile'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="My Profile & Security"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <User className="w-4 h-4 shrink-0" />
                  {(isMobile || !sidebarCollapsed) && <span className="truncate">My Profile & Security</span>}
                </div>
              </button>

              <button
                onClick={() => {
                  pushTab('platform_settings');
                  setEditingCollege(null);
                  clearSelection();
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'platform_settings'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Platform Settings"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Globe className="w-4 h-4 shrink-0" />
                  {(isMobile || !sidebarCollapsed) && <span className="truncate">Platform Settings</span>}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Bottom Actions */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1 shrink-0">
        <button
          onClick={() => {
            if (isMobile) setMobileSidebarOpen(false);
            onExitToLanding();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Return to Landing Page"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          {(isMobile || !sidebarCollapsed) && <span>Landing Page</span>}
        </button>

        <button
          onClick={() => {
            if (isMobile) setMobileSidebarOpen(false);
            setShowLogoutConfirm(true);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
          title="Sign Out Super Admin"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(isMobile || !sidebarCollapsed) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">
      
      {/* 1A. DESKTOP SIDEBAR (FIXED FOR DESKTOP ONLY) */}
      <aside 
        className={`hidden lg:flex fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 flex-col justify-between ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* 1B. MOBILE OFF-CANVAS SIDEBAR DRAWER (MOBILE ONLY ≤768px) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-transform duration-300 transform lg:hidden flex flex-col justify-between ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderSidebarContent(true)}
      </aside>

      {/* 1C. MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        
        {/* Top Header Bar */}
        <header className="h-16 px-4 sm:px-6 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>



            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              <span className="hidden sm:inline">Governance / College Management / </span>
              <strong className="text-slate-900 dark:text-white capitalize">
                {activeTab === 'edit_profile' ? 'Edit College Profile' : activeTab.replace('_', ' ')}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {activeTab !== 'edit_profile' && (
              <div className="relative w-32 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
              title="Toggle Light/Dark Mode"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                <img
                  src={platformLogoUrl}
                  alt={`${platformName} Logo`}
                  className="w-4 h-4 object-contain shrink-0"
                  onError={(e) => { e.target.src = '/pharmdverse-logo.png'; }}
                />
                <span className="hidden sm:inline">Super Admin Workspace</span>
                <span className="sm:hidden">Super Admin</span>
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Main View Container */}
        <main className="p-4 sm:p-6 w-full space-y-6 flex-1 min-w-0">
          
          {/* EDIT COLLEGE PROFILE FULL PAGE VIEW */}
          {activeTab === 'edit_profile' && editingCollege && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Edit College Profile & Subscription
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Details auto-fetched from registration request for <strong className="text-emerald-600 dark:text-emerald-400">{editingCollege.name || editingCollege.collegeName}</strong>. You can edit any details below.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('active');
                    setEditingCollege(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  Cancel & Back
                </button>
              </div>

              <EditCollegeModal
                isOpen={true}
                isFullPage={true}
                college={editingCollege}
                onSave={handleSaveProfile}
                onDelete={(id) => {
                  deleteCollege(id);
                  setActiveTab('active');
                  setEditingCollege(null);
                }}
                onClose={() => {
                  setActiveTab('active');
                  setEditingCollege(null);
                }}
              />
            </div>
          )}

          {/* TAB 0: DRUG KNOWLEDGE MASTER MANAGEMENT */}
          {activeTab === 'drug_knowledge' && (
            <DrugKnowledgeManagementView />
          )}

          {/* TAB 0B: LAB PARAMETER KNOWLEDGE MASTER MANAGEMENT */}
          {activeTab === 'lab_knowledge' && (
            <LabKnowledgeManagementView />
          )}

          {/* TAB 0C: OTHER INVESTIGATION KNOWLEDGE MASTER MANAGEMENT */}
          {activeTab === 'other_inv_knowledge' && (
            <OtherInvestigationManagementView />
          )}

          {/* TAB 0D: DRUG-DRUG INTERACTION KNOWLEDGE MASTER MANAGEMENT */}
          {activeTab === 'ddi_knowledge' && (
            <DrugDrugInteractionManagementView />
          )}

          {/* TAB 0E: DRUG-FOOD INTERACTION KNOWLEDGE MASTER MANAGEMENT */}
          {activeTab === 'dfi_knowledge' && (
            <DrugFoodInteractionManagementView />
          )}

          {/* TAB 0F: SUPER ADMIN MY PROFILE & SECURITY */}
          {activeTab === 'super_admin_profile' && (
            <SuperAdminProfileView
              admin={getActiveAdminSession()}
              onProfileUpdated={() => {
                // Re-render
              }}
              onExitToLanding={onExitToLanding}
              onBack={popTab}
            />
          )}

          {/* TAB 0G: SUPER ADMIN PLATFORM IDENTITY & GLOBAL SETTINGS */}
          {activeTab === 'platform_settings' && (
            <PlatformSettingsManagementView onBack={popTab} />
          )}

          {/* SINGLE UNIFIED MAIN CARD BACKDROP FOR DASHBOARD TABS */}
          {['requests', 'active', 'inactive', 'expired'].includes(activeTab) && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              
              {/* SUPER ADMIN WELCOME BANNER (INTEGRATED TOP BLOCK) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/50 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-blue-950/30 text-slate-900 dark:text-white relative overflow-hidden border border-slate-200/80 dark:border-slate-800">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start gap-5 relative z-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 flex items-center justify-center shrink-0 shadow-xs">
                    <img
                      src={platformLogoUrl}
                      alt={`${platformName} Logo`}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => { e.target.src = '/pharmdverse-logo.png'; }}
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Super Admin Workspace
                      </span>
                      <span className="text-[11px] text-blue-700 dark:text-blue-400 font-mono font-bold">Role: Global Admin</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                      Welcome, Super Admin
                    </h1>

                    <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">System Scope: </span>
                        <strong className="text-slate-900 dark:text-slate-100 font-bold">PharmDVerse Governance & Onboarding</strong>
                      </div>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Active Portals: </span>
                        <strong className="text-blue-700 dark:text-blue-400 font-bold">{activeColleges.length} Live Colleges</strong>
                      </div>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Pending Requests: </span>
                        <strong className="text-amber-600 dark:text-amber-400 font-bold">
                          {pendingCount > 0 ? `${pendingCount} Pending (${pendingRequests.length} Total)` : `0 Pending (${pendingRequests.length} Total)`}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

          {/* FLOATING BULK DELETE BAR (FOR ACTIVE COLLEGES ONLY) */}
          {selectedIds.length > 0 && activeTab !== 'requests' && activeTab !== 'edit_profile' && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 shadow-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 animate-fadeIn sticky top-20 z-20">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
                  {selectedIds.length}
                </span>
                <span className="text-xs font-bold">
                  {selectedIds.length === 1 ? '1 College Selected' : `${selectedIds.length} Colleges Selected`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={clearSelection}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>

                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-rose-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedIds.length})</span>
                </button>
              </div>
            </div>
          )}



          {/* TAB 1: REGISTRATION REQUESTS (ONLY APPROVE AND REJECT WITH COMMENTS - NO EDIT/DELETE) */}
          {activeTab === 'requests' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    College Registration Applications
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Review and approve pending pharmacy college onboarding applications.
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {filteredRequests.length} Applications Total
                </span>
              </div>

              {filteredRequests.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No registration requests found.
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    New registration requests submitted by pharmacy colleges will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3.5 px-5">College Name</th>
                          <th className="py-3.5 px-5">Contact Person</th>
                          <th className="py-3.5 px-5">Mobile Number</th>
                          <th className="py-3.5 px-5">Email Address</th>
                          <th className="py-3.5 px-5">City / State</th>
                          <th className="py-3.5 px-5">Submitted Date</th>
                          <th className="py-3.5 px-5">Status</th>
                          <th className="py-3.5 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {filteredRequests.map((req) => {
                          const isProcessingThis = approvingId === req.id;

                          return (
                            <tr 
                              key={req.id} 
                              className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                            >
                              <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                                {req.collegeName}
                              </td>
                              <td className="py-4 px-5 font-semibold text-slate-700 dark:text-slate-300">
                                {req.contactName}
                              </td>
                              <td className="py-4 px-5 font-mono text-slate-600 dark:text-slate-400">
                                {req.mobileNumber}
                              </td>
                              <td className="py-4 px-5 text-slate-600 dark:text-slate-400">
                                {req.email}
                              </td>
                              <td className="py-4 px-5 text-slate-600 dark:text-slate-400">
                                {req.city}, {req.state}
                              </td>
                              <td className="py-4 px-5 text-slate-500 dark:text-slate-400">
                                {req.submittedDate}
                              </td>
                              <td className="py-4 px-5">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  req.status === 'Approved'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                    : req.status === 'Rejected'
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                                }`}>
                                  {req.status}
                                </span>
                                {req.remarks && (
                                  <p className="text-[10px] text-rose-600 dark:text-rose-400 italic mt-1 max-w-xs truncate" title={req.remarks}>
                                    Note: {req.remarks}
                                  </p>
                                )}
                              </td>
                              <td className="py-4 px-5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {req.status === 'Pending' ? (
                                    <>
                                      <button
                                        onClick={() => handleApproveAndEdit(req.id)}
                                        disabled={isProcessingThis}
                                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-60"
                                      >
                                        {isProcessingThis ? (
                                          <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Approving...</span>
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Approve</span>
                                          </>
                                        )}
                                      </button>

                                      <button
                                        onClick={() => {
                                          setRejectingRequest(req);
                                          setRejectionRemarks('');
                                        }}
                                        disabled={isProcessingThis}
                                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>Reject</span>
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[11px] font-semibold text-slate-400 italic">
                                      Processed
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE COLLEGES */}
          {activeTab === 'active' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentTabItems.length > 0 && (
                    <button
                      onClick={toggleSelectAll}
                      className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-bold"
                    >
                      {allCurrentSelected ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4" />}
                      <span>Select All</span>
                    </button>
                  )}
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Active Subscribed Colleges
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Subscribed pharmacy colleges actively displayed on the landing page.
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  {filteredActive.length} Active Portals Live
                </span>
              </div>

              {filteredActive.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No active colleges available.
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Approved registration requests will appear here after Subscription Plan setup.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredActive.map((clg) => {
                    const isSelected = selectedIds.includes(clg.id);
                    return (
                      <div
                        key={clg.id}
                        className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-300 flex flex-col justify-between group relative ${
                          isSelected 
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' 
                            : 'border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg'
                        }`}
                      >
                        <div>
                          {/* TOP CARD HEADER WITH SELECT CHECKBOX */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectItem(clg.id)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
                              />

                              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${clg.logoBg || 'from-emerald-600 to-teal-700'} flex items-center justify-center text-white font-extrabold text-xs shadow-md shrink-0`}>
                                {clg.initials}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                  {clg.name}
                                </h4>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {clg.city}, {clg.state}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                Active
                              </span>

                              <button
                                onClick={() => setCollegeToDelete({ id: clg.id, name: clg.name })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                                title="Delete College"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 space-y-2 my-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[10px] font-semibold">Subscription Plan:</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{clg.subscriptionPlanName || clg.subscriptionPlan || 'Professional Plan'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[10px] font-semibold">Student Usage:</span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">{clg.currentStudentsCount || 0} / {clg.maxStudentsAllowed || 300}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[10px] font-semibold">Available Seats:</span>
                              <span className="font-bold text-teal-600 dark:text-teal-400">{clg.availableSeats !== undefined ? clg.availableSeats : (clg.maxStudentsAllowed - (clg.currentStudentsCount || 0))} Available</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-1.5">
                              <span className="text-slate-400 text-[10px] font-semibold">Expiry Date:</span>
                              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{formatSubscriptionDate(clg.subscriptionExpiryDate)} ({clg.daysRemaining < 0 ? 'Expired' : `${clg.daysRemaining} Days`})</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEditProfile(clg)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => setDeactivatingCollege(clg)}
                              className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-bold flex items-center gap-1 transition-colors"
                              title="Deactivate College Subscription"
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span>Deactivate</span>
                            </button>
                          </div>

                          <a
                            href={clg.portalUrl || `https://${clg.code.toLowerCase()}.pharmdverse.com`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>Open Portal</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INACTIVE */}
          {activeTab === 'inactive' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Inactive & Deactivated Colleges
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    All historical records, students, preceptors, cases, and settings are safely preserved. Click Reactivate to restore operational status.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {filteredInactive.length} Deactivated
                </span>
              </div>

              {filteredInactive.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <XCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No inactive colleges.
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Deactivated colleges will be listed here with options to view or reactivate.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredInactive.map((c) => {
                    const isSelected = selectedIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-300 flex flex-col justify-between group relative ${
                          isSelected 
                            ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md' 
                            : 'border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg opacity-90'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectItem(c.id)}
                                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
                              />
                              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${c.logoBg || 'from-slate-600 to-slate-800'} flex items-center justify-center text-white font-extrabold text-xs shadow-md shrink-0`}>
                                {c.initials}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                  {c.name}
                                </h4>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {c.city}, {c.state}
                                </span>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              Inactive
                            </span>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 space-y-2 my-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[10px] font-semibold">Subscription Plan:</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400">{c.subscriptionPlanName || c.subscriptionPlan || 'Professional Plan'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[10px] font-semibold">Student Usage:</span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">{c.currentStudentsCount || 0} / {c.maxStudentsAllowed || 300}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-1.5">
                              <span className="text-slate-400 text-[10px] font-semibold">Expiry Date:</span>
                              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{formatSubscriptionDate(c.subscriptionExpiryDate)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => setReactivatingCollege(c)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Reactivate</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStartEditProfile(c)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setCollegeToDelete({ id: c.id, name: c.name })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                              title="Delete College"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXPIRED */}
          {activeTab === 'expired' && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Expired Subscriptions</h2>
              {filteredExpired.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No expired colleges.
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Colleges with expired subscription plans will be listed here.
                  </p>
                </div>
              ) : (
                filteredExpired.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <div key={c.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(c.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                        />
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.logoBg || 'from-rose-600 to-slate-800'} flex items-center justify-center text-white font-bold text-xs`}>
                          {c.initials}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h4>
                          <span className="text-xs text-slate-500">{c.city}, {c.state}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                          Expired
                        </span>
                        <button
                          onClick={() => setCollegeToDelete({ id: c.id, name: c.name })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                          title="Delete College"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

        </main>

      </div>

      {/* REJECTION REMARKS DIALOG */}
      {rejectingRequest && (
        <ModalWrapper
          isOpen={true}
          onClose={() => {
            setRejectingRequest(null);
            setRejectionRemarks('');
          }}
          title="Reject Registration Application"
          subtitle={`Enter rejection remarks for ${rejectingRequest.collegeName}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Rejection Remarks / Comments (Optional)
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  rows={3}
                  value={rejectionRemarks}
                  onChange={(e) => setRejectionRemarks(e.target.value)}
                  placeholder="Enter reason for rejection (e.g. PCI document unverified, invalid contact number)..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isRejecting}
                onClick={() => {
                  setRejectingRequest(null);
                  setRejectionRemarks('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRejecting}
                onClick={handleConfirmRejection}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <span>Confirm Rejection</span>
                )}
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* SINGLE DELETE CONFIRMATION DIALOG (ACTIVE COLLEGES) */}
      {collegeToDelete && (
        <ModalWrapper
          isOpen={true}
          onClose={() => setCollegeToDelete(null)}
          title="Delete Confirmation"
          subtitle={`Are you sure you want to delete ${collegeToDelete.name}?`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This action will permanently delete this college record and subscription from the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCollegeToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSingleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Delete College
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* BULK DELETE CONFIRMATION DIALOG */}
      {showBulkDeleteConfirm && (
        <ModalWrapper
          isOpen={showBulkDeleteConfirm}
          onClose={() => setShowBulkDeleteConfirm(false)}
          title="Bulk Delete Confirmation"
          subtitle={`Delete ${selectedIds.length} Selected Colleges?`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This action will permanently remove all {selectedIds.length} selected colleges and their subscription records from the system.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* SUBSCRIPTION DEACTIVATION CONFIRMATION MODAL */}
      {deactivatingCollege && (
        <ModalWrapper
          isOpen={Boolean(deactivatingCollege)}
          onClose={() => setDeactivatingCollege(null)}
          title="DEACTIVATE COLLEGE?"
          subtitle={`Confirm subscription suspension for ${deactivatingCollege.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span>College:</span>
                <span className="text-amber-800 dark:text-amber-300">{deactivatingCollege.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Current Plan:</span>
                <span className="font-semibold">{deactivatingCollege.subscriptionPlanName || deactivatingCollege.subscriptionPlan || 'Professional Plan'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Students:</span>
                <span className="font-mono font-bold">{deactivatingCollege.currentStudentsCount || 0} / {deactivatingCollege.maxStudentsAllowed || 300}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Expiry Date:</span>
                <span className="font-mono">{formatSubscriptionDate(deactivatingCollege.subscriptionExpiryDate)}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Warning:</strong> Deactivating this college will change its subscription status to <strong>Inactive</strong> and restrict portal access according to existing subscription rules. All college data, student accounts, preceptors, and clinical cases remain 100% safely preserved.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeactivatingCollege(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={isUpdatingStatus}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-md shadow-amber-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deactivating...</span>
                  </>
                ) : (
                  <>
                    <Power className="w-3.5 h-3.5" />
                    <span>Deactivate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* SUBSCRIPTION REACTIVATION CONFIRMATION MODAL */}
      {reactivatingCollege && (
        <ModalWrapper
          isOpen={Boolean(reactivatingCollege)}
          onClose={() => setReactivatingCollege(null)}
          title="REACTIVATE COLLEGE?"
          subtitle={`Restore active subscription for ${reactivatingCollege.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span>College:</span>
                <span className="text-emerald-800 dark:text-emerald-300">{reactivatingCollege.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Current Plan:</span>
                <span className="font-semibold">{reactivatingCollege.subscriptionPlanName || reactivatingCollege.subscriptionPlan || 'Professional Plan'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Students:</span>
                <span className="font-mono font-bold">{reactivatingCollege.currentStudentsCount || 0} / {reactivatingCollege.maxStudentsAllowed || 300}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Expiry Date:</span>
                <span className="font-mono">{formatSubscriptionDate(reactivatingCollege.subscriptionExpiryDate)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Reactivating this college will restore its subscription status to <strong>Active</strong> and restore landing page portal access. Existing plan parameters and subscription dates remain intact.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReactivatingCollege(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReactivate}
                disabled={isUpdatingStatus}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Reactivating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Reactivate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      <LeaveWorkspaceModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirmLeave={() => {
          logoutSuperAdmin();
          onExitToLanding();
        }}
        leaveButtonText="Go to Main Landing Page"
      />

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirmLogout={() => {
          logoutSuperAdmin();
          onExitToLanding();
        }}
        userType="Super Admin"
      />

      <LogoPreviewModal isOpen={showLogoModal} onClose={() => setShowLogoModal(false)} />

    </div>
  );
};
