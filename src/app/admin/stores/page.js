'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, AlertIcon, StarIcon, XIcon } from '@/components/Icons';

export default function AdminStoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    description: '',
    logo_url: '',
    banner_url: '',
    rating: 5.0,
    is_featured: false,
    is_active: true,
    commission_rate: 10.0,
    bank_name: '',
    bank_account_title: '',
    bank_account_number: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  });

  const loadStores = async () => {
    try {
      setLoading(true);
      const [meRes, sRes] = await Promise.all([
        fetch('/api/admin/me'),
        fetch('/api/admin/stores')
      ]);

      if (meRes.ok) {
        const me = await meRes.json();
        setAdminInfo(me);
      }

      if (sRes.ok) {
        const data = await sRes.json();
        setStores(data);
      } else {
        const err = await sRes.json();
        setError(err.error || 'Failed to load stores');
      }
    } catch (err) {
      setError('Network error loading stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const handleOpenAddModal = () => {
    setEditingStore(null);
    setFormData({
      name: '',
      slug: '',
      tagline: '',
      description: '',
      logo_url: '',
      banner_url: '',
      rating: 5.0,
      is_featured: false,
      is_active: true,
      commission_rate: 10.0,
      bank_name: '',
      bank_account_title: '',
      bank_account_number: '',
      admin_name: '',
      admin_email: '',
      admin_password: '',
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name || '',
      slug: store.slug || '',
      tagline: store.tagline || '',
      description: store.description || '',
      logo_url: store.logo_url || '',
      banner_url: store.banner_url || '',
      rating: parseFloat(store.rating || 5.0),
      is_featured: !!store.is_featured,
      is_active: store.is_active !== false,
      commission_rate: parseFloat(store.commission_rate || 10.0),
      bank_name: store.bank_name || '',
      bank_account_title: store.bank_account_title || '',
      bank_account_number: store.bank_account_number || '',
      admin_name: store.owner_name || '',
      admin_email: store.owner_email || '',
      admin_password: '', // leave empty unless resetting
    });
    setError(null);
    setShowModal(true);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    if (!editingStore) {
      const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData((prev) => ({
        ...prev,
        name: val,
        slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ? generatedSlug : prev.slug,
      }));
    } else {
      setFormData((prev) => ({ ...prev, name: val }));
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (field === 'logo_url') setUploadingLogo(true);
    if (field === 'banner_url') setUploadingBanner(true);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      setFormData((prev) => ({ ...prev, [field]: data.url }));
    } catch (err) {
      alert(err.message);
    } finally {
      if (field === 'logo_url') setUploadingLogo(false);
      if (field === 'banner_url') setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (editingStore) {
        // Update existing store
        const updatePayload = {
          name: formData.name,
          slug: formData.slug,
          tagline: formData.tagline,
          description: formData.description,
          logo_url: formData.logo_url,
          banner_url: formData.banner_url,
          rating: parseFloat(formData.rating),
          is_featured: formData.is_featured,
          is_active: formData.is_active,
          commission_rate: parseFloat(formData.commission_rate || 10.0),
          bank_name: formData.bank_name,
          bank_account_title: formData.bank_account_title,
          bank_account_number: formData.bank_account_number,
        };

        if (formData.admin_email) {
          updatePayload.admin_email = formData.admin_email;
        }
        if (formData.admin_name) {
          updatePayload.admin_name = formData.admin_name;
        }
        if (formData.admin_password && formData.admin_password.trim().length >= 6) {
          updatePayload.admin_password = formData.admin_password.trim();
        }

        const res = await fetch(`/api/admin/stores/${editingStore.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update store');
        }

        setSuccessMsg(`Store "${data.name}" and credentials updated successfully!`);
      } else {
        // Create new store
        const res = await fetch('/api/admin/stores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create store');
        }

        setSuccessMsg(`Store "${data.name}" and Store Admin account created successfully!`);
      }

      setShowModal(false);
      loadStores();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (store, field) => {
    try {
      const updatedValue = !store[field];
      const res = await fetch(`/api/admin/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: updatedValue }),
      });

      if (res.ok) {
        setStores((prev) =>
          prev.map((s) => (s.id === store.id ? { ...s, [field]: updatedValue } : s))
        );
      }
    } catch (err) {
      console.error('Failed to update store status', err);
    }
  };

  const handleDeleteStore = async (id, name) => {
    if (!confirm(`Are you sure you want to permanently delete store "${name}"? All products belonging to this store will also be removed.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/stores/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStores((prev) => prev.filter((s) => s.id !== id));
        setSuccessMsg(`Store "${name}" deleted.`);
      } else {
        alert('Failed to delete store');
      }
    } catch (err) {
      console.error('Delete store error', err);
    }
  };

  // Filtered stores
  const filteredStores = stores.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.owner_email && s.owner_email.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'active') return s.is_active === true;
    if (filterStatus === 'suspended') return s.is_active === false;
    if (filterStatus === 'featured') return s.is_featured === true;

    return true;
  });

  // Calculate summary metrics
  const totalStoresCount = stores.length;
  const activeStoresCount = stores.filter((s) => s.is_active).length;
  const totalProductsCount = stores.reduce((acc, s) => acc + parseInt(s.product_count || 0), 0);
  const totalRevenueSum = stores.reduce((acc, s) => acc + parseFloat(s.total_revenue || 0), 0);

  if (adminInfo && !adminInfo.isSuperAdmin) {
    return (
      <div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <StarIcon size={24} color="#2563eb" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
          Super Admin Privileges Required
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
          Store provisioning and platform-wide tenant management are restricted to platform super administrators. As a store admin for <strong>{adminInfo.storeName || 'your store'}</strong>, you can customize your store&apos;s branding, banner, and bank details in Store Settings.
        </p>
        <Link 
          href="/admin/store-settings" 
          className="admin-btn-primary" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', padding: '10px 22px', borderRadius: '6px' }}
        >
          Go to Store Profile & Branding &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="admin-page-title" style={{ marginBottom: '4px' }}>Store Management (Multi-Tenant)</h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Super Admin control center: manage all stores, edit branding, reset store admin credentials, and inspect store metrics.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          style={{
            padding: '10px 24px',
            background: '#1e293b',
            color: 'white',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>+</span> Add New Store & Admin
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 18px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircleIcon size={16} color="#059669" /> {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 18px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertIcon size={16} color="#dc2626" /> {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Total Stores</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </div>
          <div className="admin-stat-value">{totalStoresCount}</div>
          <div className="admin-stat-trend">Registered tenants</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Active Stores</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#16a34a"><circle cx="12" cy="12" r="10"></circle></svg>
          </div>
          <div className="admin-stat-value">{activeStoresCount}</div>
          <div className="admin-stat-trend positive">Live on marketplace</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Store Products</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <div className="admin-stat-value">{totalProductsCount}</div>
          <div className="admin-stat-trend">Catalog across all stores</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Tenant Revenue</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div className="admin-stat-value">Rs. {totalRevenueSum.toLocaleString()}</div>
          <div className="admin-stat-trend positive">Total store orders</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'active', 'featured', 'suspended'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: filterStatus === status ? '1px solid #0f172a' : '1px solid #e2e8f0',
                background: filterStatus === status ? '#0f172a' : '#ffffff',
                color: filterStatus === status ? '#ffffff' : '#64748b',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {status}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search store name, slug, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ margin: 0, paddingLeft: '32px' }}
          />
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
        </div>
      </div>

      {/* Stores Table */}
      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Loading stores...</div>
        ) : filteredStores.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
            No stores found matching your search.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Slug</th>
                  <th>Store Admin Login</th>
                  <th>Products</th>
                  <th>Revenue</th>
                  <th>Featured</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Management Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.map((store) => (
                  <tr key={store.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={store.logo_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&h=100&fit=crop'}
                          alt={store.name}
                          style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{store.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <StarIcon size={11} color="#eab308" filled={true} /> {parseFloat(store.rating || 5.0).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                        /{store.slug}
                      </span>
                    </td>
                    <td>
                      {store.owner_email ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#2563eb', fontSize: '13px' }}>{store.owner_email}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{store.owner_name}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>No admin assigned</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <Link 
                        href={`/admin/products?store_id=${store.id}`} 
                        style={{ color: '#2563eb', textDecoration: 'underline' }}
                        title="View products belonging to this store"
                      >
                        {store.product_count || 0} items
                      </Link>
                    </td>
                    <td style={{ fontWeight: 600, color: '#059669' }}>
                      Rs. {parseFloat(store.total_revenue || 0).toLocaleString()}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(store, 'is_featured')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: store.is_featured ? '#fefce8' : '#f8fafc',
                          color: store.is_featured ? '#854d0e' : '#64748b',
                          border: store.is_featured ? '1px solid #fef08a' : '1px solid #e2e8f0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {store.is_featured ? (
                          <>
                            <StarIcon size={11} color="#854d0e" filled={true} /> Featured
                          </>
                        ) : (
                          'Standard'
                        )}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(store, 'is_active')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: store.is_active ? '#ecfdf5' : '#fef2f2',
                          color: store.is_active ? '#065f46' : '#991b1b',
                          border: store.is_active ? '1px solid #a7f3d0' : '1px solid #fecaca',
                        }}
                      >
                        {store.is_active ? 'Active' : 'Suspended'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleOpenEditModal(store)}
                          className="admin-btn-edit"
                          style={{ cursor: 'pointer' }}
                          title="Edit store and admin credentials"
                        >
                          Edit
                        </button>
                        <Link
                          href={`/admin/products?store_id=${store.id}`}
                          className="admin-btn-edit"
                          style={{ textDecoration: 'none', background: '#f8fafc', color: '#0f172a' }}
                          title="Manage this store's products"
                        >
                          Products
                        </Link>
                        <Link
                          href={`/store/${store.slug}`}
                          target="_blank"
                          className="admin-btn-edit"
                          style={{ textDecoration: 'none', background: '#f8fafc', color: '#0f172a' }}
                          title="View live storefront"
                        >
                          View ↗
                        </Link>
                        <button
                          onClick={() => handleDeleteStore(store.id, store.name)}
                          className="admin-btn-delete"
                          style={{ cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Store Modal */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="admin-modal-header">
              <h2>{editingStore ? `Edit Store: ${editingStore.name}` : 'Provision New Store & Admin'}</h2>
              <button className="admin-modal-close" onClick={() => setShowModal(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <XIcon size={16} color="currentColor" />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyperion Streetwear"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Store Slug (URL Identifier) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. hyperion-streetwear"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rating (1 - 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tagline / Catchphrase</label>
                <input
                  type="text"
                  placeholder="e.g. Avant-garde urban techwear"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Store Bio & Description</label>
                <textarea
                  rows={3}
                  placeholder="Tell customers about the store story, collections, and aesthetic..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              {/* Logo & Banner URLs with Upload options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Store Logo URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="form-input"
                    style={{ marginBottom: '6px' }}
                  />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    {uploadingLogo ? 'Uploading logo...' : 'Upload Logo Image'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'logo_url')}
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Store Banner URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.banner_url}
                    onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                    className="form-input"
                    style={{ marginBottom: '6px' }}
                  />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    {uploadingBanner ? 'Uploading banner...' : 'Upload Banner Image'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'banner_url')}
                      disabled={uploadingBanner}
                    />
                  </label>
                </div>
              </div>

              {/* Commission & Bank Details Section */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  Economics & Bank Account (Payouts)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Platform Commission (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Chase / HBL / Wells Fargo"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Bank Account Title</label>
                    <input
                      type="text"
                      placeholder="Account holder name"
                      value={formData.bank_account_title}
                      onChange={(e) => setFormData({ ...formData, bank_account_title: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Number / IBAN</label>
                    <input
                      type="text"
                      placeholder="Account or IBAN"
                      value={formData.bank_account_number}
                      onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Store Admin Credentials Section */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M21 2l-2 2m-1.5 1.5L14 9l-3-3L3.5 13.5a5 5 0 1 0 7 7L18 13l3.5-3.5-2-2z"></path><circle cx="7.5" cy="16.5" r="1.5"></circle></svg>
                  {editingStore ? 'Store Admin Credentials & Password Reset' : 'Provision Dedicated Store Admin Account'}
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>
                  {editingStore 
                    ? 'Update the store administrator email or enter a new password below to reset their access.' 
                    : 'A dedicated store admin login will be created. They can only access this store.'}
                </p>

                <div className="form-group">
                  <label className="form-label">Admin Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyperion Store Manager"
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Admin Email (Login ID) *</label>
                  <input
                    type="email"
                    required={!editingStore}
                    placeholder="e.g. hyperion@store.com"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    {editingStore ? 'New Password (leave blank to keep existing password)' : 'Admin Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingStore}
                    placeholder={editingStore ? 'Enter new password to reset' : 'Minimum 6 characters'}
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  />
                  Featured on Homepage
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Store Active (Live for shoppers)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 20px', borderRadius: '6px', background: '#1e293b', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  {submitting ? 'Saving...' : editingStore ? 'Save Store Changes' : 'Create Store & Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
