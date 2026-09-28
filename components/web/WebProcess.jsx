'use client';

// ---------------------------------------------------------------------------
// WebProcess — the process builder canvas (Missions → Within Processes): a
// trigger starts a chain of missions; statement conditions branch on answers
// (Yes → this branch, No → that branch); tickets and delays are steps too.
// "A training can trigger a task, a task a training, a survey a checklist."
// Drag the canvas to pan. Prefix .wa-flow-*.
// ---------------------------------------------------------------------------

import { useRef, useState } from 'react';
import { PROCESS_FLOW } from '@/lib/web/data.mjs';
import { Icon } from '@/components/OverviewWorkspace';

const W = 250, H = { trigger: 64, mission: 82, condition: 96, ticket: 82, delay: 64 };
const KIND_LABEL = { mission: null, condition: null, ticket: 'Ticket', delay: 'Delay', trigger: 'Trigger' };

export default function WebProcess({ process, onClose }) {
  const flow = PROCESS_FLOW[process.id] || PROCESS_FLOW.kitting;
  const [pan, setPan] = useState({ x: 40, y: 20 });
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState(null);
  const drag = useRef(null);
  const byId = Object.fromEntries(flow.nodes.map(n => [n.id, n]));
  const node = selected && byId[selected];
  const width = Math.max(...flow.nodes.map(n => n.x + W)) + 80, height = Math.max(...flow.nodes.map(n => n.y + H[n.kind])) + 80;
  return <section className="wa-flow" aria-label={`${process.name} process`}>
    <header className="wa-flow-head">
      <dl><div><dt>Name</dt><dd>{process.name}</dd></div><div><dt>Tag</dt><dd><span className="wa-chip">{process.tag}</span></dd></div><div><dt>Category</dt><dd><span className="wa-chip">{process.category}</span></dd></div></dl>
      <div className="wa-flow-actions"><span className="wa-version">{process.version} <i className="wa-dot is-green"/>Published</span><button type="button" className="ow-primary">Actions <Icon name="chevron"/></button><button type="button" className="ow-secondary">Edit</button><button type="button" className="ow-secondary" onClick={onClose}>Close</button></div>
    </header>
    <div className="wa-flow-body">
      <div className="wa-flow-canvas" onPointerDown={e => { if (e.target.closest('.wa-node')) return; drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={e => drag.current && setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y })} onPointerUp={() => { drag.current = null; }}>
        <div className="wa-flow-plane" style={{ width, height, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          <svg className="wa-flow-edges" width={width} height={height} aria-hidden="true">
            {flow.edges.map(([a, b]) => {
              const s = byId[a], t = byId[b];
              const sx = s.x + W / 2, sy = s.y + H[s.kind], tx = t.x + W / 2, ty = t.y;
              const side = t.y <= s.y + H[s.kind] - 10;
              const d = side ? `M${s.x + W} ${s.y + H[s.kind] / 2} C ${s.x + W + 50} ${s.y + H[s.kind] / 2}, ${t.x - 50} ${t.y + H[t.kind] / 2}, ${t.x} ${t.y + H[t.kind] / 2}` : `M${sx} ${sy} C ${sx} ${sy + 40}, ${tx} ${ty - 40}, ${tx} ${ty}`;
              return <path key={a + b} d={d} fill="none" stroke="#9fb3c2" strokeWidth="1.6"/>;
            })}
          </svg>
          {flow.nodes.map(n => <button type="button" key={n.id} className={`wa-node wa-node--${n.kind}${selected === n.id ? ' is-selected' : ''}`} style={{ left: n.x, top: n.y, width: W, minHeight: H[n.kind] }} onClick={() => setSelected(n.id)}>
            {n.level && <span className="wa-node-level">{n.level}</span>}
            <span className="wa-node-kind"><img src="/mission-logo.png" alt=""/>{KIND_LABEL[n.kind] ?? (n.kind === 'condition' ? n.title : n.type)}</span>
            {n.kind === 'condition' ? <><small>{n.sub}</small><b className={`wa-node-answer is-${n.answer === 'Yes' ? 'yes' : 'no'}`}>{n.answer}</b></> : <><b>{n.kind === 'trigger' ? n.sub : n.title}</b>{n.kind !== 'trigger' && <small>{n.sub}</small>}</>}
          </button>)}
        </div>
      </div>
      <aside className="wa-flow-rail">
        <button type="button" className="ow-secondary"><Icon name="group"/>Navigation</button>
        <button type="button" className="ow-secondary"><Icon name="settings"/>Settings</button>
        {node && <div className="wa-flow-inspector"><strong>{node.kind === 'condition' ? 'Statement Condition' : node.title}</strong><p>{node.sub}</p>{node.kind === 'condition' && <p>Continue on answer: <b>{node.answer}</b></p>}{node.level && <p>Level {node.level}</p>}</div>}
        <div className="wa-flow-zoom"><button type="button" aria-label="Zoom in" onClick={() => setZoom(z => Math.min(1.6, z + .1))}>+</button><button type="button" aria-label="Zoom out" onClick={() => setZoom(z => Math.max(.6, z - .1))}>−</button><button type="button" aria-label="Reset view" onClick={() => { setZoom(1); setPan({ x: 40, y: 20 }); }}>⟲</button></div>
      </aside>
    </div>
  </section>;
}
