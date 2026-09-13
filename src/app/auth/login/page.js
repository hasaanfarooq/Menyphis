'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, redirectTarget);
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  const signupLink = redirectTarget && redirectTarget !== '/' 
    ? `/auth/signup?redirect=${encodeURIComponent(redirectTarget)}`
    : '/auth/signup';

  return (
    <div className="auth-card">
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
          MENYPHIS
        </span>
      </div>
      <h1 className="auth-title">Welcome Back</h1>
      <p className="auth-subtitle">
        {redirectTarget === '/checkout' 
          ? 'Sign in to your account to complete checkout' 
          : 'Sign in to your account to continue shopping'}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
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
            placeholder="••••••••" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" className="btn-primary-dark" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="auth-link">
        Don&apos;t have an account? <Link href={signupLink}>Sign Up</Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-page">
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading sign-in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
