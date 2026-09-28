'use client';

// ---------------------------------------------------------------------------
// DemoAI — /demo-ai: a live call with "Mav", Taskmaverick's AI product
// specialist, who shares its screen (DemoStage: web app + phone + shared
// tablet) and drives it while it talks. Styled like the main site, in dark:
// navy starfield hero, brand-blue pills, feature cards, sidebar list.
//   you speak → Listener (live transcription, captions)
//   → /api/demo-ai/chat (Gemini, streamed, with the live screen contents)
//   → createSegmenter (sentences + [[commands]]) → VoiceQueue (ElevenLabs
//   voice; commands and the cursor run in sync with the words)
// Speaking over Mav interrupts it; its own voice from the speakers is ignored.
// After the greeting Mav plays the guided tour (lib/demoAi/tour.mjs — the same
// walkthrough as the recorded sales demo). Interrupting pauses it; Gemini
// answers, and [[tour continue]] resumes exactly where it was cut.
// When Mav sets the app up for the visitor's industry ([[stage industry …]]),
// the stage reports it once it's on screen and Mav gets a hidden "screen
// update" turn to present it with the real mission names.
// The transcript panel also takes typed messages. Prefix .dai-*.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import DemoStage from './DemoStage';
import Starfield from '@/components/Starfield';
import { VoiceQueue } from './voice';
import { Listener, isEcho } from './listener';
import { createSimStore } from '@/lib/sim/store.mjs';
import { createSegmenter, stripCommands } from '@/lib/demoAi/commands.mjs';
import { GREETING, AI_NAME } from '@/lib/demoAi/prompt.mjs';
import { TOUR, tourContext, isContinue, continueLine } from '@/lib/demoAi/tour.mjs';
import './demo-ai.css';

const LAYOUT_CHOICES = [['devices', 'Phone + Tablet'], ['all', 'Everything'], ['web', 'Web'], ['tablet', 'Tablet'], ['phone', 'Phone']];
const pad = n => String(n).padStart(2, '0');

const Glyph = ({ name }) => {
  const d = {
    mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8',
    micOff: 'M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V6a3 3 0 0 0-5.7-1.3M5 11a7 7 0 0 0 11.5 5.4M19 11a7 7 0 0 1-.6 2.8M12 18v3M8 21h8M3 3l18 18',
    cc: 'M3 6h18v12H3zM10 10.5a2 2 0 1 0 0 3M17 10.5a2 2 0 1 0 0 3',
    chat: 'M4 5h16v11H9l-5 4z',
    send: 'M4 12 20 4l-6 16-3-7z',
    screen: 'M3 5h18v11H3zM8 20h8M12 16v4',
    hand: 'M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5V4a1.5 1.5 0 0 1 3 0v6.5m0-4a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.5 14a1.5 1.5 0 0 1 2.4-1.8L8 14.5',
    wave: 'M3 12h2M7 8v8M11 5v14M15 8v8M19 11v2',
    brief: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
    play: 'M8 5v14l11-7z',
    leave: 'M10 4H5v16h5M14 8l4 4-4 4M18 12H9',
    calendar: 'M4 5h16v16H4zM8 2v6M16 2v6M4 10h16',
    pause: 'M8 5v14M16 5v14',
    next: 'M6 5l9 7-9 7zM18 5v14',
    list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  }[name];
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill={name === 'play' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
};

function useClock(running) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { if (!running) return; const start = Date.now(); const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000); return () => clearInterval(id); }, [running]);
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

function SiteHeader({ children }) {
  return <header className="dai-head">
    <a className="dai-logo" href="/" aria-label="Taskmaverick home"><img src="/logo-light.svg" alt="taskmaverick" width="186" height="26"/></a>
    {children}
  </header>;
}

const FEATURES = [
  ['screen', 'blue', 'Live Screen Share', 'Mav Drives The Real App On Web, Tablet And Phone While It Talks'],
  ['wave', 'green', 'Just Talk', 'Speak Naturally And Interrupt Any Time, Like A Real Call'],
  ['brief', 'blue', 'Tailored To You', 'Every Answer And Demo Fits Your Business'],
];

