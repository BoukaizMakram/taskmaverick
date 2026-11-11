import {notFound} from 'next/navigation';
import SectionStage from '@/components/sections/SectionStage';

export const metadata = {title: 'Section stage', robots: {index: false}};

// A section's art at a state, for scripts/capture-sections.mjs. Development only (like /storyboard-ui).
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <SectionStage/>;
}
