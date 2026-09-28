'use client';

// ---------------------------------------------------------------------------
// Secondary screens of the software simulator (SimDevice layers):
//   CameraLayer   — in-app capture (Add Photo / Add Video). No gallery button:
//                   proof is captured live inside the mission, never picked.
//   LessonLayer   — lesson player (video / audio "podcast" / image) with its
//                   quiz; skip to the quiz if you already know it, fail → back.
//   PhotoViewer   — a proof photo or video, full screen, with Close.
//   ProofsFeed    — "Media Proofs": every inspection's photos like a feed.
//   RatePanel     — rate a closed mission (Poor … Excellent).
//   KnowledgePanel— the Knowledge Base, always at your fingertips.
//   TestResult    — "Test Completed", score, and the media assigned on fail.
// Prefix .sim-* (components/sim/sim.css).
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';
import { IconBack } from '@/components/PhoneShell';
import { BUSINESS_PROOFS, proofSrc } from '@/lib/businessProofs.mjs';
import { KNOWLEDGE } from '@/lib/sim/data.mjs';
import { clock, fileStamp, stamp } from '@/lib/sim/store.mjs';
import { PhotoGlyph, VideoGlyph } from './SimMissionBody';

const PlayGlyph = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5Z"/></svg>;
const PauseGlyph = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>;
const CheckGlyph = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>;
const RetakeGlyph = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2.1-5M5 4v4h4"/></svg>;

export function LayerHead({ title, onBack, dark = false, children }) {
  return <header className={`sim-head${dark ? ' is-dark' : ''}`}>
    <button type="button" className="sim-head-back" aria-label="Back" onClick={onBack}><IconBack/></button>
    <b>{title}</b>{children || <span className="sim-head-space"/>}
  </header>;
}

// ---- camera -----------------------------------------------------------------
const PHOTO_FEEDS = ['equipment-thermostat', 'storage-shelves', 'restroom-sinks', 'fire-extinguisher', 'storage-containers', 'equipment-gauge'];
export function feedFor(media, key = '') {
  if (media === 'video') return '/demo-quality/condition-report.mp4';
  const n = [...key].reduce((s, c) => s + c.charCodeAt(0), 0);
  return proofSrc(PHOTO_FEEDS[n % PHOTO_FEEDS.length]);
}
export function CameraLayer({ media = 'photo', feedKey, onCapture, onBack, auto = false }) {
  const video = media === 'video';
  const src = feedFor(media, feedKey);
  const [stage, setStage] = useState('live');
  const [flash, setFlash] = useState(false);
  const [rec, setRec] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);
  const shutter = () => {
    if (!video) { setFlash(true); setTimeout(() => { setFlash(false); setStage('review'); }, 180); return; }
    if (stage === 'recording') { clearInterval(timer.current); setStage('review'); return; }
    setStage('recording'); setRec(0);
    const length = auto ? 2 : 4;
    timer.current = setInterval(() => setRec(s => { if (s >= length) { clearInterval(timer.current); setStage('review'); return s; } return s + 1; }), 1000);
  };
  // The AI presenter can run the capture on its own.
  useEffect(() => {
    if (!auto) return;
    const a = setTimeout(shutter, 700);
    return () => clearTimeout(a);
  }, [auto]);
  useEffect(() => {
    if (!auto || stage !== 'review') return;
    const b = setTimeout(() => onCapture({ kind: media, src }), 900);
    return () => clearTimeout(b);
  }, [auto, stage]);
  return <div className="sim-camera">
    <LayerHead title={`Add ${video ? 'Video' : 'Photo'}`} onBack={onBack} dark/>
    <div className={`sim-camera-view${stage === 'review' ? ' is-review' : ''}`}>
      {video ? <video src={src} poster="/demo-quality/damaged-hinge.png" muted loop autoPlay playsInline/> : <img src={src} alt="Live camera view"/>}
      {stage === 'recording' && <span className="sim-rec"><i/>00:0{rec}</span>}
      {flash && <span className="sim-flash"/>}
    </div>
    {stage === 'review'
      ? <footer className="sim-review"><button type="button" className="is-next" onClick={() => onCapture({ kind: media, src })}><CheckGlyph/>Next</button><button type="button" className="is-retake" onClick={() => setStage('live')}><RetakeGlyph/>Retake</button></footer>
      : <footer className="sim-camera-bar"><span className="sim-camera-tool" aria-hidden="true">⚡</span>
          <button type="button" aria-label={video ? (stage === 'recording' ? 'Stop recording' : 'Record') : 'Take photo'} className={`sim-shutter${video ? ' is-video' : ''}${stage === 'recording' ? ' is-recording' : ''}`} onClick={shutter}><i/></button>
          <span className="sim-camera-tool" aria-hidden="true">⟲</span></footer>}
  </div>;
}

