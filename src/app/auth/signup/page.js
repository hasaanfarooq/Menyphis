'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
            MENYPHIS
          </span>
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join Menyphis for exclusive drops and benefits</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <button type="submit" className="btn-primary-dark" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link href="/auth/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
