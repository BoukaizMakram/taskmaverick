// Exporting a storyboard video as an MP4 file (the user, 2026-10-28: "add a way to export the videos in /storyboard"). Pure parts only: the size, which pictures are
// taken, the names of the files, the encoder, ffmpeg's arguments. The work is scripts/storyboard-export.mjs (a headless Chrome puts the video on each second of itself
// and takes its picture, ffmpeg makes the file), asked for by app/api/storyboard/export/route.js, which the buttons (components/StoryboardExport.jsx) call.

// The video's picture is 1600 x 900 px (`.sb-pl-screen`); the file is taken at any size of that shape (a multiple of 32 wide, so it is an even number of pixels high too: H.264 needs it).
export const SCREEN = {w: 1600, h: 900};
export const DEFAULTS = {fps: 30, width: 1920, crf: 18, format: 'jpeg', quality: 95};
export const LIMITS = {fps: [1, 60], width: [320, 3840], crf: [0, 51]};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const number = (value, fallback) => (Number.isFinite(Number(value)) && String(value ?? '').trim() !== '' ? Number(value) : fallback);

// What was asked for (command line words or the API's body) made safe: {fps, width, crf, format ('jpeg' | 'png')}.
export function optionsOf(raw = {}) {
  return {
    fps: Math.round(clamp(number(raw.fps, DEFAULTS.fps), ...LIMITS.fps)),
    width: Math.round(clamp(number(raw.width, DEFAULTS.width), ...LIMITS.width) / 32) * 32,
    crf: Math.round(clamp(number(raw.crf, DEFAULTS.crf), ...LIMITS.crf)),
    format: raw.format === 'png' ? 'png' : DEFAULTS.format,
  };
}

// The pixels of the file and how much bigger than the screen they are (the browser takes the picture at that device scale).
export const sizeOf = width => { const w = optionsOf({width}).width; return {w, h: (w * SCREEN.h) / SCREEN.w, scale: w / SCREEN.w}; };

// The pictures of a video `total` seconds long: one at 0, one every 1 / fps, the last on its very end. `timeOf(n)` is the second picture n is taken at.
export const frameCount = (total, fps) => Math.max(0, Math.floor(Math.max(0, total) * fps + 1e-6)) + 1;
export const timeOf = (n, total, fps) => Math.min(Math.max(0, total), n / fps);

// A file name from a video's title ("The tablet and its Knowledge Base" -> "the-tablet-and-its-knowledge-base"); titles that come to the same name get -2, -3…
export const slugOf = title => String(title ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'video';
export function namesOf(titles) {
  const used = new Map(), out = new Map();
  for (const title of titles) {
    const slug = slugOf(title), n = (used.get(slug) ?? 0) + 1;
    used.set(slug, n);
    out.set(title, n === 1 ? slug : `${slug}-${n}`);
  }
  return out;
}

// The videos of a board a request is for: the title it names exactly (a capital or two apart), else every title that has the words in it (`exactOnly`: the exact one or none: what
// the buttons ask for); no words: all of them.
export function wanted(titles, line, exactOnly = false) {
  const all = [...new Set(titles)], word = String(line ?? '').trim().toLowerCase();
  if (!word) return all;
  const exact = all.filter(t => t.toLowerCase() === word);
  return exact.length || exactOnly ? exact : all.filter(t => t.toLowerCase().includes(word));
}

// H.264 encoders, the best first: libx264 (the usual ffmpeg), Cisco's, the one Windows has.
export const ENCODERS = ['libx264', 'libopenh264', 'h264_mf'];
export const encoderOf = listing => ENCODERS.find(name => new RegExp(`^\\s*V\\S*\\s+${name}\\s`, 'm').test(String(listing ?? ''))) ?? null;

// ffmpeg reading the pictures one after the other from its input (JPEG or PNG), writing `out` (H.264, yuv420p, BT.709 like every HD video, the moov first so it plays as it downloads).
export function ffmpegArgs({fps, format = 'jpeg', crf = DEFAULTS.crf, encoder = 'libx264', out}) {
  const quality = encoder === 'libx264' ? ['-preset', 'medium', '-crf', String(crf)] : ['-b:v', '16M'];
  return ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', format === 'png' ? 'png' : 'mjpeg', '-i', '-', '-an',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=bicubic,format=yuv420p', '-c:v', encoder, ...quality,
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', out];
}

// The script prints one JSON object a line when it is asked to (--json): {event: 'start' | 'progress' | 'done' | 'error' | 'finished', …}. -> the object, or null for any other line.
export function eventOf(line) {
  try { const event = JSON.parse(line); return event && typeof event === 'object' && typeof event.event === 'string' ? event : null; } catch { return null; }
}