function PreJoin({ status, onJoin }) {
  const [name, setName] = useState('');
  const [mic, setMic] = useState(true);
  return <main className="dai-page dai-prejoin">
    <SiteHeader><nav className="dai-head-nav"><a href="/">Home</a><a href="/book" className="dai-head-cta"><Glyph name="calendar"/>Book a call</a></nav></SiteHeader>
    <div className="dai-prejoin-body">
      <section className="dai-hero" aria-label="Join the live demo">
        <Starfield className="dai-stars" fitParent speed={0.35}/>
        <div className="dai-hero-inner">
          <span className="dai-eyebrow"><i/>Live AI Demo</span>
          <h1>Meet {AI_NAME}<br/>Your Taskmaverick Product Specialist</h1>
          <p>{AI_NAME} shares its screen and walks you through the real software — tailored to how your business runs.</p>
          <form className="dai-join" onSubmit={e => { e.preventDefault(); onJoin({ name: name.trim(), mic }); }}>
            <input value={name} maxLength={40} placeholder="Your name" aria-label="Your name" onChange={e => setName(e.target.value)}/>
            <button type="button" className={`dai-mic-choice${mic ? '' : ' is-off'}`} aria-pressed={mic} onClick={() => setMic(m => !m)} title={mic ? 'Microphone on' : 'Microphone off — you can type instead'}><Glyph name={mic ? 'mic' : 'micOff'}/>{mic ? 'Mic on' : 'Mic off'}</button>
            <button type="submit" className="dai-play"><Glyph name="play"/>Start the call</button>
          </form>
          <ul className="dai-status">
            <li className={status.ai ? 'is-ok' : status.ai === false ? 'is-bad' : ''}>{status.ai ? 'Mav is ready' : status.ai === false ? 'Mav is offline right now' : 'Connecting to Mav…'}</li>
            <li className={status.voice ? 'is-ok' : status.voice === false ? 'is-warn' : ''}>{status.voice ? 'Voice ready' : status.voice === false ? 'Using the browser voice' : 'Checking voice…'}</li>
          </ul>
        </div>
      </section>
      <div className="dai-features">{FEATURES.map(([icon, tone, title, sub]) => <article key={title} className={`dai-feature is-${tone}`}><span className="dai-feature-icon"><Glyph name={icon}/></span><div><b>{title}</b><small>{sub}</small></div></article>)}</div>
      <p className="dai-fineprint">Uses your microphone. {AI_NAME} is an AI and can make mistakes — for anything binding, book a call with our team.</p>
    </div>
  </main>;
}

