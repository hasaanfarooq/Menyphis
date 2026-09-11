'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StoreIcon, StarIcon, CheckIcon, PaletteIcon, CameraIcon, UploadIcon, RulerIcon, TagIcon, SparklesIcon, XIcon } from '@/components/Icons';

const PRESET_COLORS = [
  'Black', 'White', 'Charcoal', 'Navy', 'Grey', 'Pink', 'Red', 'Purple', 'Dark Green', 'Sky Blue', 'Slate', 'Brown', 'Beige', 'Cream', 'Olive', 'Gold'
];

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'One Size'];

const PRESET_FEATURES = [
  'Free shipping over $99',
  '30-day free returns',
  '100% premium cotton',
  'Exclusive design',
  'Authentic guaranteed',
  'Breathable fabric',
  '1-Year Warranty',
  'Eco-friendly materials',
  'Machine washable',
  'Water resistant'
];

const colorHexMap = {
  'Black': '#1a1a1a', 'Charcoal': '#36454F', 'Navy': '#1B2A4A',
  'Purple': '#7C3AED', 'Dark Green': '#1B4332', 'White': '#F5F5F5',
  'Pink': '#EC4899', 'Midnight Blue': '#191970', 'Grey': '#6B7280',
  'Dark Red': '#8B0000', 'Red': '#DC2626', 'Aurora Green': '#00D084',
  'Deep Purple': '#6B21A8', 'Phantom Black': '#0D0D0D', 'Ghost White': '#F8F8FF',
  'Slate': '#475569', 'Sky Blue': '#87CEEB', 'Storm Grey': '#708090',
  'Brown': '#78350F', 'Beige': '#F5F5DC', 'Cream': '#FFFDD0', 'Olive': '#808000', 'Gold': '#D4AF37'
};

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeIdParam = searchParams.get('store_id');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingColor, setUploadingColor] = useState(null);

  const [newColorInput, setNewColorInput] = useState('');
  const [newSizeInput, setNewSizeInput] = useState('');
  const [newFeatureInput, setNewFeatureInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    compare_price: '',
    category_id: '',
    image_url: '',
    stock: '',
    colors: ['Black', 'White'],
    sizes: ['S', 'M', 'L', 'XL'],
    color_images: {},
    features: [
      'Free shipping over $99',
      '30-day free returns',
      '100% premium cotton',
      'Exclusive design'
    ]
  });

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      const prodUrl = storeIdParam ? `/api/admin/products?store_id=${storeIdParam}` : '/api/admin/products';
      const [prodRes, catRes, meRes] = await Promise.all([
        fetch(prodUrl),
        fetch('/api/admin/categories'),
        fetch('/api/admin/me')
      ]);
      
      if (meRes.ok) {
        setAdminInfo(await meRes.json());
      }
      if (prodRes.ok) {
        setProducts(await prodRes.json());
      }
      if (catRes.ok) {
        setCategories(await catRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, [storeIdParam]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: product.price,
        compare_price: product.compare_price || '',
        category_id: product.category_id || '',
        image_url: product.image_url || '',
        stock: product.stock || 0,
        colors: Array.isArray(product.colors) ? product.colors : [],
        sizes: Array.isArray(product.sizes) ? product.sizes : [],
        color_images: product.color_images && typeof product.color_images === 'object' ? product.color_images : {},
        features: Array.isArray(product.features) && product.features.length > 0 
          ? product.features 
          : [
              'Free shipping over $99',
              '30-day free returns',
              '100% premium cotton',
              'Exclusive design'
            ]
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        compare_price: '',
        category_id: '',
        image_url: '',
        stock: '',
        colors: ['Black', 'White'],
        sizes: ['S', 'M', 'L', 'XL'],
        color_images: {},
        features: [
          'Free shipping over $99',
          '30-day free returns',
          '100% premium cotton',
          'Exclusive design'
        ]
      });
    }
    setNewColorInput('');
    setNewSizeInput('');
    setNewFeatureInput('');
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  // Upload main image
  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, image_url: result.url }));
      } else {
        alert(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Upload color-specific image
  const handleColorImageUpload = async (colorName, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingColor(colorName);
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (res.ok) {
        setFormData(prev => {
          const updatedColorImages = { ...(prev.color_images || {}), [colorName]: result.url };
          // If no main image is chosen yet, auto-set main image to this color image
          const newMain = prev.image_url ? prev.image_url : result.url;
          return {
            ...prev,
            image_url: newMain,
            color_images: updatedColorImages
          };
        });
      } else {
        alert(result.error || 'Color image upload failed');
      }
    } catch (error) {
      console.error('Color image upload error:', error);
      alert('Upload failed');
    } finally {
      setUploadingColor(null);
    }
  };

  const handleSetColorImageUrl = (colorName, url) => {
    setFormData(prev => ({
      ...prev,
      color_images: {
        ...(prev.color_images || {}),
        [colorName]: url
      }
    }));
  };

  // Color add/remove handlers
  const handleAddColor = (color) => {
    const trimmed = color.trim();
    if (!trimmed) return;
    if (formData.colors.includes(trimmed)) return;
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, trimmed]
    }));
    setNewColorInput('');
  };

  const handleRemoveColor = (color) => {
    setFormData(prev => {
      const updatedColors = prev.colors.filter(c => c !== color);
      const updatedColorImages = { ...(prev.color_images || {}) };
      delete updatedColorImages[color];
      return {
        ...prev,
        colors: updatedColors,
        color_images: updatedColorImages
      };
    });
  };

  // Size add/remove handlers
  const handleToggleSize = (size) => {
    setFormData(prev => {
      const exists = prev.sizes.includes(size);
      return {
        ...prev,
        sizes: exists ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size]
      };
    });
  };

  const handleAddCustomSize = () => {
    const trimmed = newSizeInput.trim();
    if (!trimmed) return;
    if (!formData.sizes.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, trimmed]
      }));
    }
    setNewSizeInput('');
  };

  // Feature tags add/remove handlers
  const handleAddFeatureTag = (tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (formData.features.includes(trimmed)) return;
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, trimmed]
    }));
    setNewFeatureInput('');
  };

  const handleRemoveFeatureTag = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Fallback: If image_url is empty but there's at least one color image, use that
    let finalImageUrl = formData.image_url;
    if (!finalImageUrl && formData.color_images) {
      const firstColorImg = Object.values(formData.color_images).find(url => !!url);
      if (firstColorImg) finalImageUrl = firstColorImg;
    }

    if (!finalImageUrl) {
      alert('Please upload or provide at least one product image or color image.');
      return;
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
    
    const payload = {
      ...formData,
      image_url: finalImageUrl,
      price: parseFloat(formData.price),
      compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      stock: parseInt(formData.stock) || 0,
      colors: formData.colors || [],
      sizes: formData.sizes || [],
      color_images: formData.color_images || {},
      features: formData.features || []
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      handleCloseModal();
      fetchProductsAndCategories();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Error saving product');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchProductsAndCategories();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="admin-page-title" style={{ marginBottom: '4px' }}>
            {adminInfo?.isStoreAdmin ? 'My Store Products' : 'Products (Catalog)'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
            {adminInfo?.isStoreAdmin
              ? `Manage styles, variants, stock, and guarantee tags for ${adminInfo.storeName || 'your store'}`
              : 'Multi-store platform product catalog: manage inventory, pricing, and color variants across all vendors.'}
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          style={{ 
            padding: '10px 24px', 
            background: '#1e293b', 
            color: 'white', 
            borderRadius: '6px', 
            border: 'none', 
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}
        >
          Add New Product
        </button>
      </div>

      {storeIdParam && !adminInfo?.isStoreAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: 600 }}>
            Filtered to Store ID: #{storeIdParam}
          </span>
          <button 
            onClick={() => router.push('/admin/products')}
            style={{ padding: '4px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            Clear Store Filter (Show All)
          </button>
        </div>
      )}

      <div className="admin-card">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                {!adminInfo?.isStoreAdmin && <th>Store</th>}
                <th>Variants</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }} />}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{p.slug}</div>
                  </td>
                  {!adminInfo?.isStoreAdmin && (
                    <td>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '2px 8px', 
                        borderRadius: '999px', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        background: 'rgba(0, 0, 0, 0.05)',
                        color: '#334155'
                      }}>
                        <StoreIcon size={12} color="currentColor" /> {p.store_name || 'Menyphis'}
                      </span>
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {p.colors && p.colors.length > 0 && (
                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                          {p.colors.slice(0, 4).map((c, i) => (
                            <span 
                              key={i} 
                              style={{ 
                                width: 10, 
                                height: 10, 
                                borderRadius: '50%', 
                                background: colorHexMap[c] || c, 
                                border: '1px solid #cbd5e1',
                                display: 'inline-block' 
                              }} 
                              title={c} 
                            />
                          ))}
                          {p.colors.length > 4 && <span style={{ fontSize: '10px', color: '#64748b' }}>+{p.colors.length - 4}</span>}
                        </div>
                      )}
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {p.sizes?.length ? `${p.sizes.length} sizes` : 'No sizes'}
                      </span>
                    </div>
                  </td>
                  <td>${p.price}</td>
                  <td>{p.stock}</td>
                  <td>
                    <button
                      onClick={async () => {
                        const nextVal = !p.featured;
                        try {
                          const res = await fetch(`/api/admin/products/${p.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...p, featured: nextVal })
                          });
                          if (res.ok) {
                            setProducts(prev => prev.map(item => item.id === p.id ? { ...item, featured: nextVal } : item));
                          }
                        } catch (err) {
                          alert('Failed to toggle featured status');
                        }
                      }}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: p.featured ? '#fef3c7' : '#f1f5f9',
                        color: p.featured ? '#b45309' : '#64748b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Toggle Homepage Featured"
                    >
                      <StarIcon size={12} color={p.featured ? '#b45309' : '#64748b'} filled={p.featured} />
                      {p.featured ? 'Featured' : 'Standard'}
                    </button>
                  </td>
                  <td>
                    <button className="admin-btn-edit" onClick={() => handleOpenModal(p)}>Edit</button>
                    <button className="admin-btn-delete" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No products found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '800px', width: '95%', maxHeight: '92vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              {/* Basic Information */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Product Name *</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({
                      ...formData, 
                      name: e.target.value,
                      slug: editingId ? formData.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    })} 
                    required 
                    className="form-input" 
                    placeholder="e.g. Oversized Graphic Hoodie"
                  />
                </div>
                <div className="form-group" style={{ flex: 1.5 }}>
                  <label>Slug *</label>
                  <input 
                    type="text" 
                    value={formData.slug} 
                    onChange={e => setFormData({...formData, slug: e.target.value})} 
                    required 
                    className="form-input" 
                    placeholder="oversized-graphic-hoodie"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Price ($) *</label>
                  <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="form-input" placeholder="49.99" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Compare Price ($)</label>
                  <input type="number" step="0.01" value={formData.compare_price} onChange={e => setFormData({...formData, compare_price: e.target.value})} className="form-input" placeholder="79.99" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Stock Quantity</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="form-input" placeholder="100" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Category</label>
                  <select 
                    value={formData.category_id} 
                    onChange={e => setFormData({...formData, category_id: e.target.value})} 
                    className="form-input"
                    style={{ background: 'white' }}
                  >
                    <option value="">Select a category...</option>
                    {categories.filter(c => c.store_id != null && (c.is_owner || (adminInfo?.store_id && c.store_id === adminInfo.store_id))).length > 0 && (
                      <optgroup label="My Store Categories">
                        {categories
                          .filter(c => c.store_id != null && (c.is_owner || (adminInfo?.store_id && c.store_id === adminInfo.store_id)))
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                      </optgroup>
                    )}
                    <optgroup label="Global Platform Categories">
                      {categories
                        .filter(c => c.store_id == null)
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </optgroup>
                    {adminInfo?.isSuperAdmin && categories.filter(c => c.store_id != null).length > 0 && (
                      <optgroup label="Store-Specific Categories">
                        {categories
                          .filter(c => c.store_id != null)
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.store_name || `Store #${c.store_id}`})</option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Primary Image URL</label>
                  <input 
                    type="text" 
                    value={formData.image_url} 
                    onChange={e => setFormData({...formData, image_url: e.target.value})} 
                    className="form-input" 
                    placeholder="https://... or upload below"
                  />
                </div>
              </div>

              {/* Main Image Upload Box */}
              <div className="form-group" style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Default Product Image</label>
                  {uploading && <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>Uploading image...</span>}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleMainImageUpload} 
                    className="form-input" 
                    style={{ flex: 1, padding: '6px' }}
                    disabled={uploading}
                  />
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Main Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                  )}
                </div>
              </div>

              {/* SECTION: COLOR VARIANTS & COLOR IMAGES */}
              <div style={{ marginTop: '18px', padding: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PaletteIcon size={16} color="#0f172a" /> Color Variants & Individual Images
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      Each color can have its own specific image. When shoppers click a color, that image is displayed!
                    </p>
                  </div>
                </div>

                {/* Quick Add Colors */}
                <div style={{ margin: '12px 0 10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Quick Add Popular Colors:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {PRESET_COLORS.map(c => {
                      const isAdded = formData.colors.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => isAdded ? handleRemoveColor(c) : handleAddColor(c)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            border: isAdded ? '1px solid #0f172a' : '1px solid #e2e8f0',
                            background: isAdded ? '#0f172a' : '#f8fafc',
                            color: isAdded ? '#ffffff' : '#334155',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorHexMap[c] || c, border: '1px solid rgba(0,0,0,0.15)' }} />
                          {c} {isAdded ? <CheckIcon size={12} color="currentColor" /> : '+'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Input */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    value={newColorInput}
                    onChange={e => setNewColorInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddColor(newColorInput); } }}
                    className="form-input"
                    placeholder="Or type custom color (e.g. Sage Green, Lavender)"
                    style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddColor(newColorInput)}
                    style={{ padding: '6px 16px', background: '#334155', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    + Add Color
                  </button>
                </div>

                {/* Color Cards with Image Uploads */}
                {formData.colors.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>
                    No colors added yet. Select from the quick colors above or add a custom color.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {formData.colors.map(color => {
                      const colorImg = formData.color_images?.[color] || '';
                      const isUploadingThis = uploadingColor === color;
                      return (
                        <div 
                          key={color} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            padding: '10px 14px', 
                            background: '#f8fafc', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '8px',
                            flexWrap: 'wrap'
                          }}
                        >
                          {/* Color Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                            <span 
                              style={{ 
                                width: '18px', 
                                height: '18px', 
                                borderRadius: '50%', 
                                background: colorHexMap[color] || color, 
                                border: '1px solid #cbd5e1',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }} 
                            />
                            <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{color}</span>
                          </div>

                          {/* Image Preview */}
                          <div style={{ width: '42px', height: '42px', borderRadius: '6px', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                            {colorImg ? (
                              <img src={colorImg} alt={color} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <CameraIcon size={18} color="#94a3b8" />
                            )}
                          </div>

                          {/* Image URL input */}
                          <input
                            type="text"
                            value={colorImg}
                            onChange={e => handleSetColorImageUrl(color, e.target.value)}
                            placeholder={`Image URL for ${color}`}
                            className="form-input"
                            style={{ flex: 1, minWidth: '180px', padding: '6px 10px', fontSize: '12px' }}
                          />

                          {/* Upload Button */}
                          <label 
                            style={{ 
                              padding: '6px 12px', 
                              background: isUploadingThis ? '#94a3b8' : '#0f172a', 
                              color: 'white', 
                              borderRadius: '6px', 
                              fontSize: '12px', 
                              fontWeight: 600, 
                              cursor: isUploadingThis ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <UploadIcon size={13} color="currentColor" />
                            {isUploadingThis ? 'Uploading...' : 'Upload'}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={e => handleColorImageUpload(color, e)} 
                              style={{ display: 'none' }}
                              disabled={isUploadingThis}
                            />
                          </label>

                          {/* Set As Main */}
                          {colorImg && colorImg !== formData.image_url && (
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, image_url: colorImg }))}
                              style={{ padding: '6px 10px', background: '#e2e8f0', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', color: '#334155', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Use this color image as default main image"
                            >
                              <StarIcon size={12} color="#334155" filled={true} /> Set Main
                            </button>
                          )}

                          {/* Remove Color */}
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(color)}
                            style={{ padding: '6px 10px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Remove this color variant"
                          >
                            <XIcon size={13} color="currentColor" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: SIZES */}
              <div style={{ marginTop: '18px', padding: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RulerIcon size={16} color="#0f172a" /> Product Sizes
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '10px 0 12px' }}>
                  {PRESET_SIZES.map(s => {
                    const isSelected = formData.sizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleToggleSize(s)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: isSelected ? '1px solid #0f172a' : '1px solid #cbd5e1',
                          background: isSelected ? '#0f172a' : '#f8fafc',
                          color: isSelected ? '#ffffff' : '#334155',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {s} {isSelected && <CheckIcon size={12} color="currentColor" />}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newSizeInput}
                    onChange={e => setNewSizeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSize(); } }}
                    placeholder="Custom size (e.g. 32, 34, UK 8)"
                    className="form-input"
                    style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    style={{ padding: '6px 16px', background: '#334155', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    + Add Size
                  </button>
                </div>
              </div>

              {/* SECTION: CUSTOM FEATURE TAGS BELOW ADD TO CART */}
              <div style={{ marginTop: '18px', padding: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TagIcon size={16} color="#0f172a" /> Product Assurance Tags (Below Add to Cart)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                    These tags appear directly below the "ADD TO CART" button on the product page (e.g. shipping, returns, materials, warranty).
                  </p>
                </div>

                {/* Quick Presets */}
                <div style={{ margin: '10px 0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Quick Add Suggestions:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {PRESET_FEATURES.map(f => {
                      const isAdded = formData.features.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            if (isAdded) {
                              setFormData(prev => ({ ...prev, features: prev.features.filter(x => x !== f) }));
                            } else {
                              handleAddFeatureTag(f);
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            border: isAdded ? '1px solid #0f172a' : '1px solid #e2e8f0',
                            background: isAdded ? '#0f172a' : '#f8fafc',
                            color: isAdded ? '#ffffff' : '#334155',
                            fontWeight: 500,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {f} {isAdded ? <CheckIcon size={12} color="currentColor" /> : '+'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Tag Input */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={newFeatureInput}
                    onChange={e => setNewFeatureInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeatureTag(newFeatureInput); } }}
                    placeholder="Type custom tag (e.g. 100% Cashmere, Made in Italy, Lifetime Guarantee)"
                    className="form-input"
                    style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddFeatureTag(newFeatureInput)}
                    style={{ padding: '6px 16px', background: '#334155', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    + Add Tag
                  </button>
                </div>

                {/* Active Tags Display */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {formData.features.map((tag, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '8px 12px', 
                        background: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '6px' 
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <SparklesIcon size={13} color="#2563eb" /> {tag}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeatureTag(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: '4px' }}
                        title="Remove tag"
                      >
                        <XIcon size={14} color="#ef4444" />
                      </button>
                    </div>
                  ))}
                  {formData.features.length === 0 && (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                      No tags configured. Default store assurance tags will be displayed.
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginTop: '18px' }}>
                <label>Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="form-input" 
                  style={{ minHeight: '80px' }} 
                  placeholder="Detailed product story, fit notes, styling recommendations..."
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', background: 'white', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }} disabled={uploading || !!uploadingColor}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-dark" style={{ width: 'auto', padding: '10px 28px', fontWeight: 600, fontSize: '14px' }} disabled={uploading || !!uploadingColor}>
                  {uploading || !!uploadingColor ? 'Uploading Images...' : (editingId ? 'Save Changes' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px' }}>Loading products...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
