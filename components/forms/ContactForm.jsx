'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Contact from ${form.name || 'the website'}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\n\n${form.message}`
    );
    window.location.href = `mailto:contact@taskmaverick.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <p className="auth-note">
        Thanks — your email client should have opened with your message ready to send.
      </p>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="auth-field">
        <label className="auth-label" htmlFor="c-name">Name</label>
        <input id="c-name" className="auth-input" type="text" autoComplete="name" value={form.name} onChange={set('name')} required />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="c-email">Email</label>
        <input id="c-email" className="auth-input" type="email" autoComplete="email" value={form.email} onChange={set('email')} required />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="c-company">Company <span className="auth-optional">(optional)</span></label>
        <input id="c-company" className="auth-input" type="text" autoComplete="organization" value={form.company} onChange={set('company')} />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="c-msg">Message</label>
        <textarea id="c-msg" className="auth-input auth-textarea" rows={4} value={form.message} onChange={set('message')} required />
      </div>

      <button type="submit" className="auth-submit">Send message</button>
    </form>
  );
}
