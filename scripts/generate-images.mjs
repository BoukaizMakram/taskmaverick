// Generates the photographs that replace drawn (vector) art, with the OpenAI Images API: an image EDIT whose input images are a layout guide
// (the drawing as it was), our own UI (the captured pieces of public/storyboard/ui/) and a style reference (scripts/image-refs/, the pictures
// the user gave as the look to reach); the picture comes back photographic, our UI on its screens (the user, 2026-10-27: "instead of vectors,
// generate images like the ones I sent ... where you give our UI and improve the image").
//   node scripts/generate-images.mjs                     the jobs (nothing is made)
//   node scripts/generate-images.mjs --only break-room   one job (several: --only a,b); --all: every job (every picture made again: one call each)
//   node scripts/generate-images.mjs --dry               only the input images, written to a temp folder to look at (no API call)
//   --n 3                     three variants: <out>-1.jpg … next to the output, each with the place it would give the live device
//   --use <picture.png>       no API call: this picture (one printed as "as generated") is the job's output (how a variant is picked)
//   --model <id>  --quality low|medium|high|xhigh|max
// The key: OPENAI_API_KEY from the environment, else from ~/.claude/api-keys.env (or --keys <file>). It is never printed or written.
// A job with `place` has a live device drawn over its picture (the section's real UI stays on top): the device the model drew is measured and
// the stage's constant is written so that the live one covers it (the board is then captured again).
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const ONLY = option('only', '')?.split(',').filter(Boolean);
const DRY = args.includes('--dry'), USE = option('use', null);
const N = Number(option('n', 1));
const MODEL = option('model', 'gpt-image-2.5-sunburst'); // (the 2.5 model made for precise edits: our UI kept as it is)
const QUALITY = option('quality', 'high');
const TMP = path.join(os.tmpdir(), 'taskmaverick-images');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ---- input images ----
const file = rel => () => sharp(path.join(ROOT, rel)).png().toBuffer();
const ref = name => file(`scripts/image-refs/${name}`);
// A tablet's screen out of a captured piece (public/storyboard/ui/<id>.jpg is the whole .tbl-tablet: public/tablet-frame.png, 1285 × 896, its
// screen at 92,64 1099 × 766, scaled to the capture's width).
async function tabletScreen(id) {
  const pic = sharp(path.join(ROOT, 'public/storyboard/ui', `${id}.jpg`)), {width} = await pic.metadata(), k = width / 1285;
  return pic.extract({left: Math.round(92 * k), top: Math.round(64 * k), width: Math.round(1099 * k), height: Math.round(766 * k)}).png().toBuffer();
}

