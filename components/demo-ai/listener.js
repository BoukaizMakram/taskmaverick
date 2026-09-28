'use client';

// ---------------------------------------------------------------------------
// Listener — hears the visitor on the /demo-ai call. Three engines, tried in
// order:
//   1. scribe  — ElevenLabs Scribe v2 Realtime: the mic (with echo
//      cancellation, so Mav's own voice is removed) is streamed as 16 kHz PCM
//      over a WebSocket (single-use token from /api/demo-ai/stt-token);
//      partial transcripts are live captions, a committed transcript (the
//      server's voice-activity detection heard you stop) is your turn.
//   2. browser — the Web Speech API (Chrome / Edge / Safari).
//   3. recorder — a volume gate records each utterance and /api/demo-ai/stt
//      transcribes it (works anywhere with a microphone).
// Callbacks: onInterim(text), onUtterance(text), onSpeechStart(text),
// onLevel(0..1), onStatus({ engine, state, message }), onError(message).
// ---------------------------------------------------------------------------

const RATE = 16000;
const CHUNK = RATE / 10; // 100 ms per message
const SCRIBE = 'wss://api.elevenlabs.io/v1/speech-to-text/realtime';
const QUIET_ERRORS = ['insufficient_audio_activity', 'commit_throttled', 'warning'];
const TAP = `class TmTap extends AudioWorkletProcessor { process(inputs) { const c = inputs[0] && inputs[0][0]; if (c) this.port.postMessage(c.slice(0)); return true; } } registerProcessor('tm-tap', TmTap);`;

