'use client';
import { useState, useEffect, useCallback } from 'react';
import { TruckIcon, TagIcon, EditIcon, XIcon } from '@/components/Icons';
import SuperAdminGuard from '@/components/SuperAdminGuard';

const typeConfig = {
  percentage: { label: 'Percentage Off', icon: '%', color: '#8b5cf6', bg: '#f5f3ff' },
  fixed: { label: 'Fixed Amount Off', icon: '$', color: '#3b82f6', bg: '#eff6ff' },
  free_shipping: { label: 'Free Shipping', icon: <TruckIcon size={16} />, color: '#22c55e', bg: '#f0fdf4' },
};

const toLocalDT = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const statusBadge = (coupon) => {
  const now = new Date();
  if (!coupon.is_active) return { label: 'Inactive', color: '#94a3b8', bg: '#f1f5f9' };
  if (coupon.expires_at && new Date(coupon.expires_at) < now) return { label: 'Expired', color: '#ef4444', bg: '#fef2f2' };
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return { label: 'Scheduled', color: '#f97316', bg: '#fff7ed' };
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) return { label: 'Exhausted', color: '#ef4444', bg: '#fef2f2' };
  return { label: 'Active', color: '#22c55e', bg: '#f0fdf4' };
};

const defaultForm = () => ({
  code: '', description: '', type: 'percentage', value: '', 
  min_order_amount: '', max_discount_amount: '', usage_limit: '',
  per_user_limit: '1', starts_at: toLocalDT(new Date().toISOString()),
  expires_at: '', is_active: true, first_order_only: false, store_id: '',
});

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(defaultForm());
  const [search, setSearch] = useState('');

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, cRes, sRes] = await Promise.all([
        fetch('/api/admin/me'),
        fetch('/api/admin/coupons'),
        fetch('/api/admin/stores'),
      ]);
      if (meRes.ok) setAdminInfo(await meRes.json());
      if (cRes.ok) setCoupons(await cRes.json());
      if (sRes.ok) setStores(await sRes.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const isStoreAdmin = !!adminInfo?.isStoreAdmin;
  const isSuperAdmin = !isStoreAdmin;

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingId(coupon.id);
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        type: coupon.type,
        value: coupon.value,
        min_order_amount: coupon.min_order_amount || '',
        max_discount_amount: coupon.max_discount_amount || '',
        usage_limit: coupon.usage_limit ?? '',
        per_user_limit: coupon.per_user_limit || '1',
        starts_at: toLocalDT(coupon.starts_at),
        expires_at: toLocalDT(coupon.expires_at),
        is_active: coupon.is_active,
        first_order_only: coupon.first_order_only || false,
        store_id: coupon.store_id ? coupon.store_id.toString() : '',
      });
    } else {
      setEditingId(null);
      setFormData({
        ...defaultForm(),
        store_id: isStoreAdmin && adminInfo?.storeId ? adminInfo.storeId.toString() : '',
      });
    }
    setShowModal(true);
  };

  const handleToggle = async (coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...coupon, is_active: !coupon.is_active }),
      });
      if (res.ok) fetchCoupons();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCoupons();
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        store_id: isStoreAdmin ? adminInfo.storeId : (formData.store_id ? parseInt(formData.store_id) : null),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        fetchCoupons();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save coupon');
      }
    } catch {
      alert('Network error, please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.store_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="admin-page-title" style={{ marginBottom: '4px' }}>
            {isStoreAdmin ? 'Store Coupons & Discounts' : 'Coupons & Promotions'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            {isStoreAdmin
              ? `Create promotional discount codes for ${adminInfo?.storeName || 'your store'}.`
              : 'Create sitewide platform discount codes or manage store-specific promotions.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input type="text" placeholder="Search coupons..." value={search} onChange={e => setSearch(e.target.value)}
            className="form-input" style={{ margin: 0, maxWidth: '220px' }} />
          <button onClick={() => handleOpenModal()}
            style={{ padding: '10px 24px', background: '#1e293b', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' }}>
            + Create Coupon
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: isStoreAdmin ? 'Store Coupons' : 'Total Coupons', value: coupons.length, color: '#3b82f6' },
          { label: 'Active', value: coupons.filter(c => statusBadge(c).label === 'Active').length, color: '#22c55e' },
          { label: 'Total Redemptions', value: coupons.reduce((s, c) => s + (c.used_count || 0), 0), color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="admin-card" style={{ padding: '20px', margin: 0 }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: '#94a3b8' }}>
              <TagIcon size={48} />
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              {isStoreAdmin ? 'No Store Coupons Yet' : 'No Coupons Found'}
            </div>
            <div style={{ color: '#64748b', marginBottom: '24px' }}>
              Create your first coupon code to drive sales.
            </div>
            <button onClick={() => handleOpenModal()} style={{ padding: '10px 24px', background: '#1e293b', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
              Create Coupon
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  {isSuperAdmin && <th>Scope / Store</th>}
                  <th>Type & Value</th>
                  <th>Conditions</th>
                  <th>Usage</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(coupon => {
                  const tc = typeConfig[coupon.type];
                  const badge = statusBadge(coupon);
                  return (
                    <tr key={coupon.id}>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '16px', letterSpacing: '1px', color: '#1e293b' }}>{coupon.code}</div>
                        {coupon.description && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{coupon.description}</div>}
                      </td>
                      {isSuperAdmin && (
                        <td>
                          {coupon.store_name ? (
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af', background: '#eff6ff', padding: '3px 8px', borderRadius: '4px' }}>
                              {coupon.store_name}
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                              Sitewide
                            </span>
                          )}
                        </td>
                      )}
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: tc.bg, color: tc.color, padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>
                          {tc.icon} {coupon.type === 'free_shipping' ? 'Free Shipping' : `${coupon.type === 'percentage' ? coupon.value + '%' : '$' + parseFloat(coupon.value).toFixed(2)} off`}
                        </span>
                        {coupon.max_discount_amount && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Max: ${parseFloat(coupon.max_discount_amount).toFixed(2)}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#475569' }}>
                          {parseFloat(coupon.min_order_amount) > 0 && <div>Min order: ${parseFloat(coupon.min_order_amount).toFixed(2)}</div>}
                          {coupon.first_order_only && <div style={{ color: '#8b5cf6', fontWeight: '600' }}>First order only</div>}
                          <div>Limit: {coupon.per_user_limit}x per user</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>
                          {coupon.used_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : '/ ∞'}
                        </div>
                        {coupon.usage_limit && (
                          <div style={{ width: '80px', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, (coupon.used_count / coupon.usage_limit) * 100)}%`, background: '#3b82f6', borderRadius: '2px' }} />
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#475569' }}>
                          {coupon.expires_at
                            ? new Date(coupon.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Never</span>
                          }
                        </div>
                      </td>
                      <td>
                        <span style={{ background: badge.bg, color: badge.color, padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' }}>
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleToggle(coupon)}
                          style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', background: coupon.is_active ? '#fef2f2' : '#f0fdf4', color: coupon.is_active ? '#ef4444' : '#22c55e', cursor: 'pointer', fontSize: '12px', fontWeight: '600', marginRight: '6px', marginBottom: '4px' }}>
                          {coupon.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button className="admin-btn-edit" onClick={() => handleOpenModal(coupon)}>Edit</button>
                        <button className="admin-btn-delete" onClick={() => handleDelete(coupon.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '680px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingId ? <><EditIcon size={20} /> Edit Coupon</> : <><TagIcon size={20} /> Create Coupon</>}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '4px' }} aria-label="Close">
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              {/* Store Scope */}
              {isSuperAdmin ? (
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Store Scope</h3>
                  <select
                    value={formData.store_id || ''}
                    onChange={e => set('store_id', e.target.value)}
                    className="form-input"
                    style={{ margin: 0, width: '100%' }}
                  >
                    <option value="">Marketplace Sitewide (All Stores)</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id.toString()}>{s.name} (Store #{s.id})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>
                    This coupon will apply exclusively to products sold by <strong>{adminInfo?.storeName}</strong>.
                  </div>
                </div>
              )}

              {/* Coupon Code */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coupon Code</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Code *</label>
                    <input type="text" value={formData.code} required className="form-input" placeholder="e.g. SUMMER20, WELCOME10"
                      onChange={e => set('code', e.target.value.toUpperCase())}
                      style={{ fontFamily: 'monospace', fontWeight: '700', letterSpacing: '2px', fontSize: '16px' }} />
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Uppercase only. Must be unique.</div>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Description</label>
                    <input type="text" value={formData.description} className="form-input" placeholder="Internal note..."
                      onChange={e => set('description', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Discount Type & Value */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Discount Type</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {Object.entries(typeConfig).map(([key, tc]) => (
                    <button key={key} type="button" onClick={() => set('type', key)}
                      style={{ flex: 1, padding: '10px 8px', borderRadius: '8px', cursor: 'pointer', border: `2px solid ${formData.type === key ? tc.color : '#e2e8f0'}`, background: formData.type === key ? tc.bg : 'white', color: formData.type === key ? tc.color : '#64748b', fontWeight: '600', fontSize: '12px', transition: 'all 0.15s', textAlign: 'center' }}>
                      <div style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '4px' }}>{tc.icon}</div>
                      {tc.label}
                    </button>
                  ))}
                </div>
                {formData.type !== 'free_shipping' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>{formData.type === 'percentage' ? 'Discount % *' : 'Discount Amount ($) *'}</label>
                      <input type="number" value={formData.value} required className="form-input" min="0.01"
                        max={formData.type === 'percentage' ? 100 : undefined} step="0.01"
                        placeholder={formData.type === 'percentage' ? '20' : '10.00'}
                        onChange={e => set('value', e.target.value)} />
                    </div>
                    {formData.type === 'percentage' && (
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Max Discount Amount ($)</label>
                        <input type="number" value={formData.max_discount_amount} className="form-input" min="0" step="0.01"
                          placeholder="Optional cap (e.g. 50)"
                          onChange={e => set('max_discount_amount', e.target.value)} />
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Leave blank for no cap.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Conditions */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conditions</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: '1 1 160px' }}>
                    <label>Minimum Order Amount ($)</label>
                    <input type="number" value={formData.min_order_amount} className="form-input" min="0" step="0.01" placeholder="0.00 (no minimum)"
                      onChange={e => set('min_order_amount', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: '1 1 160px' }}>
                    <label>Total Usage Limit</label>
                    <input type="number" value={formData.usage_limit} className="form-input" min="1" step="1" placeholder="Unlimited"
                      onChange={e => set('usage_limit', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: '1 1 160px' }}>
                    <label>Per-User Limit</label>
                    <input type="number" value={formData.per_user_limit} className="form-input" min="1" step="1"
                      onChange={e => set('per_user_limit', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                  <input type="checkbox" id="first_order" checked={formData.first_order_only}
                    onChange={e => set('first_order_only', e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <label htmlFor="first_order" style={{ cursor: 'pointer', fontSize: '14px', color: '#475569', margin: 0 }}>
                    First order only (new customers)
                  </label>
                </div>
              </div>

              {/* Schedule & Status */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Schedule</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: '1 1 200px' }}>
                    <label>Valid From</label>
                    <input type="datetime-local" value={formData.starts_at} className="form-input"
                      onChange={e => set('starts_at', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: '1 1 200px' }}>
                    <label>Expires At</label>
                    <input type="datetime-local" value={formData.expires_at} className="form-input"
                      onChange={e => set('expires_at', e.target.value)} />
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Leave blank = never expires</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                  <input type="checkbox" id="is_active" checked={formData.is_active}
                    onChange={e => set('is_active', e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <label htmlFor="is_active" style={{ cursor: 'pointer', fontSize: '14px', color: '#475569', margin: 0 }}>
                    Coupon is <strong>active</strong> immediately
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} disabled={submitting}
                  style={{ padding: '10px 20px', border: '1px solid #ddd', background: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{ padding: '10px 24px', background: '#1e293b', color: 'white', borderRadius: '6px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Saving...' : editingId ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
