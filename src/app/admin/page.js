import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';
import Link from 'next/link';

export default async function AdminDashboard() {
  const adminCtx = await getAdminContext();
  const isStoreAdmin = adminCtx?.isStoreAdmin;
  const storeId = adminCtx?.storeId;

  let totalRevenue = 0;
  let totalOrders = 0;
  let totalProducts = 0;
  let recentOrders = [];
  let topStores = [];

  if (isStoreAdmin && storeId) {
    const rev = await sql`
      SELECT SUM(oi.price * oi.quantity) as sum 
      FROM order_items oi 
      JOIN orders o ON oi.order_id = o.id 
      WHERE oi.store_id = ${storeId} AND o.status != 'cancelled'
    `;
    const ord = await sql`
      SELECT COUNT(DISTINCT oi.order_id) as count 
      FROM order_items oi 
      JOIN orders o ON oi.order_id = o.id 
      WHERE oi.store_id = ${storeId} AND o.status != 'cancelled'
    `;
    const prod = await sql`SELECT COUNT(id) as count FROM products WHERE store_id = ${storeId}`;
    const recent = await sql`
      SELECT DISTINCT o.id, o.status, o.created_at, u.name as customer_name,
             COALESCE(SUM(oi.price * oi.quantity), 0) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.store_id = ${storeId}
      GROUP BY o.id, o.status, o.created_at, u.name
      ORDER BY o.created_at DESC
      LIMIT 5
    `;

    totalRevenue = rev[0]?.sum || 0;
    totalOrders = parseInt(ord[0]?.count || 0);
    totalProducts = parseInt(prod[0]?.count || 0);
    recentOrders = recent;
  } else {
    // Super Admin platform wide metrics
    const rev = await sql`SELECT SUM(total) as sum FROM orders WHERE status != 'cancelled'`;
    const ord = await sql`SELECT COUNT(id) as count FROM orders WHERE status != 'cancelled'`;
    const prod = await sql`SELECT COUNT(id) as count FROM products`;
    const recent = await sql`
      SELECT o.id, o.total, o.status, u.name as customer_name 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC 
      LIMIT 5
    `;
    const stores = await sql`
      SELECT s.id, s.name, s.slug, s.logo_url, s.is_featured, s.rating,
             COUNT(DISTINCT p.id) as product_count,
             COALESCE(SUM(oi.price * oi.quantity), 0) as store_revenue
      FROM stores s
      LEFT JOIN products p ON s.id = p.store_id
      LEFT JOIN order_items oi ON s.id = oi.store_id
      GROUP BY s.id
      ORDER BY store_revenue DESC
      LIMIT 5
    `;

    totalRevenue = rev[0]?.sum || 0;
    totalOrders = parseInt(ord[0]?.count || 0);
    totalProducts = parseInt(prod[0]?.count || 0);
    recentOrders = recent;
    topStores = stores;
  }

  const averageValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val).replace('PKR', 'Rs.');
  };

  // Helper for status badges
  const getBadgeStyle = (status) => {
    const s = status?.toLowerCase() || 'pending';
    if (s === 'delivered') {
      return { 
        className: 'admin-badge delivered', 
        label: 'DELIVERED', 
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> 
      };
    }
    if (s === 'shipped' || s === 'out_for_delivery') {
      return { 
        className: 'admin-badge out-for-delivery', 
        label: 'SHIPPED', 
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg> 
      };
    }
    return { 
      className: 'admin-badge placed', 
      label: s.toUpperCase(), 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> 
    };
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Overview</h1>
        <p className="admin-page-subtitle">Here's what's happening with your store today.</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Total Revenue</span>
            <svg className="admin-stat-icon blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div className="admin-stat-value">{formatCurrency(totalRevenue)}</div>
          <div className="admin-stat-trend positive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            Live Data
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Orders</span>
            <svg className="admin-stat-icon green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <div className="admin-stat-value">{totalOrders}</div>
          <div className="admin-stat-trend">
            Active non-cancelled orders
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Average Value</span>
            <svg className="admin-stat-icon purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
          </div>
          <div className="admin-stat-value">{formatCurrency(averageValue)}</div>
          <div className="admin-stat-trend">
            Per order
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Products</span>
            <svg className="admin-stat-icon orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z"></path></svg>
          </div>
          <div className="admin-stat-value">{totalProducts}</div>
          <div className="admin-stat-trend">
            Total active items
          </div>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Revenue Overview</div>
          </div>
          <div className="admin-card-subtitle">Your expected earnings over the last 7 days.</div>
          
          {/* Placeholder for chart */}
          <div style={{ position: 'relative', height: '300px', width: '100%', marginTop: '32px' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: '#e2e8f0' }}></div>
            <div style={{ position: 'absolute', bottom: '25%', left: 0, right: 0, height: '1px', borderTop: '1px dashed #e2e8f0' }}></div>
            <div style={{ position: 'absolute', bottom: '50%', left: 0, right: 0, height: '1px', borderTop: '1px dashed #e2e8f0' }}></div>
            <div style={{ position: 'absolute', bottom: '75%', left: 0, right: 0, height: '1px', borderTop: '1px dashed #e2e8f0' }}></div>
            <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, height: '1px', borderTop: '1px dashed #e2e8f0' }}></div>
            
            <div style={{ position: 'absolute', left: '-24px', bottom: '-8px', fontSize: '10px', color: '#64748b' }}>Rs 0</div>
            <div style={{ position: 'absolute', left: '-24px', bottom: '25%', transform: 'translateY(5px)', fontSize: '10px', color: '#64748b' }}>Rs 1k</div>
            <div style={{ position: 'absolute', left: '-24px', bottom: '50%', transform: 'translateY(5px)', fontSize: '10px', color: '#64748b' }}>Rs 2k</div>
            <div style={{ position: 'absolute', left: '-24px', bottom: '75%', transform: 'translateY(5px)', fontSize: '10px', color: '#64748b' }}>Rs 3k</div>
            <div style={{ position: 'absolute', left: '-24px', bottom: '100%', transform: 'translateY(5px)', fontSize: '10px', color: '#64748b' }}>Rs 4k</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', bottom: '-24px', left: 0, right: 0, fontSize: '10px', color: '#64748b' }}>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
              <span>Mon</span>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: '#0f172a' }}></div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">Recent Orders</div>
            <a href="#" className="admin-card-link">View All &rarr;</a>
          </div>

          <div className="admin-recent-orders-list">
            {recentOrders.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '13px', padding: '16px 0' }}>No recent orders found.</div>
            ) : (
              recentOrders.map(order => {
                const badge = getBadgeStyle(order.status);
                return (
                  <div key={order.id} className="admin-recent-order-item">
                    <div className="admin-order-info">
                      <span className="admin-order-id">#ORD-{order.id.toString().padStart(5, '0')}</span>
                      <span className="admin-order-customer">{order.customer_name || 'Guest'}</span>
                    </div>
                    <div className="admin-order-status-group">
                      <span className="admin-order-price">{formatCurrency(order.total)}</span>
                      <span className={badge.className}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
