import { notFound } from 'next/navigation';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import QualityAssetLibrary from '@/components/quality-assets/QualityAssetLibrary';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Improved Quality · Asset Library', robots: { index: false, follow: false } };
export default async function Page() {
  if (process.env.NODE_ENV === 'production') notFound();
  const references = await readdir(path.join(process.cwd(), 'assets/quality-references')).catch(() => []);
  return <QualityAssetLibrary references={references.filter(file => /^(mobile|tablet)-[a-z-]+\.png$/.test(file))}/>;
}
