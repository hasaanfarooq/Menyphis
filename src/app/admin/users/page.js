'use client';
import { useState, useEffect } from 'react';
import SuperAdminGuard from '@/components/SuperAdminGuard';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', is_admin: false
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [meRes, res] = await Promise.all([
        fetch('/api/admin/me'),
        fetch('/api/admin/users'),
      ]);

      if (meRes.ok) {
        setAdminInfo(await meRes.json());
      }
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      is_admin: user.is_admin
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const res = await fetch(`/api/admin/users/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        handleCloseModal();
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Error saving user');
      }
    } catch (error) {
      console.error('Error saving user', error);
      alert('Failed to update user');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone. Any related orders will be kept for history but disconnected from the user.')) {
      try {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchUsers();
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Delete user error', error);
        alert('Failed to delete user');
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (adminInfo && !adminInfo.isSuperAdmin) {
    return (
      <SuperAdminGuard
        feature="User & Role Management"
        description="Viewing platform user accounts, assigning administrator roles, and granting store permissions are strictly limited to platform super administrators."
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Users</h1>
        <div style={{ flex: '1', maxWidth: '300px' }}>
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ width: '100%', margin: 0 }}
          />
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
                  <th>Avatar</th>
                  <th>User Info</th>
                  <th>Role</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      {u.avatar_url ? (
                         <img src={u.avatar_url} alt={u.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td>
                      {u.is_admin ? (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>Admin</span>
                      ) : (
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>User</span>
                      )}
                    </td>
                    <td>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="admin-btn-edit" onClick={() => handleOpenModal(u)}>Edit</button>
                      <button className="admin-btn-delete" onClick={() => handleDelete(u.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2 style={{ marginBottom: '16px' }}>Edit User</h2>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  required 
                  className="form-input" 
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="isAdmin"
                  checked={formData.is_admin} 
                  onChange={e => setFormData({...formData, is_admin: e.target.checked})} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isAdmin" style={{ margin: 0, cursor: 'pointer' }}>Administrator Access</label>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: '8px 16px', border: '1px solid #ddd', background: 'white', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary-dark" style={{ width: 'auto', padding: '8px 24px' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
