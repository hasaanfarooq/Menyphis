'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StoreIcon, FileTextIcon, BankIcon, DollarSignIcon, SettingsIcon, CheckCircleIcon, ClockIcon, AlertTriangleIcon } from '@/components/Icons';

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [stores, setStores] = useState([]);
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Modal form
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [meRes, pRes, sRes] = await Promise.all([
        fetch('/api/admin/me'),
        fetch('/api/admin/payouts'),
        fetch('/api/admin/stores'),
      ]);

      let meData = null;
      if (meRes.ok) {
        meData = await meRes.json();
        setAdminInfo(meData);
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        setPayouts(pData);
      }

      if (sRes.ok) {
        const sData = await sRes.json();
        setStores(sData);
        if (sData.length > 0) {
          const defaultStore = meData?.isStoreAdmin
            ? sData.find((s) => s.id === meData.storeId) || sData[0]
            : sData[0];
          setSelectedStoreId(defaultStore.id.toString());
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isStoreAdmin = !!adminInfo?.isStoreAdmin;
  const isSuperAdmin = !isStoreAdmin; // Default or verified superadmin

  // Find store record for store admin
  const myStore = isStoreAdmin
    ? stores.find((s) => s.id === adminInfo?.storeId) || stores[0]
    : null;

  const handleCreatePayout = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const storeIdToUse = isStoreAdmin ? adminInfo.storeId : parseInt(selectedStoreId);
    const payoutAmount = parseFloat(amount);

    if (isStoreAdmin && myStore) {
      const pendingBal = parseFloat(myStore.pending_payout || 0);
      if (payoutAmount > pendingBal) {
        alert(`Requested amount ($${payoutAmount.toFixed(2)}) exceeds your available pending balance ($${pendingBal.toFixed(2)})`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeIdToUse,
          amount: payoutAmount,
          notes,
          transaction_reference: reference || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process payout request');
      }

      setShowModal(false);
      setAmount('');
      setNotes('');
      setReference('');
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (payoutId, status) => {
    try {
      const ref = prompt('Enter payment transaction reference (e.g. WIRE-983192):', '');
      const res = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          transaction_reference: ref || null,
        }),
      });

      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Update failed');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Aggregates
  const totalPendingBalance = stores.reduce((acc, s) => acc + parseFloat(s.pending_payout || 0), 0);
  const totalPaidOutSum = stores.reduce((acc, s) => acc + parseFloat(s.total_paid_out || 0), 0);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {isStoreAdmin ? 'Store Earnings & Balance' : 'Multi-Tenant Vendor Payouts'}
          </h1>
          <p className="admin-page-desc">
            {isStoreAdmin
              ? `Manage payouts, pending balance, and bank disbursements for ${adminInfo?.storeName || 'your store'}.`
              : 'Track platform gross sales, commissions, vendor pending balances, and process bank settlements.'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 18px',
            background: '#0f172a',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <DollarSignIcon size={16} />
          {isStoreAdmin ? 'Request Payout' : 'Process Direct Payout'}
        </button>
      </div>

      {/* STORE ADMIN VIEW */}
      {isStoreAdmin && myStore ? (
        <>
          {/* Store Metrics */}
          <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Pending Payout Balance</div>
              <div className="admin-stat-value" style={{ color: '#d97706' }}>
                ${parseFloat(myStore.pending_payout || 0).toFixed(2)}
              </div>
              <div className="admin-stat-trend">Available for withdrawal request</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Total Disbursed to Bank</div>
              <div className="admin-stat-value" style={{ color: '#16a34a' }}>
                ${parseFloat(myStore.total_paid_out || 0).toFixed(2)}
              </div>
              <div className="admin-stat-trend positive">Settled vendor payouts</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Platform Commission</div>
              <div className="admin-stat-value">
                {parseFloat(myStore.commission_rate || 10.0)}%
              </div>
              <div className="admin-stat-trend">Per completed order item</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Total Store Revenue</div>
              <div className="admin-stat-value" style={{ color: '#2563eb' }}>
                ${parseFloat(myStore.total_revenue || 0).toFixed(2)}
              </div>
              <div className="admin-stat-trend">Gross merchandise value</div>
            </div>
          </div>

          {/* Registered Bank Account Info Card */}
          <div className="admin-card" style={{ marginBottom: '32px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BankIcon size={20} color="#2563eb" />
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    Registered Bank Account for Disbursements
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                    Payout settlements are wired directly to these account details.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/store-settings"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  textDecoration: 'none',
                }}
              >
                <SettingsIcon size={14} /> Edit Banking Details
              </Link>
            </div>

            {myStore.bank_name ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Bank Name</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{myStore.bank_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Account Title</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{myStore.bank_account_title || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Account Number</div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                    {myStore.bank_account_number || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>IBAN</div>
                  <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                    {myStore.bank_iban || '—'}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  padding: '16px',
                  borderRadius: '8px',
                  color: '#92400e',
                }}
              >
                <AlertTriangleIcon size={22} />
                <div style={{ flex: 1, fontSize: '13px' }}>
                  <strong>No bank account registered yet.</strong> Please configure your bank account details in Store Settings so platform administrators can disburse your earnings.
                </div>
                <Link
                  href="/admin/store-settings"
                  style={{
                    padding: '6px 14px',
                    background: '#d97706',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Configure Now
                </Link>
              </div>
            )}
          </div>
        </>
      ) : isSuperAdmin ? (
        <>
          {/* Super Admin Metrics Row */}
          <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Total Pending Vendor Balance</div>
              <div className="admin-stat-value" style={{ color: '#d97706' }}>
                ${totalPendingBalance.toFixed(2)}
              </div>
              <div className="admin-stat-trend">Platform liability to active stores</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Total Disbursed Across Stores</div>
              <div className="admin-stat-value" style={{ color: '#16a34a' }}>
                ${totalPaidOutSum.toFixed(2)}
              </div>
              <div className="admin-stat-trend positive">Completed bank settlements</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Active Stores On Platform</div>
              <div className="admin-stat-value">{stores.length}</div>
              <div className="admin-stat-trend">Multi-tenant brands</div>
            </div>
          </div>

          {/* Super Admin Vendor Store Balances Table */}
          <div className="admin-card" style={{ marginBottom: '32px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StoreIcon size={18} color="#2563eb" /> Vendor Account Balances & Banking Info
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Store</th>
                    <th>Commission Rate</th>
                    <th>Pending Balance</th>
                    <th>Total Paid Out</th>
                    <th>Bank Account Info</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{s.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>/{s.slug}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: '600', color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                          {parseFloat(s.commission_rate || 10.0)}%
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '700', color: '#d97706', fontSize: '15px' }}>
                          ${parseFloat(s.pending_payout || 0).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '700', color: '#16a34a', fontSize: '15px' }}>
                          ${parseFloat(s.total_paid_out || 0).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        {s.bank_name ? (
                          <div style={{ fontSize: '12px', color: '#334155' }}>
                            <div><strong>{s.bank_name}</strong> - {s.bank_account_title}</div>
                            <div style={{ fontFamily: 'monospace', color: '#64748b' }}>Acc: {s.bank_account_number}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>No bank account set</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Payout History Table */}
      <div className="admin-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileTextIcon size={18} color="#2563eb" /> {isStoreAdmin ? 'Store Payout Settlement History' : 'Platform Payout Settlement Transactions'}
          </h3>
        </div>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Loading payouts...</div>
        ) : payouts.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
            {isStoreAdmin
              ? 'No payout requests recorded yet. As your products sell, earnings will accrue to your pending balance.'
              : 'No payout transactions recorded yet.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  {!isStoreAdmin && <th>Store</th>}
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th>Notes</th>
                  <th>Date</th>
                  {isSuperAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{p.id}</td>
                    {!isStoreAdmin && <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.store_name}</td>}
                    <td style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                      ${parseFloat(p.amount).toFixed(2)}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: p.status === 'completed' ? '#dcfce7' : p.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                          color: p.status === 'completed' ? '#166534' : p.status === 'rejected' ? '#991b1b' : '#92400e',
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>
                      {p.transaction_reference || '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b', maxWidth: '200px' }}>
                      {p.notes || '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    {isSuperAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        {p.status === 'pending' && (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => handleUpdateStatus(p.id, 'completed')}
                              style={{
                                padding: '4px 10px',
                                background: '#16a34a',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Approve & Mark Paid
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(p.id, 'rejected')}
                              style={{
                                padding: '4px 8px',
                                background: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Requesting / Processing Payout */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div style={{ background: '#fff', borderRadius: '12px', width: '480px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              {isStoreAdmin ? 'Request Earnings Payout' : 'Disburse Payout to Store'}
            </h3>

            <form onSubmit={handleCreatePayout} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {isSuperAdmin ? (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Select Store</label>
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="form-input"
                    style={{ margin: 0, width: '100%' }}
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Pending: ${parseFloat(s.pending_payout || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Requesting payout for</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{adminInfo?.storeName}</div>
                  <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 600, marginTop: '4px' }}>
                    Available Balance: ${parseFloat(myStore?.pending_payout || 0).toFixed(2)}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Payout Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  max={isStoreAdmin && myStore ? parseFloat(myStore.pending_payout || 0) : undefined}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="form-input"
                  style={{ margin: 0, width: '100%' }}
                />
                {isStoreAdmin && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Maximum request: ${parseFloat(myStore?.pending_payout || 0).toFixed(2)}
                  </div>
                )}
              </div>

              {isSuperAdmin && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    Transaction / Wire Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WIRE-8492048 or Bank Ref"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="form-input"
                    style={{ margin: 0, width: '100%' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Notes {isStoreAdmin && '(Optional)'}
                </label>
                <textarea
                  placeholder={isStoreAdmin ? 'Add any special transfer instructions or notes' : 'Settlement notes or receipt details'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                  style={{ margin: 0, width: '100%', minHeight: '60px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  {submitting ? 'Submitting...' : isSuperAdmin ? 'Disburse & Complete' : 'Submit Payout Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

