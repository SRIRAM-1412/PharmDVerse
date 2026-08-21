/**
 * Super Admin & Portal Authentication Session Service
 * Database-backed Super Admin authentication & single active session support
 */

import { authenticateSuperAdminInSupabase, invalidateActiveSessionByTokenInSupabase } from './supabaseService';

const PORTAL_SESSION_KEY = 'pharmdverse_active_portal_session';

/**
 * Save active portal session to localStorage
 */
export const saveActiveSession = (sessionData) => {
  try {
    const payload = {
      ...sessionData,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to save portal session', err);
  }
};

/**
 * Get active portal session from localStorage
 */
export const getActiveSession = () => {
  try {
    const raw = localStorage.getItem(PORTAL_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse portal session', err);
    return null;
  }
};

/**
 * Clear active portal session
 */
export const clearActiveSession = () => {
  try {
    localStorage.removeItem(PORTAL_SESSION_KEY);
  } catch (err) {
    console.error('Failed to clear portal session', err);
  }
};

/**
 * Authenticate Super Admin user via Supabase database
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{success: boolean, superAdmin?: object, error?: string}>}
 */
export const authenticateSuperAdmin = async (email, password) => {
  const result = await authenticateSuperAdminInSupabase(email, password);
  if (result.success && result.superAdmin) {
    const userSession = {
      id: result.superAdmin.id,
      name: result.superAdmin.name,
      email: result.superAdmin.email,
      role: 'super_admin',
      authenticatedAt: new Date().toISOString()
    };
    localStorage.setItem('pharmdverse_super_admin_session', JSON.stringify(userSession));
    saveActiveSession({ viewMode: 'admin', userRole: 'super_admin', userId: result.superAdmin.id });
    return { success: true, superAdmin: result.superAdmin };
  }
  return { success: false, error: result.error || 'Invalid Email Address or Password.' };
};

/**
 * Get active Super Admin session from storage
 */
export const getActiveAdminSession = () => {
  const saved = localStorage.getItem('pharmdverse_super_admin_session');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return null;
};

/**
 * Update stored Super Admin profile fields in localStorage session
 */
export const updateStoredSuperAdminSession = (updatedFields) => {
  const current = getActiveAdminSession();
  if (current) {
    const updated = { ...current, ...updatedFields };
    localStorage.setItem('pharmdverse_super_admin_session', JSON.stringify(updated));
    return updated;
  }
  return null;
};

/**
 * Logout Super Admin session and invalidate active_sessions record
 */
export const logoutSuperAdmin = async (sessionToken = null) => {
  try {
    const currentSession = getActiveSession();
    const tokenToInvalidate = sessionToken || currentSession?.sessionToken;
    if (tokenToInvalidate) {
      await invalidateActiveSessionByTokenInSupabase(tokenToInvalidate);
    }
  } catch (err) {
    console.error('Error during super admin session invalidation:', err);
  } finally {
    localStorage.removeItem('pharmdverse_super_admin_session');
    clearActiveSession();
  }
};
