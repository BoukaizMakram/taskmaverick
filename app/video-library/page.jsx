import {promises as fs} from 'node:fs';
import path from 'node:path';
import VideoLibrary from '@/components/VideoLibrary';
import {ASSETS, DEMOS} from '@/lib/videoLibrary.mjs';

export const metadata={title:'Video Library — Taskmaverick',robots:{index:false}};

// The notes saved in content/video-library.json travel with the code, so a
// deployed copy shows them on the cards too.
async function savedReviews(){
 try{return JSON.parse(await fs.readFile(path.join(process.cwd(),'content','video-library.json'),'utf8')).reviews||{};}
 catch{return {};}
}

// The animations as plain data (the story code stays on the server).
export default async function Page(){
 return <VideoLibrary assets={ASSETS} demos={DEMOS.map(({story,...demo})=>demo)} saved={await savedReviews()}/>;
}
