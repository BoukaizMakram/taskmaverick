// Downloads the demo proof photos (public domain / CC0, see `source` in
// lib/businessProofs.mjs and lib/liveOversightData.mjs) and self-hosts them
// as small square JPEGs in public/demo-quality/proofs.
//   npm run fetch:proofs            -> only missing photos
//   npm run fetch:proofs -- --force -> download all again
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {BUSINESS_PROOFS,PROOF_DIR} from '../lib/businessProofs.mjs';
import {STORAGE_PHOTOS,STORAGE_TODAY} from '../lib/liveOversightData.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'public',PROOF_DIR);
const force=process.argv.includes('--force');

async function fetchPhoto({name,url}){
 const file=path.join(OUT,`${name}.jpg`);
 if(!force&&await fs.access(file).then(()=>true,()=>false))return console.log(`skip  ${name}`);
 const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (Taskmaverick demo asset fetch)'}});
 if(!response.ok)throw new Error(`${name}: HTTP ${response.status}`);
 // Square crop around the most detailed region, like the app's photo grid.
 await sharp(Buffer.from(await response.arrayBuffer())).rotate().resize(512,512,{fit:'cover',position:sharp.strategy.attention}).jpeg({quality:80,mozjpeg:true}).toFile(file);
 console.log(`wrote ${name}`);
}

await fs.mkdir(OUT,{recursive:true});
const photos=[...BUSINESS_PROOFS.flatMap(m=>m.photos),...STORAGE_PHOTOS,...STORAGE_TODAY];
const results=await Promise.allSettled(photos.map(fetchPhoto));
const failed=results.filter(r=>r.status==='rejected').map(r=>r.reason.message);
if(failed.length){console.error(`\n${failed.length} photo(s) failed:\n${failed.join('\n')}\nRun npm run fetch:proofs again to retry them.`);process.exit(1);}
console.log(`\nDone: ${photos.length} photos in public${PROOF_DIR}`);
