import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  fetchPlatformSettingsFromSupabase, 
  updatePlatformSettingsInSupabase, 
  DEFAULT_PLATFORM_SETTINGS 
} from '../services/platformService';

const PlatformContext = createContext(null);

export const PlatformProvider = ({ children }) => {
  const [platformSettings, setPlatformSettings] = useState(DEFAULT_PLATFORM_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Load platform settings on mount
  useEffect(() => {
    const initSettings = async () => {
      setLoadingSettings(true);
      const res = await fetchPlatformSettingsFromSupabase();
      if (res.success && res.settings) {
        setPlatformSettings(res.settings);
      }
      setLoadingSettings(false);
    };

    initSettings();
  }, []);

  // Update browser document title and favicon dynamically whenever settings change
  useEffect(() => {
    if (platformSettings) {
      // 1. Update Document Title
      const title = platformSettings.platform_name || DEFAULT_PLATFORM_SETTINGS.platform_name;
      document.title = `${title} — Clinical Case Analysis ERP`;

      // 2. Update Favicon Link Element
      if (platformSettings.favicon_url) {
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = platformSettings.favicon_url;
      }
    }
  }, [platformSettings]);

  // Handler to update settings centrally
  const updateSettings = async (newSettings, updatedBy = 'Super Admin') => {
    const res = await updatePlatformSettingsInSupabase(newSettings, updatedBy);
    if (res.success && res.settings) {
      setPlatformSettings(res.settings);
    }
    return res;
  };

  return (
    <PlatformContext.Provider value={{
      platformSettings: platformSettings || DEFAULT_PLATFORM_SETTINGS,
      updatePlatformSettings: updateSettings,
      loadingSettings
    }}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      platformSettings: DEFAULT_PLATFORM_SETTINGS,
      updatePlatformSettings: async () => ({ success: true, settings: DEFAULT_PLATFORM_SETTINGS }),
      loadingSettings: false
    };
  }
  return context;
};
