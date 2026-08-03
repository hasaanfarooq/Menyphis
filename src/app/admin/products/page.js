'use client';
import { useState, useEffect } from 'react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', price: '', compare_price: '', category_id: '', image_url: '', stock: ''
  });

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/categories')
      ]);
      
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
  }, []);

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
        stock: product.stock || 0
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', slug: '', description: '', price: '', compare_price: '', category_id: '', image_url: '', stock: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleImageUpload = async (e) => {
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
        setFormData({ ...formData, image_url: result.url });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        price: parseFloat(formData.price),
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        stock: parseInt(formData.stock) || 0
      })
    });

    if (res.ok) {
      handleCloseModal();
      fetchProductsAndCategories();
    } else {
      alert('Error saving product');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Products</h1>
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

      <div className="admin-card">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{p.slug}</div>
                  </td>
                  <td>${p.price}</td>
                  <td>{p.stock}</td>
                  <td>
                    <button className="admin-btn-edit" onClick={() => handleOpenModal(p)}>Edit</button>
                    <button className="admin-btn-delete" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No products found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2 style={{ marginBottom: '16px' }}>{editingId ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="form-input" />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} required className="form-input" />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Price</label>
                  <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="form-input" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Compare Price</label>
                  <input type="number" step="0.01" value={formData.compare_price} onChange={e => setFormData({...formData, compare_price: e.target.value})} className="form-input" />
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
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Stock</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label>Image Upload</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="form-input" 
                    style={{ flex: 1 }}
                    disabled={uploading}
                  />
                  {uploading && <span style={{ fontSize: '13px', color: '#64748b' }}>Uploading...</span>}
                </div>
                {formData.image_url && (
                  <div style={{ marginTop: '12px' }}>
                    <img src={formData.image_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="form-input" style={{ minHeight: '80px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: '8px 16px', border: '1px solid #ddd', background: 'white', borderRadius: 4, cursor: 'pointer' }} disabled={uploading}>Cancel</button>
                <button type="submit" className="btn-primary-dark" style={{ width: 'auto', padding: '8px 24px' }} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
