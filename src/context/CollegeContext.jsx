import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  fetchAllCollegesFromSupabase,
  fetchActiveCollegesFromSupabase, 
  fetchRegistrationRequestsFromSupabase, 
  fetchCollegeStudentCountsFromSupabase,
  submitCollegeRegistrationToSupabase, 
  approveCollegeInSupabase, 
  rejectCollegeInSupabase,
  updateCollegeProfileAndSubscriptionInSupabase,
  updateCollegeStatusInSupabase, 
  deleteCollegeFromSupabase, 
  deleteMultipleCollegesFromSupabase,
  uploadCollegeLogoToSupabaseStorage,
  authenticateCollegeAdminInSupabase
} from '../services/supabaseService';
import { getPlanDetails, getSubscriptionStatusDetails, calculateDaysRemaining } from '../utils/subscriptionUtils';

const CollegeContext = createContext();

const safeInitials = (str) => {
  if (!str || typeof str !== 'string') return 'CLG';
  const words = str.trim().split(/\s+/).filter(w => w && w.length > 0);
  if (words.length === 0) return 'CLG';
  return words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
};

export const CollegeProvider = ({ children }) => {
  const [activeColleges, setActiveColleges] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [inactiveColleges, setInactiveColleges] = useState([]);
  const [expiredSubscriptions, setExpiredSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // STEP 3 & STEP 7: Pure Live Supabase Fetch (Including college_admin_username)
  const loadSupabaseData = async () => {
    setIsLoading(true);
    console.log('[CollegeContext] Loading live data from Supabase PostgreSQL...');
    
    // Fetch live student count map per college ID
    const studentCountsMap = await fetchCollegeStudentCountsFromSupabase();

    // 1. Fetch All Colleges for Super Admin & Landing Page (from colleges table)
    const collegesRes = await fetchAllCollegesFromSupabase();
    if (collegesRes.success && Array.isArray(collegesRes.data)) {
      const mappedColleges = collegesRes.data.map(c => {
        const sub = Array.isArray(c.subscriptions) ? c.subscriptions[0] : (c.subscriptions || null);
        const planKey = sub ? sub.plan_name : 'Professional';
        const rawMax = sub ? sub.maximum_students : 600;
        const planInfo = getPlanDetails(planKey, rawMax);
        
        const rawExpiry = sub ? sub.subscription_expiry_date : '2027-08-04';
        const dbStatus = c.status || (sub ? sub.status : 'Active');
        
        const statusMeta = getSubscriptionStatusDetails(rawExpiry, dbStatus);
        const currentStudents = studentCountsMap[c.id] || 0;
        const maxCapacity = planInfo.maxStudents;

        return {
          id: c.id,
          name: c.college_name || c.name || '',
          code: c.college_code || c.code || '',
          logoUrl: c.college_logo_url || null,
          description: c.college_description || '',
          adminUsername: c.college_admin_username || c.principal_email || '',
          city: c.city || '',
          state: c.state || '',
          district: c.district || '',
          pinCode: c.pincode || c.pin_code || '',
          address: c.address || '',
          universityAffiliation: c.university_affiliation || '',
          pciApprovalNo: c.pci_approval_number || c.pci_approval_no || '',
          principalName: c.principal_name || '',
          principalMobile: c.principal_mobile || '',
          principalEmail: c.principal_email || '',
          logoBg: c.college_logo || c.logo_bg || 'from-emerald-600 to-teal-700',
          initials: safeInitials(c.college_name || c.name),
          studentsCount: maxCapacity,
          currentStudentsCount: currentStudents,
          availableSeats: Math.max(0, maxCapacity - currentStudents),
          portalUrl: `https://${(c.college_code || c.code || 'clg').toLowerCase()}.pharmdverse.com`,
          status: statusMeta.status,
          dbStatus: dbStatus,
          subscriptionPlan: planInfo.id,
          subscriptionPlanName: planInfo.shortName,
          subscriptionStartDate: sub ? sub.subscription_start_date : new Date().toISOString().split('T')[0],
          subscriptionExpiryDate: rawExpiry,
          maxStudentsAllowed: maxCapacity,
          daysRemaining: statusMeta.daysRemaining,
          badgeClass: statusMeta.badgeClass,
          subscriptionStatus: statusMeta.status
        };
      });

      const activeList = mappedColleges.filter(c => String(c.dbStatus).toLowerCase() !== 'inactive');
      const expiredList = mappedColleges.filter(c => c.status === 'Expired');
      const inactiveList = mappedColleges.filter(c => String(c.dbStatus).toLowerCase() === 'inactive' || c.status === 'Inactive');

      setActiveColleges(activeList);
      setInactiveColleges(inactiveList);
      setExpiredSubscriptions(expiredList);
    } else {
      setActiveColleges([]);
      setInactiveColleges([]);
      setExpiredSubscriptions([]);
    }

    // 2. Fetch Registration Requests for Super Admin (from registration_requests table)
    const requestsRes = await fetchRegistrationRequestsFromSupabase();
    if (requestsRes.success && Array.isArray(requestsRes.data)) {
      const mappedRequests = requestsRes.data.map(r => ({
        id: r.id,
        collegeName: r.college_name || '',
        city: r.city || '',
        state: r.state || '',
        contactName: r.contact_person || r.contact_name || '',
        mobileNumber: r.mobile_number || '',
        email: r.email || '',
        status: r.status || 'Pending',
        remarks: r.remarks || '',
        submittedDate: r.submitted_at ? r.submitted_at.split('T')[0] : (r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        address: r.address || '',
        district: r.district || '',
        pinCode: r.pincode || r.pin_code || '',
        universityAffiliation: r.university_affiliation || '',
        pciApprovalNo: r.pci_approval_number || r.pci_approval_no || '',
        code: r.college_name ? `${safeInitials(r.college_name)}-${(r.city || 'CLG').substring(0, 3).toUpperCase()}` : '',
        initials: safeInitials(r.college_name),
        logoBg: 'from-teal-600 to-emerald-700',
        subscriptionPlan: 'Professional',
        subscriptionStartDate: new Date().toISOString().split('T')[0],
        subscriptionExpiryDate: '2027-08-04',
        maxStudentsAllowed: 600,
        subscriptionStatus: 'Active'
      }));
      setPendingRequests(mappedRequests);
    } else {
      setPendingRequests([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadSupabaseData();
  }, []);

  // Submit Registration Request -> Direct Supabase Insert
  const submitRegistration = async (newRequestData) => {
    console.log('[CollegeContext] Submitting registration directly to Supabase:', newRequestData);
    const result = await submitCollegeRegistrationToSupabase(newRequestData);

    if (result.success) {
      await loadSupabaseData();
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  };

  // Approve College Request -> Direct Supabase Update & Inserts
  const approveCollege = async (requestId) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return null;

    console.log('[CollegeContext] Approving request directly in Supabase:', requestId);
    const result = await approveCollegeInSupabase(request);

    if (result.success) {
      await loadSupabaseData();
      return result.data;
    }
    return null;
  };

  // Reject College Request with Remarks -> Direct Supabase Update
  const rejectCollege = async (requestId, remarks = '') => {
    console.log('[CollegeContext] Rejecting request directly in Supabase:', requestId, 'remarks:', remarks);
    const result = await rejectCollegeInSupabase(requestId, remarks);
    if (result.success) {
      await loadSupabaseData();
    }
  };

  // Update College Profile & Subscription -> Direct Supabase Updates
  const updateCollegeProfile = async (collegeId, updatedProfile) => {
    console.log('[CollegeContext] Updating profile and subscription directly in Supabase:', collegeId);
    const result = await updateCollegeProfileAndSubscriptionInSupabase(collegeId, updatedProfile);

    if (result.success) {
      await loadSupabaseData();
    }
    return result;
  };

  // Upload College Logo
  const uploadCollegeLogo = async (file) => {
    return await uploadCollegeLogoToSupabaseStorage(file);
  };

  // Authenticate College Admin
  const loginCollegeAdmin = async (username, password, targetCollegeId = null) => {
    return await authenticateCollegeAdminInSupabase(username, password, targetCollegeId);
  };

  // Delete Single College -> Direct Supabase Deletion
  const deleteCollege = async (collegeId) => {
    console.log('[CollegeContext] Deleting college directly in Supabase:', collegeId);
    await deleteCollegeFromSupabase(collegeId);
    await loadSupabaseData();
  };

  // Bulk Delete Multiple Colleges -> Direct Supabase Bulk Deletion
  const deleteMultipleColleges = async (collegeIds) => {
    console.log('[CollegeContext] Bulk deleting colleges directly in Supabase:', collegeIds);
    await deleteMultipleCollegesFromSupabase(collegeIds);
    await loadSupabaseData();
  };

  // Update College Status (Active <-> Inactive Soft Deactivation/Reactivation)
  const updateCollegeStatus = async (collegeId, newStatus) => {
    console.log(`[CollegeContext] Updating college status in Supabase: ${collegeId} -> ${newStatus}`);
    const res = await updateCollegeStatusInSupabase(collegeId, newStatus);
    if (res.success) {
      await loadSupabaseData();
    }
    return res;
  };

  return (
    <CollegeContext.Provider value={{
      activeColleges,
      pendingRequests,
      inactiveColleges,
      expiredSubscriptions,
      isLoading,
      loadSupabaseData,
      submitRegistration,
      approveCollege,
      rejectCollege,
      updateCollegeProfile,
      updateCollegeStatus,
      uploadCollegeLogo,
      loginCollegeAdmin,
      deleteCollege,
      deleteMultipleColleges
    }}>
      {children}
    </CollegeContext.Provider>
  );
};

const defaultContextValue = {
  activeColleges: [],
  pendingRequests: [],
  inactiveColleges: [],
  expiredSubscriptions: [],
  isLoading: false,
  loadSupabaseData: async () => {},
  submitRegistration: async () => ({ success: false }),
  approveCollege: async () => null,
  rejectCollege: async () => {},
  updateCollegeProfile: async () => ({ success: false }),
  updateCollegeStatus: async () => ({ success: false }),
  uploadCollegeLogo: async () => ({ success: false }),
  loginCollegeAdmin: async () => ({ success: false }),
  deleteCollege: async () => {},
  deleteMultipleColleges: async () => {}
};

export const useColleges = () => {
  const context = useContext(CollegeContext);
  return context || defaultContextValue;
};
