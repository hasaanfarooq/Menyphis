'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StoreIcon, PaletteIcon, ShoppingBagIcon, ShareIcon, GlobeIcon,
  BellIcon, LockIcon, FileTextIcon, SlidersIcon, CheckIcon, AlertIcon,
  XIcon, SunIcon, MoonIcon, MonitorIcon, InstagramIcon, TwitterIcon,
  TikTokIcon, YouTubeIcon, FacebookIcon
} from '@/components/Icons';
import SuperAdminGuard from '@/components/SuperAdminGuard';

// ── Reusable primitives ────────────────────────────────────────────────────────

function Toggle({ value, onChange, id }) {
  return (
    <button type="button" id={id} onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
        background: value ? '#22c55e' : '#cbd5e1',
        position: 'relative', transition: 'background 0.25s', flexShrink: 0,
      }}>
      <span style={{
        position: 'absolute', top: '3px', left: value ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%', background: 'white',
        transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        display: 'block',
      }} />
    </button>
  );
}

function SettingRow({ label, hint, children, id, icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f1f5f9', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '14px', color: '#1e293b', cursor: 'pointer', marginBottom: hint ? '2px' : 0 }}>
          {icon && icon}
          {label}
        </label>
        {hint && <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function SInput({ value, onChange, placeholder, type = 'text', id, mono = false, style: extra = {} }) {
  return (
    <input id={id} type={type} value={value ?? ''} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', width: '280px', maxWidth: '100%', fontFamily: mono ? 'monospace' : 'inherit', ...extra }} />
  );
}

function STextarea({ value, onChange, placeholder, rows = 4, id, mono = false }) {
  return (
    <textarea id={id} value={value ?? ''} placeholder={placeholder} rows={rows}
      onChange={e => onChange(e.target.value)}
      style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', width: '320px', maxWidth: '100%', resize: 'vertical', fontFamily: mono ? 'monospace' : 'inherit', lineHeight: '1.5' }} />
  );
}

function SSelect({ value, onChange, options, id }) {
  return (
    <select id={id} value={value ?? ''} onChange={e => onChange(e.target.value)}
      style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', background: 'white', cursor: 'pointer', minWidth: '160px' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ColorInput({ value, onChange, id }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input type="color" id={id} value={value?.startsWith('#') ? value : '#6366f1'}
        onChange={e => onChange(e.target.value)}
        style={{ width: '40px', height: '36px', padding: '2px 3px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', flexShrink: 0 }} />
      <input type="text" value={value ?? ''} onChange={e => onChange(e.target.value)}
        placeholder="#6366f1" style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', width: '120px' }} />
      {/* Live preview */}
      <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: value, border: '1px solid #e2e8f0', display: 'inline-block', flexShrink: 0 }} />
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      background: type === 'success' ? '#1e293b' : '#ef4444',
      color: 'white', padding: '14px 20px', borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600',
      animation: 'slideUp 0.3s ease',
      maxWidth: '360px',
    }}>
      <span style={{ display: 'flex', alignItems: 'center' }}>{type === 'success' ? <CheckIcon size={18} color="white" /> : <AlertIcon size={18} color="white" />}</span>
      {message}
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', padding: 0, marginLeft: 'auto' }}>
        <XIcon size={16} color="white" />
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'general', label: 'General', icon: (color) => <StoreIcon size={16} color={color} /> },
  { key: 'appearance', label: 'Appearance & Theme', icon: (color) => <PaletteIcon size={16} color={color} /> },
  { key: 'commerce', label: 'Commerce', icon: (color) => <ShoppingBagIcon size={16} color={color} /> },
  { key: 'social', label: 'Social Links', icon: (color) => <ShareIcon size={16} color={color} /> },
  { key: 'seo', label: 'SEO & Meta', icon: (color) => <GlobeIcon size={16} color={color} /> },
  { key: 'notifications', label: 'Notifications', icon: (color) => <BellIcon size={16} color={color} /> },
  { key: 'security', label: 'Security', icon: (color) => <LockIcon size={16} color={color} /> },
  { key: 'footer', label: 'Footer & Legal', icon: (color) => <FileTextIcon size={16} color={color} /> },
  { key: 'advanced', label: 'Advanced', icon: (color) => <SlidersIcon size={16} color={color} /> },
];

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({});
  const [original, setOriginal] = useState({});
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [dirty, setDirty] = useState(false);
  const mainRef = useRef(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, res] = await Promise.all([
        fetch('/api/admin/me'),
        fetch('/api/admin/settings'),
      ]);
      if (meRes.ok) {
        setAdminInfo(await meRes.json());
      }
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setOriginal(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const set = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const s = (key, fallback = '') => settings[key] ?? fallback;

  const handleSave = async (sectionKeys = null) => {
    setSaving(true);
    try {
      const payload = sectionKeys
        ? Object.fromEntries(sectionKeys.map(k => [k, settings[k]]))
        : settings;

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setOriginal({ ...original, ...payload });
        setDirty(false);

        // Apply primary color immediately
        if (payload.primary_color) {
          document.documentElement.style.setProperty('--color-primary', payload.primary_color);
        }
        // Apply custom CSS immediately
        if ('custom_css' in payload) {
          let el = document.getElementById('admin-custom-css');
          if (!el) { el = document.createElement('style'); el.id = 'admin-custom-css'; document.head.appendChild(el); }
          el.textContent = payload.custom_css || '';
        }

        setToast({ message: `${data.saved} settings saved successfully`, type: 'success' });
      } else {
        const err = await res.json();
        setToast({ message: err.error || 'Save failed', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error, please try again', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(original);
    setDirty(false);
  };

  const scrollTo = (key) => {
    setActiveSection(key);
    const el = document.getElementById(`section-${key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Section keys map for per-section save
  const SECTION_KEYS = {
    general: ['site_name', 'site_tagline', 'site_description', 'contact_email', 'contact_phone', 'contact_address'],
    appearance: ['primary_color', 'font_family', 'default_theme', 'custom_css'],
    commerce: ['currency_default', 'free_shipping_threshold', 'tax_rate', 'guest_checkout', 'low_stock_threshold', 'default_shipping_cost'],
    social: ['social_instagram', 'social_twitter', 'social_tiktok', 'social_youtube', 'social_facebook'],
    seo: ['seo_title', 'seo_description', 'seo_og_image', 'google_analytics_id'],
    notifications: ['notify_new_order', 'notify_low_stock', 'notify_new_review', 'admin_notify_email'],
    security: ['maintenance_mode', 'maintenance_message', 'registration_open'],
    footer: ['footer_copyright', 'footer_tagline', 'returns_policy_url', 'privacy_policy_url', 'terms_url'],
    advanced: ['custom_css'],
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', color: '#64748b' }}>
        <div style={{ width: '24px', height: '24px', border: '3px solid #e2e8f0', borderTopColor: '#1e293b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        Loading settings...
      </div>
    );
  }

  if (adminInfo && !adminInfo.isSuperAdmin) {
    return (
      <SuperAdminGuard
        feature="Platform Global Settings"
        description="Marketplace-wide settings, payment gateways, maintenance toggles, and global design options can only be adjusted by platform super administrators."
      />
    );
  }

  return (
    <div style={{ display: 'flex', gap: '0', minHeight: '100%' }}>
      {/* ── Sidebar nav ── */}
      <div style={{
        width: '220px', flexShrink: 0, position: 'sticky', top: 0, alignSelf: 'flex-start',
        background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
        overflow: 'hidden', marginRight: '24px',
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', fontWeight: '700', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Settings
        </div>
        {SECTIONS.map(section => (
          <button key={section.key} onClick={() => scrollTo(section.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
              padding: '11px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: activeSection === section.key ? '#f8fafc' : 'transparent',
              color: activeSection === section.key ? '#1e293b' : '#475569',
              fontWeight: activeSection === section.key ? '700' : '400',
              fontSize: '13px', borderLeft: `3px solid ${activeSection === section.key ? '#1e293b' : 'transparent'}`,
              transition: 'all 0.15s',
            }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {section.icon(activeSection === section.key ? '#1e293b' : '#64748b')}
            </span>
            {section.label}
          </button>
        ))}
      </div>

      {/* ── Main content ── */}
      <div ref={mainRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="admin-page-title" style={{ marginBottom: '2px' }}>Settings</h1>
            <p style={{ color: '#64748b', fontSize: '13px' }}>Configure every aspect of your store.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {dirty && (
              <>
                <span style={{ fontSize: '12px', color: '#f97316', fontWeight: '600', background: '#fff7ed', padding: '4px 10px', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                  ● Unsaved changes
                </span>
                <button onClick={handleReset} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                  Discard
                </button>
              </>
            )}
            <button onClick={() => handleSave()} disabled={saving}
              style={{ padding: '10px 24px', background: saving ? '#94a3b8' : '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px' }}>
              {saving ? 'Saving…' : 'Save All'}
            </button>
          </div>
        </div>

        {/* ══ GENERAL ══════════════════════════════════════════════════ */}
        <div id="section-general" className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StoreIcon size={18} /> General
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>Brand identity and contact details</p>
            </div>
            <button onClick={() => handleSave(SECTION_KEYS.general)} disabled={saving}
              style={{ padding: '6px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              Save Section
            </button>
          </div>
          <SettingRow label="Store Name" hint="Displayed in the browser tab and emails" id="site_name">
            <SInput id="site_name" value={s('site_name')} onChange={v => set('site_name', v)} placeholder="Menyphis" />
          </SettingRow>
          <SettingRow label="Tagline" hint="Short brand slogan shown in the hero" id="site_tagline">
            <SInput id="site_tagline" value={s('site_tagline')} onChange={v => set('site_tagline', v)} placeholder="Premium Streetwear" />
          </SettingRow>
          <SettingRow label="Store Description" hint="Used for SEO and meta tags" id="site_description">
            <STextarea id="site_description" value={s('site_description')} onChange={v => set('site_description', v)} rows={3} placeholder="What makes your store unique..." />
          </SettingRow>
          <SettingRow label="Contact Email" id="contact_email">
            <SInput id="contact_email" type="email" value={s('contact_email')} onChange={v => set('contact_email', v)} placeholder="hello@store.com" />
          </SettingRow>
          <SettingRow label="Contact Phone" id="contact_phone">
            <SInput id="contact_phone" value={s('contact_phone')} onChange={v => set('contact_phone', v)} placeholder="+1 (555) 000-0000" />
          </SettingRow>
          <SettingRow label="Store Address" hint="Used in footer and receipts" id="contact_address">
            <STextarea id="contact_address" value={s('contact_address')} onChange={v => set('contact_address', v)} rows={2} placeholder="123 Street, City, Country" />
          </SettingRow>
        </div>

        {/* ══ APPEARANCE ══════════════════════════════════════════════ */}
        <div id="section-appearance" className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PaletteIcon size={18} /> Appearance
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>Colors, fonts, and custom styling</p>
            </div>
            <button onClick={() => handleSave(SECTION_KEYS.appearance)} disabled={saving}
              style={{ padding: '6px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              Save Section
            </button>
          </div>

          <SettingRow label="Primary Color" hint="Main brand color applied across buttons, links, and highlights" id="primary_color">
            <ColorInput id="primary_color" value={s('primary_color', '#6366f1')} onChange={v => set('primary_color', v)} />
          </SettingRow>

          {/* Color presets */}
          <div style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Presets</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'Indigo', color: '#6366f1' }, { label: 'Purple', color: '#8b5cf6' },
                { label: 'Rose', color: '#f43f5e' }, { label: 'Amber', color: '#f59e0b' },
                { label: 'Emerald', color: '#10b981' }, { label: 'Sky', color: '#0ea5e9' },
                { label: 'Slate', color: '#1e293b' }, { label: 'Orange', color: '#f97316' },
              ].map(p => (
                <button key={p.color} type="button" onClick={() => set('primary_color', p.color)}
                  title={p.label}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', background: p.color, border: s('primary_color') === p.color ? '3px solid #1e293b' : '3px solid white', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.15s', transform: s('primary_color') === p.color ? 'scale(1.2)' : 'scale(1)' }} />
              ))}
            </div>
          </div>

          <SettingRow label="Font Family" hint="Applied to all text across the store" id="font_family">
            <SSelect id="font_family" value={s('font_family', 'Inter')} onChange={v => set('font_family', v)}
              options={[
                { value: 'Inter', label: 'Inter (default)' },
                { value: 'Outfit', label: 'Outfit' },
                { value: 'Poppins', label: 'Poppins' },
                { value: 'Roboto', label: 'Roboto' },
                { value: 'DM Sans', label: 'DM Sans' },
                { value: 'Space Grotesk', label: 'Space Grotesk' },
                { value: 'Syne', label: 'Syne' },
                { value: 'Bebas Neue', label: 'Bebas Neue' },
              ]} />
          </SettingRow>

          <SettingRow label="Default Theme" hint="Initial theme for new visitors" id="default_theme">
            <div style={{ display: 'flex', gap: '8px' }}>
              {['light', 'dark', 'system'].map(t => (
                <button key={t} type="button" onClick={() => set('default_theme', t)}
                  style={{
                    padding: '8px 20px', borderRadius: '8px',
                    border: `2px solid ${s('default_theme') === t ? '#1e293b' : '#e2e8f0'}`,
                    background: s('default_theme') === t ? '#1e293b' : 'white',
                    color: s('default_theme') === t ? 'white' : '#475569',
                    cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                    textTransform: 'capitalize', transition: 'all 0.15s',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}>
                  {t === 'light' ? <SunIcon size={14} /> : t === 'dark' ? <MoonIcon size={14} /> : <MonitorIcon size={14} />} {t}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow label="Custom CSS" hint="Injected into every page — use with care" id="custom_css">
            <STextarea id="custom_css" mono value={s('custom_css', '')} onChange={v => set('custom_css', v)} rows={6}
              placeholder="/* Custom CSS overrides */&#10;:root { --custom-var: value; }" />
          </SettingRow>
        </div>

        {/* ══ COMMERCE ══════════════════════════════════════════════════ */}
        <div id="section-commerce" className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBagIcon size={18} /> Commerce
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>Currency, shipping, and checkout rules</p>
            </div>
            <button onClick={() => handleSave(SECTION_KEYS.commerce)} disabled={saving}
              style={{ padding: '6px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              Save Section
            </button>
          </div>
          <SettingRow label="Default Currency" id="currency_default">
            <SSelect id="currency_default" value={s('currency_default', 'USD')} onChange={v => set('currency_default', v)}
              options={[
                { value: 'USD', label: 'USD — US Dollar' },
                { value: 'PKR', label: 'PKR — Pakistani Rupee' },
                { value: 'EUR', label: 'EUR — Euro' },
                { value: 'GBP', label: 'GBP — British Pound' },
                { value: 'AED', label: 'AED — UAE Dirham' },
                { value: 'SAR', label: 'SAR — Saudi Riyal' },
                { value: 'CAD', label: 'CAD — Canadian Dollar' },
                { value: 'AUD', label: 'AUD — Australian Dollar' },
              ]} />
          </SettingRow>
          <SettingRow label="Free Shipping Threshold" hint="Orders above this amount get free shipping (0 = always free)" id="free_shipping_threshold">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '600', color: '#64748b' }}>$</span>
              <SInput id="free_shipping_threshold" type="number" value={s('free_shipping_threshold', 99)} onChange={v => set('free_shipping_threshold', parseFloat(v))} placeholder="99" style={{ width: '100px' }} />
            </div>
          </SettingRow>
          <SettingRow label="Default Shipping Cost" hint="Charged when order doesn't qualify for free shipping" id="default_shipping_cost">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '600', color: '#64748b' }}>$</span>
              <SInput id="default_shipping_cost" type="number" value={s('default_shipping_cost', 0)} onChange={v => set('default_shipping_cost', parseFloat(v))} placeholder="0" style={{ width: '100px' }} />
            </div>
          </SettingRow>
          <SettingRow label="Tax Rate (%)" hint="Applied at checkout (0 = no tax)" id="tax_rate">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SInput id="tax_rate" type="number" min="0" max="100" step="0.1" value={s('tax_rate', 0)} onChange={v => set('tax_rate', parseFloat(v))} placeholder="0" style={{ width: '100px' }} />
              <span style={{ fontWeight: '600', color: '#64748b' }}>%</span>
            </div>
          </SettingRow>
          <SettingRow label="Guest Checkout" hint="Allow users to order without creating an account" id="guest_checkout">
            <Toggle id="guest_checkout" value={s('guest_checkout', true)} onChange={v => set('guest_checkout', v)} />
          </SettingRow>
          <SettingRow label="Low Stock Alert Threshold" hint="Warn when product stock falls below this number" id="low_stock_threshold">
            <SInput id="low_stock_threshold" type="number" value={s('low_stock_threshold', 5)} onChange={v => set('low_stock_threshold', parseInt(v))} placeholder="5" style={{ width: '100px' }} />
          </SettingRow>
        </div>

        {/* ══ SOCIAL ══════════════════════════════════════════════════ */}
        <div id="section-social" className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShareIcon size={18} /> Social Links
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>Used in footer and sharing</p>
            </div>
            <button onClick={() => handleSave(SECTION_KEYS.social)} disabled={saving}
              style={{ padding: '6px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              Save Section
            </button>
          </div>
          {[
            { key: 'social_instagram', label: 'Instagram', icon: <InstagramIcon size={16} />, placeholder: 'https://instagram.com/yourstore' },
            { key: 'social_twitter', label: 'Twitter / X', icon: <TwitterIcon size={16} />, placeholder: 'https://twitter.com/yourstore' },
            { key: 'social_tiktok', label: 'TikTok', icon: <TikTokIcon size={16} />, placeholder: 'https://tiktok.com/@yourstore' },
            { key: 'social_youtube', label: 'YouTube', icon: <YouTubeIcon size={16} />, placeholder: 'https://youtube.com/@yourstore' },
            { key: 'social_facebook', label: 'Facebook', icon: <FacebookIcon size={16} />, placeholder: 'https://facebook.com/yourstore' },
          ].map(({ key, label, icon, placeholder }) => (
            <SettingRow key={key} label={label} id={key} icon={icon}>
              <SInput id={key} type="url" value={s(key)} onChange={v => set(key, v)} placeholder={placeholder} />
            </SettingRow>
          ))}
        </div>

        {/* ══ SEO ══════════════════════════════════════════════════════ */}
        <div id="section-seo" className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GlobeIcon size={18} /> SEO & Meta
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>How your store appears in search engines</p>
            </div>
            <button onClick={() => handleSave(SECTION_KEYS.seo)} disabled={saving}
              style={{ padding: '6px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              Save Section
            </button>
          </div>
          <SettingRow label="Default Page Title" hint="Shown in browser tab and Google results (50–60 chars)" id="seo_title">
            <div>
              <SInput id="seo_title" value={s('seo_title')} onChange={v => set('seo_title', v)} placeholder="Store Name — Tagline" />
              <div style={{ fontSize: '11px', color: s('seo_title', '').length > 60 ? '#ef4444' : '#94a3b8', marginTop: '4px' }}>
                {s('seo_title', '').length} / 60 characters
              </div>
            </div>
          </SettingRow>
          <SettingRow label="Meta Description" hint="Shown under your link in Google (150–160 chars)" id="seo_description">
            <div>
              <STextarea id="seo_description" value={s('seo_description')} onChange={v => set('seo_description', v)} rows={3} placeholder="Short, compelling description of your store..." />
              <div style={{ fontSize: '11px', color: s('seo_description', '').length > 160 ? '#ef4444' : '#94a3b8', marginTop: '4px' }}>
                {s('seo_description', '').length} / 160 characters
              </div>
            </div>
          </SettingRow>
          <SettingRow label="OG Image URL" hint="Shown when sharing your store on social media" id="seo_og_image">
            <SInput id="seo_og_image" type="url" value={s('seo_og_image')} onChange={v => set('seo_og_image', v)} placeholder="https://yourstore.com/og.jpg" />
          </SettingRow>
          <SettingRow label="Google Analytics ID" hint="Format: G-XXXXXXXXXX" id="google_analytics_id">
            <SInput id="google_analytics_id" value={s('google_analytics_id')} onChange={v => set('google_analytics_id', v)} placeholder="G-XXXXXXXXXX" mono />
          </SettingRow>

          {/* Google Preview */}
          {s('seo_title') && (
            <div style={{ margin: '16px 0 0', background: '#f8fafc', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Google Preview</div>
              <div style={{ fontSize: '12px', color: '#1a73e8', fontWeight: '700', marginBottom: '2px' }}>{s('seo_title') || 'Page Title'}</div>
              <div style={{ fontSize: '11px', color: '#006621' }}>yourstore.com</div>
              <div style={{ fontSize: '12px', color: '#545454', marginTop: '4px', lineHeight: '1.4' }}>{s('seo_description', '').slice(0, 160) || 'Your store description will appear here.'}</div>
            </div>
          )}
        </div>

        {/* ══ NOTIFICATIONS ════════════════════════════════════════════ */}
        <div id="section-notifications" className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BellIcon size={18} /> Notifications
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>Admin email alert preferences</p>
            </div>
            <button onClick={() => handleSave(SECTION_KEYS.notifications)} disabled={saving}
              style={{ padding: '6px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              Save Section
            </button>
          </div>
          <SettingRow label="Admin Notification Email" hint="Where alert emails are sent" id="admin_notify_email">
            <SInput id="admin_notify_email" type="email" value={s('admin_notify_email')} onChange={v => set('admin_notify_email', v)} placeholder="admin@yourstore.com" />
          </SettingRow>
          <SettingRow label="New Order Alert" hint="Email you when a new order is placed" id="notify_new_order">
            <Toggle id="notify_new_order" value={s('notify_new_order', true)} onChange={v => set('notify_new_order', v)} />
          </SettingRow>
          <SettingRow label="Low Stock Alert" hint={`Email when product stock drops below threshold (${s('low_stock_threshold', 5)} units)`} id="notify_low_stock">
            <Toggle id="notify_low_stock" value={s('notify_low_stock', true)} onChange={v => set('notify_low_stock', v)} />
          </SettingRow>
          <SettingRow label="New Review Alert" hint="Email when a customer leaves a review" id="notify_new_review">
            <Toggle id="notify_new_review" value={s('notify_new_review', false)} onChange={v => set('notify_new_review', v)} />
          </SettingRow>
        </div>

        {/* ══ SECURITY ═════════════════════════════════════════════════ */}
        <div id="section-security" className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LockIcon size={18} /> Security
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>Access control and store availability</p>
            </div>
            <button onClick={() => handleSave(SECTION_KEYS.security)} disabled={saving}
              style={{ padding: '6px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              Save Section
            </button>
          </div>

          <SettingRow label="Maintenance Mode" hint="Visitors see a maintenance page; admin can still log in" id="maintenance_mode">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Toggle id="maintenance_mode" value={s('maintenance_mode', false)} onChange={v => set('maintenance_mode', v)} />
              {s('maintenance_mode') && (
                <span style={{ background: '#fef2f2', color: '#ef4444', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <AlertIcon size={13} color="#ef4444" /> Store is offline
                </span>
              )}
            </div>
          </SettingRow>
          {s('maintenance_mode') && (
            <SettingRow label="Maintenance Message" id="maintenance_message">
              <STextarea id="maintenance_message" value={s('maintenance_message')} onChange={v => set('maintenance_message', v)} rows={2} placeholder="We'll be back soon!" />
            </SettingRow>
          )}
          <SettingRow label="Open Registration" hint="Allow new customers to create accounts" id="registration_open">
            <Toggle id="registration_open" value={s('registration_open', true)} onChange={v => set('registration_open', v)} />
          </SettingRow>
        </div>

        {/* ══ FOOTER & LEGAL ════════════════════════════════════════════ */}
        <div id="section-footer" className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileTextIcon size={18} /> Footer & Legal
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>Footer text and legal page links</p>
            </div>
            <button onClick={() => handleSave(SECTION_KEYS.footer)} disabled={saving}
              style={{ padding: '6px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              Save Section
            </button>
          </div>
          <SettingRow label="Copyright Text" id="footer_copyright">
            <SInput id="footer_copyright" value={s('footer_copyright')} onChange={v => set('footer_copyright', v)} placeholder="© 2026 Menyphis. All rights reserved." />
          </SettingRow>
          <SettingRow label="Footer Brand Tagline" id="footer_tagline">
            <STextarea id="footer_tagline" value={s('footer_tagline')} onChange={v => set('footer_tagline', v)} rows={2} placeholder="Short brand statement shown in footer" />
          </SettingRow>
          <SettingRow label="Privacy Policy URL" id="privacy_policy_url">
            <SInput id="privacy_policy_url" type="url" value={s('privacy_policy_url')} onChange={v => set('privacy_policy_url', v)} placeholder="/privacy" />
          </SettingRow>
          <SettingRow label="Terms of Service URL" id="terms_url">
            <SInput id="terms_url" type="url" value={s('terms_url')} onChange={v => set('terms_url', v)} placeholder="/terms" />
          </SettingRow>
          <SettingRow label="Returns Policy URL" id="returns_policy_url">
            <SInput id="returns_policy_url" type="url" value={s('returns_policy_url')} onChange={v => set('returns_policy_url', v)} placeholder="/returns" />
          </SettingRow>
        </div>

        {/* ══ ADVANCED ═════════════════════════════════════════════════ */}
        <div id="section-advanced" className="admin-card">
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersIcon size={18} /> Advanced
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>Danger zone and system controls</p>
          </div>

          {/* Settings Export */}
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>Export Settings</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>Download all settings as a JSON file for backup.</div>
            <button type="button" onClick={() => {
              const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'menyphis-settings.json'; a.click();
              URL.revokeObjectURL(url);
            }} style={{ padding: '8px 20px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              Export JSON
            </button>
          </div>

          {/* Settings JSON viewer */}
          <div style={{ background: '#0f172a', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#94a3b8', marginBottom: '10px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Raw Settings JSON</div>
            <pre style={{ margin: 0, fontSize: '11px', color: '#a5f3fc', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '300px', overflowY: 'auto', lineHeight: '1.5' }}>
              {JSON.stringify(settings, null, 2)}
            </pre>
          </div>

          {/* Danger zone */}
          <div style={{ border: '1px solid #fecaca', borderRadius: '10px', padding: '16px', background: '#fff8f8' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#ef4444', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertIcon size={16} color="#ef4444" /> Danger Zone
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>These actions are irreversible. Proceed with extreme caution.</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => { if (confirm('Reset ALL settings to defaults? This cannot be undone.')) { fetchSettings(); setToast({ message: 'Settings reloaded from database', type: 'success' }); } }}
                style={{ padding: '8px 18px', border: '1px solid #ef4444', background: 'white', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>

        {/* Sticky save footer */}
        {dirty && (
          <div style={{
            position: 'sticky', bottom: 0, background: '#1e293b', borderRadius: '12px',
            padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.2)', flexWrap: 'wrap', gap: '10px',
            animation: 'slideUp 0.3s ease',
          }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>You have unsaved changes across all sections.</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleReset} style={{ padding: '8px 16px', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Discard</button>
              <button onClick={() => handleSave()} disabled={saving}
                style={{ padding: '8px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '13px' }}>
                {saving ? 'Saving…' : 'Save All Changes'}
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
