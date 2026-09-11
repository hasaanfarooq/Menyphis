'use client';
import { useState, useEffect, useCallback } from 'react';
import { ImageIcon, MegaphoneIcon, EditIcon, XIcon, ClockIcon, BellIcon, ZapIcon } from '@/components/Icons';
import SuperAdminGuard from '@/components/SuperAdminGuard';

// ── Image Uploader ─────────────────────────────────────────────
function ImageUploader({ value, onChange, label = 'Image', aspect = '16/9' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || '');

  useEffect(() => { setPreview(value || ''); }, [value]);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) { setPreview(data.url); onChange(data.url); }
      else alert(data.error || 'Upload failed');
    } catch { alert('Upload error'); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#475569' }}>{label}</label>
      <div style={{ border: '2px dashed #e2e8f0', borderRadius: '10px', overflow: 'hidden', background: '#f8fafc', position: 'relative', aspectRatio: aspect, minHeight: '100px' }}>
        {preview ? (
          <>
            <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button type="button" onClick={() => { setPreview(''); onChange(''); }} aria-label="Remove image"
              style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XIcon size={14} />
            </button>
          </>
        ) : (
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer', gap: '8px', padding: '16px', textAlign: 'center', minHeight: '100px' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              {uploading ? <ClockIcon size={28} /> : <ImageIcon size={28} />}
            </span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{uploading ? 'Uploading...' : 'Click to upload'}</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading}
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          </label>
        )}
      </div>
      <input type="text" value={preview} onChange={e => { setPreview(e.target.value); onChange(e.target.value); }}
        placeholder="…or paste image URL"
        style={{ width: '100%', marginTop: '6px', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box', color: '#475569' }} />
    </div>
  );
}

// ── Color Input ─────────────────────────────────────────────────
function ColorPicker({ label, value, onChange }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input type="color" value={value?.startsWith('#') ? value : '#1e293b'} onChange={e => onChange(e.target.value)}
          style={{ width: '40px', height: '36px', padding: '2px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', flexShrink: 0 }} />
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder="#ffffff or rgba(0,0,0,0.5)"
          style={{ flex: 1, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }} />
      </div>
    </div>
  );
}

const defaultSlide = {
  title: '', subtitle: '', badge_text: '', cta_text: 'Shop Now', cta_link: '/shop',
  cta_secondary_text: '', cta_secondary_link: '', image_url: '',
  overlay_color: 'rgba(0,0,0,0.45)', text_color: '#ffffff', text_align: 'left',
  sort_order: 0, is_active: true,
};

const defaultBanner = (placement) => ({
  placement, title: '', subtitle: '', cta_text: '', cta_link: '',
  image_url: '', bg_color: '#1e293b', text_color: '#ffffff', is_active: false, extra_config: {},
});

const PLACEMENTS = [
  { key: 'announcement_bar', label: 'Announcement Bar', desc: 'Thin bar at the top of every page', icon: <MegaphoneIcon size={20} />, hasImage: false },
  { key: 'popup', label: 'Popup Banner', desc: 'Overlay shown after a delay', icon: <BellIcon size={20} />, hasImage: true },
  { key: 'promo_strip', label: 'Promo Strip', desc: 'Full-width promotional strip on homepage', icon: <ZapIcon size={20} />, hasImage: true },
];

