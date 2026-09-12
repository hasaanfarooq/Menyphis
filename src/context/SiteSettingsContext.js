'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SiteSettingsContext = createContext({});

export function SiteSettingsProvider({ children, initialSettings = {} }) {
  const [settings, setSettings] = useState(initialSettings);
  const [loaded, setLoaded] = useState(Boolean(initialSettings && Object.keys(initialSettings).length > 0));

  const applySiteEffects = useCallback((data) => {
    if (!data || typeof data !== 'object') return;

    // Apply primary color as CSS variable
    if (data.primary_color) {
      document.documentElement.style.setProperty('--color-primary', data.primary_color);
    }

    // Apply Font Family
    if (data.font_family) {
      const fontName = data.font_family.replace(/ /g, '+');
      let link = document.getElementById('google-font-link');
      if (!link) {
        link = document.createElement('link');
        link.id = 'google-font-link';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700;800&display=swap`;
      document.documentElement.style.setProperty('--font-body', `"${data.font_family}", sans-serif`);
    }

    // Apply Theme
    if (data.default_theme) {
      if (data.default_theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', data.default_theme);
      }
    }

    // Apply custom CSS
    if (data.custom_css) {
      let el = document.getElementById('admin-custom-css');
      if (!el) {
        el = document.createElement('style');
        el.id = 'admin-custom-css';
        document.head.appendChild(el);
      }
      el.textContent = data.custom_css;
    }

    // Set page title from settings (if not overridden by page)
    if (data.site_name && data.seo_title) {
      document.title = data.seo_title;
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const r = await fetch(`/api/settings?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      if (!r.ok) {
        setLoaded(true);
        return;
      }
      const data = await r.json();
      if (!data || typeof data !== 'object') {
        setLoaded(true);
        return;
      }
      setSettings(data);
      setLoaded(true);
      applySiteEffects(data);
    } catch {
      setLoaded(true);
    }
  }, [applySiteEffects]);

  useEffect(() => {
    // If initialSettings were provided, apply effects immediately
    if (initialSettings && Object.keys(initialSettings).length > 0) {
      applySiteEffects(initialSettings);
    }

    loadSettings();

    // Listen for setting changes dispatched from admin or other tabs
    const handleUpdate = () => {
      loadSettings();
    };

    const handleStorage = (e) => {
      if (e.key === 'site_settings_timestamp') {
        loadSettings();
      }
    };

    window.addEventListener('site-settings-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('site-settings-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadSettings, initialSettings, applySiteEffects]);

  const get = (key, fallback = '') => (settings[key] !== undefined ? settings[key] : fallback);

  return (
    <SiteSettingsContext.Provider value={{ settings, loaded, get, refreshSettings: loadSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
