import {notFound} from 'next/navigation';
import CutStage from '@/components/remotion/CutStage';

export const metadata = {title: 'Cut stage', robots: {index: false}};

// A Remotion cut drawn at one second, for scripts/capture-cuts.mjs (the board "All storyboards"). Development only (like /section-stage).
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <CutStage/>;
}
