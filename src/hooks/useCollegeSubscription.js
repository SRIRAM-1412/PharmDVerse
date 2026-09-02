import { useState, useEffect } from 'react';
import { fetchCollegeSubscriptionByIdFromSupabase } from '../services/supabaseService';
import { getSubscriptionStatusDetails } from '../utils/subscriptionUtils';

export const useCollegeSubscription = (collegeId) => {
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collegeData, setCollegeData] = useState(null);

  useEffect(() => {
    const checkExpiry = async () => {
      if (!collegeId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetchCollegeSubscriptionByIdFromSupabase(collegeId);
        if (res.success && res.college) {
          const sub = res.subscription;
          const col = res.college;
          
          const rawExpiry = sub?.subscription_end_date || col?.subscription_end_date || sub?.subscription_expiry_date || '2027-08-04';
          const rawStatus = sub?.status || col?.status || 'Active';
          
          const statusMeta = getSubscriptionStatusDetails(rawExpiry, rawStatus);
          
          setIsExpired(statusMeta.status === 'Expired');
          setCollegeData({ ...col, ...sub, status: rawStatus });
        }
      } catch (err) {
        console.error("Failed to fetch college subscription status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkExpiry();
  }, [collegeId]);

  return { isExpired, loading, collegeData };
};
