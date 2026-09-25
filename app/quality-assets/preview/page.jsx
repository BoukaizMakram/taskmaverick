import { notFound } from 'next/navigation';
import QualityAssetScreen from '@/components/quality-assets/QualityAssetScreen';
import { assetById } from '@/lib/qualityAssets';
export const dynamic = 'force-dynamic';
export const metadata = { title:'Quality asset · Clean preview', robots:{index:false,follow:false} };
export default async function Page({searchParams}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const query = await searchParams;
  return <QualityAssetScreen asset={assetById(query.asset)} device={query.device === 'tablet' ? 'tablet' : 'mobile'} initialState={Number(query.state) || 0}/>;
}
