'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StoreIcon, CheckCircleIcon, ZapIcon, ShieldCheckIcon, TruckIcon } from '@/components/Icons';

export default function BecomeASellerPage() {
  const [formData, setFormData] = useState({
    brand_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website_or_social: '',
    category: 'Streetwear & Apparel',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/seller/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        setApplicationId(data.applicationId);
      } else {
        setErrorMsg(data.error || 'Failed to submit application. Please check your fields.');
      }
    } catch {
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '85vh', background: '#f8fafc', padding: '50px 20px' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        
        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eef2ff', color: '#4f46e5', padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '16px' }}>
            <StoreIcon size={14} color="#4f46e5" />
            Brand Partner Program
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 12px' }}>
            Sell with Menyphis
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            Showcase your collections on Pakistan&apos;s premier curated streetwear marketplace. Reach discerning buyers with dedicated storefront branding, seamless orders, and transparent payouts.
          </p>
        </div>

        {/* Benefits Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '44px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', color: '#0f172a' }}>
              <StoreIcon size={20} color="#0f172a" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px', color: '#0f172a' }}>Dedicated Brand Portal</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Your own branded URL, custom banner, logo, and intuitive catalog management dashboard.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', color: '#059669' }}>
              <ZapIcon size={20} color="#059669" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px', color: '#0f172a' }}>Fast Bank Payouts</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Transparent low commission structure with automated earnings accrual and direct bank deposits.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', color: '#7c3aed' }}>
              <TruckIcon size={20} color="#7c3aed" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px', color: '#0f172a' }}>Real-time Dispatch Alerts</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Instant email manifests and vendor orders dashboard the moment a customer buys your piece.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', color: '#2563eb' }}>
              <ShieldCheckIcon size={20} color="#2563eb" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px', color: '#0f172a' }}>Curated Exclusivity</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Quality-controlled brand ecosystem ensuring your designs sit alongside Pakistan&apos;s best creators.
            </p>
          </div>
        </div>

        {/* Application Form Card */}
        <div style={{ maxWidth: '720px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '36px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <CheckCircleIcon size={34} color="#059669" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                Application Received!
              </h2>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 20px' }}>
                Thank you for applying to partner with Menyphis. Our curation team will review your brand catalog and get in touch within 24 to 48 hours.
              </p>
              {applicationId && (
                <div style={{ display: 'inline-block', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', color: '#475569', marginBottom: '24px', fontFamily: 'monospace' }}>
                  Reference No: #APP-{applicationId}
                </div>
              )}
              <div>
                <Link
                  href="/"
                  style={{
                    display: 'inline-block',
                    padding: '12px 28px',
                    background: '#000000',
                    color: '#ffffff',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                  }}
                >
                  Return to Storefront
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '18px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
                  Brand Partner Application
                </h2>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                  Fill in your brand credentials below. Once approved, you will receive login access to your store portal.
                </p>
              </div>

              {errorMsg && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', marginBottom: '20px' }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Brand / Store Name *
                    </label>
                    <input
                      type="text"
                      name="brand_name"
                      required
                      value={formData.brand_name}
                      onChange={handleChange}
                      placeholder="e.g. Apex Streetwear"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      name="contact_name"
                      required
                      value={formData.contact_name}
                      onChange={handleChange}
                      placeholder="e.g. Ali Khan"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Business Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="brands@yourdomain.com"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      WhatsApp / Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+92 300 1234567"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Instagram Handle or Website *
                    </label>
                    <input
                      type="text"
                      name="website_or_social"
                      required
                      value={formData.website_or_social}
                      onChange={handleChange}
                      placeholder="@yourbrand or yourbrand.pk"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Primary Product Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#ffffff', boxSizing: 'border-box' }}
                    >
                      <option value="Streetwear & Apparel">Streetwear & Apparel</option>
                      <option value="Graphic Tees & Oversized">Graphic Tees & Oversized</option>
                      <option value="Heavyweight Hoodies">Heavyweight Hoodies</option>
                      <option value="Caps & Accessories">Caps & Accessories</option>
                      <option value="Footwear & Kicks">Footwear & Kicks</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    About Your Brand & Collections *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell us about your brand ethos, current product range, manufacturing quality, and approximate monthly drop volumes..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#000000',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '14px 24px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    marginTop: '8px',
                  }}
                >
                  {loading ? 'Submitting Application...' : 'Submit Partner Application →'}
                </button>
              </form>

              <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                Already an approved partner?{' '}
                <Link href="/auth/login" style={{ color: '#4f46e5', fontWeight: '600', textDecoration: 'none' }}>
                  Sign In to Vendor Portal
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
