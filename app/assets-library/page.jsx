import {promises as fs} from 'node:fs';
import path from 'node:path';
import AssetsLibrary from '@/components/AssetsLibrary';
import {partList, slimParts} from '@/lib/storyboardParts.mjs';

export const metadata={title:'Assets Library — Taskmaverick',robots:{index:false}};

// The product's UI pieces: the same catalog as Shift+A in the storyboard, captured by
// `npm run gen:storyboard -- --parts` (the pieces' pictures are public/storyboard/ui/).
// The page only needs their names, not their HTML.
async function catalog(){
 try{return JSON.parse(await fs.readFile(path.join(process.cwd(),'public','storyboard','ui-parts.json'),'utf8'));}
 catch{return {};}
}

export default async function Page(){
 return <AssetsLibrary parts={partList(slimParts(await catalog()))}/>;
}
