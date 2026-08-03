'use client';
import { useState, useEffect } from 'react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', image_url: ''
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image_url: category.image_url || ''
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', slug: '', description: '', image_url: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

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
    if (submitting) return;

    setSubmitting(true);
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        handleCloseModal();
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || 'Error saving category');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchCategories();
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to delete category');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete category');
      }
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Categories</h1>
        
        <div style={{ display: 'flex', gap: '12px', flex: '1', justifyContent: 'flex-end', minWidth: '300px' }}>
          <input 
            type="text" 
            placeholder="Search categories..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ margin: 0, maxWidth: '250px' }}
          />
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
            Add New Category
          </button>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name & Slug</th>
                  <th>Description</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(c => (
                  <tr key={c.id}>
                    <td>
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        <div style={{ width: 48, height: 48, background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>/{c.slug}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: '#475569', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.description || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>No description</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '999px', fontSize: '13px', fontWeight: '600' }}>
                        {c.product_count} items
                      </span>
                    </td>
                    <td>
                      <button className="admin-btn-edit" onClick={() => handleOpenModal(c)}>Edit</button>
                      <button className="admin-btn-delete" onClick={() => handleDelete(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No categories found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2 style={{ marginBottom: '16px' }}>{editingId ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Category Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="form-input" placeholder="e.g. Summer Collection" />
              </div>
              <div className="form-group">
                <label>URL Slug</label>
                <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} required className="form-input" placeholder="e.g. summer-collection" />
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Only lowercase letters, numbers, and hyphens. Must be unique.</div>
              </div>
              
              <div className="form-group">
                <label>Category Image</label>
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
                    <img src={formData.image_url} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="form-input" 
                  style={{ minHeight: '80px', resize: 'vertical' }} 
                  placeholder="Optional brief description of this category..."
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: '8px 16px', border: '1px solid #ddd', background: 'white', borderRadius: 4, cursor: 'pointer' }} disabled={uploading || submitting}>Cancel</button>
                <button type="submit" className="btn-primary-dark" style={{ width: 'auto', padding: '8px 24px' }} disabled={uploading || submitting}>
                  {uploading ? 'Uploading...' : submitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
