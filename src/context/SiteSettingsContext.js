'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const SiteSettingsContext = createContext({});

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setSettings(data);
        setLoaded(true);

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
      })
      .catch(() => setLoaded(true));
  }, []);

  const get = (key, fallback = '') => (settings[key] !== undefined ? settings[key] : fallback);

  return (
    <SiteSettingsContext.Provider value={{ settings, loaded, get }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
