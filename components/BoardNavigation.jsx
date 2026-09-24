'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IconBack } from './PhoneShell';

const entries = [
  ['Retrieve Codes', 'codes', 'purple'],
  ['Personal Board', 'person', 'blue', true],
  ['Switch Unit', 'building', 'blue'],
  ['Ticket Board', 'ticket', 'pink'],
  ['Rate Missions', 'like', 'blue'],
  ['Knowledge Base', 'book', 'blue'],
  ['View Made Requests - 0', 'link', 'blue'],
  ['Make Request', 'plus', 'green'],
  ['Add Process', 'process', 'blue'],
  ['Create Mission', 'file', 'orange'],
  ['Schedule to This Board', 'calendar', 'green'],
  ['Closed Missions Visibility: 2 day(s)', 'clock', 'blue'],
  ['Lock User', 'lock', 'blue'],
  ['Business Proofs', 'image', 'blue'],
];
export function MenuIcon({ kind, color = 'blue', menu }) {
  if (menu) return <span className="bn-menu-icon"><img src={`/board-icons/${kind === 'codes' ? 'personal' : menu}-${kind}.svg`} alt=""/></span>;
  return <span className={`bn-icon bn-icon--${color}`}><img src={`/board-icons/${kind}.svg`} alt=""/></span>;
}
const personalEntries = [
  ['Retrieve Codes', 'codes', 'purple'], ['Unit Ticket Boards', 'ticket', 'pink'],
  ['Organization View', 'units', 'purple'], ['Personal Board', 'person', 'blue'],
  ['Create Mission', 'file', 'orange'], ['Schedule to This Board', 'calendar', 'green'],
  ['Home', 'home', 'purple'], ['Lock User', 'lock', 'blue'],
];

export function BoardMenu({ onDismiss, boardType = 'team', onNavigate, anchor, businessMediaLabel }) {
  const ref = useRef(null);
  const closeRef = useRef(null);
  const [codes, setCodes] = useState(false);
  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const align = () => {
      const layer = ref.current;
      const bounds = layer.getBoundingClientRect();
      const button = anchor.getBoundingClientRect();
      const scaleX = bounds.width / layer.offsetWidth;
      const scaleY = bounds.height / layer.offsetHeight;
      if (!scaleX || !scaleY) return;
      Object.assign(closeRef.current.style, {
        left: `${(button.left - bounds.left) / scaleX}px`,
        top: `${(button.top - bounds.top) / scaleY}px`,
        width: `${button.width / scaleX}px`,
        height: `${button.height / scaleY}px`, right: 'auto',
      });
    };
    align();
    const observer = new ResizeObserver(align);
    observer.observe(ref.current);
    observer.observe(anchor);
    window.addEventListener('resize', align);
    return () => { observer.disconnect(); window.removeEventListener('resize', align); };
  }, [anchor]);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.querySelector('button')?.focus({ preventScroll: true });
    return () => previous?.focus({ preventScroll: true });
  }, []);
  return <div className="bn-menu-layer" ref={ref} role="dialog" aria-modal="true" aria-label="Board menu" onKeyDown={event => {
    if (event.key === 'Escape') onDismiss();
    if (event.key === 'Tab') {
      const buttons = [...ref.current.querySelectorAll('button')];
      const index = buttons.indexOf(document.activeElement);
      event.preventDefault(); buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
    }
  }}>
    <button className="bn-shade" aria-label="Dismiss menu" onClick={onDismiss}/>
    <button ref={closeRef} className="ph-iconbtn bn-menu-close" aria-label="Close menu" onClick={onDismiss}><svg viewBox="0 0 20 20"><path d="M4 4l12 12M16 4 4 16" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg></button>
    <div className="bn-menu">
      {(boardType === 'personal' ? personalEntries : entries).map(([label, kind, color, locked], index) => <div key={kind} className={(boardType === 'personal' ? [0,3,5] : [0,3,6]).includes(index) ? 'bn-menu-group-end' : ''}>
        {kind === 'codes' ? <button className="bn-menu-item" onClick={() => setCodes(value => !value)} aria-expanded={codes}><MenuIcon kind={kind} color={color} menu={boardType}/><span>{label}</span></button> : ['person', 'building', 'units', 'home'].includes(kind) ? <button className="bn-menu-item" onClick={() => onNavigate(kind === 'person' ? 'personal' : kind === 'home' ? 'home' : 'unit')}><MenuIcon kind={kind} color={color} menu={boardType}/><span>{label}</span></button> : <div className="bn-menu-item" data-iq-target={kind === 'image' && businessMediaLabel ? 'business-media' : undefined}><MenuIcon kind={kind} color={color} menu={boardType}/><span>{kind === 'image' && businessMediaLabel ? businessMediaLabel : label}</span>{locked && <img className="bn-lock" src="/board-icons/lock.svg" alt="Locked"/>}</div>}
        {kind === 'codes' && codes && <div className="bn-demo-codes">Anna F. — <b>123456</b><br/>J. Maverick — <b>654321</b></div>}
      </div>)}
    </div>
  </div>;
}

const catalog = [
  ['Task', '10-Min Break AM'], ['Task', '30-Min Break'],
  ['Checklist', 'ABC License Renewal'], ['Survey', 'All Cheese Crepe Waste'],
  ['Survey', 'Anonymous Incident Log'], ['Checklist', 'Business Card Inventory'],
  ['Checklist', 'Chef Coat Checkout'], ['Checklist', 'Chef Coat Inventory'],
];

export function OnDemand({ department, onBack }) {
  const [byReference, setByReference] = useState(false);
  const backRef = useRef(null);
  useEffect(() => { backRef.current?.focus({ preventScroll: true }); }, []);
  return <section className="bn-demand" aria-label="On-Demand" onKeyDown={event => { if (event.key === 'Escape') onBack(); }}>
    <header className="bn-demand-header"><button ref={backRef} className="ph-iconbtn" aria-label="Back to board" onClick={onBack}><IconBack/></button><h2>On-Demand - {department}</h2></header>
    <div className="bn-demand-body">
      <div className="bn-demand-tabs"><button aria-pressed={!byReference} className={!byReference ? 'is-active' : ''} onClick={() => setByReference(false)}>By Mission</button><button aria-pressed={byReference} className={byReference ? 'is-active' : ''} onClick={() => setByReference(true)}>By Reference</button></div>
      <div className="bn-demand-list">{byReference ? <p className="mi-empty">No references available</p> : catalog.map(([kind, title]) => <article className="bn-demand-card" key={title}><div><img src="/mission-logo.png" alt=""/>{kind}</div><h3>{title}</h3></article>)}</div>
    </div>
  </section>;
}
