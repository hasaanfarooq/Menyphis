'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SaveIcon, StarIcon, StoreIcon, PackageIcon, CheckCircleIcon } from '@/components/Icons';
import SuperAdminGuard from '@/components/SuperAdminGuard';

export default function AdminFeaturedProductsPage() {
  const [products, setProducts] = useState([]);
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStore, setFilterStore] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [meRes, res] = await Promise.all([
        fetch('/api/admin/me'),
        fetch('/api/admin/featured-products'),
      ]);
      if (meRes.ok) {
        setAdminInfo(await meRes.json());
      }
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to load featured products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const featuredList = products.filter((p) => p.featured);
  const nonFeaturedList = products.filter((p) => !p.featured);

  // Filter stores
  const storeNames = Array.from(new Set(products.map((p) => p.store_name || 'Menyphis Marketplace')));

  const handleToggleFeatured = async (product) => {
    const nextStatus = !product.featured;
    try {
      const res = await fetch('/api/admin/featured-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toggle_id: product.id,
          featured_status: nextStatus,
        }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, featured: nextStatus } : p))
        );
        setSuccessMsg(`"${product.name}" ${nextStatus ? 'added to' : 'removed from'} Homepage Featured!`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      alert('Failed to toggle featured status');
    }
  };

  const moveItem = (index, direction) => {
    const currentFeatured = [...featuredList];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentFeatured.length) return;

    const temp = currentFeatured[index];
    currentFeatured[index] = currentFeatured[targetIndex];
    currentFeatured[targetIndex] = temp;

    // Update order numbers
    const updatedFeatured = currentFeatured.map((p, idx) => ({
      ...p,
      featured_order: idx + 1,
    }));

    setProducts([
      ...updatedFeatured,
      ...nonFeaturedList,
    ]);
    setHasUnsavedOrder(true);
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const itemsToSave = featuredList.map((p, idx) => ({
        id: p.id,
        featured: true,
        featured_order: idx + 1,
      }));

      const res = await fetch('/api/admin/featured-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToSave }),
      });

      if (res.ok) {
        setHasUnsavedOrder(false);
        setSuccessMsg('Homepage Featured display order saved successfully!');
        setTimeout(() => setSuccessMsg(''), 3500);
      }
    } catch (err) {
      alert('Failed to save display order');
    } finally {
      setSaving(false);
    }
  };

  // Search filter for the candidate catalog
  const filteredCandidates = nonFeaturedList.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.store_name && p.store_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStore = filterStore === 'all' || (p.store_name || 'Menyphis Marketplace') === filterStore;
    return matchesSearch && matchesStore;
  });

  if (adminInfo && !adminInfo.isSuperAdmin) {
    return (
      <SuperAdminGuard
        feature="Homepage Featured Products Selection"
        description="Selecting and arranging featured products displayed on the marketplace homepage is managed centrally by platform super administrators."
      />
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Homepage Featured Products</h1>
          <p className="admin-page-desc">
            Curate and arrange the exact products showcased on the main landing page. Drag or move items to set custom display priority.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/"
            target="_blank"
            className="admin-header-link"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>View Live Landing Page</span> ↗
          </Link>

          {hasUnsavedOrder && (
            <button
              onClick={handleSaveOrder}
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: '#16a34a',
                color: '#fff',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
              }}
            >
              {saving ? 'Saving...' : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <SaveIcon size={14} color="#ffffff" /> Save Display Sequence
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 18px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircleIcon size={16} color="#059669" /> {successMsg}
        </div>
      )}

      {/* Grid: Left Column = Active Featured on Homepage (With Ordering), Right Column = Catalog Browser to Add More */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left Column: Curated Homepage Sequence */}
        <div className="admin-card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StarIcon size={16} color="#eab308" filled={true} /> Active On Homepage ({featuredList.length} products)
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                Items appear in this exact order from left to right on the main page.
              </p>
            </div>
            {hasUnsavedOrder && (
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: '4px' }}>
                Unsaved order
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>Loading products...</div>
          ) : featuredList.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <div style={{ marginBottom: '8px', color: '#cbd5e1' }}>
                <StarIcon size={32} color="#94a3b8" filled={false} />
              </div>
              <div style={{ fontWeight: '600', color: '#334155', marginBottom: '4px' }}>No featured products selected</div>
              <div style={{ fontSize: '13px' }}>Click &quot;+ Feature on Homepage&quot; from the catalog on the right to add items here.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {featuredList.map((product, index) => (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#0f172a',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '700',
                      }}
                    >
                      {index + 1}
                    </span>

                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />

                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{product.name}</div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        <span>${parseFloat(product.price).toFixed(2)}</span>
                        <span>•</span>
                        <span style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <StoreIcon size={12} color="#2563eb" /> {product.store_name || 'Menyphis'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Move Up / Down Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        style={{
                          padding: '2px 8px',
                          border: '1px solid #cbd5e1',
                          background: index === 0 ? '#f1f5f9' : '#fff',
                          color: index === 0 ? '#94a3b8' : '#0f172a',
                          borderRadius: '4px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          fontSize: '10px',
                          fontWeight: '700',
                        }}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveItem(index, 1)}
                        disabled={index === featuredList.length - 1}
                        style={{
                          padding: '2px 8px',
                          border: '1px solid #cbd5e1',
                          background: index === featuredList.length - 1 ? '#f1f5f9' : '#fff',
                          color: index === featuredList.length - 1 ? '#94a3b8' : '#0f172a',
                          borderRadius: '4px',
                          cursor: index === featuredList.length - 1 ? 'not-allowed' : 'pointer',
                          fontSize: '10px',
                          fontWeight: '700',
                        }}
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>

                    <button
                      onClick={() => handleToggleFeatured(product)}
                      style={{
                        padding: '6px 10px',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        marginLeft: '8px',
                      }}
                      title="Remove from Homepage"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Catalog Browser to Add More Products */}
        <div className="admin-card" style={{ height: 'fit-content' }}>
          <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackageIcon size={18} color="#2563eb" /> Marketplace Product Catalog
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              Search across all tenant stores and feature items onto the main landing page with a single click.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search by title, slug, store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ margin: 0, flex: 1, fontSize: '13px' }}
            />

            <select
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              className="form-input"
              style={{ margin: 0, width: '150px', fontSize: '12px' }}
            >
              <option value="all">All Stores</option>
              {storeNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Candidate List */}
          <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredCandidates.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No eligible products found matching your search.
              </div>
            ) : (
              filteredCandidates.map((product) => (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #f1f5f9',
                    background: '#ffffff',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#0f172a' }}>{product.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        ${parseFloat(product.price).toFixed(2)} • <span style={{ color: '#2563eb' }}>{product.store_name || 'Menyphis'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleFeatured(product)}
                    style={{
                      padding: '5px 12px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    + Feature
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