// ---- Meal & Rest Breaks: the break room around the wall tablet (components/sections/BreaksStage.jsx, the room 1042 × 900 px) ----
// The tablet is the live Break Board (BreaksStage's WALL, read from the stage: its middle and its scale from .adx-tablet's 860 px); its frame's
// outline is tablet-frame.png's opaque box (46,17 → 1235,874) and its screen the frame's screen.
const WALL = JSON.parse((await fs.readFile(path.join(ROOT, 'components/sections/BreaksStage.jsx'), 'utf8')).match(/const WALL = (\{[^}]+\})/)[1].replace(/(\w+):/g, '"$1":'));
const ROOM = {w: 1042, h: 900}, F = 860 / 1285 * WALL.scale;
const T0 = {x: WALL.x - 1285 * F / 2, y: WALL.y - 896 * F / 2};
const BREAK_TABLET = {x: T0.x + 46 * F, y: T0.y + 17 * F, w: (1235 - 46) * F, h: (874 - 17) * F};
const BREAK_SCREEN = {x: T0.x + 92 * F, y: T0.y + 64 * F, w: 1099 * F, h: 766 * F};
// The picture is made at the room's own proportions (1280 × 1104, multiples of 16), so what the model frames is what the board shows: made 3:2 and
// cropped, a realistic door (far wider than the drawn one) ran past the crop and cut its sign in half. SIDE is the wall the guide shows past each side.
const PICTURE = {w: 1280, h: 1104}, SIDE = (ROOM.h * PICTURE.w / PICTURE.h - ROOM.w) / 2;
// The room as it was drawn (components/sections/meal-rest-breaks.css before the photo: the wall, the floor, the clock, the door and its sign,
// the bench, the plant), in the room's px, with the tablet showing our Team Board: the layout the photograph keeps.
async function breakRoomGuide() {
  const screen = (await tabletScreen('tablet-board')).toString('base64'), r = n => n.toFixed(1);
  const [x0, w] = [-SIDE, ROOM.w + 2 * SIDE], T = BREAK_TABLET, S = BREAK_SCREEN;
  const planks = Array.from({length: Math.ceil(w / 130) + 1}, (_, i) => `<rect x="${x0 + i * 130 + 128}" y="648" width="2" height="252" fill="rgb(60 35 15 / 10%)"/>`).join('');
  const ticks = Array.from({length: 12}, (_, i) => `<line x1="192" y1="128" x2="192" y2="139" stroke="#2f353c" stroke-width="3" transform="rotate(${i * 30} 192 178)"/>`).join('');
  const leaves = [[-38, 100], [-14, 120], [6, 136], [26, 112], [46, 92]].map(([a, h]) => `<ellipse cx="122" cy="${570 - h / 2}" rx="14" ry="${h / 2}" fill="url(#leaf)" transform="rotate(${a} 122 570)"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PICTURE.w}" height="${PICTURE.h}" viewBox="${x0} 0 ${w} ${ROOM.h}" preserveAspectRatio="none">
<defs>
<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1ede6"/><stop offset="1" stop-color="#e7e1d8"/></linearGradient>
<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c49a6c"/><stop offset="1" stop-color="#a97e52"/></linearGradient>
<linearGradient id="door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9c6d1"/><stop offset="1" stop-color="#a8b6c2"/></linearGradient>
<linearGradient id="seat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d6743"/><stop offset="1" stop-color="#73532f"/></linearGradient>
<linearGradient id="pot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9814f"/><stop offset="1" stop-color="#bd6a3c"/></linearGradient>
<linearGradient id="leaf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fae6e"/><stop offset="1" stop-color="#3d8a4f"/></linearGradient>
<radialGradient id="face"><stop offset=".6" stop-color="#fff"/><stop offset="1" stop-color="#f1f3f5"/></radialGradient>
<radialGradient id="mount"><stop offset="0" stop-color="rgb(0 0 0 / 22%)"/><stop offset="1" stop-color="rgb(0 0 0 / 0%)"/></radialGradient>
</defs>
<rect x="${x0}" y="0" width="${w}" height="648" fill="url(#wall)"/>
<rect x="${x0}" y="648" width="${w}" height="252" fill="url(#floor)"/>${planks}
<rect x="${x0}" y="632" width="${w}" height="18" fill="#fbfaf7"/>
<circle cx="192" cy="178" r="56.5" fill="url(#face)" stroke="#2f353c" stroke-width="7"/>${ticks}
<line x1="192" y1="178" x2="192" y2="148" stroke="#2f353c" stroke-width="6" stroke-linecap="round" transform="rotate(-30 192 178)"/>
<line x1="192" y1="178" x2="192" y2="136" stroke="#2f353c" stroke-width="4" stroke-linecap="round" transform="rotate(180 192 178)"/>
<circle cx="192" cy="178" r="6" fill="#bd1f59"/>
<rect x="800" y="236" width="170" height="398" rx="4" fill="#d9d2c6"/><rect x="810" y="246" width="150" height="388" fill="url(#door)"/><circle cx="937" cy="449" r="7" fill="#5d6a75"/>
<rect x="810" y="176" width="150" height="37" rx="6" fill="#1271b7"/><text x="885" y="200" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="17" font-weight="600" fill="#fff">Break Room</text>
<rect x="377" y="572" width="16" height="66" fill="#5c4126"/><rect x="649" y="572" width="16" height="66" fill="#5c4126"/><rect x="351" y="548" width="340" height="24" rx="6" fill="url(#seat)"/>
${leaves}<polygon points="78,556 164,556 153.7,640 88.3,640" fill="url(#pot)"/>
<ellipse cx="${r(T.x + T.w / 2)}" cy="${r(T.y + T.h + 6)}" rx="${r(T.w * 0.53)}" ry="15" fill="url(#mount)"/>
<rect x="${r(T.x)}" y="${r(T.y)}" width="${r(T.w)}" height="${r(T.h)}" rx="12" fill="#0b0b0b"/>
<image x="${r(S.x)}" y="${r(S.y)}" width="${r(S.w)}" height="${r(S.h)}" preserveAspectRatio="none" href="data:image/png;base64,${screen}"/>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
// The mask of an edit (its transparent part is what the model may change): everything but `keep` (room px), so the device stays where and as big
// as the guide has it (without it the model framed the room closer: a wider tablet, too big to sit under the live one).
function guideMask(keep) {
  const k = PICTURE.h / ROOM.h, r = n => Math.round(n * k);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PICTURE.w}" height="${PICTURE.h}"><rect x="${r(keep.x + SIDE)}" y="${r(keep.y)}" width="${r(keep.w)}" height="${r(keep.h)}" fill="#000"/></svg>`;
  return sharp(Buffer.from(svg)).ensureAlpha().png().toBuffer();
}

// The look of the user's references (scripts/image-refs/): a premium studio photograph.
const STYLE = 'Premium commercial studio photography: soft, even studio light, realistic materials, crisp focus, natural colors.';

// A job: `out` (.jpg, or .webp to keep a transparent background), `prompt`, `size`, and `inputs` (+ `mask`) for an EDIT, or none for a plain
// generation; `transparent` (the model leaves the background out; the picture is trimmed to what is in it), `max` (its longest side, px), `avatar` (that square of it, in the avatars' frame), `screen`
// (finds the chroma-green screen, says where it is and blacks it out), `place` (a live device over it: below), or `source` + `cutout` (no API call:
// a picture of ours with its light backdrop taken out).
const JOBS = [
  {
    id: 'break-room', out: 'public/storyboard-art/break-room.jpg', size: `${PICTURE.w}x${PICTURE.h}`,
    inputs: [breakRoomGuide, () => tabletScreen('tablet-board'), ref('kitchen-team-board.webp')],
    mask: () => guideMask(BREAK_TABLET),
    place: {room: ROOM, device: BREAK_TABLET, stage: 'components/sections/BreaksStage.jsx'},
    prompt: `Turn image 1 into a real photograph. Image 1 is a flat vector drawing of the staff break room of a restaurant; keep its composition exactly: a straight-on, eye-level view square to the wall (no perspective, no tilt, no rotation), seen from as far back as in image 1, every object at the same place and the same size as in image 1: the round wall clock at the top left, the potted plant on the floor at the left, the wooden bench against the wall under the tablet, the door at the right with a small blue sign above it that reads "Break Room", the white baseboard and the wood floor.
The black tablet in landscape in the middle is a small tablet mounted flat on the wall: keep it exactly where it is, exactly as big and with exactly the proportions it has in image 1 (it is not a wide TV), its thin flat black bezel facing the camera straight on, nothing in front of it. Build the room around it at that scale. Its screen shows the Taskmaverick app exactly as image 2 shows it (our real software: the Team Board, its blue Open / Claimed / Closed headers and white mission cards with green timers): copy it as it is, do not redesign, restyle or invent any UI.
Layout from left to right, as in image 1: the potted plant on the floor at the left with the round clock on the wall above it; the bench under the tablet; the door at the right, its left edge about half a tablet-width right of the tablet, with its blue sign above it. The door and its sign stay whole inside the picture, a little wall at their right; the clock and the plant stay whole too.
Two employees on their break sit on the bench, in red polo uniforms with black collars, relaxed, one holding a coffee cup; they sit low, the top of their heads at least half a tablet-height below the bottom edge of the tablet.
Image 3 is only the reference for the photographic quality and mood: a premium commercial photograph, warm natural light, realistic materials (painted plaster wall, oak bench, wood floor), soft shadows, crisp focus. Do not copy image 3's kitchen, its tablet or its framing.
Clean and tidy, no clutter, no other text or logos.`,
  },

  // ---- the other boards' things that are not the software (the user, 2026-10-27: "update things like operational manual to the image I sent without the background + any
  // other UI that is not the software like the A Consultant May Generate Revenue From Mass Adoption to be a generated image ... just a good one, on all the storyboard") ----
  // Standardizing Enterprise: the Operations Manual is the user's own picture (the book, its light, the plaques), its backdrop taken out (no API call).
  {id: 'operational-manual', out: 'public/storyboard-art/operational-manual-plaques.webp', source: 'scripts/image-refs/operational-manual-plaques.webp', cutout: true, max: 1400},
  // Increased Efficiency, after "A Whole Team Can Share One Single Device": the AI picture the user already had, three people looking at the Team Board on the wall (the CEO's review of 2026-10-28; no API call).
  {id: 'three-people', out: 'public/storyboard-art/three-people.jpg', source: 'scripts/image-refs/kitchen-team-board.webp', max: 1536},
  // Increased Efficiency: the three people of that picture, facing us, for the team's avatars (the user, 2026-11-02: "generate faces using openai that looks like the guys in ai image and put them in similar avatar frames"; made in ChatGPT, each
  // from its crop of the picture, the account having no API credits: scripts/image-refs/face-*.png are the pictures, no API call). `avatar`: the square of the picture to use, so that the three heads are the same size in the row.
  {id: 'face-maya', out: 'public/avatars/team-maya.png', source: 'scripts/image-refs/face-maya.png', avatar: {left: 93, top: 4, size: 734}},
  {id: 'face-adam', out: 'public/avatars/team-adam.png', source: 'scripts/image-refs/face-adam.png', avatar: {left: 92, top: 3, size: 717}},
  {id: 'face-ben', out: 'public/avatars/team-ben.png', source: 'scripts/image-refs/face-ben.png', avatar: {left: 4, top: 2, size: 895}},
  // Innovating Consulting, "A Consultant May Generate Revenue From Mass Adoption": the crowd the catalog reaches, and the coin that pops over it (one picture, every coin).
  {id: 'crowd', out: 'public/storyboard-art/crowd.webp', size: '1536x1024', transparent: true, max: 1400,
    prompt: `A photograph of a large, diverse crowd of small-business owners and their staff, about thirty people standing close together in three loose rows: restaurant owners, chefs in white jackets, cafe baristas in aprons, retail store managers, hotel front-desk staff, fitness trainers, men and women of many ages and backgrounds. Seen from the front at eye level, they look up and slightly past the camera with interest and warm smiles, as if at something exciting above them. The front row is cut at the chest by the bottom of the picture; the rows behind are higher. ${STYLE} Isolated on a transparent background: no floor, no walls, no backdrop, nothing behind the people.`},
  {id: 'coin', out: 'public/storyboard-art/coin.webp', size: '1024x1024', transparent: true, max: 160,
    prompt: `A single shiny gold coin embossed with a bold dollar sign ($), seen straight on, its milled rim catching the light, filling most of the picture. ${STYLE} Isolated on a transparent background, no shadow.`},
  // Innovating Consulting, "Easily Demonstrate That The Value Provided Is Greater Than Its Cost": the BI report is on a monitor (the report stays live on its screen, the green part).
  {id: 'bi-monitor', out: 'public/storyboard-art/bi-monitor.webp', size: '1536x1024', transparent: true, screen: true, max: 1400,
    prompt: `A photograph of a large modern desktop monitor with a very thin black bezel on a slim aluminium stand, seen exactly from the front at eye level (no perspective, no rotation, the screen a perfect rectangle), filling most of the picture. Its screen is a perfectly flat, uniform, pure chroma-key green (#00FF00): no reflection, no glare, no gradient, no content, the green filling the whole display right up to the bezel. ${STYLE} Isolated on a transparent background: no desk, no wall, nothing behind it.`},
  // Content Adaptation: California and Texas are drawn by their own outlines, filled with this land (the outlines stay exact).
  {id: 'land', out: 'public/storyboard-art/land.jpg', size: '1024x1024', max: 1024,
    prompt: `A top-down aerial photograph of natural land seen from very high above, like a detailed satellite relief image: rolling hills and mountain ridges with soft shading, river valleys, patches of green forest, golden farmland and warm ochre desert. Soft natural light, rich fine detail, natural colors. No roads, no towns, no water bodies at the edges, no text, no labels, no borders, no clouds; the land fills the whole frame evenly.`},
  // Automated Certification and Learning Efficiency: the certificate's paper (its words, its name and its dates stay live over it).
  {id: 'certificate', out: 'public/storyboard-art/certificate.webp', size: '1536x1024', transparent: true, max: 1200,
    prompt: `A blank certificate of completion printed on thick cream cotton paper, landscape, seen flat from straight above, filling the picture: an elegant thin double border in deep blue with a fine gold-foil line around its edge, and one round embossed gold-foil seal with two short deep-blue ribbons, centered at the bottom. Everything else is completely blank: no text, no letters, no lines to sign on, no logos, no signatures. ${STYLE} Isolated on a transparent background.`},
  // Risk & Liability: the cover of the HR training "Respect In The Workplace" (its thumbnail in the survey).
  {id: 'hr-training', out: 'public/storyboard-art/hr-training.jpg', size: '1536x1024', max: 800,
    prompt: `A warm, candid photograph for an HR training course about respect in the workplace: four coworkers of different ages, genders and backgrounds in neat restaurant and front-desk uniforms talk together in a bright, modern break room, listening to each other and smiling, open and inclusive body language. Natural window light, shallow depth of field, premium commercial photography, realistic. No text, no logos.`},
  // Requesting Support: the sign with its QR code on the wall, and the package with its label.
  {id: 'qr-sign', out: 'public/storyboard-art/qr-sign.webp', size: '1024x1536', transparent: true, max: 800,
    prompt: `A wall sign photographed straight on (no perspective, no rotation): a white acrylic panel in portrait (2:3) with softly rounded corners, a deep blue band (#1271b7) across its top, held by two brushed-steel standoff screws at its top corners. Printed on it, centered, in a clean bold sans-serif: "Need something?" in large black letters; under it "Scan to request support" in gray; then a large black QR code inside a rounded black frame; and at the bottom "Room 12" in blue. Exactly these words, spelled exactly so, and no other text. ${STYLE} Isolated on a transparent background, a soft shadow under it.`},
  {id: 'package', out: 'public/storyboard-art/package.webp', size: '1024x1024', transparent: true, max: 900,
    prompt: `A closed corrugated cardboard shipping box in a three-quarter front view, slightly from above (its front face toward the camera, a little of its top and one side seen), a strip of brown packing tape along the middle of its top, and a white shipping label stuck flat on its front face: a black barcode across the top of the label, under it a black QR code at the left and, to its right, the bold words "Package 4821" with "Scan to report a problem" under them. Exactly these words, spelled exactly so, and no other text. ${STYLE} Isolated on a transparent background, a soft shadow under it.`},
];

// ---- the API ----
async function loadKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim();
  const text = await fs.readFile(option('keys', path.join(os.homedir(), '.claude', 'api-keys.env')), 'utf8').catch(() => '');
  return text.match(/^\s*OPENAI_API_KEY\s*=\s*["']?([^"'\r\n]+)/m)?.[1].trim();
}
async function call(key, endpoint, body) {
  const headers = {Authorization: `Bearer ${key}`, ...(body instanceof FormData ? {} : {'Content-Type': 'application/json'})};
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`https://api.openai.com/v1/images/${endpoint}`, {method: 'POST', headers, body: body instanceof FormData ? body : JSON.stringify(body)}).catch(error => ({error}));
    const text = response.error ? '' : await response.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    if (json?.data) return json.data.map(d => Buffer.from(d.b64_json, 'base64'));
    const message = json?.error?.message ?? response.error?.message ?? `HTTP ${response.status}: ${text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160)}`;
    if (attempt >= 3 || (response.status && response.status < 500 && response.status !== 429)) throw new Error(message); // (a refused request makes no picture: only a 5xx or a 429 is tried again)
    console.log(`  retry (${message})`); await sleep(5000 * attempt);
  }
}
async function edit(key, {prompt, images, mask, size, n, fidelity = true}) {
  const form = new FormData();
  for (const [k, v] of Object.entries({model: MODEL, prompt, size, quality: QUALITY, n: String(n)})) form.append(k, v);
  if (fidelity) form.append('input_fidelity', 'high');
  images.forEach((buffer, i) => form.append('image[]', new Blob([buffer], {type: 'image/png'}), `input-${i + 1}.png`));
  if (mask) form.append('mask', new Blob([mask], {type: 'image/png'}), 'mask.png');
  try { return await call(key, 'edits', form); } catch (error) {
    if (fidelity && /input_fidelity/i.test(error.message)) return edit(key, {prompt, images, mask, size, n, fidelity: false}); // (a model without the parameter)
    throw error;
  }
}
const generate = (key, {prompt, size, n, transparent}) => call(key, 'generations', {model: MODEL, prompt, size, quality: QUALITY, n, ...(transparent ? {background: 'transparent', output_format: 'png'} : {})});

