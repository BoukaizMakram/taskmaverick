import { notFound } from 'next/navigation';

import Navbar from '@/components/Navbar';
import IndustrySlides from '@/components/IndustrySlides';
import { INDUSTRY_ORDER, getIndustry } from '@/lib/industryDecks';

export function generateStaticParams() {
  return INDUSTRY_ORDER.map((industry) => ({ industry }));
}

export function generateMetadata({ params }) {
  const ind = getIndustry(params.industry);
  if (!ind) return { title: 'Use cases · Taskmaverick' };
  return {
    title: `${ind.name} use cases · Taskmaverick`,
    description: `See how ${ind.name} teams run their everyday operations with Taskmaverick, slide by slide.`,
  };
}

export default function IndustryPage({ params }) {
  const ind = getIndustry(params.industry);
  if (!ind) notFound();

  return (
    <div className="page isl-page">
      <Navbar />
      <IndustrySlides industry={ind} />
    </div>
  );
}
