import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  fetchPlatformSettingsFromSupabase, 
  updatePlatformSettingsInSupabase, 
  DEFAULT_PLATFORM_SETTINGS 
} from '../services/platformService';

const PlatformContext = createContext(null);

export const PlatformProvider = ({ children }) => {
  const [platformSettings, setPlatformSettings] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = window.localStorage.getItem('pharmdverse_platform_settings_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (!parsed.platform_name || parsed.platform_name === 'PharmDVerse ERP') {
            parsed.platform_name = 'PHARM.D & B.PHARM NEXUS';
          }
          return { ...DEFAULT_PLATFORM_SETTINGS, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to load cached settings:', e);
    }
    return DEFAULT_PLATFORM_SETTINGS;
  });
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
    try {
      if (typeof document !== 'undefined') {
        const title = platformSettings?.platform_name || DEFAULT_PLATFORM_SETTINGS.platform_name;
        document.title = `${title} — Clinical Case & Practical Platform`;

        const favUrl = platformSettings?.favicon_url || '/pharmdverse-logo.png';
        let link = document.querySelector("link[rel*='icon']");
        if (link) {
          link.href = favUrl;
        } else {
          link = document.createElement('link');
          link.rel = 'icon';
          link.type = 'image/png';
          link.href = favUrl;
          document.getElementsByTagName('head')[0].appendChild(link);
        }
      }
    } catch (e) {
      console.warn('Could not update document title or favicon:', e);
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
