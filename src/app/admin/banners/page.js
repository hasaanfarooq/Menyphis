'use client';
import { useState, useEffect, useCallback } from 'react';
import SuperAdminGuard from '@/components/SuperAdminGuard';
import { 
  MegaphoneIcon, 
  EditIcon, 
  TrashIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  XIcon, 
  TruckIcon,
  ShoppingBagIcon,
  ClockIcon
} from '@/components/Icons';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const emptyForm = {
    placement: 'announcement_bar',
    title: '',
    subtitle: '',
    cta_text: '',
    cta_link: '',
    image_url: '',
    bg_color: '#0f172a',
    text_color: '#ffffff',
    is_active: true,
    extra_config: {
      dismissable: true,
      icon: true,
    }
  };

  const [formData, setFormData] = useState(emptyForm);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/banners');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setBanners(data);
      }
    } catch (e) {
      console.error('Failed to fetch banners:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditingBanner(b);
    setFormData({
      placement: b.placement || 'announcement_bar',
      title: b.title || '',
      subtitle: b.subtitle || '',
      cta_text: b.cta_text || '',
      cta_link: b.cta_link || '',
      image_url: b.image_url || '',
      bg_color: b.bg_color || '#0f172a',
      text_color: b.text_color || '#ffffff',
      is_active: b.is_active ?? true,
      extra_config: b.extra_config || { dismissable: true, icon: true }
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a banner title or announcement text.');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';
      const payload = editingBanner ? { ...formData, id: editingBanner.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setModalOpen(false);
        fetchBanners();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save banner');
      }
    } catch (err) {
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner) => {
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...banner,
          is_active: !banner.is_active
        })
      });
      if (res.ok) {
        fetchBanners();
      }
    } catch (e) {
      console.error('Failed to toggle banner:', e);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchBanners();
      }
    } catch (e) {
      console.error('Failed to delete banner:', e);
    }
  };

  const filteredBanners = activeTab === 'all' 
    ? banners 
    : banners.filter(b => b.placement === activeTab);

  return (
    <SuperAdminGuard feature="Site Banners & Announcements">
      <div className="admin-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#0f172a' }}>
              Site Banners & Announcements
            </h1>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
              Manage top announcement bars, promo popups, and site-wide notifications
            </p>
          </div>

          <button
            onClick={openCreateModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <PlusIcon size={16} color="#ffffff" />
            Create Banner
          </button>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          {[
            { id: 'all', label: 'All Banners' },
            { id: 'announcement_bar', label: 'Top Announcement Bars' },
            { id: 'popup_modal', label: 'Promo Modal Popups' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeTab === tab.id ? '#0f172a' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Banner List */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '12px' }} />
            ))}
          </div>
        ) : filteredBanners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <MegaphoneIcon size={40} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>No banners created</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Create an announcement bar or promo popup to engage your visitors.
            </p>
            <button
              onClick={openCreateModal}
              style={{
                padding: '8px 16px',
                background: '#0f172a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Add First Banner
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {filteredBanners.map(banner => (
              <div
                key={banner.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Visual Preview */}
                <div
                  style={{
                    background: banner.bg_color || '#1e293b',
                    color: banner.text_color || '#ffffff',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '60px',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    {banner.extra_config?.icon && (
                      <TruckIcon size={18} color={banner.text_color || '#ffffff'} />
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {banner.title}
                      </div>
                      {banner.subtitle && (
                        <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {banner.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {banner.cta_text && (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      textDecoration: 'underline', 
                      marginLeft: '12px',
                      flexShrink: 0
                    }}>
                      {banner.cta_text} →
                    </span>
                  )}
                </div>

                {/* Card Meta */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: banner.placement === 'announcement_bar' ? '#eff6ff' : '#fdf2f8',
                          color: banner.placement === 'announcement_bar' ? '#1d4ed8' : '#be185d',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {banner.placement === 'announcement_bar' ? 'Announcement Bar' : 'Popup Modal'}
                      </span>

                      <button
                        onClick={() => toggleActive(banner)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: banner.is_active ? '#16a34a' : '#94a3b8'
                        }}
                      >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: banner.is_active ? '#16a34a' : '#cbd5e1' }} />
                        {banner.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {banner.cta_link && (
                        <div>Link: <span style={{ color: '#0f172a', fontWeight: 500 }}>{banner.cta_link}</span></div>
                      )}
                      <div>Colors: <span style={{ color: '#0f172a', fontWeight: 500 }}>BG {banner.bg_color} / Text {banner.text_color}</span></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      onClick={() => openEditModal(banner)}
                      style={{
                        padding: '6px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <EditIcon size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#fef2f2',
                        border: '1px solid #fee2e2',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <TrashIcon size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: '28px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  {editingBanner ? 'Edit Banner' : 'Create New Banner'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                >
                  <XIcon size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Placement Type
                  </label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  >
                    <option value="announcement_bar">Top Announcement Bar</option>
                    <option value="popup_modal">Promo Modal Popup</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Title / Primary Message *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Free Worldwide Express Shipping on Orders Over $100"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {formData.placement === 'popup_modal' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Subtitle / Supporting Details
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Use coupon code MENYPHIS20 at checkout for 20% off your first purchase."
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Call to Action Text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shop Now"
                      value={formData.cta_text}
                      onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Call to Action Link
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /shop or /stores"
                      value={formData.cta_link}
                      onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Background Color
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={formData.bg_color}
                        onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                        style={{ width: '38px', height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '2px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={formData.bg_color}
                        onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Text Color
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        style={{ width: '38px', height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '2px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Active / Visible to Customers
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.extra_config?.dismissable ?? true}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        extra_config: { ...formData.extra_config, dismissable: e.target.checked }
                      })}
                    />
                    User Dismissable (X button)
                  </label>
                </div>

                {/* Live Preview */}
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                    Live Preview
                  </div>
                  <div
                    style={{
                      background: formData.bg_color,
                      color: formData.text_color,
                      padding: '12px 16px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TruckIcon size={16} color={formData.text_color} />
                      <span>{formData.title || 'Your announcement will appear here'}</span>
                    </div>
                    {formData.cta_text && (
                      <span style={{ textDecoration: 'underline', fontSize: '12px' }}>{formData.cta_text} →</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    style={{
                      padding: '10px 18px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#475569'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '10px 20px',
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: saving ? 0.7 : 1
                    }}
                  >
                    {saving ? 'Saving...' : editingBanner ? 'Save Changes' : 'Create Banner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SuperAdminGuard>
  );
}
