'use client';
import { useState, useEffect } from 'react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenModal = async (orderId) => {
    setShowModal(true);
    setOrderLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data);
        setTrackingNumber(data.tracking_number || '');
        setCarrier(data.carrier || '');
      } else {
        alert('Failed to load order details');
        setShowModal(false);
      }
    } catch (error) {
      console.error('Fetch order details error:', error);
    }
    setOrderLoading(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: selectedOrder.status,
          tracking_number: trackingNumber,
          carrier: carrier
        })
      });

      if (res.ok) {
        // Update local state
        const updated = await res.json();
        setSelectedOrder(updated);
        setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o));
        alert('Order updated successfully');
      } else {
        alert('Failed to update order');
      }
    } catch (error) {
      console.error('Order update error:', error);
      alert('Failed to update order');
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return { bg: '#fef3c7', text: '#92400e' };
      case 'processing': return { bg: '#e0f2fe', text: '#0369a1' };
      case 'shipped': return { bg: '#f3e8ff', text: '#6b21a8' };
      case 'delivered': return { bg: '#dcfce7', text: '#166534' };
      case 'cancelled': return { bg: '#fee2e2', text: '#b91c1c' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Orders</h1>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const statusStyle = getStatusColor(o.status);
                  return (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>#{o.id}</td>
                      <td>{new Date(o.created_at).toLocaleDateString()}</td>
                      <td>
                        {o.user_name ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>{o.user_name}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>{o.user_email}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontStyle: 'italic' }}>Guest</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>${parseFloat(o.total).toFixed(2)}</td>
                      <td>
                        <span style={{ background: statusStyle.bg, color: statusStyle.text, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' }}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <button className="admin-btn-edit" onClick={() => handleOpenModal(o.id)}>View Details</button>
                      </td>
                    </tr>
                  )
                })}
                {orders.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Order Details #{selectedOrder?.id}</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            {orderLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Loading details...</div>
            ) : selectedOrder ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Info</h3>
                    {selectedOrder.user_name ? (
                      <>
                        <div style={{ fontWeight: 600 }}>{selectedOrder.user_name}</div>
                        <div>{selectedOrder.user_email}</div>
                      </>
                    ) : (
                      <div style={{ fontStyle: 'italic' }}>Guest User</div>
                    )}
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shipping Address</h3>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{selectedOrder.shipping_address}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Fulfillment & Tracking</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Status</label>
                      <select 
                        value={selectedOrder.status} 
                        onChange={(e) => setSelectedOrder({...selectedOrder, status: e.target.value})}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Carrier (e.g. FedEx, UPS)</label>
                      <input 
                        type="text" 
                        value={carrier} 
                        onChange={(e) => setCarrier(e.target.value)}
                        placeholder="Enter carrier"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Tracking Number</label>
                      <input 
                        type="text" 
                        value={trackingNumber} 
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleUpdateOrder} className="admin-btn-primary" style={{ padding: '8px 16px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      Save Updates
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Order Items</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Details</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map(item => (
                        <tr key={item.id}>
                          <td>
                            {item.product_image ? (
                              <img src={item.product_image} alt={item.product_name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px' }} />
                            ) : (
                              <div style={{ width: 40, height: 40, background: '#e2e8f0', borderRadius: '4px' }}></div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{item.product_name || 'Unknown Product'}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {item.size && `Size: ${item.size} `}
                              {item.color && `Color: ${item.color}`}
                            </div>
                          </td>
                          <td>${parseFloat(item.price).toFixed(2)}</td>
                          <td>{item.quantity}</td>
                          <td style={{ fontWeight: 600 }}>${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>
                    Total: ${parseFloat(selectedOrder.total).toFixed(2)}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