// ---- lesson player ------------------------------------------------------------
function useSpeech(text, playing, muted, onEnd, seconds) {
  const [pos, setPos] = useState(0);
  const end = useRef(onEnd); end.current = onEnd;
  useEffect(() => {
    if (!playing) { window.speechSynthesis?.pause?.(); return; }
    let utterance;
    if (!muted && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
    const started = performance.now() - pos * 1000;
    const id = setInterval(() => {
      const t = (performance.now() - started) / 1000;
      if (t >= seconds) { clearInterval(id); setPos(seconds); end.current(); } else setPos(t);
    }, 100);
    return () => { clearInterval(id); if (utterance) window.speechSynthesis.cancel(); };
  }, [playing]);
  useEffect(() => () => window.speechSynthesis?.cancel?.(), []);
  return pos;
}

function Quiz({ questions, lang, onSubmit, failed }) {
  const [answers, setAnswers] = useState({});
  const all = questions.every((_, i) => answers[i] != null);
  return <div className="sim-quiz">
    {failed && <p className="sim-quiz-failed" role="alert">Not quite. {failed}</p>}
    {questions.map((q, i) => <section key={i} className="sim-q">
      <p className="sim-q-prompt"><b>{i + 1}.</b> {(lang === 'es' && q.promptEs) || q.prompt}</p>
      <div className={q.options.length === 2 ? 'sim-opts' : 'sim-choices'}>{((lang === 'es' && q.optionsEs) || q.options).map((o, j) => q.options.length === 2
        ? <button type="button" key={o} className={`sim-opt${answers[i] === j ? ' is-on' : ''}`} onClick={() => setAnswers({ ...answers, [i]: j })}><span className={`sim-box${answers[i] === j ? ' is-on' : ''}`}>{answers[i] === j && '✓'}</span>{o}</button>
        : <button type="button" key={o} className={`sim-choice${answers[i] === j ? ' is-on' : ''}`} onClick={() => setAnswers({ ...answers, [i]: j })}><span className="sim-radio"/>{o}</button>)}</div>
    </section>)}
    <button type="button" className="sim-primary" disabled={!all} onClick={() => { onSubmit(questions.every((q, i) => answers[i] === q.correct)); setAnswers({}); }}>{lang === 'es' ? 'Enviar' : 'Submit'}</button>
  </div>;
}

export function LessonLayer({ lesson, index = 1, total = 1, lang = 'en', muted = false, onPass, onFail, onBack, onToggleLang, auto = false }) {
  const quiz = lesson.kind === 'quiz' ? lesson.questions : lesson.kind === 'choice' ? [{ prompt: lesson.prompt, options: lesson.options, correct: lesson.correct }] : lesson.quiz;
  const [phase, setPhase] = useState(lesson.kind === 'quiz' || lesson.kind === 'choice' ? 'quiz' : 'content');
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState('');
  const videoRef = useRef(null);
  const [vt, setVt] = useState({ t: 0, d: 0 });
  const text = (lang === 'es' && lesson.textEs) || lesson.text;
  const finish = () => { setPlaying(false); if (quiz?.length) setPhase('quiz'); else onPass(); };
  const pos = useSpeech(text || '', playing && lesson.kind === 'audio', muted || lang === 'es', finish, lesson.seconds || 20);
  const submit = ok => {
    if (ok) { onPass(); return; }
    if (lesson.kind === 'quiz') { onFail?.(); return; }
    setFailed(lesson.kind === 'choice' ? 'Try again.' : 'The lesson will repeat until you pass.');
    if (lesson.kind !== 'choice') setPhase('content');
  };
  // The AI presenter can play through a lesson: skip → correct answers.
  useEffect(() => { if (auto) { const t = setTimeout(() => onPass(), 1600); return () => clearTimeout(t); } }, [auto]);
  const label = phase === 'quiz' ? (lang === 'es' ? 'Prueba' : 'Quiz') : lesson.kind === 'audio' ? 'Audio' : lesson.kind === 'video' ? 'Video' : lesson.kind === 'image' ? 'Image' : lesson.title;
  return <div className="sim-lesson">
    <LayerHead title="Mission Details" onBack={onBack}>{lesson.textEs || quiz?.some(q => q.promptEs) ? <button type="button" className="sim-lang" onClick={onToggleLang}>{lang === 'es' ? 'EN' : 'ES'}</button> : <span className="sim-head-space"/>}</LayerHead>
    <div className="sim-pager"><span><small>{index}/{total}</small><b>{label}</b></span><em>{lesson.title}</em></div>
    <div className="sim-lesson-stage">
      {phase === 'content' && lesson.kind === 'video' && <video ref={videoRef} src={lesson.src} playsInline muted={muted} onTimeUpdate={e => setVt({ t: e.currentTarget.currentTime, d: e.currentTarget.duration || 0 })} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={finish}/>}
      {phase === 'content' && lesson.kind === 'audio' && <p className="sim-lesson-text">{text}</p>}
      {phase === 'content' && lesson.kind === 'image' && <img src={lesson.src} alt={lesson.title}/>}
      {phase === 'quiz' && <Quiz questions={quiz} lang={lang} failed={failed} onSubmit={submit}/>}
      {phase === 'content' && failed && <p className="sim-quiz-failed" role="alert">{failed}</p>}
    </div>
    {phase === 'content' && <footer className="sim-transport">
      {lesson.kind !== 'image' && <button type="button" className="sim-play" aria-label={playing ? 'Pause' : 'Play'} onClick={() => {
        if (lesson.kind === 'video') { const v = videoRef.current; if (v.paused) v.play().catch(() => {}); else v.pause(); } else setPlaying(p => !p);
      }}>{playing ? <PauseGlyph/> : <PlayGlyph/>}</button>}
      {lesson.kind !== 'image' && <span className="sim-track"><i style={{ width: `${lesson.kind === 'video' ? (vt.d ? vt.t / vt.d * 100 : 0) : pos / (lesson.seconds || 20) * 100}%` }}/></span>}
      {lesson.kind !== 'image' && <time>{clock(lesson.kind === 'video' ? Math.max(0, vt.d - vt.t) : Math.max(0, (lesson.seconds || 20) - pos)).text.slice(3)}</time>}
      <button type="button" className="sim-skip" onClick={finish}>{quiz?.length ? (lesson.kind === 'image' ? 'Next' : 'Skip to quiz') : 'Done'}</button>
    </footer>}
  </div>;
}

// ---- photo / video viewer ---------------------------------------------------------
export function PhotoViewer({ src, media = 'photo', name, onClose }) {
  return <div className="sim-viewer">
    <LayerHead title={name || 'Photo'} onBack={onClose} dark/>
    <div className="sim-viewer-media">{media === 'video' ? <video src={src} poster="/demo-quality/damaged-hinge.png" autoPlay muted loop playsInline controls/> : <img src={src} alt={name || 'Proof photo'}/>}</div>
    <footer className="sim-viewer-close"><button type="button" onClick={onClose}><CheckGlyph/>Close</button></footer>
  </div>;
}

// ---- Media Proofs feed ---------------------------------------------------------------
export function ProofsFeed({ missions, onPhoto, onBack }) {
  const [query, setQuery] = useState('');
  const live = missions.filter(m => m.status === 'closed' && Object.keys(m.proofs || {}).length).map(m => {
    const s = stamp(m.closedAt);
    return { id: m.id, kind: m.type, category: m.reference || 'Operations', title: m.title, performer: (m.performer || '').replace(' - Staff', ''), execution: clock((m.closedAt - m.claimedAt) / 1000).text, duration: clock((m.closedAt - m.postedAt) / 1000).text, date: `${s.date} ${s.time}`,
      photos: Object.values(m.proofs).map(p => ({ src: p.kind === 'video' ? '/demo-quality/damaged-hinge.png' : p.src, full: p.src, media: p.kind, alt: m.title, name: fileStamp(p.at, p.kind) })) };
  });
  const feed = [...live, ...BUSINESS_PROOFS.map(m => ({ ...m, photos: m.photos.map(p => ({ src: proofSrc(p.name), full: proofSrc(p.name), media: 'photo', alt: p.alt, name: p.alt })) }))]
    .filter(m => !query || `${m.title} ${m.performer} ${m.category}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="sim-proofs">
    <LayerHead title="Media Proofs" onBack={onBack}/>
    <label className="sim-search"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4.5 4.5"/></svg><input placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search media proofs"/></label>
    <div className="sim-proofs-list">
      {feed.map(m => <article key={m.id} className="sim-proof-card">
        <header><div className="sim-proof-kind"><img src="/mission-logo.png" alt=""/><b>{m.kind}</b><span>{m.execution}</span><strong>{m.duration}</strong></div>
          <small>{m.category}</small><h3>{m.title}</h3><div className="sim-proof-meta"><span>{m.performer}</span><time>{m.date}</time></div></header>
        <div className="sim-proof-grid">{m.photos.map((p, i) => <button type="button" key={i} className="sim-proof-photo" style={{ backgroundImage: `url('${p.src}')` }} aria-label={`Open ${p.alt}`} onClick={() => onPhoto({ src: p.full, media: p.media, name: p.name })}>{p.media === 'video' && <i><PlayGlyph/></i>}</button>)}</div>
      </article>)}
      {!feed.length && <p className="mi-empty">No proofs match your search</p>}
    </div>
  </div>;
}

// ---- rate a closed mission -----------------------------------------------------------------
export const RATE_LABELS = ['Poor', 'OK', 'Good', 'Great', 'Excellent'];
export function RatePanel({ mission, now, onSubmit, onBack }) {
  const [value, setValue] = useState(null);
  const s = stamp(mission.closedAt || now);
  return <div className="sim-rate">
    <LayerHead title="Rate Mission" onBack={onBack}/>
    <section className="sim-rate-mission">
      <div className="sim-proof-kind"><img src="/mission-logo.png" alt=""/><b>{mission.type}</b>{mission.points != null && <em className="chip-points">{mission.points}</em>}</div>
      <h3>{mission.title}</h3>{mission.reference && <small>Ref: <b>{mission.reference}</b></small>}
      <div className="sim-proof-meta"><span>{mission.performer}</span><time>{s.date} {s.time}</time></div>
    </section>
    <div className="sim-rate-body">
      <p>Rate this mission:</p><h4>{value == null ? '—' : RATE_LABELS[value]}</h4>
      <div className="sim-rate-scale">{RATE_LABELS.map((l, i) => <button type="button" key={l} aria-pressed={value === i} className={value != null && i <= value ? 'is-on' : ''} onClick={() => setValue(i)}><span>{i + 1}</span><small>{l}</small></button>)}</div>
    </div>
    <footer className="sim-rate-foot"><button type="button" className="sim-primary" disabled={value == null} onClick={() => onSubmit(value + 1)}>Submit Rate</button></footer>
  </div>;
}

// ---- knowledge base ------------------------------------------------------------------------------
export function KnowledgePanel({ onBack, muted }) {
  const [open, setOpen] = useState(null);
  const item = KNOWLEDGE.find(k => k.id === open);
  if (item) {
    const lesson = item.kind === 'video' ? { kind: 'video', title: item.title, src: item.src } : item.kind === 'audio' ? { kind: 'audio', title: item.title, text: item.text, seconds: Math.max(10, Math.round(item.text.length / 15)) } : { kind: 'image', title: item.title, src: item.src };
    return <LessonLayer lesson={lesson} muted={muted} onPass={() => setOpen(null)} onBack={() => setOpen(null)}/>;
  }
  return <div className="sim-kb">
    <LayerHead title="Knowledge Base" onBack={onBack}/>
    <div className="sim-kb-list">{KNOWLEDGE.map(k => <button type="button" key={k.id} className="sim-kb-card" onClick={() => setOpen(k.id)}>
      <span className="sim-proof-kind"><img src="/mission-logo.png" alt=""/><b>Media</b><em className="sim-kb-kind">{k.kind === 'video' ? <VideoGlyph/> : k.kind === 'image' ? <PhotoGlyph/> : '♪'}</em></span>
      <h3>{k.title}</h3><time>{k.date}</time>
    </button>)}</div>
  </div>;
}

// ---- test completed ---------------------------------------------------------------------------------
export function TestResult({ mission, assigned = [], onClose }) {
  const r = mission.result || { score: 0, pct: 0 };
  const pass = !assigned.length && r.pct >= 70;
  return <div className="sim-result">
    <LayerHead title="Mission Details" onBack={onClose}/>
    <div className="sim-result-body">
      <span className={`sim-result-icon${pass ? '' : ' is-fail'}`}><CheckGlyph/></span>
      <h3>Test Completed</h3><p>Your Score is:</p>
      <strong className={pass ? 'is-pass' : ''}>{r.score}</strong><em className={pass ? 'is-pass' : ''}>{r.pct}%</em>
      {assigned.length > 0 && <p className="sim-result-note">Related media were assigned to a personal board:<br/>{assigned.map(a => <u key={a.id}>{a.title}</u>)}</p>}
    </div>
    <footer className="sim-rate-foot"><button type="button" className="sim-primary" onClick={onClose}>Close</button></footer>
  </div>;
}

export function useEventToast(events, deviceStart) {
  const [toast, setToast] = useState(null);
  const seen = useRef(null);
  const latest = useMemo(() => events.find(e => e.kind === 'ticket' || e.kind === 'assign'), [events]);
  useEffect(() => {
    if (!latest || latest.id === seen.current || latest.at < deviceStart) return;
    seen.current = latest.id; setToast(latest);
    const t = setTimeout(() => setToast(null), 6500);
    return () => clearTimeout(t);
  }, [latest, deviceStart]);
  return [toast, () => setToast(null)];
}
