import {promises as fs} from 'node:fs';
import path from 'node:path';
import {notFound} from 'next/navigation';
import AssetViewer from '@/components/AssetViewer';
import {SYNTHETIC} from '@/lib/storyboardParts.mjs';

// One piece of the product's UI, opened: the real HTML of the piece (the one Shift+A adds
// to a storyboard frame), not its thumbnail — it stays sharp at any zoom.
async function find(id) {
  const made = SYNTHETIC.find(p => p.id === id);
  if (made) return made;
  try {
    const catalog = JSON.parse(await fs.readFile(path.join(process.cwd(), 'public', 'storyboard', 'ui-parts.json'), 'utf8'));
    const part = Object.hasOwn(catalog, id) ? catalog[id] : null;
    return part?.name ? part : null;
  } catch { return null; }
}

export async function generateMetadata({params}) {
  const part = await find((await params).id);
  return {title: `${part?.name ?? 'Asset'} — Assets Library`, robots: {index: false}};
}

export default async function Page({params}) {
  const part = await find((await params).id);
  if (!part) notFound();
  return <AssetViewer part={part}/>;
}
