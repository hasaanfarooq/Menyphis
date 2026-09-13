'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';

  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password, redirectTarget);
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  const loginLink = redirectTarget && redirectTarget !== '/' 
    ? `/auth/login?redirect=${encodeURIComponent(redirectTarget)}`
    : '/auth/login';

  return (
    <div className="auth-card">
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
          MENYPHIS
        </span>
      </div>
      <h1 className="auth-title">Create Account</h1>
      <p className="auth-subtitle">
        {redirectTarget === '/checkout'
          ? 'Join Menyphis to complete your order and track shipments'
          : 'Join Menyphis for exclusive drops and member perks'}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Your name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="you@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="Min 8 characters" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={8} 
          />
        </div>
        <button type="submit" className="btn-primary-dark" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-link">
        Already have an account? <Link href={loginLink}>Sign In</Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="auth-page">
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading registration...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
