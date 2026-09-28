'use client';

// ---------------------------------------------------------------------------
// VoiceQueue — plays the AI presenter's reply in order: speech segments are
// voiced through /api/demo-ai/tts (ElevenLabs, streamed MP3 — playback starts
// while it downloads; the next two sentences are prefetched), and command
// segments run on the shared screen at that exact point (`runCommand` returns a
// promise that resolves when the action has visibly happened).
// stop() interrupts instantly (barge-in). If ElevenLabs is unavailable the
// browser's own voice is used instead.
// ---------------------------------------------------------------------------

const AHEAD = 2;

export class VoiceQueue {
  constructor({ runCommand, onSpeaking, onCaption, onIdle, onError, onSegment, onStop }) {
    Object.assign(this, { runCommand, onSpeaking, onCaption, onIdle, onError, onSegment, onStop });
    this.items = [];
    this.running = false;
    this.generation = 0;
    this.current = null;
    this.previous = '';
    this.fallback = false;
    this.spoken = [];
  }

  enqueue(item) {
    this.items.push(item);
    this.prefetch();
    if (!this.running) this.loop();
  }

  prefetch() {
    let ready = 0;
    let prev = this.previous;
    for (const item of this.items) {
      if (item.type !== 'speech') continue;
      if (ready >= AHEAD) break;
      if (!item.audio && !this.fallback) {
        item.audio = new Audio(`/api/demo-ai/tts?text=${encodeURIComponent(item.text)}&prev=${encodeURIComponent(prev.slice(-200))}`);
        item.audio.preload = 'auto';
        item.failed = new Promise(resolve => item.audio.addEventListener('error', () => resolve(true), { once: true }));
      }
      prev = item.text;
      ready += 1;
    }
  }

  async loop() {
    this.running = true;
    const generation = this.generation;
    while (this.items.length && generation === this.generation) {
      const item = this.items.shift();
      this.prefetch();
      if (item.type === 'command') {
        try { await this.runCommand(item.command); } catch (error) { console.warn('demo-ai command failed', item.command, error); }
        continue;
      }
      this.currentItem = item;
      this.onCaption?.(item.text);
      this.spoken.push(item.text);
      this.spoken = this.spoken.slice(-4);
      this.onSpeaking?.(true);
      // The screen follows the words (DemoStage.follow): pass the sentence and its audio.
      this.onSegment?.(item.text, this.fallback ? null : item.audio || null);
      await this.speak(item, generation);
      if (generation === this.generation) this.currentItem = null;
      this.previous = item.text;
    }
    if (generation === this.generation) {
      this.running = false;
      this.onSpeaking?.(false);
      this.onCaption?.('');
      this.onIdle?.();
    }
  }

  speak(item, generation) {
    if (this.fallback || !item.audio) return this.speakLocally(item.text, generation);
    return new Promise(resolve => {
      const audio = item.audio;
      this.current = audio;
      let settled = false, local = false;
      const done = () => { if (settled) return; settled = true; this.current = null; this.finishCurrent = null; resolve(); };
      const useLocal = () => {
        if (local || settled) return;
        local = true;
        if (generation !== this.generation) return done();
        this.fallback = true;
        this.onError?.('voice');
        this.speakLocally(item.text, generation).then(done);
      };
      this.finishCurrent = done;
      audio.addEventListener('ended', done, { once: true });
      item.failed.then(useLocal);
      audio.play().catch(useLocal);
    });
  }

  speakLocally(text, generation) {
    return new Promise(resolve => {
      const synth = typeof window !== 'undefined' && window.speechSynthesis;
      if (!synth || generation !== this.generation) return resolve();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.04;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      this.utterance = utterance;
      synth.speak(utterance);
      // Some browsers never fire onend for long texts — don't hang the queue.
      setTimeout(resolve, 1500 + text.length * 90);
    });
  }

  // Barge-in / new turn: silence now and drop everything queued. What was cut
  // (the sentence being spoken + everything after it) is kept in `dropped`, so a
  // scripted tour can resume exactly there.
  stop() {
    const cut = [this.currentItem, ...this.items].filter(Boolean).map(({ type, text, command }) => ({ type, text, command }));
    if (cut.length) this.dropped = cut;
    this.currentItem = null;
    this.generation += 1;
    for (const item of this.items) if (item.audio) { item.audio.pause(); item.audio.removeAttribute('src'); item.audio.load(); }
    this.items = [];
    if (this.current) { this.current.pause(); this.current = null; }
    this.finishCurrent?.();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    this.running = false;
    this.onSpeaking?.(false);
    this.onCaption?.('');
    this.onStop?.();
  }

  takeDropped() { const d = this.dropped || []; this.dropped = null; return d; }
  get busy() { return this.running || this.items.length > 0; }
  recentText() { return this.spoken.join(' '); }
}
