'use client';

import { useState } from 'react';
import type { Settings } from '@/lib/types';

export default function ContactForm({ settings }: { settings: Settings }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError('Please enter your name and a message.');
      return;
    }
    const text = encodeURIComponent(
      `Assalam-o-Alaikum! I am ${name.trim()}${phone.trim() ? ` (${phone.trim()})` : ''}.\n\n${message.trim()}`,
    );
    window.open(`https://wa.me/${settings.whatsapp}?text=${text}`, '_blank');
  };

  return (
    <div className="cart-layout">
      <div className="card">
        <h2 style={{ margin: '0 0 14px', color: 'var(--navy)' }}>
          Send us a message
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 0 }}>
          Fill in the form and it will open WhatsApp with your message ready to
          send — we usually reply within a few hours.
        </p>
        <form onSubmit={send}>
          {error && <div className="form-error">{error}</div>}
          <div className="form-field">
            <label htmlFor="ct-name">Your Name *</label>
            <input
              id="ct-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="form-field">
            <label htmlFor="ct-phone">Mobile Number</label>
            <input
              id="ct-phone"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0307-1234567"
              inputMode="tel"
            />
          </div>
          <div className="form-field">
            <label htmlFor="ct-message">Message *</label>
            <textarea
              id="ct-message"
              className="input"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help you?"
            />
          </div>
          <button type="submit" className="btn-navy btn-block">
            Send via WhatsApp
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 14px', color: 'var(--navy)' }}>
          Contact Details
        </h2>
        <p>
          📍 <strong>Address:</strong>
          <br />
          {settings.address}
        </p>
        <p>
          📞 <strong>Phone:</strong>
          <br />
          <a href={`tel:${settings.phone}`} style={{ fontWeight: 700 }}>
            {settings.phone}
          </a>
        </p>
        <p>
          💬 <strong>WhatsApp:</strong>
          <br />
          <a
            href={`https://wa.me/${settings.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 700 }}
          >
            Chat on WhatsApp
          </a>
        </p>
        <p>
          ✉️ <strong>Email:</strong>
          <br />
          <a href={`mailto:${settings.email}`} style={{ fontWeight: 700 }}>
            {settings.email}
          </a>
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          We are available 7 days a week, 9am – 9pm.
        </p>
      </div>
    </div>
  );
}
