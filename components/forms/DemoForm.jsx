'use client';

import { useState } from 'react';

const TEAM_SIZES = ['1–10', '11–50', '51–200', '201–1,000', '1,000+'];

export default function DemoForm() {
  const [form, setForm] = useState({ name: '', email: '', company: '', size: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Demo request — ${form.company || form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nWork email: ${form.email}\nCompany: ${form.company}\nTeam size: ${form.size}\n\n${form.message}`
    );
    window.location.href = `mailto:contact@taskmaverick.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <p className="auth-note">
        Thanks — your email client should have opened with your request ready to send. We&apos;ll be
        in touch shortly.
      </p>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="auth-field">
        <label className="auth-label" htmlFor="d-name">Full name</label>
        <input id="d-name" className="auth-input" type="text" autoComplete="name" value={form.name} onChange={set('name')} required />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="d-email">Work email</label>
        <input id="d-email" className="auth-input" type="email" autoComplete="email" value={form.email} onChange={set('email')} required />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="d-company">Company</label>
        <input id="d-company" className="auth-input" type="text" autoComplete="organization" value={form.company} onChange={set('company')} required />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="d-size">Team size</label>
        <select id="d-size" className="auth-input auth-select" value={form.size} onChange={set('size')} required>
          <option value="" disabled>Select…</option>
          {TEAM_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="d-msg">What would you like to see? <span className="auth-optional">(optional)</span></label>
        <textarea id="d-msg" className="auth-input auth-textarea" rows={3} value={form.message} onChange={set('message')} />
      </div>

      <button type="submit" className="auth-submit">Request demo</button>
    </form>
  );
}