// ---- after the model ----
// The backdrop taken out of a studio picture (a light, neutral backdrop). The solid things (what is darker than a light gray, their small gaps closed:
// gold letters on a dark cover) are kept whole. The rest is a glow over a dark plate: as strong as it is warm (its color's saturation, on a blurred
// copy: a wide, smooth light, no grain, no sparkles), in that color at full brightness. The neutral backdrop and its gray shadows are left out (un-mixing
// them from the backdrop left gray and tan patches on a dark plate).
async function cutout(picture) {
  const {data, info} = await sharp(picture).removeAlpha().raw().toBuffer({resolveWithObject: true});
  const W = info.width, H = info.height, out = Buffer.alloc(W * H * 4);
  const soft = await sharp(picture).removeAlpha().blur(6).raw().toBuffer();
  const gray = (buffer, at) => sharp(buffer, {raw: {width: W, height: H, channels: 1}}).blur(at).extractChannel(0).raw().toBuffer(); // (sharp gives 3 channels back without it)
  const threshold = (buffer, t) => Buffer.from(buffer.map(v => (v > t ? 255 : 0)));
  const dark = Buffer.alloc(W * H);
  for (let p = 0; p < W * H; p++) dark[p] = 0.2126 * data[p * 3] + 0.7152 * data[p * 3 + 1] + 0.0722 * data[p * 3 + 2] < 175 ? 255 : 0;
  const solid = await gray(threshold(await gray(threshold(await gray(dark, 5), 40), 5), 215), 1); // (grown, shrunk back: closed; then a soft edge)
  for (let p = 0; p < W * H; p++) {
    const i = p * 3, o = p * 4, top = Math.max(soft[i], soft[i + 1], soft[i + 2]), chroma = top - Math.min(soft[i], soft[i + 1], soft[i + 2]);
    const glow = Math.min(1, Math.max(0, (chroma - 6) / 110)), k = solid[p] / 255, alpha = k + (1 - k) * glow;
    for (let c = 0; c < 3; c++) out[o + c] = alpha ? Math.round((k * data[i + c] + (1 - k) * glow * (soft[i + c] * 255 / Math.max(1, top))) / alpha) : 0;
    out[o + 3] = Math.round(alpha * 255);
  }
  return sharp(out, {raw: {width: W, height: H, channels: 4}}).png().toBuffer();
}
// What is in a transparent picture, the empty part around it cut off.
async function trim(picture) {
  const {data, info} = await sharp(picture).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return x1 < 0 ? picture : sharp(picture).extract({left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1}).png().toBuffer();
}
// The chroma-green screen of a picture: where it is (px and fractions of the picture: the stage puts its live screen there) and blacked out (a
// green fringe would show round the live screen).
async function screen(picture) {
  const {data, info} = await sharp(picture).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const W = info.width, H = info.height;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (g > r + 40 && g > b + 40) {
      if (g > 150 && r < 110 && b < 110) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      data[i] = data[i + 1] = data[i + 2] = 12;
    }
  }
  if (x1 < 0) console.log('  ! no green screen found');
  else console.log(`  screen at ${JSON.stringify({x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1})} px of ${W}×${H}: left ${(x0 / W * 100).toFixed(2)}%, top ${(y0 / H * 100).toFixed(2)}%, width ${((x1 - x0 + 1) / W * 100).toFixed(2)}%, height ${((y1 - y0 + 1) / H * 100).toFixed(2)}%`);
  return sharp(data, {raw: {width: W, height: H, channels: 4}}).png().toBuffer();
}
// A picture in the frame of public/avatars: an octagon 320 px wide with softly rounded corners and a thin gray line round it.
async function avatarFrame(picture, {left, top, size}) {
  const S = 320, R = 10, C = 95 + R * (Math.SQRT2 - 1), points = [[C, R], [S - C, R], [S - R, C], [S - R, S - C], [S - C, S - R], [C, S - R], [R, S - C], [R, C]].join(' ');
  const shape = (color, line) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><polygon points="${points}" fill="${color}" stroke="${color}" stroke-width="${line}" stroke-linejoin="round"/></svg>`);
  const inside = await sharp(picture).extract({left, top, width: size, height: size}).resize(S, S).ensureAlpha().composite([{input: shape('#fff', 2 * R - 6), blend: 'dest-in'}]).png().toBuffer();
  return sharp(shape('#878787', 2 * R)).composite([{input: inside}]).png().toBuffer();
}
async function write(picture, file, max) {
  let image = sharp(picture);
  const {width, height} = await image.metadata();
  if (max && Math.max(width, height) > max) image = image.resize(width >= height ? {width: max} : {height: max});
  image = file.endsWith('.png') ? image.png({compressionLevel: 9}) : file.endsWith('.webp') ? image.webp({quality: 88, alphaQuality: 95}) : image.flatten({background: '#ffffff'}).jpeg({quality: 88, mozjpeg: true});
  await image.toFile(file);
  const meta = await sharp(file).metadata();
  return `${meta.width}×${meta.height}`;
}

// ---- fitting the picture over the live device ----
// The picture is the whole room (made at its proportions) and the LIVE device follows the one the model drew: the model keeps the place the mask
// gives but draws a tablet its own way (16:10, some 10% wider than the mask), so a crop could not fit it under the live one. The device's black
// frame is found near where the guide put it (the columns and rows with a long dark run: a bezel), and the stage's WALL (its middle and scale) is
// set so that the live tablet's frame covers it whole, their middles together (our frame is 4:3-ish: as wide, a little taller).
async function measure(picture, expected) {
  const {data, info} = await sharp(picture).greyscale().raw().toBuffer({resolveWithObject: true});
  const pad = 0.35, X0 = Math.max(0, Math.round(expected.x - expected.w * pad)), X1 = Math.min(info.width - 1, Math.round(expected.x + expected.w * (1 + pad)));
  const Y0 = Math.max(0, Math.round(expected.y - expected.h * pad)), Y1 = Math.min(info.height - 1, Math.round(expected.y + expected.h * (1 + pad)));
  const dark = (x, y) => data[y * info.width + x] < 60;
  const run = (from, to, at) => { let best = 0, n = 0; for (let i = from; i <= to; i++) { n = at(i) ? n + 1 : 0; best = Math.max(best, n); } return best; }; // (the longest dark run: a bezel, not hair beside hair)
  const cols = [], rows = [];
  for (let x = X0; x <= X1; x++) if (run(Y0, Y1, y => dark(x, y)) >= expected.h * 0.55) cols.push(x);
  for (let y = Y0; y <= Y1; y++) if (run(X0, X1, x => dark(x, y)) >= expected.w * 0.55) rows.push(y);
  if (!cols.length || !rows.length) return null;
  const found = {x: cols[0], y: rows[0], w: cols.at(-1) - cols[0] + 1, h: rows.at(-1) - rows[0] + 1};
  return Math.abs(found.w / expected.w - 1) < 0.3 && Math.abs(found.h / expected.h - 1) < 0.3 ? found : null;
}
// The live tablet (public/tablet-frame.png, 1285 × 896, its frame's opaque box 46,17 → 1235,874) at `scale` of .adx-tablet's 860 px, centered on
// x, y: the WALL that puts its frame over `m` (room px).
function wallOver(m) {
  const F = Math.max(m.w / 1189, m.h / 857), scale = Math.ceil(F * 1285 / 860 * 1000) / 1000, f = 860 / 1285 * scale;
  return {x: +(m.x + m.w / 2 - (46 + 1189 / 2 - 1285 / 2) * f).toFixed(1), y: +(m.y + m.h / 2 - (17 + 857 / 2 - 896 / 2) * f).toFixed(1), scale};
}
async function place(picture, {room, device, stage}, write) {
  const {width, height} = await sharp(picture).metadata(), kx = width / room.w, ky = height / room.h;
  const found = await measure(picture, {x: device.x * kx, y: device.y * ky, w: device.w * kx, h: device.h * ky});
  if (!found) { console.log(`  ! no tablet found where the guide put it: ${stage} is left as it is (look at the picture)`); return; }
  const wall = wallOver({x: found.x / kx, y: found.y / ky, w: found.w / kx, h: found.h / ky}), literal = `{x: ${wall.x}, y: ${wall.y}, scale: ${wall.scale}}`;
  console.log(`  tablet at ${JSON.stringify(found)} px -> WALL = ${literal}`);
  if (!write) return;
  const file = path.join(ROOT, stage), text = await fs.readFile(file, 'utf8');
  await fs.writeFile(file, text.replace(/const WALL = \{[^}]+\}/, `const WALL = ${literal}`));
  console.log(`  wrote WALL in ${stage} (capture the board again: node scripts/capture-sections.mjs --section meal-rest-breaks, the site running)`);
}

// ---- run ----
const jobs = JOBS.filter(j => args.includes('--all') || ONLY.includes(j.id));
if (!jobs.length) { console.error(`${ONLY.length ? `No job named ${ONLY.join(', ')}. ` : ''}Jobs (--only <id>, or --all: every picture made again): ${JOBS.map(j => j.id).join(', ')}`); process.exit(1); }
await fs.mkdir(TMP, {recursive: true});
const needsKey = !DRY && !USE && jobs.some(j => !j.source);
const key = needsKey ? await loadKey() : null;
if (needsKey && !key) { console.error('Missing OPENAI_API_KEY (environment or ~/.claude/api-keys.env).'); process.exit(1); }
for (const job of jobs) {
  const local = job.source || USE;
  console.log(`${job.id}: ${DRY ? 'inputs' : local ? `the picture ${job.source ?? USE}` : `${MODEL}, ${QUALITY}, ${job.size}${N > 1 ? `, ${N} variants` : ''}`}`);
  const images = await Promise.all((job.inputs ?? []).map(make => make())), mask = job.mask && await job.mask();
  if (DRY) { for (const [name, image] of [...images.map((image, i) => [`input-${i + 1}`, image]), ...(mask ? [['mask', mask]] : [])]) { const out = path.join(TMP, `${job.id}-${name}.png`); await fs.writeFile(out, image); console.log(`  ${out}`); } continue; }
  const started = Date.now(), request = {prompt: job.prompt, size: job.size, n: N};
  const pictures = local ? [await fs.readFile(path.resolve(ROOT, job.source ?? USE))] : images.length ? await edit(key, {...request, images, mask}) : await generate(key, {...request, transparent: job.transparent});
  if (!local) console.log(`  ${((Date.now() - started) / 1000).toFixed(0)} s`);
  const variants = pictures.length > 1;
  for (const [i, generated] of pictures.entries()) {
    const raw = local ? path.resolve(ROOT, job.source ?? USE) : path.join(TMP, `${job.id}-${Date.now()}-${i + 1}.png`);
    if (!local) await fs.writeFile(raw, generated);
    let picture = job.cutout ? await cutout(generated) : generated;
    if (job.transparent || job.cutout) picture = await trim(picture);
    if (job.screen) picture = await screen(picture);
    if (job.avatar) picture = await avatarFrame(picture, job.avatar);
    const out = path.join(ROOT, variants ? job.out.replace(/(\.\w+)$/, `-${i + 1}$1`) : job.out);
    await fs.mkdir(path.dirname(out), {recursive: true});
    console.log(`  wrote ${path.relative(ROOT, out)}, ${await write(picture, out, job.max)} (${local ? 'from' : 'as generated:'} ${raw})`);
    if (job.place) await place(picture, job.place, !variants); // (a variant only says its WALL: the one picked is made the output with --use)
  }
}
