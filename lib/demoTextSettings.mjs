export const DEMO_IDS = ['increased-efficiency', 'improved-quality'];
export const EMPTY_DEMO_TEXT = { version: 1, captions: {}, ui: {} };
export const FONT_OPTIONS = ['original', 'Poppins', 'Montserrat', 'Inter', 'Arial'];
const ranges = { size: [25, 300], weight: [100, 900], lineHeight: [.7, 3], letterSpacing: [-3, 15], x: [-800, 800], y: [-500, 500], width: [100, 1500], delay: [0, 120], reveal: [.05, 10], pause: [0, 20], fadeIn: [0, 5], fadeOut: [0, 5], duration: [.5, 180] };
export function validateDemoText(value) {
  if (!value || value.version !== 1 || !value.captions || !value.ui || Array.isArray(value.captions) || Array.isArray(value.ui)) throw new Error('Invalid demo text file.');
  const result = { version: 1, captions: {}, ui: {} };
  for (const group of ['captions', 'ui']) {
    if (typeof value[group] !== 'object' || Object.keys(value[group]).length > 3000) throw new Error('Too many text entries.');
    for (const [key, entry] of Object.entries(value[group])) {
      if (!/^[a-zA-Z0-9_-]{1,120}$/.test(key) || ['__proto__','constructor','prototype'].includes(key) || !entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Invalid text entry.');
      const clean = {};
      if (entry.positions !== undefined) {
        if (!Array.isArray(entry.positions) || entry.positions.length > 100 || entry.positions.some((p,i,a) => !p || !Number.isFinite(p.time) || p.time < 0 || p.time > 180 || !Number.isFinite(p.x) || p.x < 0 || p.x > 1600 || !Number.isFinite(p.y) || p.y < 0 || p.y > 900 || (i > 0 && p.time <= a[i-1].time))) throw new Error('Invalid position keyframes.');
        clean.positions = entry.positions.map(({time,x,y})=>({time,x,y}));
      }
      if (entry.positionStyle !== undefined) {
        const p=entry.positionStyle;
        if (!p || !Number.isFinite(p.fontSize) || p.fontSize < 1 || p.fontSize > 400 || !Number.isFinite(p.lineHeight) || p.lineHeight < .7 || p.lineHeight > 3) throw new Error('Invalid position text style.');
        clean.positionStyle={fontSize:p.fontSize,lineHeight:p.lineHeight};
      }
      for (const field of ['text', 'source', 'scene']) if (entry[field] !== undefined) {
        if (typeof entry[field] !== 'string' || entry[field].length > 10000) throw new Error('Text is too long.');
        clean[field] = entry[field];
      }
      for (const [field, [min, max]] of Object.entries(ranges)) if (entry[field] !== undefined) {
        if (!Number.isFinite(entry[field]) || entry[field] < min || entry[field] > max) throw new Error(`${field} must be between ${min} and ${max}.`);
        clean[field] = entry[field];
      }
      for (const [field, options] of Object.entries({font: FONT_OPTIONS, fontStyle:['normal','italic'], decoration:['none','underline'], align: ['left', 'center', 'right'], casing: ['original', 'title', 'uppercase']})) if (entry[field] !== undefined) {
        if (!options.includes(entry[field])) throw new Error(`Invalid ${field}.`);
        clean[field] = entry[field];
      }
      if (entry.color !== undefined) {
        if (!/^#[0-9a-f]{6}$/i.test(entry.color)) throw new Error('Invalid color.');
        clean.color = entry.color;
      }
      if (entry.lineStarts !== undefined) {
        if (!Array.isArray(entry.lineStarts) || entry.lineStarts.length > 100 || entry.lineStarts.some(n => !Number.isFinite(n) || n < 0 || n > 180)) throw new Error('Invalid line timing.');
        if (entry.lineStarts.some((n, i, a) => i > 0 && n < a[i-1])) throw new Error('Line start times must be in order.');
        clean.lineStarts = entry.lineStarts;
      }
      result[group][key] = clean;
    }
  }
  return result;
}
export function editedTimeline(story, config) {
  let cursor = 0;
  return story.map(scene => {
    const settings = config.captions[scene.id] || {};
    const duration = settings.duration ?? (scene.end-scene.start);
    const start = cursor;
    cursor += duration;
    return {...scene, text: settings.text ?? scene.text, start, end: cursor, duration, original: scene};
  });
}
export function demoClock(story, config, time) {
  const timeline = editedTimeline(story, config);
  const scene = timeline.find(s => time < s.end) || timeline.at(-1);
  const elapsed = Math.max(0, Math.min(scene.duration, time - scene.start));
  // Device choreography keeps its original relative positions within each scene.
  const originalTime = scene.original.start + elapsed / scene.duration * (scene.original.end-scene.original.start);
  return {timeline, scene, elapsed, remaining: scene.end-time, originalTime, duration: timeline.at(-1).end};
}
export function textFont(font) {
  return font && font !== 'original' ? (font === 'Arial' ? 'Arial,sans-serif' : `var(--font-${font.toLowerCase()}),sans-serif`) : undefined;
}
export function textLineStarts(text, settings = {}, speed = 1) {
  return text.split('\n').map((_, i) => settings.lineStarts?.[i] ?? (.1/speed + i*((settings.reveal ?? .65/speed)+(settings.pause ?? .45/speed))));
}

// Absolute centers on the 1600 × 900 video canvas; holds outside the keys.
export function textPositionAt(positions, time) {
  if (!positions?.length) return null;
  const next=positions.findIndex(p=>p.time>time);
  if(next===0)return positions[0];
  if(next===-1)return positions.at(-1);
  const a=positions[next-1],b=positions[next],t=(time-a.time)/(b.time-a.time);
  const eased=t*t*(3-2*t);
  return {x:a.x+(b.x-a.x)*eased,y:a.y+(b.y-a.y)*eased};
}

export function setTextPosition(positions, keyframe) {
  return [...(positions||[]).filter(p=>Math.abs(p.time-keyframe.time)>.025),keyframe].sort((a,b)=>a.time-b.time);
}
