import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const ExpiredSubscriptionBanner = ({ college }) => {
  const { platformSettings } = usePlatform();
  const platformName = platformSettings?.platform_name || 'PharmDVerse';

  // Only render if the college is actually expired
  if (!college || college.status !== 'Expired') return null;

  return (
    <div className="bg-red-600 dark:bg-red-900/90 text-white px-4 py-2 flex items-center justify-center space-x-3 w-full shadow-md z-50 animate-in slide-in-from-top-4 duration-500">
      <AlertOctagon className="w-5 h-5 flex-shrink-0 animate-pulse" />
      <p className="text-xs sm:text-sm font-semibold tracking-wide text-center">
        Subscription Expired on {college.subscriptionExpiryDate}. Workspace is in Read-Only Mode. Please contact {platformName} Super Admin to restore full access.
      </p>
    </div>
  );
};
