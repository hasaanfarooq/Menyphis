'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, AlertIcon, BankIcon } from '@/components/Icons';

export default function StoreSettingsPage() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    logo_url: '',
    banner_url: '',
    bank_name: '',
    bank_account_title: '',
    bank_account_number: '',
  });

  useEffect(() => {
    async function loadStoreProfile() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/stores');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const currentStore = data[0];
            setStore(currentStore);
            setFormData({
              name: currentStore.name || '',
              tagline: currentStore.tagline || '',
              description: currentStore.description || '',
              logo_url: currentStore.logo_url || '',
              banner_url: currentStore.banner_url || '',
              bank_name: currentStore.bank_name || '',
              bank_account_title: currentStore.bank_account_title || '',
              bank_account_number: currentStore.bank_account_number || '',
            });
          }
        } else {
          setError('Failed to load store profile');
        }
      } catch (err) {
        setError('Network error loading store');
      } finally {
        setLoading(false);
      }
    }
    loadStoreProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!store) return;
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch(`/api/admin/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update store');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px' }}>
        <div className="skeleton" style={{ height: '40px', width: '250px', marginBottom: '20px' }} />
        <div className="skeleton" style={{ height: '350px', borderRadius: '8px' }} />
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>No store associated with this administrator account.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-title" style={{ marginBottom: '4px' }}>Store Profile & Branding</h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Configure how your store appears to customers on the landing page and your dedicated storefront.
          </p>
        </div>
        <Link 
          href={`/store/${store.slug}`} 
          target="_blank"
          className="admin-header-link"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span>View Live Storefront</span> ↗
        </Link>
      </div>

      {success && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 18px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircleIcon size={16} color="#059669" /> Store profile successfully updated!
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 18px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertIcon size={16} color="#dc2626" /> {error}
        </div>
      )}

      {/* Live Preview Card */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ height: '140px', position: 'relative', overflow: 'hidden', background: '#f1f5f9' }}>
          <img
            src={formData.banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop'}
            alt="Store Preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
        </div>

        <div style={{ padding: '0 20px 20px', marginTop: '-32px', display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid #ffffff', overflow: 'hidden', background: '#ffffff', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <img
              src={formData.logo_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=140&h=140&fit=crop'}
              alt="Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
              {formData.name || 'Your Store Name'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
              {formData.tagline || 'Your tagline or catchphrase appears here'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="admin-card">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Store Display Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tagline</label>
            <input
              type="text"
              placeholder="e.g. Next-gen streetwear essentials"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Store Bio & Description</label>
            <textarea
              rows={4}
              placeholder="Tell customers what your brand stands for, your fabrics, aesthetic, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Store Logo URL (Square 1:1)</label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Store Banner URL (Landscape)</label>
              <input
                type="url"
                value={formData.banner_url}
                onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          {/* Banking / Payout Account */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginTop: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BankIcon size={16} color="#2563eb" /> Bank Account for Payouts
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chase / HBL"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label">Account Title</label>
                <input
                  type="text"
                  placeholder="Account holder name"
                  value={formData.bank_account_title}
                  onChange={(e) => setFormData({ ...formData, bank_account_title: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Account / IBAN Number</label>
              <input
                type="text"
                placeholder="Account number or IBAN"
                value={formData.bank_account_number}
                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 24px',
                background: '#1e293b',
                color: 'white',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              {saving ? 'Saving Changes...' : 'Save Store Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
