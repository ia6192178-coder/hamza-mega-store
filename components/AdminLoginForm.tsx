'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Please enter the admin password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <h1>Admin Login</h1>
      <p>Hamza Mega Store — store owner access</p>
      <form onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <div className="form-field">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn-navy btn-block" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
    </div>
  );
}
