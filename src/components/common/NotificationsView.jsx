import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle2, ChevronRight, Loader2, ArrowLeft, Download, Eye, ExternalLink } from 'lucide-react';
import { fetchNotificationsFromSupabase, markNotificationAsReadInSupabase } from '../../services/supabaseService';

export const NotificationsView = ({ userId, userRole, onNavigate, onBack }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unread'); // 'unread' | 'read' | 'all'

  const loadNotifications = async () => {
    setLoading(true);
    const res = await fetchNotificationsFromSupabase(userId);
    if (res.success) {
      setNotifications(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      // Mark as read in Supabase
      const res = await markNotificationAsReadInSupabase(notif.id);
      if (res.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notif.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
        );
      }
    }

    // Trigger navigation
    if (onNavigate) {
      let targetRoute = notif.action_route;
      if (userRole === 'Preceptor' || notif.action_label === 'Review Case') {
        targetRoute = 'case-review';
      } else {
        targetRoute = 'my-cases';
      }
      onNavigate(targetRoute, notif.clinical_case_id);
    }
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'read') return n.is_read;
    return true; // 'all'
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 animate-fadeIn w-full min-w-0 pb-12">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Notification Center</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Stay updated on your Clinical Case workflow status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500 text-white animate-pulse">
              {unreadCount} Unread
            </span>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-850 p-1 rounded-xl w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'unread'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Unread ({notifications.filter(n => !n.is_read).length})
        </button>
        <button
          onClick={() => setActiveTab('read')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'read'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Read ({notifications.filter(n => n.is_read).length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          All History ({notifications.length})
        </button>
      </div>

      {/* NOTIFICATIONS LIST */}
      {loading ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">Retrieving notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <BellOff className="w-10 h-10 text-slate-350 dark:text-slate-650 mx-auto mb-3" />
          <h3 className="text-sm font-extrabold text-slate-750 dark:text-slate-250">No notifications found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            You have no notifications in the selected category.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex items-start justify-between gap-4 relative overflow-hidden group ${
                notif.is_read
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                  : 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900 shadow-md shadow-indigo-500/5'
              }`}
            >
              {/* Unread glow bar */}
              {!notif.is_read && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
              )}

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                  notif.notification_type === 'Case Approved' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' 
                    : notif.notification_type === 'Case Returned'
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {notif.notification_type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold whitespace-pre-line">
                    {notif.message}
                  </p>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {notif.action_label && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNotificationClick(notif);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900 text-[11px] font-bold flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-all shrink-0 select-none cursor-pointer"
                >
                  <span>{notif.action_label}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
