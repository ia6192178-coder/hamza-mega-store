'use client';

import { useState } from 'react';
import type { Settings } from '@/lib/types';

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: 'phone', label: 'Store Phone Number' },
  {
    key: 'whatsapp',
    label: 'WhatsApp Number',
    hint: 'Digits only, with country code — e.g. 923074347460',
  },
  { key: 'email', label: 'Email Address' },
  { key: 'address', label: 'Store Address' },
  { key: 'delivery_fee', label: 'Delivery Charges (Rs)' },
  { key: 'free_delivery_threshold', label: 'Free Delivery on Orders Above (Rs)' },
  { key: 'announcement', label: 'Announcement Bar Text' },
];

export default function AdminSettingsClient({
  initialSettings,
}: {
  initialSettings: Settings;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const f of FIELDS) v[f.key] = initialSettings[f.key] ?? '';
    return v;
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const fee = Number(values.delivery_fee);
    const threshold = Number(values.free_delivery_threshold);
    if (!Number.isFinite(fee) || fee < 0)
      return setError('Delivery charges must be 0 or more.');
    if (!Number.isFinite(threshold) || threshold < 0)
      return setError('Free-delivery threshold must be 0 or more.');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save settings.');
      setMessage('Settings saved — the store now uses the new values.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwMessage('');
    if (newPw.length < 6)
      return setPwError('New password must be at least 6 characters.');
    if (newPw !== confirmPw)
      return setPwError('New password and confirmation do not match.');
    setPwSaving(true);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPw,
          new_password: newPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not change password.');
      setPwMessage('Password changed. Use the new password next time you log in.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <>
      <form className="card" onSubmit={saveSettings} style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--navy)' }}>
          Store Settings
        </h3>
        {message && <div className="form-success">{message}</div>}
        {error && <div className="form-error">{error}</div>}
        {FIELDS.map((f) => (
          <div key={f.key} className="form-field">
            <label htmlFor={`set-${f.key}`}>{f.label}</label>
            <input
              id={`set-${f.key}`}
              className="input"
              value={values[f.key]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [f.key]: e.target.value }))
              }
            />
            {f.hint && (
              <small style={{ color: 'var(--muted)' }}>{f.hint}</small>
            )}
          </div>
        ))}
        <button type="submit" className="btn-red" disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>

      <form className="card" onSubmit={changePassword}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--navy)' }}>
          Change Admin Password
        </h3>
        {pwMessage && <div className="form-success">{pwMessage}</div>}
        {pwError && <div className="form-error">{pwError}</div>}
        <div className="form-field">
          <label htmlFor="pw-current">Current Password</label>
          <input
            id="pw-current"
            type="password"
            className="input"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="form-field">
          <label htmlFor="pw-new">New Password</label>
          <input
            id="pw-new"
            type="password"
            className="input"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="form-field">
          <label htmlFor="pw-confirm">Confirm New Password</label>
          <input
            id="pw-confirm"
            type="password"
            className="input"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn-navy" disabled={pwSaving}>
          {pwSaving ? 'Changing…' : 'Change Password'}
        </button>
      </form>
    </>
  );
}