export default function DemoAI() {
  const [phase, setPhase] = useState('prejoin');
  const [status, setStatus] = useState({ ai: null, voice: null });
  const [name, setName] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [level, setLevel] = useState(0);
  const [micStatus, setMicStatus] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [caption, setCaption] = useState('');
  const [heard, setHeard] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [captions, setCaptions] = useState(true);
  const [layout, setLayout] = useState('devices');
  const [remoteControl, setRemoteControl] = useState(false);
  const [transcript, setTranscript] = useState(false);
  const [sideTab, setSideTab] = useState('tour');
  const [tourView, setTourView] = useState({ status: 'idle', chapter: 0, step: 0 });
  const [notice, setNotice] = useState('');
  const [typed, setTyped] = useState('');
  const [store] = useState(() => createSimStore());
  const clock = useClock(phase === 'call');
  const stage = useRef(null);
  const voice = useRef(null);
  const listener = useRef(null);
  const abort = useRef(null);
  const history = useRef([]);
  const view = useRef({});
  const chatEnd = useRef(null);
  // Guided tour: where it is, and what was cut when it was interrupted.
  const tour = useRef({ status: 'idle', chapter: 0, step: 0, resume: false, leftover: null });
  const advanceRef = useRef(() => {});
  // An industry that just landed on screen, waiting for Mav to present it.
  const followUp = useRef(null);
  const lastFollow = useRef({ key: '', at: 0 });

  useEffect(() => {
    fetch('/api/demo-ai/chat').then(r => r.json()).then(d => setStatus({ ai: !!d.ai, voice: !!d.voice })).catch(() => setStatus({ ai: false, voice: false }));
  }, []);
  useEffect(() => { chatEnd.current?.scrollIntoView({ block: 'end' }); }, [messages, draft, transcript]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 7000); return () => clearTimeout(t); }, [notice]);

  const commit = (role, text, hidden = false) => { history.current = [...history.current, { role, text, ...(hidden ? { hidden } : {}) }]; setMessages(history.current); };

  const ask = useCallback(async (text, { hidden = false } = {}) => {
    const said = text.trim();
    if (!said) return;
    if (!hidden) followUp.current = null;
    // "Yes, continue" while the tour is paused: resume right away, no AI round-trip.
    if (!hidden && tour.current.status === 'paused' && isContinue(said)) {
      abort.current?.abort();
      voice.current?.stop();
      voice.current?.takeDropped();
      commit('user', said);
      Object.assign(tour.current, { status: 'playing', resume: true });
      syncTour();
      speakScript(continueLine(said));
      return;
    }
    abort.current?.abort();
    voice.current?.stop();
    const t = tour.current;
    if (t.status === 'playing') { t.status = 'paused'; t.resume = false; t.leftover = voice.current?.takeDropped() || null; syncTour(); }
    commit('user', said, hidden);
    setThinking(true);
    const controller = new AbortController();
    abort.current = controller;
    let full = '';
    try {
      const res = await fetch('/api/demo-ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history.current.filter(m => m.role !== 'action').map(({ role, text }) => ({ role, text })), view: view.current, screen: stage.current?.describe?.() || '', tour: tourContext(tour.current) }), signal: controller.signal });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Mav is unavailable right now (${res.status}).`); }
      const segmenter = createSegmenter(item => { if (abort.current === controller) voice.current.enqueue(item); });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        segmenter.push(chunk);
        setThinking(false);
        setDraft(stripCommands(full));
      }
      segmenter.end();
    } catch (error) {
      if (error.name !== 'AbortError') setNotice(error.message);
    } finally {
      if (abort.current === controller) { abort.current = null; setThinking(false); }
      setDraft('');
      if (full.trim()) commit('assistant', full.trim());
    }
  }, []);

  // ---- industries ---------------------------------------------------------------
  // The hidden turn says which language to answer in: the visitor's own (their last words).
  const industryNote = info => {
    const last = [...history.current].reverse().find(m => m.role === 'user' && !m.hidden)?.text || '';
    const lang = last ? ` Answer in the SAME language as the visitor's last message ("${last.slice(0, 160)}").` : '';
    return info.failed
      ? `(Screen update, not said by the visitor: setting up the ${info.industry} workspace failed — ${info.error}. In one or two sentences, say so simply and offer to show the closest example already in the app, or to continue the tour. No screen commands.${lang})`
      : `(Screen update, not said by the visitor: the ${info.industry} workspace is now on screen — unit ${info.unit}; team boards ${info.teams.join(', ')}${info.tickets.length ? `; ticket board ${info.tickets.join(', ')}` : ''}. The tablet shows the ${info.teams[0]} board, the phone shows the home dashboard with this unit on top. Present it now like a demo in 3 to 5 short sentences: name a few of its real missions from CURRENT SCREEN so your cursor points at them, and you may open one to show its steps. Do not use [[stage industry]] again. End with a question.${lang})`;
  };
  const runFollowUp = () => {
    const info = followUp.current;
    followUp.current = null;
    if (!info) return;
    // Presenting the same industry twice in a row (the AI asked for it again): once is enough.
    const key = `${info.industry}|${info.failed ? 'x' : info.unit}`;
    if (lastFollow.current.key === key && Date.now() - lastFollow.current.at < 90000) return advanceRef.current();
    lastFollow.current = { key, at: Date.now() };
    ask(industryNote(info), { hidden: true });
  };
  const onIndustry = info => {
    followUp.current = info;
    if (!voice.current?.busy && !abort.current) runFollowUp();
  };

  // ---- guided tour -----------------------------------------------------------
  const syncTour = () => setTourView({ status: tour.current.status, chapter: tour.current.chapter, step: tour.current.step });
  const speakScript = text => {
    commit('assistant', text);
    const segmenter = createSegmenter(item => voice.current.enqueue(item));
    segmenter.push(text); segmenter.end();
  };
  const playStep = () => {
    const t = tour.current;
    const chapter = TOUR[t.chapter];
    if (!chapter) { t.status = 'done'; syncTour(); return; }
    syncTour();
    speakScript(chapter.steps[t.step]);
  };
  // Called whenever Mav goes quiet: resume a cut step, or play the next one.
  advanceRef.current = () => {
    const t = tour.current;
    if (t.status !== 'playing') return;
    if (t.resume) {
      t.resume = false;
      const left = t.leftover; t.leftover = null;
      if (left?.length) { syncTour(); left.forEach(item => voice.current.enqueue(item)); } else playStep();
      return;
    }
    t.step += 1;
    if (t.step >= TOUR[t.chapter].steps.length) { t.chapter += 1; t.step = 0; }
    if (t.chapter >= TOUR.length) { t.status = 'done'; syncTour(); return; }
    syncTour();
    setTimeout(() => { if (tour.current.status === 'playing' && !voice.current.busy) playStep(); }, 380);
  };
  const tourCommand = c => {
    const t = tour.current;
    if (c.cmd === 'continue' || c.cmd === 'resume') { if (t.status !== 'done') Object.assign(t, { status: 'playing', resume: true }); }
    else if (c.cmd === 'chapter') { const n = Math.max(1, Math.min(TOUR.length, parseInt(c.arg, 10) || 1)); Object.assign(t, { status: 'playing', chapter: n - 1, step: 0, resume: true, leftover: null }); }
    else if (c.cmd === 'start') Object.assign(t, { status: 'playing', chapter: 0, step: 0, resume: true, leftover: null });
    else if (c.cmd === 'stop') Object.assign(t, { status: 'stopped', leftover: null });
    syncTour();
  };
  const pauseTour = () => {
    const t = tour.current;
    abort.current?.abort();
    voice.current?.stop();
    if (t.status === 'playing') { t.status = 'paused'; t.leftover = voice.current?.takeDropped() || null; }
    syncTour();
  };
  const resumeTour = () => {
    const t = tour.current;
    if (t.status === 'done' || t.status === 'idle') Object.assign(t, { chapter: 0, step: 0, leftover: null });
    Object.assign(t, { status: 'playing', resume: true });
    syncTour();
    if (!voice.current?.busy) advanceRef.current();
  };
  const jumpTo = index => {
    abort.current?.abort();
    voice.current?.stop();
    voice.current?.takeDropped();
    Object.assign(tour.current, { status: 'playing', chapter: Math.max(0, Math.min(TOUR.length - 1, index)), step: 0, resume: true, leftover: null });
    syncTour();
    advanceRef.current();
  };

  // One voice queue for the call; commands and the cursor run on the shared screen.
  useEffect(() => {
    voice.current = new VoiceQueue({
      runCommand: c => (c.target === 'tour' ? tourCommand(c) : stage.current?.run(c)),
      onIdle: () => (followUp.current && !abort.current ? runFollowUp() : advanceRef.current()),
      onSpeaking: setSpeaking,
      onCaption: setCaption,
      onError: () => setNotice('The ElevenLabs voice is unavailable — using the browser voice.'),
      onSegment: (text, audio) => stage.current?.follow(text, audio),
      onStop: () => stage.current?.unfollow(),
    });
    return () => { voice.current?.stop(); abort.current?.abort(); listener.current?.destroy(); };
  }, []);

  const startListening = useCallback(async () => {
    listener.current?.destroy();
    const l = new Listener({
      lang: typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US',
      onLevel: setLevel,
      onInterim: setHeard,
      onStatus: setMicStatus,
      onError: message => setNotice(message),
      // Speaking over Mav interrupts it — unless it's Mav's own voice from the speakers.
      onSpeechStart: text => {
        const v = voice.current;
        if (v?.busy && text.split(/\s+/).length >= 3 && !isEcho(text, v.recentText())) { v.stop(); abort.current?.abort(); }
      },
      onUtterance: text => {
        const v = voice.current;
        if (v?.busy && isEcho(text, v.recentText())) return;
        ask(text);
      },
    });
    listener.current = l;
    const ok = await l.start();
    if (!ok) setMicOn(false);
  }, [ask]);

  const join = ({ name: who, mic }) => {
    setName(who);
    setMicOn(mic);
    setPhase('call');
    Object.assign(tour.current, { status: 'playing', chapter: 0, step: 0, resume: true, leftover: null });
    syncTour();
    speakScript(GREETING(who));
    if (mic) startListening();
  };

  const toggleMic = () => {
    if (micOn) { listener.current?.stop(); setMicOn(false); setHeard(''); setMicStatus(null); }
    else { setMicOn(true); startListening(); }
  };

  // Hold Space to talk while muted.
  useEffect(() => {
    if (phase !== 'call') return;
    let held = false;
    const down = e => { if (e.code !== 'Space' || e.repeat || micOn || /INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement?.tagName)) return; e.preventDefault(); held = true; setMicOn(true); startListening(); };
    const up = e => { if (e.code !== 'Space' || !held) return; held = false; setTimeout(() => { listener.current?.flush?.(); listener.current?.stop(); setMicOn(false); }, 500); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [phase, micOn, startListening]);

  const leave = () => { abort.current?.abort(); voice.current?.stop(); tour.current.status = 'stopped'; listener.current?.destroy(); listener.current = null; setMicOn(false); setPhase('left'); };
  const sendTyped = e => { e.preventDefault(); const t = typed.trim(); if (!t) return; setTyped(''); ask(t); };
  const chooseLayout = next => { setLayout(next); stage.current?.setLayout(next); };

  if (phase === 'prejoin') return <PreJoin status={status} onJoin={join}/>;
  if (phase === 'left') return <main className="dai-page dai-prejoin">
    <SiteHeader><nav className="dai-head-nav"><a href="/">Home</a></nav></SiteHeader>
    <div className="dai-prejoin-body"><section className="dai-hero dai-hero--small"><Starfield className="dai-stars" fitParent speed={0.35}/>
      <div className="dai-hero-inner"><h1>Thanks For Meeting {AI_NAME}</h1><p>Want a walkthrough with our team, or a quote for your teams?</p>
        <div className="dai-join"><a className="dai-play" href="/book"><Glyph name="calendar"/>Book a call</a><button type="button" className="dai-ghost" onClick={() => { history.current = []; setMessages([]); Object.assign(tour.current, { status: 'idle', chapter: 0, step: 0, resume: false, leftover: null }); syncTour(); setPhase('prejoin'); }}>Rejoin the demo</button></div></div>
    </section></div>
  </main>;

  const aiState = thinking ? 'thinking' : speaking ? 'speaking' : 'idle';
  const listenLabel = !micOn ? 'Muted' : micStatus?.state === 'listening' ? 'Listening' : micStatus?.state === 'connecting' ? 'Connecting…' : micStatus?.state === 'error' ? 'Mic problem' : '';
  return <main className={`dai-page dai-call${transcript ? ' show-transcript' : ''}`} aria-label="Taskmaverick live demo call">
    <SiteHeader>
      <span className="dai-live"><i/>Live with {AI_NAME}<em>{clock}</em></span>
      <nav className="dai-head-nav"><a href="/book" className="dai-head-cta" target="_blank" rel="noreferrer"><Glyph name="calendar"/>Book a call</a><button type="button" className="dai-leave" onClick={leave}><Glyph name="leave"/>Leave</button></nav>
    </SiteHeader>

    <div className="dai-body">
      <section className="dai-share" aria-label={`${AI_NAME}'s shared screen`}>
        <div className="dai-share-bar">
          <span className="dai-sharing"><Glyph name="screen"/>{AI_NAME} is sharing</span>
          <div className="dai-seg" role="group" aria-label="What to show">{LAYOUT_CHOICES.map(([id, label]) => <button type="button" key={id} aria-pressed={layout === id} onClick={() => chooseLayout(id)}>{label}</button>)}</div>
          <button type="button" className={`dai-remote${remoteControl ? ' is-on' : ''}`} aria-pressed={remoteControl} onClick={() => setRemoteControl(r => !r)} title="Let me click the app myself"><Glyph name="hand"/>{remoteControl ? 'You have control' : 'Take control'}</button>
        </div>
        <div className="dai-stage-wrap">
          <DemoStage ref={stage} store={store} interactive={remoteControl} onView={v => { view.current = v; if (v.stage && v.stage !== layout) setLayout(v.stage); }} onAction={text => { history.current = [...history.current, { role: 'action', text }]; setMessages(history.current); }} onIndustry={onIndustry}/>
          {captions && (heard || caption) && <div className="dai-captions" aria-live="polite">{heard ? <p dir="auto"><b>{name || 'You'}</b>{heard}</p> : <p dir="auto"><b>{AI_NAME}</b>{caption}</p>}</div>}
          {notice && <div className="dai-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
        </div>
      </section>

      <aside className="dai-side" aria-label="Call">
        <div className="dai-tiles">
          <div className={`dai-tile is-ai is-${aiState}`}>
            <Starfield className="dai-stars" fitParent speed={0.25}/>
            <span className="dai-avatar is-ai"><img src="/mission-logo.png" alt=""/></span>
            {aiState === 'speaking' && <span className="dai-eq" aria-hidden="true"><i/><i/><i/><i/></span>}
            {aiState === 'thinking' && <span className="dai-dots" aria-label="Thinking"><i/><i/><i/></span>}
            <span className="dai-name">{AI_NAME} · AI</span>
          </div>
          <div className={`dai-tile is-you${micOn && level > 0.12 ? ' is-speaking' : ''}`}>
            <span className="dai-avatar is-you" style={{ '--lvl': micOn ? level : 0 }}>{(name || 'You').slice(0, 1).toUpperCase()}</span>
            {listenLabel && <span className={`dai-listen is-${micOn ? micStatus?.state || 'connecting' : 'off'}`}>{listenLabel}</span>}
            <span className="dai-name">{micOn ? <Glyph name="mic"/> : <span className="dai-muted"><Glyph name="micOff"/></span>}{name || 'You'}</span>
          </div>
        </div>
        <section className="dai-transcript" aria-label="Tour and transcript">
          <div className="dai-side-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={sideTab === 'tour'} onClick={() => setSideTab('tour')}><span className="dai-sq"/>Tour</button>
            <button type="button" role="tab" aria-selected={sideTab === 'transcript'} onClick={() => setSideTab('transcript')}><span className="dai-sq"/>Transcript</button>
          </div>
          {sideTab === 'tour' && <div className="dai-tour">
            <p className="dai-tour-state">{tourView.status === 'playing' ? `Playing · chapter ${tourView.chapter + 1} of ${TOUR.length}` : tourView.status === 'paused' ? `Paused at chapter ${tourView.chapter + 1} — ask anything, then resume` : tourView.status === 'done' ? 'Tour complete — ask Mav anything' : 'Tour stopped'}</p>
            <ol>{TOUR.map((c, i) => <li key={c.id}><button type="button" className={`${i === tourView.chapter && tourView.status !== 'done' ? 'is-current' : ''}${i < tourView.chapter || tourView.status === 'done' ? ' is-done' : ''}`} onClick={() => jumpTo(i)}><em>{i + 1}.</em>{c.title}</button></li>)}</ol>
          </div>}
          {sideTab === 'transcript' && <>
          <div className="dai-chat">{messages.map((m, i) => m.hidden ? null : m.role === 'action' ? <p key={i} className="is-action">{m.text}</p> : <p key={i} dir="auto" className={m.role === 'user' ? 'is-you' : ''}><b>{m.role === 'user' ? (name || 'You') : AI_NAME}</b>{stripCommands(m.text)}</p>)}
            {draft && <p dir="auto"><b>{AI_NAME}</b>{draft}</p>}{thinking && <p className="is-thinking"><b>{AI_NAME}</b>thinking…</p>}<span ref={chatEnd}/></div>
          </>}
          <form className="dai-chat-form" onSubmit={sendTyped}><input value={typed} onChange={e => setTyped(e.target.value)} placeholder={`Type to ${AI_NAME}…`} aria-label={`Message to ${AI_NAME}`}/><button type="submit" aria-label="Send"><Glyph name="send"/></button></form>
        </section>
      </aside>
    </div>

    <footer className="dai-dock">
      <button type="button" className={`dai-tool is-mic${micOn ? '' : ' is-off'}`} onClick={toggleMic} aria-pressed={!micOn} title={micOn ? 'Mute (hold Space to talk while muted)' : 'Unmute'}>
        <span className="dai-mic-level" style={{ '--lvl': micOn ? level : 0 }}><Glyph name={micOn ? 'mic' : 'micOff'}/></span>{micOn ? 'Mute' : 'Unmute'}
      </button>
      {tourView.status === 'playing'
        ? <button type="button" className="dai-tool" onClick={pauseTour}><Glyph name="pause"/>Pause tour</button>
        : <button type="button" className="dai-tool is-primary" onClick={resumeTour}><Glyph name="play"/>{tourView.status === 'paused' || tourView.status === 'stopped' ? 'Resume tour' : 'Start tour'}</button>}
      {(tourView.status === 'playing' || tourView.status === 'paused') && tourView.chapter < TOUR.length - 1 && <button type="button" className="dai-tool" onClick={() => jumpTo(tourView.chapter + 1)} title={`Next: ${TOUR[tourView.chapter + 1]?.title}`}><Glyph name="next"/>Next chapter</button>}
      <button type="button" className={`dai-tool${captions ? ' is-on' : ''}`} onClick={() => setCaptions(c => !c)} aria-pressed={captions}><Glyph name="cc"/>Captions</button>
      <button type="button" className={`dai-tool dai-only-narrow${transcript ? ' is-on' : ''}`} onClick={() => setTranscript(t => !t)} aria-pressed={transcript}><Glyph name="list"/>Tour &amp; transcript</button>
    </footer>
  </main>;
}