function toBase64(int16) {
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export class Listener {
  constructor({ lang = 'en-US', onInterim, onUtterance, onLevel, onError, onSpeechStart, onStatus }) {
    Object.assign(this, { lang, onInterim, onUtterance, onLevel, onError, onSpeechStart, onStatus });
    this.enabled = false;
    this.finals = '';
    this.timer = null;
    this.engine = null;
    this.pending = [];
    this.pendingLength = 0;
  }

  static supportsLive() {
    return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  status(state, message = '') { this.onStatus?.({ engine: this.engine, state, message }); }

  async start() {
    this.enabled = true;
    this.status('connecting');
    if (!navigator.mediaDevices?.getUserMedia) {
      const message = window.isSecureContext ? 'This browser cannot use the microphone. Type in the chat instead.' : 'The microphone only works on https:// or http://localhost. Type in the chat instead.';
      this.onError?.(message); this.status('error', message); this.enabled = false; return false;
    }
    try {
      this.stream = this.stream || await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
    } catch (error) {
      const message = error?.name === 'NotFoundError' ? 'No microphone was found.' : 'Microphone access was blocked. Allow the microphone for this site, or type in the chat.';
      this.onError?.(message); this.status('error', message); this.enabled = false; return false;
    }
    await this.audioGraph();
    this.meter();
    if (await this.startScribe()) return true;
    if (Listener.supportsLive()) { this.startBrowser(); return true; }
    this.startRecorder();
    return true;
  }

  stop() {
    this.enabled = false;
    clearTimeout(this.timer);
    clearTimeout(this.reconnect);
    try { this.recognition?.abort(); } catch { /* already stopped */ }
    this.recognition = null;
    if (this.ws) { const ws = this.ws; this.ws = null; try { ws.close(); } catch { /* closed */ } }
    if (this.recorder?.state === 'recording') this.recorder.stop();
    cancelAnimationFrame(this.raf);
    this.onLevel?.(0);
    this.onInterim?.('');
    this.status('off');
  }

  destroy() {
    this.stop();
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.audioContext?.close().catch(() => {});
    this.audioContext = null;
  }

  setLang(lang) {
    this.lang = lang;
    if (this.engine === 'scribe' && this.ws) { try { this.ws.close(); } catch { /* reconnects with the new language */ } }
    if (this.recognition) { try { this.recognition.abort(); } catch { /* restarts onend */ } }
  }

  // Push-to-talk release: end the current utterance now.
  flush() {
    if (this.engine === 'scribe' && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ message_type: 'input_audio_chunk', audio_base_64: toBase64(new Int16Array(CHUNK / 4)), commit: true, sample_rate: RATE }));
      return;
    }
    clearTimeout(this.timer);
    const text = this.finals.trim();
    this.finals = '';
    this.onInterim?.('');
    if (text) this.onUtterance?.(text);
  }

  async audioGraph() {
    if (this.audioContext) { if (this.audioContext.state === 'suspended') await this.audioContext.resume().catch(() => {}); return; }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.audioContext = ctx;
    const source = ctx.createMediaStreamSource(this.stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.samples = new Uint8Array(this.analyser.fftSize);
    source.connect(this.analyser);
    // Raw samples for streaming (AudioWorklet; ScriptProcessor where missing).
    const sink = ctx.createGain();
    sink.gain.value = 0;
    sink.connect(ctx.destination);
    const onSamples = data => this.collect(data, ctx.sampleRate);
    try {
      const url = URL.createObjectURL(new Blob([TAP], { type: 'application/javascript' }));
      await ctx.audioWorklet.addModule(url);
      const tap = new AudioWorkletNode(ctx, 'tm-tap');
      tap.port.onmessage = e => onSamples(e.data);
      source.connect(tap).connect(sink);
    } catch {
      const tap = ctx.createScriptProcessor(4096, 1, 1);
      tap.onaudioprocess = e => onSamples(e.inputBuffer.getChannelData(0).slice(0));
      source.connect(tap).connect(sink);
    }
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
  }

  // Resample to 16 kHz mono PCM16 and send 100 ms messages to Scribe.
  collect(data, sampleRate) {
    if (this.engine !== 'scribe' || this.ws?.readyState !== WebSocket.OPEN) { this.pending = []; this.pendingLength = 0; return; }
    this.pending.push(data);
    this.pendingLength += data.length;
    const need = Math.ceil(CHUNK * sampleRate / RATE);
    if (this.pendingLength < need) return;
    const input = new Float32Array(this.pendingLength);
    let offset = 0;
    for (const part of this.pending) { input.set(part, offset); offset += part.length; }
    const outLength = Math.floor(input.length * RATE / sampleRate);
    const out = new Int16Array(outLength);
    const step = sampleRate / RATE;
    for (let i = 0; i < outLength; i += 1) {
      const pos = i * step, j = Math.floor(pos), frac = pos - j;
      const s = (input[j] ?? 0) * (1 - frac) + (input[j + 1] ?? input[j] ?? 0) * frac;
      out[i] = Math.max(-32768, Math.min(32767, Math.round(s * 32767)));
    }
    this.pending = []; this.pendingLength = 0;
    this.ws.send(JSON.stringify({ message_type: 'input_audio_chunk', audio_base_64: toBase64(out), commit: false, sample_rate: RATE }));
  }

  async startScribe() {
    this.engine = 'scribe';
    let token;
    try {
      const res = await fetch('/api/demo-ai/stt-token', { method: 'POST' });
      if (!res.ok) throw new Error('token');
      ({ token } = await res.json());
    } catch { this.engine = null; return false; }
    if (!this.enabled) return true;
    const params = new URLSearchParams({ model_id: 'scribe_v2_realtime', token, audio_format: 'pcm_16000', commit_strategy: 'vad', vad_silence_threshold_secs: '0.8' }); // language detected automatically
    const ws = new WebSocket(`${SCRIBE}?${params}`);
    const opened = await new Promise(resolve => {
      const timeout = setTimeout(() => resolve(false), 6000);
      ws.onopen = () => { clearTimeout(timeout); resolve(true); };
      ws.onerror = () => { clearTimeout(timeout); resolve(false); };
    });
    if (!opened) { try { ws.close(); } catch { /* never opened */ } this.engine = null; return false; }
    this.ws = ws;
    this.status('listening');
    ws.onmessage = event => {
      let m;
      try { m = JSON.parse(event.data); } catch { return; }
      if (m.message_type === 'partial_transcript') {
        const text = (m.text || '').trim();
        if (text) { this.onSpeechStart?.(text); this.onInterim?.(text); }
      } else if (m.message_type === 'committed_transcript') {
        const text = (m.text || '').trim();
        this.onInterim?.('');
        if (text) this.onUtterance?.(text);
      } else if (m.error && !QUIET_ERRORS.includes(m.message_type)) {
        console.warn('[demo-ai] Scribe', m.message_type, m.error);
        if (['auth_error', 'quota_exceeded'].includes(m.message_type)) this.onError?.('Live transcription is unavailable (ElevenLabs account). Switching to the browser’s speech recognition.');
      }
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (!this.enabled) return;
      // Session limits or network blips: reconnect with a fresh token, or fall back.
      this.status('connecting');
      this.reconnect = setTimeout(async () => { if (this.enabled && !(await this.startScribe())) { if (Listener.supportsLive()) this.startBrowser(); else this.startRecorder(); } }, 400);
    };
    return true;
  }

  meter() {
    const tick = () => {
      if (!this.enabled) return;
      this.analyser.getByteTimeDomainData(this.samples);
      let sum = 0;
      for (const v of this.samples) sum += ((v - 128) / 128) ** 2;
      this.level = Math.min(1, Math.sqrt(sum / this.samples.length) * 4);
      this.onLevel?.(this.level);
      this.raf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(this.raf);
    tick();
  }

  startBrowser() {
    this.engine = 'browser';
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = this.lang;
    let heardAnything = false;
    recognition.onresult = event => {
      heardAnything = true;
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) this.finals += ` ${result[0].transcript}`;
        else interim += result[0].transcript;
      }
      const shown = `${this.finals} ${interim}`.trim();
      if (shown) this.onSpeechStart?.(shown);
      this.onInterim?.(shown);
      clearTimeout(this.timer);
      if (this.finals.trim()) this.timer = setTimeout(() => this.flush(), interim ? 1500 : 750);
    };
    recognition.onerror = event => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || (event.error === 'network' && !heardAnything)) {
        // Some Chromium browsers ship the API without a speech service.
        this.recognition = null;
        try { recognition.abort(); } catch { /* stopped */ }
        this.startRecorder();
      }
    };
    recognition.onend = () => {
      if (this.finals.trim()) this.flush();
      if (this.enabled && this.recognition === recognition) { recognition.lang = this.lang; try { recognition.start(); } catch { /* retry on next end */ } }
    };
    this.recognition = recognition;
    try { recognition.start(); this.status('listening'); } catch { this.startRecorder(); }
  }

  startRecorder() {
    if (typeof MediaRecorder === 'undefined') { this.status('error', 'This browser cannot record audio. Type in the chat instead.'); return; }
    this.engine = 'recorder';
    this.status('listening');
    const gate = 0.08, silence = 900;
    let quietSince = 0, chunks = [];
    const recorder = new MediaRecorder(this.stream);
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      chunks = [];
      if (blob.size < 4000) return;
      this.onInterim?.('…');
      try {
        const form = new FormData();
        form.append('audio', blob, 'speech.webm');
        form.append('language', this.lang.slice(0, 2));
        const res = await fetch('/api/demo-ai/stt', { method: 'POST', body: form });
        const data = await res.json();
        this.onInterim?.('');
        if (res.ok && data.text) this.onUtterance?.(data.text); else if (!res.ok) this.onError?.(data.error || 'Transcription failed.');
      } catch { this.onInterim?.(''); this.onError?.('Transcription failed.'); }
    };
    this.recorder = recorder;
    const watch = () => {
      if (!this.enabled || this.engine !== 'recorder') return;
      const now = performance.now();
      if (this.level > gate) {
        quietSince = 0;
        if (recorder.state === 'inactive') { recorder.start(); this.onSpeechStart?.(''); }
      } else if (recorder.state === 'recording') {
        quietSince = quietSince || now;
        if (now - quietSince > silence) recorder.stop();
      }
      setTimeout(watch, 60);
    };
    watch();
  }
}

// Words the AI just said that the mic may have picked up from the speakers.
export function isEcho(heard, spoken) {
  // Without vowel marks: Mav writes vowelized Arabic, transcripts come without them.
  const words = s => String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').match(/[\p{L}\p{N}']+/gu) || [];
  const said = new Set(words(spoken));
  const got = words(heard);
  if (!got.length) return true;
  return got.filter(w => said.has(w)).length / got.length >= 0.6;
}
