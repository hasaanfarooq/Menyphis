'use client';
import { useState, useEffect, useCallback } from 'react';
import { ZapIcon, EditIcon, XIcon } from '@/components/Icons';
import SuperAdminGuard from '@/components/SuperAdminGuard';

const statusBadge = (sale) => {
  const now = new Date();
  const ends = new Date(sale.ends_at);
  if (!sale.is_active) return { label: 'Inactive', color: '#94a3b8', bg: '#f1f5f9' };
  if (ends < now) return { label: 'Expired', color: '#ef4444', bg: '#fef2f2' };
  return { label: 'Active', color: '#22c55e', bg: '#f0fdf4' };
};

const toLocalDatetimeValue = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function AdminFlashSalesPage() {
  const [sales, setSales] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [formData, setFormData] = useState({
    title: '', subtitle: '', discount_percent: 20, badge_text: 'SALE',
    starts_at: '', ends_at: '', is_active: false, product_ids: [], store_id: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, salesRes, productsRes, storesRes] = await Promise.all([
        fetch('/api/admin/me'),
        fetch('/api/admin/flash-sales'),
        fetch('/api/admin/products'),
        fetch('/api/admin/stores')
      ]);
      if (meRes.ok) setAdminInfo(await meRes.json());
      if (salesRes.ok) setSales(await salesRes.json());
      if (productsRes.ok) setAllProducts(await productsRes.json());
      if (storesRes.ok) setStores(await storesRes.json());
    } catch (err) {
      console.error('Failed to fetch:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isStoreAdmin = !!adminInfo?.isStoreAdmin;
  const isSuperAdmin = !isStoreAdmin;

  const handleOpenModal = async (sale = null) => {
    if (sale) {
      setEditingId(sale.id);
      // Fetch full details (with products)
      const res = await fetch(`/api/admin/flash-sales/${sale.id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          title: data.title,
          subtitle: data.subtitle || '',
          discount_percent: data.discount_percent,
          badge_text: data.badge_text || 'SALE',
          starts_at: toLocalDatetimeValue(data.starts_at),
          ends_at: toLocalDatetimeValue(data.ends_at),
          is_active: data.is_active,
          store_id: data.store_id ? data.store_id.toString() : '',
          product_ids: (data.products || []).map(p => ({
            product_id: p.id,
            custom_discount_percent: p.custom_discount_percent || null
          }))
        });
      }
    } else {
      setEditingId(null);
      const defaultEnds = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      setFormData({
        title: '',
        subtitle: '',
        discount_percent: 20,
        badge_text: 'SALE',
        starts_at: toLocalDatetimeValue(new Date().toISOString()),
        ends_at: toLocalDatetimeValue(defaultEnds.toISOString()),
        is_active: true,
        store_id: isStoreAdmin && adminInfo?.storeId ? adminInfo.storeId.toString() : '',
        product_ids: []
      });
    }
    setProductSearch('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleProductToggle = (productId) => {
    const exists = formData.product_ids.some(p => p.product_id === productId);
    if (exists) {
      setFormData({
        ...formData,
        product_ids: formData.product_ids.filter(p => p.product_id !== productId)
      });
    } else {
      setFormData({
        ...formData,
        product_ids: [...formData.product_ids, { product_id: productId, custom_discount_percent: null }]
      });
    }
  };

  const handleCustomDiscountChange = (productId, val) => {
    setFormData({
      ...formData,
      product_ids: formData.product_ids.map(p => {
        if (p.product_id === productId) {
          return { ...p, custom_discount_percent: val ? parseInt(val) : null };
        }
        return p;
      })
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/admin/flash-sales/${editingId}` : '/api/admin/flash-sales';

    const payload = {
      ...formData,
      discount_percent: parseInt(formData.discount_percent),
      starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : new Date().toISOString(),
      ends_at: new Date(formData.ends_at).toISOString(),
      store_id: isStoreAdmin ? adminInfo.storeId : (formData.store_id ? parseInt(formData.store_id) : null),
      product_ids: formData.product_ids.map(p => ({
        product_id: p.product_id,
        custom_discount_percent: p.custom_discount_percent ? parseInt(p.custom_discount_percent) : null
      }))
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        handleCloseModal();
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Error saving flash sale');
      }
    } catch (err) {
      alert('Failed to save flash sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this sale? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/flash-sales/${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const handleToggleActive = async (sale) => {
    const method = 'PUT';
    const res = await fetch(`/api/admin/flash-sales/${sale.id}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sale, is_active: !sale.is_active, product_ids: [] })
    });
    if (res.ok) fetchData();
  };

  const candidateProducts = isSuperAdmin && formData.store_id
    ? allProducts.filter(p => p.store_id === parseInt(formData.store_id))
    : allProducts;

  const filteredProducts = candidateProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedIds = formData.product_ids.map(p => p.product_id);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="admin-page-title" style={{ marginBottom: '4px' }}>
            {isStoreAdmin ? 'Store Sales & Promotions' : 'Flash Sales & Promotions'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            {isStoreAdmin
              ? `Create time-limited sales and promotional discounts for ${adminInfo?.storeName || 'your store'}.`
              : 'Create sitewide flash sales with countdown timers or manage vendor store sales.'}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          style={{ padding: '10px 24px', background: '#1e293b', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' }}
        >
          + Create Sale Event
        </button>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
        ) : sales.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: '#94a3b8' }}>
              <ZapIcon size={48} />
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              {isStoreAdmin ? 'No Store Sales Running' : 'No Sales Created Yet'}
            </div>
            <div style={{ color: '#64748b', marginBottom: '24px' }}>Create a sale event to drive customer purchases.</div>
            <button onClick={() => handleOpenModal()} style={{ padding: '10px 24px', background: '#1e293b', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
              Create Sale Event
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sale</th>
                  {isSuperAdmin && <th>Scope / Store</th>}
                  <th>Discount</th>
                  <th>Products</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => {
                  const badge = statusBadge(sale);
                  return (
                    <tr key={sale.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{sale.title}</div>
                        {sale.subtitle && <div style={{ fontSize: '12px', color: '#64748b' }}>{sale.subtitle}</div>}
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Badge: {sale.badge_text}</div>
                      </td>
                      {isSuperAdmin && (
                        <td>
                          {sale.store_name ? (
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af', background: '#eff6ff', padding: '3px 8px', borderRadius: '4px' }}>
                              {sale.store_name}
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                              Sitewide
                            </span>
                          )}
                        </td>
                      )}
                      <td>
                        <span style={{ fontSize: '22px', fontWeight: '700', color: '#ef4444' }}>{sale.discount_percent}%</span>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>off</div>
                      </td>
                      <td>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '999px', fontSize: '13px', fontWeight: '600' }}>
                          {sale.product_count} items
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{new Date(sale.ends_at).toLocaleString()}</div>
                      </td>
                      <td>
                        <span style={{ background: badge.bg, color: badge.color, padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' }}>
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(sale)}
                          style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', background: sale.is_active ? '#fef2f2' : '#f0fdf4', color: sale.is_active ? '#ef4444' : '#22c55e', cursor: 'pointer', fontSize: '12px', fontWeight: '600', marginRight: '6px' }}
                        >
                          {sale.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="admin-btn-edit" onClick={() => handleOpenModal(sale)}>Edit</button>
                        <button className="admin-btn-delete" onClick={() => handleDelete(sale.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '780px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingId ? <><EditIcon size={20} /> Edit Flash Sale</> : <><ZapIcon size={20} /> Create Flash Sale</>}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '4px' }} aria-label="Close">
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
                    onChange={e => setFormData({ ...formData, store_id: e.target.value, product_ids: [] })}
                    className="form-input"
                    style={{ margin: 0, width: '100%' }}
                  >
                    <option value="">Marketplace Sitewide (Platform-Wide)</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id.toString()}>{s.name} (Store #{s.id})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>
                    This promotion will run specifically for <strong>{adminInfo?.storeName}</strong> products.
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>SALE DETAILS</h3>
                <div className="form-group">
                  <label>Sale Title *</label>
                  <input
                    type="text" value={formData.title} required className="form-input"
                    placeholder="e.g. Weekend Mega Sale, Summer Flash Deal..."
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Subtitle (optional)</label>
                  <input
                    type="text" value={formData.subtitle} className="form-input"
                    placeholder="e.g. Limited time only - grab yours before it's gone!"
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Badge Label</label>
                    <input
                      type="text" value={formData.badge_text} className="form-input"
                      placeholder="FLASH SALE"
                      onChange={e => setFormData({ ...formData, badge_text: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Default Discount % *</label>
                    <input
                      type="number" value={formData.discount_percent} required min="1" max="99" className="form-input"
                      onChange={e => setFormData({ ...formData, discount_percent: e.target.value })}
                    />
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Applied to all products unless overridden per-product below.</div>
                  </div>
                </div>
              </div>

              {/* Time */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>SALE TIMING</h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Starts At</label>
                    <input
                      type="datetime-local" value={formData.starts_at} className="form-input"
                      onChange={e => setFormData({ ...formData, starts_at: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Ends At *</label>
                    <input
                      type="datetime-local" value={formData.ends_at} required className="form-input"
                      onChange={e => setFormData({ ...formData, ends_at: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox" id="is_active" checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="is_active" style={{ cursor: 'pointer', fontSize: '14px', color: '#475569', margin: 0 }}>
                    Make this the <strong>active</strong> sale (will deactivate any other active sale)
                  </label>
                </div>
              </div>

              {/* Product Selection */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                    PRODUCTS IN SALE ({selectedIds.length} selected)
                  </h3>
                  {selectedIds.length > 0 && (
                    <button type="button" onClick={() => setFormData(p => ({ ...p, product_ids: [] }))}
                      style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Clear all
                    </button>
                  )}
                </div>

                <input
                  type="text" placeholder="Search products to add..." value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="form-input" style={{ marginBottom: '12px' }}
                />

                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white' }}>
                  {filteredProducts.map(p => {
                    const isSelected = selectedIds.includes(p.id);
                    const selectedItem = formData.product_ids.find(s => s.product_id === p.id);
                    const effectiveDiscount = selectedItem?.custom_discount_percent || formData.discount_percent;
                    const salePrice = (p.price * (1 - effectiveDiscount / 100)).toFixed(2);

                    return (
                      <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                        borderBottom: '1px solid #f1f5f9',
                        background: isSelected ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }} onClick={() => toggleProduct(p.id)}>
                        <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ pointerEvents: 'none' }} />
                        {p.image_url && (
                          <img src={p.image_url} alt={p.name} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            ${p.price} → <span style={{ color: '#ef4444', fontWeight: '600' }}>${salePrice}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                            <label style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>Custom %:</label>
                            <input
                              type="number" min="1" max="99"
                              value={selectedItem?.custom_discount_percent || ''}
                              placeholder={formData.discount_percent}
                              onChange={e => updateProductDiscount(p.id, e.target.value)}
                              style={{ width: '58px', padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No products match your search</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={handleCloseModal} disabled={submitting}
                  style={{ padding: '10px 20px', border: '1px solid #ddd', background: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{ padding: '10px 24px', background: '#1e293b', color: 'white', borderRadius: '6px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Saving...' : editingId ? 'Update Sale' : 'Create Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
