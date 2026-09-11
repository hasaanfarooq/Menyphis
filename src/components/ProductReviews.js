'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StarIcon, CheckCircleIcon, EditIcon } from '@/components/Icons';

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div style={{ display: 'flex', gap: '4px', cursor: 'pointer' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          style={{
            display: 'inline-flex',
            padding: '2px',
            transition: 'transform 0.1s',
            transform: n <= display ? 'scale(1.15)' : 'scale(1)',
            userSelect: 'none',
          }}
        >
          <StarIcon size={24} filled={n <= display} color={n <= display ? '#FFB800' : '#d1d5db'} />
        </span>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
      <span style={{ fontSize: '12px', color: '#64748b', width: '30px', textAlign: 'right', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
        {label}<StarIcon size={11} color="#FFB800" />
      </span>
      <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #FFB800, #FF8C00)', borderRadius: '999px', transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: '12px', color: '#94a3b8', width: '24px', flexShrink: 0 }}>{count}</span>
    </div>
  );
}

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' });

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setStats(data.stats);
      }
    } catch {}
    setLoading(false);
  }, [productId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rating) { setSubmitError('Please select a star rating.'); return; }
    if (submitting) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitSuccess(true);
        setShowForm(false);
        setForm({ rating: 0, title: '', comment: '' });
        fetchReviews();
        setTimeout(() => setSubmitSuccess(false), 4000);
      } else {
        setSubmitError(data.error || 'Failed to submit review');
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('Delete your review?')) return;
    const res = await fetch(`/api/products/${productId}/reviews/${reviewId}`, { method: 'DELETE' });
    if (res.ok) fetchReviews();
  };

  const total = parseInt(stats?.total || 0);
  const average = parseFloat(stats?.average || 0);
  const hasUserReviewed = reviews.some(r => r.user_id === user?.id);

  const ratingLabels = { 5: 'Excellent', 4: 'Good', 3: 'Okay', 2: 'Poor', 1: 'Terrible' };

  return (
    <section style={{ marginTop: '48px', borderTop: '1px solid var(--border-color)', paddingTop: '48px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '32px' }}>
        Customer Reviews {total > 0 && <span style={{ color: '#94a3b8', fontSize: '16px', fontWeight: '400' }}>({total})</span>}
      </h2>

      {/* Stats Overview */}
      {total > 0 && stats && (
        <div style={{
          display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap',
          background: 'var(--bg-secondary)', borderRadius: '16px', padding: '24px',
          marginBottom: '32px',
        }}>
          {/* Big average */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '56px', fontWeight: '800', lineHeight: 1, color: 'var(--text-primary)' }}>
              {average.toFixed(1)}
            </div>
            <div style={{ color: '#FFB800', display: 'flex', justifyContent: 'center', gap: '2px', margin: '6px 0' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <StarIcon key={n} size={20} filled={n <= Math.round(average)} />
              ))}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>{total} review{total !== 1 ? 's' : ''}</div>
          </div>
          {/* Bar chart */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            {[5, 4, 3, 2, 1].map(n => (
              <RatingBar key={n} label={n} count={parseInt(stats[['', 'one', 'two', 'three', 'four', 'five'][n]])} total={total} />
            ))}
          </div>
        </div>
      )}

      {/* Submit review CTA */}
      {submitSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircleIcon size={18} color="#16a34a" /> Your review has been submitted successfully!
        </div>
      )}

      {!showForm && !submitSuccess && (
        <div style={{ marginBottom: '32px' }}>
          {user ? (
            !hasUserReviewed ? (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  padding: '12px 28px', background: 'var(--color-primary)', color: 'white',
                  border: 'none', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: '600', fontSize: '15px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
              >
                <EditIcon size={16} color="white" /> Write a Review
              </button>
            ) : (
              <p style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>You have already reviewed this product.</p>
            )
          ) : (
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              <a href="/auth/login" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Log in</a> to leave a review.
            </p>
          )}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div style={{
          background: 'var(--bg-secondary)', borderRadius: '16px', padding: '28px',
          marginBottom: '32px', border: '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Your Review</h3>
            <button onClick={() => { setShowForm(false); setSubmitError(''); }}
              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Star Rating */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', fontSize: '14px' }}>
                Your Rating *
              </label>
              <StarInput value={form.rating} onChange={r => setForm(p => ({ ...p, rating: r }))} />
              {form.rating > 0 && (
                <div style={{ marginTop: '6px', fontSize: '13px', color: '#64748b' }}>
                  {ratingLabels[form.rating]}
                </div>
              )}
            </div>

            {/* Title */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>
                Review Title
              </label>
              <input
                type="text" value={form.title} maxLength={100}
                placeholder="Summarize your experience..."
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}
              />
            </div>

            {/* Comment */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>
                Review
              </label>
              <textarea
                value={form.comment} maxLength={1000}
                placeholder="Tell other shoppers about your experience with this product..."
                onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                rows={4}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', background: 'white', fontFamily: 'inherit' }}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{form.comment.length}/1000</div>
            </div>

            {submitError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '14px' }}>
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowForm(false); setSubmitError(''); }}
                style={{ padding: '10px 20px', border: '1px solid var(--border-color)', background: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                style={{
                  padding: '10px 24px', background: submitting ? '#94a3b8' : 'var(--color-primary)', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: '600',
                }}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ height: '16px', width: '30%', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '14px', width: '80%', marginBottom: '4px' }} />
              <div className="skeleton" style={{ height: '14px', width: '60%' }} />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <StarIcon size={44} filled={false} color="#94a3b8" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No reviews yet</h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Be the first to review this product!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reviews.map(review => (
            <div key={review.id} style={{
              borderBottom: '1px solid var(--border-color)', paddingBottom: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  {/* Reviewer + date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0 }}>
                      {review.user_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{review.user_name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Stars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ display: 'inline-flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <StarIcon key={n} size={15} filled={n <= review.rating} />
                      ))}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>{review.rating}/5</span>
                  </div>

                  {/* Title */}
                  {review.title && (
                    <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '6px', color: 'var(--text-primary)' }}>
                      {review.title}
                    </div>
                  )}

                  {/* Comment */}
                  {review.comment && (
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                      {review.comment}
                    </p>
                  )}
                </div>

                {/* Delete own review */}
                {user?.id === review.user_id && (
                  <button onClick={() => handleDelete(review.id)}
                    style={{ background: 'none', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
