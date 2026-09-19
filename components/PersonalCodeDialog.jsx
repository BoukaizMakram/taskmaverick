'use client';

import { useEffect, useId, useRef, useState } from 'react';

// Recording identities only: this prototype never authenticates a real account.
export const DEMO_PERFORMERS = {
  '123456': 'Anna F. - Staff',
  '456456': 'Ben R. - Staff',
  '789789': 'Carla M. - Staff',
  '654321': 'J. Maverick',
};

export function CodeKey({ children, onClick, ...props }) {
  const [pressed, setPressed] = useState(false);
  const [ripple, setRipple] = useState(0);
  const releaseTimer = useRef(null);
  const pressCount = useRef(0);
  useEffect(() => () => clearTimeout(releaseTimer.current), []);
  const press = () => {
    clearTimeout(releaseTimer.current);
    setRipple(++pressCount.current);
    setPressed(true);
  };
  const release = () => {
    setPressed(false);
    clearTimeout(releaseTimer.current);
    releaseTimer.current = setTimeout(() => setRipple(0), 300);
  };
  return <button {...props} type="button" onClick={onClick} data-pressed={pressed || undefined}
    onPointerDown={event => {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      // Percentages preserve the contact point inside scaled phone/tablet previews.
      button.style.setProperty('--pc-press-x', `${(event.clientX - rect.left) / rect.width * 100}%`);
      button.style.setProperty('--pc-press-y', `${(event.clientY - rect.top) / rect.height * 100}%`);
      button.setPointerCapture(event.pointerId);
      press();
    }}
    onPointerUp={release} onPointerCancel={release}
    onLostPointerCapture={release} onBlur={release}
    onKeyDown={event => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.currentTarget.style.setProperty('--pc-press-x', '50%');
        event.currentTarget.style.setProperty('--pc-press-y', '50%');
        if (!event.repeat) press();
      }
    }}
    onKeyUp={release}>
    {ripple !== 0 && <span key={ripple} className={`pc-ripple-fade ${pressed ? '' : 'is-releasing'}`} aria-hidden="true"><span className="pc-press-ripple"/></span>}
    <span className="pc-key-label">{children}</span>
  </button>;
}

export function PersonalCodeKeypad({ activeKey, disabled = false, onDigit, onDelete, tabIndex }) {
  return <fieldset className="pc-keypad" disabled={disabled}>
    {[1,2,3,4,5,6,7,8,9].map(n => <CodeKey key={n} tabIndex={tabIndex} data-demo-active={activeKey === String(n) || undefined} onClick={() => onDigit?.(String(n))}>{n}</CodeKey>)}
    <CodeKey tabIndex={tabIndex} aria-label="Delete last digit" onClick={onDelete}><svg width="27" height="22" viewBox="0 0 27 22" aria-hidden="true"><path d="M8 1h17v20H8L1 11Z" fill="currentColor"/><path d="m12 7 8 8m0-8-8 8" stroke="white" strokeWidth="2.5"/></svg></CodeKey>
    <CodeKey tabIndex={tabIndex} className="pc-zero" data-demo-active={activeKey === '0' || undefined} onClick={() => onDigit?.('0')}>0</CodeKey>
  </fieldset>;
}

export default function PersonalCodeDialog({ onClaim, onDismiss, action = 'Claim', demo = null }) {
  const [internalCode, setCode] = useState('');
  const [internalLoading, setLoading] = useState(false);
  const code = demo?.code ?? internalCode;
  const loading = demo?.loading ?? internalLoading;
  const [error, setError] = useState('');
  const [showCodes, setShowCodes] = useState(false);
  const input = useRef(null);
  const dialog = useRef(null);
  const callbacks = useRef({ onClaim, onDismiss });
  callbacks.current = { onClaim, onDismiss };
  const titleId = useId();
  const errorId = useId();

  useEffect(() => {
    const previous = document.activeElement;
    input.current?.focus({ preventScroll: true });
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);

  useEffect(() => {
    if (demo || code.length !== 6) return;
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
      if (!DEMO_PERFORMERS[code]) {
        setError('Code not found. Try again or retrieve a recording code.');
        input.current?.select();
      } else callbacks.current.onClaim(DEMO_PERFORMERS[code]);
    }, 900);
    return () => clearTimeout(timer);
  }, [code]);

  const change = (value) => { setError(''); setCode(value.replace(/\D/g, '').slice(0, 6)); };
  const key = (digit) => { change((error ? '' : code) + digit); input.current?.focus({ preventScroll: true }); };
  const keyboard = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); callbacks.current.onDismiss(); }
    if (event.key === 'Tab') {
      const nodes = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };

  return <div className="pc-backdrop">
    <section className={`pc-dialog ${loading ? 'pc-loading' : ''}`} aria-busy={loading} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog} onKeyDown={keyboard}>
      <header className="pc-header"><h2 id={titleId}>Enter Personal Code to {action}</h2><button type="button" aria-label="Cancel personal code" onClick={onDismiss}>×</button></header>
      <div className="pc-content">
        <div className="pc-entry" onClick={() => input.current?.focus()}>
          <div className="pc-digits" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i} data-demo-active={demo?.activeDigit === i || undefined}>{code[i] ? (demo?.revealCode ? code[i] : '●') : ''}</span>)}</div>
          <input ref={input} className="pc-input" aria-label="Personal code" aria-describedby={error ? errorId : undefined} aria-invalid={!!error} type="text" inputMode="numeric" autoComplete="off" disabled={loading} maxLength={6} value={code} onChange={e => change(e.target.value)} />
        </div>
        <PersonalCodeKeypad disabled={loading} activeKey={demo?.activeKey} onDigit={key} onDelete={() => { change(code.slice(0,-1)); input.current?.focus(); }}/>
        {error && <p className="pc-error" role="alert" id={errorId}>{error}</p>}
        <button type="button" className="pc-retrieve" disabled={loading} onClick={() => setShowCodes(v => !v)} aria-expanded={showCodes}>Retrieve Codes</button>
        {showCodes && <div className="pc-codes"><strong>Recording codes</strong>{Object.entries(DEMO_PERFORMERS).map(([value,name]) => <div key={value}>{name}: <b>{value}</b></div>)}</div>}
      </div>
    </section>
  </div>;
}

