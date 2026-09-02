/**
 * PharmDVerse — College Subscription Management Utility
 * Standardized Subscription Plans, Capacity Limits, Expiry Calculations & Status Formatting
 */

export const SUBSCRIPTION_PLANS = {
  'Basic': {
    id: 'Basic',
    name: 'Basic Plan — Up to 100 Students',
    shortName: 'Basic Plan',
    maxStudents: 100
  },
  'Standard': {
    id: 'Standard',
    name: 'Standard Plan — Up to 200 Students',
    shortName: 'Standard Plan',
    maxStudents: 200
  },
  'Professional': {
    id: 'Professional',
    name: 'Professional Plan — Up to 300 Students',
    shortName: 'Professional Plan',
    maxStudents: 300
  },
  'Enterprise': {
    id: 'Enterprise',
    name: 'Enterprise Plan — Up to 600 Students',
    shortName: 'Enterprise Plan',
    maxStudents: 600
  }
};

/**
 * Normalizes plan key or capacity number into standardized plan details.
 */
export const getPlanDetails = (planInput, maxStudentsOverride = null) => {
  // 1. Direct plan key lookup ('Basic', 'Standard', 'Professional', 'Enterprise')
  if (planInput && SUBSCRIPTION_PLANS[planInput]) {
    return SUBSCRIPTION_PLANS[planInput];
  }

  // 2. Numeric capacity lookup (100, 200, 300, 600)
  if (typeof planInput === 'number') {
    if (planInput === 100) return SUBSCRIPTION_PLANS['Basic'];
    if (planInput === 200) return SUBSCRIPTION_PLANS['Standard'];
    if (planInput === 300) return SUBSCRIPTION_PLANS['Professional'];
    if (planInput === 600) return SUBSCRIPTION_PLANS['Enterprise'];
  }

  // 3. String matching on planInput
  if (planInput && typeof planInput === 'string') {
    const lower = planInput.toLowerCase();
    if (lower.includes('basic') || lower.includes('100')) return SUBSCRIPTION_PLANS['Basic'];
    if (lower.includes('standard') || lower.includes('200')) return SUBSCRIPTION_PLANS['Standard'];
    if (lower.includes('enterprise') || lower.includes('600')) return SUBSCRIPTION_PLANS['Enterprise'];
    if (lower.includes('professional') || lower.includes('300')) return SUBSCRIPTION_PLANS['Professional'];
  }

  // 4. Override fallback by maxStudents numeric limit
  if (maxStudentsOverride) {
    const num = parseInt(maxStudentsOverride, 10);
    if (num === 100) return SUBSCRIPTION_PLANS['Basic'];
    if (num === 200) return SUBSCRIPTION_PLANS['Standard'];
    if (num === 300) return SUBSCRIPTION_PLANS['Professional'];
    if (num === 600) return SUBSCRIPTION_PLANS['Enterprise'];
  }

  return SUBSCRIPTION_PLANS['Professional'];
};

/**
 * Calculates remaining days from Expiry Date string.
 */
export const calculateDaysRemaining = (expiryDateStr) => {
  if (!expiryDateStr) return 365;

  const expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry - today;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Determines subscription status automatically from Expiry Date and explicit status override.
 */
export const getSubscriptionStatusDetails = (expiryDateStr, explicitStatus = 'Active') => {
  if (explicitStatus === 'Inactive') {
    return {
      status: 'Inactive',
      label: 'Inactive',
      daysRemaining: 0,
      badgeClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      dotClass: 'bg-amber-500'
    };
  }

  const daysRemaining = calculateDaysRemaining(expiryDateStr);

  if (daysRemaining <= 0) {
    return {
      status: 'Expired',
      label: 'Expired',
      daysRemaining: 0,
      badgeClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      dotClass: 'bg-rose-500'
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: 'Expiring Soon',
      label: daysRemaining <= 5 ? `Renewal Required Soon (${daysRemaining} Days)` : `Expiring Soon (${daysRemaining} Days)`,
      daysRemaining,
      badgeClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      dotClass: 'bg-amber-500 animate-pulse'
    };
  }

  return {
    status: 'Active',
    label: 'Active',
    daysRemaining,
    badgeClass: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    dotClass: 'bg-emerald-500 animate-pulse'
  };
};

/**
 * Formats date string into readable DD MMM YYYY format.
 */
export const formatSubscriptionDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