export default function HeroCarouselAdminPage() {
  const [tab, setTab] = useState('slides');
  const [slides, setSlides] = useState([]);
  const [banners, setBanners] = useState([]);
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Slide modal state
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideForm, setSlideForm] = useState(defaultSlide);
  const [slideSubmitting, setSlideSubmitting] = useState(false);

  // Banner edit state (one form per placement, inline)
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerSubmitting, setBannerSubmitting] = useState(false);

  const fetchSlides = useCallback(async () => {
    const res = await fetch('/api/admin/hero-slides');
    if (res.ok) setSlides(await res.json());
  }, []);

  const fetchBanners = useCallback(async () => {
    const res = await fetch('/api/admin/banners');
    if (res.ok) setBanners(await res.json());
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/me').then(r => r.ok ? r.json() : null).then(setAdminInfo),
      fetchSlides(),
      fetchBanners()
    ]).finally(() => setLoading(false));
  }, [fetchSlides, fetchBanners]);

  // ─── SLIDES ───────────────────────────────────────────────────
  const openSlideModal = (slide = null) => {
    setEditingSlide(slide);
    setSlideForm(slide ? {
      title: slide.title || '', subtitle: slide.subtitle || '', badge_text: slide.badge_text || '',
      cta_text: slide.cta_text || '', cta_link: slide.cta_link || '',
      cta_secondary_text: slide.cta_secondary_text || '', cta_secondary_link: slide.cta_secondary_link || '',
      image_url: slide.image_url || '', overlay_color: slide.overlay_color || 'rgba(0,0,0,0.45)',
      text_color: slide.text_color || '#ffffff', text_align: slide.text_align || 'left',
      sort_order: slide.sort_order ?? 0, is_active: slide.is_active ?? true,
    } : { ...defaultSlide, sort_order: slides.length });
    setShowSlideModal(true);
  };

  const handleSlideSubmit = async (e) => {
    e.preventDefault();
    if (slideSubmitting) return;
    setSlideSubmitting(true);
    const method = editingSlide ? 'PUT' : 'POST';
    const url = editingSlide ? `/api/admin/hero-slides/${editingSlide.id}` : '/api/admin/hero-slides';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(slideForm) });
    if (res.ok) { setShowSlideModal(false); fetchSlides(); }
    else { const d = await res.json(); alert(d.error || 'Error'); }
    setSlideSubmitting(false);
  };

  const deleteSlide = async (id) => {
    if (!confirm('Delete this slide?')) return;
    await fetch(`/api/admin/hero-slides/${id}`, { method: 'DELETE' });
    fetchSlides();
  };

  const toggleSlide = async (slide) => {
    await fetch(`/api/admin/hero-slides/${slide.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...slide, is_active: !slide.is_active }),
    });
    fetchSlides();
  };

  const moveSlide = async (slide, dir) => {
    const idx = slides.findIndex(s => s.id === slide.id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const other = slides[newIdx];
    await Promise.all([
      fetch(`/api/admin/hero-slides/${slide.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...slide, sort_order: other.sort_order }) }),
      fetch(`/api/admin/hero-slides/${other.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...other, sort_order: slide.sort_order }) }),
    ]);
    fetchSlides();
  };

  const setSlide = (k, v) => setSlideForm(p => ({ ...p, [k]: v }));

  // ─── BANNERS ──────────────────────────────────────────────────
  const getBanner = (placement) => banners.find(b => b.placement === placement);

  const startEditBanner = (placement) => {
    const existing = getBanner(placement);
    setEditingBanner({ placement, form: existing ? { ...existing, extra_config: existing.extra_config || {} } : defaultBanner(placement) });
  };

  const setBannerField = (k, v) => setEditingBanner(p => ({ ...p, form: { ...p.form, [k]: v } }));
  const setBannerExtra = (k, v) => setEditingBanner(p => ({ ...p, form: { ...p.form, extra_config: { ...p.form.extra_config, [k]: v } } }));

  const saveBanner = async () => {
    setBannerSubmitting(true);
    const { form } = editingBanner;
    const isExisting = !!getBanner(form.placement);
    const method = isExisting ? 'PUT' : 'POST';
    const body = JSON.stringify(form);
    const res = await fetch('/api/admin/banners', { method, headers: { 'Content-Type': 'application/json' }, body });
    if (res.ok) { setEditingBanner(null); fetchBanners(); }
    else { const d = await res.json(); alert(d.error || 'Error'); }
    setBannerSubmitting(false);
  };

  const deleteBanner = async (id) => {
    if (!confirm('Remove this banner?')) return;
    await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
    fetchBanners();
    setEditingBanner(null);
  };

  const toggleBanner = async (banner) => {
    await fetch('/api/admin/banners', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...banner, is_active: !banner.is_active }),
    });
    fetchBanners();
  };

  if (adminInfo && !adminInfo.isSuperAdmin) {
    return (
      <SuperAdminGuard
        feature="Homepage Carousel & Banners"
        description="Marketplace homepage hero slides, announcements, and promotional banners are managed centrally by platform super administrators."
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="admin-page-title" style={{ marginBottom: '4px' }}>Hero & Banners</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Customize the homepage hero carousel, announcement bar, popup, and promo strips.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '10px', padding: '4px', width: 'fit-content', marginBottom: '24px' }}>
        {[
          { key: 'slides', label: 'Hero Slides', icon: <ImageIcon size={16} /> },
          { key: 'banners', label: 'Banners & Ads', icon: <MegaphoneIcon size={16} /> }
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '8px 20px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontWeight: tab === t.key ? '700' : '400', fontSize: '14px',
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? '#1e293b' : '#64748b',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ SLIDES TAB ══════════════════════════════════════════ */}
      {tab === 'slides' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ color: '#64748b', fontSize: '14px' }}>{slides.length} slide{slides.length !== 1 ? 's' : ''} · drag order with ↑↓ buttons</div>
            <button onClick={() => openSlideModal()}
              style={{ padding: '10px 24px', background: '#1e293b', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
              + Add Slide
            </button>
          </div>

          {slides.length === 0 ? (
            <div className="admin-card" style={{ padding: '64px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <ImageIcon size={48} color="#94a3b8" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No slides yet</div>
              <div style={{ color: '#64748b', marginBottom: '24px' }}>Add your first hero slide to power the carousel.</div>
              <button onClick={() => openSlideModal()} style={{ padding: '10px 24px', background: '#1e293b', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Add Slide</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {slides.map((slide, i) => (
                <div key={slide.id} className="admin-card" style={{ margin: 0, padding: 0, overflow: 'hidden', borderLeft: `4px solid ${slide.is_active ? '#22c55e' : '#e2e8f0'}` }}>
                  <div style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>
                    {/* Thumbnail */}
                    <div style={{ width: '160px', flexShrink: 0, position: 'relative', minHeight: '90px' }}>
                      {slide.image_url ? (
                        <img src={slide.image_url} alt={slide.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e293b, #334155)', minHeight: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={28} color="#64748b" />
                        </div>
                      )}
                      {slide.overlay_color && slide.image_url && (
                        <div style={{ position: 'absolute', inset: 0, background: slide.overlay_color }} />
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        {slide.badge_text && (
                          <span style={{ background: '#f0f9ff', color: '#0284c7', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>{slide.badge_text}</span>
                        )}
                        <span style={{ background: slide.is_active ? '#f0fdf4' : '#f1f5f9', color: slide.is_active ? '#22c55e' : '#94a3b8', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>
                          {slide.is_active ? '● Active' : '○ Hidden'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Order #{slide.sort_order}</span>
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>{slide.title || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No title</span>}</div>
                      {slide.subtitle && <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>{slide.subtitle}</div>}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {slide.cta_text && <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '6px' }}>CTA: {slide.cta_text}</span>}
                        {slide.cta_secondary_text && <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '6px' }}>2nd: {slide.cta_secondary_text}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px', gap: '6px', flexShrink: 0, borderLeft: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        <button onClick={() => moveSlide(slide, -1)} disabled={i === 0} title="Move up"
                          style={{ width: '30px', height: '30px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: i === 0 ? 'not-allowed' : 'pointer', background: 'white', opacity: i === 0 ? 0.4 : 1, fontSize: '14px' }}>↑</button>
                        <button onClick={() => moveSlide(slide, 1)} disabled={i === slides.length - 1} title="Move down"
                          style={{ width: '30px', height: '30px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: i === slides.length - 1 ? 'not-allowed' : 'pointer', background: 'white', opacity: i === slides.length - 1 ? 0.4 : 1, fontSize: '14px' }}>↓</button>
                      </div>
                      <button onClick={() => toggleSlide(slide)}
                        style={{ padding: '5px 10px', borderRadius: '5px', border: '1px solid #e2e8f0', background: slide.is_active ? '#fef2f2' : '#f0fdf4', color: slide.is_active ? '#ef4444' : '#22c55e', cursor: 'pointer', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        {slide.is_active ? 'Hide' : 'Show'}
                      </button>
                      <button className="admin-btn-edit" onClick={() => openSlideModal(slide)}>Edit</button>
                      <button className="admin-btn-delete" onClick={() => deleteSlide(slide.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ BANNERS TAB ═════════════════════════════════════════ */}
      {tab === 'banners' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {PLACEMENTS.map(placement => {
            const existing = getBanner(placement.key);
            const isEditing = editingBanner?.placement === placement.key;

            return (
              <div key={placement.key} className="admin-card" style={{ margin: 0 }}>
                {/* Placement header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEditing ? '20px' : 0, flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', color: '#1e293b' }}>{placement.icon}</span>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '16px' }}>{placement.label}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{placement.desc}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {existing && (
                      <span style={{ background: existing.is_active ? '#f0fdf4' : '#f1f5f9', color: existing.is_active ? '#22c55e' : '#94a3b8', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                        {existing.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    )}
                    {existing && (
                      <button onClick={() => toggleBanner(existing)}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: existing.is_active ? '#fef2f2' : '#f0fdf4', color: existing.is_active ? '#ef4444' : '#22c55e' }}>
                        {existing.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    <button onClick={() => isEditing ? setEditingBanner(null) : startEditBanner(placement.key)}
                      style={{ padding: '6px 16px', background: isEditing ? '#f1f5f9' : '#1e293b', color: isEditing ? '#64748b' : 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                      {isEditing ? 'Cancel' : existing ? 'Edit' : 'Set Up'}
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                {isEditing && (
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: placement.hasImage ? '1fr 1fr' : '1fr', gap: '16px' }}>
                      {placement.hasImage && (
                        <ImageUploader
                          label="Banner Image" value={editingBanner.form.image_url}
                          onChange={v => setBannerField('image_url', v)}
                          aspect={placement.key === 'popup' ? '4/3' : '16/5'}
                        />
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label>Title / Message</label>
                          <input type="text" value={editingBanner.form.title || ''} className="form-input"
                            placeholder={placement.key === 'announcement_bar' ? 'e.g. Free shipping on orders over $50!' : 'e.g. Exclusive 20% Off Today'}
                            onChange={e => setBannerField('title', e.target.value)} />
                        </div>
                        {placement.key !== 'announcement_bar' && (
                          <div className="form-group" style={{ margin: 0 }}>
                            <label>Subtitle</label>
                            <input type="text" value={editingBanner.form.subtitle || ''} className="form-input"
                              placeholder="Optional supporting text"
                              onChange={e => setBannerField('subtitle', e.target.value)} />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label>CTA Button Text</label>
                            <input type="text" value={editingBanner.form.cta_text || ''} className="form-input" placeholder="Shop Now"
                              onChange={e => setBannerField('cta_text', e.target.value)} />
                          </div>
                          <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label>CTA Link</label>
                            <input type="text" value={editingBanner.form.cta_link || ''} className="form-input" placeholder="/shop"
                              onChange={e => setBannerField('cta_link', e.target.value)} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <ColorPicker label="Background Color" value={editingBanner.form.bg_color} onChange={v => setBannerField('bg_color', v)} />
                          <ColorPicker label="Text Color" value={editingBanner.form.text_color} onChange={v => setBannerField('text_color', v)} />
                        </div>
                        {/* Placement-specific extras */}
                        {placement.key === 'announcement_bar' && (
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                              <label>Tag / Text Badge</label>
                              <input type="text" value={editingBanner.form.extra_config?.icon || ''} className="form-input" placeholder="e.g. SALE"
                                onChange={e => setBannerExtra('icon', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                              <label>Dismissable</label>
                              <select value={editingBanner.form.extra_config?.dismissable === false ? 'no' : 'yes'} className="form-input"
                                onChange={e => setBannerExtra('dismissable', e.target.value !== 'no')}>
                                <option value="yes">Yes (show close button)</option>
                                <option value="no">No (always visible)</option>
                              </select>
                            </div>
                          </div>
                        )}
                        {placement.key === 'popup' && (
                          <div className="form-group" style={{ margin: 0 }}>
                            <label>Show after (seconds)</label>
                            <input type="number" value={editingBanner.form.extra_config?.delay_seconds || 3} className="form-input" min="0"
                              onChange={e => setBannerExtra('delay_seconds', parseInt(e.target.value) || 3)} />
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="checkbox" id={`active-${placement.key}`} checked={editingBanner.form.is_active}
                            onChange={e => setBannerField('is_active', e.target.checked)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                          <label htmlFor={`active-${placement.key}`} style={{ cursor: 'pointer', fontSize: '14px', margin: 0 }}>Active immediately</label>
                        </div>
                      </div>
                    </div>

                    {/* Preview strip for announcement bar */}
                    {placement.key === 'announcement_bar' && editingBanner.form.title && (
                      <div style={{ marginTop: '16px', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview</div>
                        <div style={{ background: editingBanner.form.bg_color || '#1e293b', color: editingBanner.form.text_color || '#ffffff', padding: '10px 16px', textAlign: 'center', fontSize: '14px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                          {editingBanner.form.extra_config?.icon && <span>{editingBanner.form.extra_config.icon}</span>}
                          <span>{editingBanner.form.title}</span>
                          {editingBanner.form.cta_text && <span style={{ fontWeight: '700', textDecoration: 'underline' }}>{editingBanner.form.cta_text} →</span>}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        {existing && (
                          <button onClick={() => deleteBanner(existing.id)}
                            style={{ padding: '8px 16px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                            Remove Banner
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setEditingBanner(null)}
                          style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          Cancel
                        </button>
                        <button onClick={saveBanner} disabled={bannerSubmitting}
                          style={{ padding: '8px 24px', background: '#1e293b', color: 'white', borderRadius: '6px', border: 'none', cursor: bannerSubmitting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '700', opacity: bannerSubmitting ? 0.7 : 1 }}>
                          {bannerSubmitting ? 'Saving...' : existing ? 'Update Banner' : 'Create Banner'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ SLIDE MODAL ═════════════════════════════════════════ */}
      {showSlideModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '800px', width: '95vw', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>
                {editingSlide ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <EditIcon size={20} /> Edit Slide
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={20} /> New Hero Slide
                  </span>
                )}
              </h2>
              <button onClick={() => setShowSlideModal(false)} aria-label="Close modal" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', display: 'flex', alignItems: 'center' }}>
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSlideSubmit} className="admin-form">
              {/* Image */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <ImageUploader label="Background Image" value={slideForm.image_url} onChange={v => setSlide('image_url', v)} aspect="16/9" />
              </div>

              {/* Overlay & Text Colors */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Colors & Alignment</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'start' }}>
                  <ColorPicker label="Overlay Color" value={slideForm.overlay_color} onChange={v => setSlide('overlay_color', v)} />
                  <ColorPicker label="Text Color" value={slideForm.text_color} onChange={v => setSlide('text_color', v)} />
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Text Alignment</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['left', 'center', 'right'].map(a => (
                        <button key={a} type="button" onClick={() => setSlide('text_align', a)}
                          style={{ flex: 1, padding: '8px', border: `2px solid ${slideForm.text_align === a ? '#1e293b' : '#e2e8f0'}`, borderRadius: '6px', background: slideForm.text_align === a ? '#1e293b' : 'white', color: slideForm.text_align === a ? 'white' : '#64748b', cursor: 'pointer', fontWeight: '700', fontSize: '13px', textTransform: 'capitalize' }}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Content</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Badge Text (optional)</label>
                    <input type="text" value={slideForm.badge_text} className="form-input" placeholder="e.g. New Arrival, Limited Edition"
                      onChange={e => setSlide('badge_text', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Headline Title</label>
                    <input type="text" value={slideForm.title} className="form-input" placeholder="Bold headline that grabs attention"
                      onChange={e => setSlide('title', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Subtitle</label>
                    <textarea value={slideForm.subtitle} className="form-input" rows={2} placeholder="Supporting description..."
                      onChange={e => setSlide('subtitle', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Call-to-Action Buttons</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Primary Button Text</label>
                    <input type="text" value={slideForm.cta_text} className="form-input" placeholder="Shop Now"
                      onChange={e => setSlide('cta_text', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Primary Button Link</label>
                    <input type="text" value={slideForm.cta_link} className="form-input" placeholder="/shop"
                      onChange={e => setSlide('cta_link', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Secondary Button Text</label>
                    <input type="text" value={slideForm.cta_secondary_text} className="form-input" placeholder="Learn More (optional)"
                      onChange={e => setSlide('cta_secondary_text', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Secondary Button Link</label>
                    <input type="text" value={slideForm.cta_secondary_link} className="form-input" placeholder="/about"
                      onChange={e => setSlide('cta_secondary_link', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Order (lower = first)</label>
                  <input type="number" value={slideForm.sort_order} className="form-input" style={{ width: '100px' }}
                    onChange={e => setSlide('sort_order', parseInt(e.target.value) || 0)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                  <input type="checkbox" id="slide_active" checked={slideForm.is_active}
                    onChange={e => setSlide('is_active', e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <label htmlFor="slide_active" style={{ cursor: 'pointer', fontSize: '14px', margin: 0 }}>Active (show in carousel)</label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowSlideModal(false)} disabled={slideSubmitting}
                  style={{ padding: '10px 20px', border: '1px solid #ddd', background: 'white', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={slideSubmitting}
                  style={{ padding: '10px 28px', background: '#1e293b', color: 'white', borderRadius: '6px', border: 'none', cursor: slideSubmitting ? 'not-allowed' : 'pointer', fontWeight: '700', opacity: slideSubmitting ? 0.7 : 1 }}>
                  {slideSubmitting ? 'Saving...' : editingSlide ? 'Update Slide' : 'Create Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
