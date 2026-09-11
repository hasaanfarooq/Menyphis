'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StarIcon, CheckIcon, ClockIcon } from '@/components/Icons';

const StarRating = ({ rating, size = 14 }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map(n => (
      <StarIcon key={n} size={size} filled={n <= rating} />
    ))}
  </span>
);

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ all: 0, approved: 0, pending: 0 });

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, page, ...(search && { search }) });
      const res = await fetch(`/api/admin/reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setTotal(data.total || 0);
        setTotalPages(data.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
    setLoading(false);
  }, [status, search, page]);

  const fetchStats = useCallback(async () => {
    try {
      const [allRes, approvedRes, pendingRes] = await Promise.all([
        fetch('/api/admin/reviews?status=all'),
        fetch('/api/admin/reviews?status=approved'),
        fetch('/api/admin/reviews?status=pending'),
      ]);
      const [allData, approvedData, pendingData] = await Promise.all([
        allRes.json(), approvedRes.json(), pendingRes.json()
      ]);
      setStats({
        all: allData.total || 0,
        approved: approvedData.total || 0,
        pending: pendingData.total || 0,
      });
    } catch {}
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleApprove = async (id, approved) => {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    });
    if (res.ok) {
      fetchReviews();
      fetchStats();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this review?')) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchReviews();
      fetchStats();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="admin-page-title" style={{ marginBottom: '4px' }}>Reviews</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Moderate customer reviews and manage ratings.</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Reviews', value: stats.all, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Approved', value: stats.approved, color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Pending', value: stats.pending, color: '#f97316', bg: '#fff7ed' },
        ].map(s => (
          <div key={s.label} className="admin-card" style={{ padding: '20px', margin: 0 }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: '16px', padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Status tabs */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', gap: '2px' }}>
          {[
            { key: 'all', label: 'All', icon: null },
            { key: 'approved', label: 'Approved', icon: (color) => <CheckIcon size={12} color={color} /> },
            { key: 'pending', label: 'Pending', icon: (color) => <ClockIcon size={12} color={color} /> },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setStatus(tab.key); setPage(1); }}
              style={{
                padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: status === tab.key ? 'white' : 'transparent',
                color: status === tab.key ? '#1e293b' : '#64748b',
                fontWeight: status === tab.key ? '600' : '400',
                fontSize: '13px',
                boxShadow: status === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
                display: 'inline-flex', alignItems: 'center', gap: '5px',
              }}>
              {tab.icon && tab.icon(status === tab.key ? '#1e293b' : '#64748b')}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '400px' }}>
          <input
            type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by user, product, or comment..."
            className="form-input" style={{ margin: 0, flex: 1 }}
          />
          <button type="submit" style={{ padding: '8px 16px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>
            Search
          </button>
        </form>

        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '13px', whiteSpace: 'nowrap' }}>
          {total} review{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="admin-card" style={{ padding: '20px' }}>
              <div className="skeleton" style={{ height: '16px', width: '40%', marginBottom: '10px' }} />
              <div className="skeleton" style={{ height: '14px', width: '70%' }} />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="admin-card" style={{ padding: '64px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <StarIcon size={44} filled={false} color="#94a3b8" />
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No reviews found</div>
            <div style={{ color: '#64748b' }}>Reviews will appear here once customers start leaving them.</div>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="admin-card" style={{
              padding: '20px', margin: 0,
              borderLeft: `4px solid ${review.approved ? '#22c55e' : '#f97316'}`,
              opacity: review.approved ? 1 : 0.9,
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Product */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: '200px', flex: '0 0 auto' }}>
                  {review.product_image && (
                    <img src={review.product_image} alt={review.product_name}
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                  )}
                  <div>
                    <Link href={`/product/${review.product_slug}`} target="_blank"
                      style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', textDecoration: 'none' }}>
                      {review.product_name}
                    </Link>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>/{review.product_slug}</div>
                  </div>
                </div>

                {/* Review Content */}
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <StarRating rating={review.rating} />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{review.rating}/5</span>
                    {review.title && (
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>"{review.title}"</span>
                    )}
                    <span style={{
                      background: review.approved ? '#f0fdf4' : '#fff7ed',
                      color: review.approved ? '#22c55e' : '#f97316',
                      padding: '3px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '700',
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}>
                      {review.approved ? (
                        <>
                          <CheckIcon size={12} color="#22c55e" /> Approved
                        </>
                      ) : (
                        <>
                          <ClockIcon size={12} color="#f97316" /> Pending
                        </>
                      )}
                    </span>
                  </div>
                  {review.comment && (
                    <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 8px', lineHeight: '1.5' }}>
                      {review.comment}
                    </p>
                  )}
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    By <strong style={{ color: '#64748b' }}>{review.user_name}</strong> ({review.user_email}) •{' '}
                    {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  {review.approved ? (
                    <button onClick={() => handleApprove(review.id, false)}
                      style={{ padding: '6px 14px', background: '#fff7ed', color: '#f97316', border: '1px solid #fed7aa', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      Reject
                    </button>
                  ) : (
                    <button onClick={() => handleApprove(review.id, true)}
                      style={{ padding: '6px 14px', background: '#f0fdf4', color: '#22c55e', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      Approve
                    </button>
                  )}
                  <button onClick={() => handleDelete(review.id)}
                    style={{ padding: '6px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', background: 'white', color: '#64748b', opacity: page === 1 ? 0.5 : 1 }}>
            ← Prev
          </button>
          {[...Array(Math.min(totalPages, 7))].map((_, i) => {
            const p = i + 1;
            return (
              <button key={p} onClick={() => setPage(p)}
                style={{ padding: '8px 14px', border: '1px solid', borderRadius: '6px', cursor: 'pointer', borderColor: page === p ? '#1e293b' : '#e2e8f0', background: page === p ? '#1e293b' : 'white', color: page === p ? 'white' : '#64748b', fontWeight: page === p ? '700' : '400' }}>
                {p}
              </button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', background: 'white', color: '#64748b', opacity: page === totalPages ? 0.5 : 1 }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
