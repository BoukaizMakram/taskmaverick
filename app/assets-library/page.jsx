import {promises as fs} from 'node:fs';
import path from 'node:path';
import AssetsLibrary from '@/components/AssetsLibrary';
import {ASSETS, DEMOS} from '@/lib/assetsLibrary.mjs';

export const metadata={title:'Assets Library — Taskmaverick',robots:{index:false}};

// The notes saved in content/assets-library.json travel with the code, so a
// deployed copy shows them on the cards too.
async function savedReviews(){
 try{return JSON.parse(await fs.readFile(path.join(process.cwd(),'content','assets-library.json'),'utf8')).reviews||{};}
 catch{return {};}
}

// The animations as plain data (the story code stays on the server).
export default async function Page(){
 return <AssetsLibrary assets={ASSETS} demos={DEMOS.map(({story,...demo})=>demo)} saved={await savedReviews()}/>;
}
