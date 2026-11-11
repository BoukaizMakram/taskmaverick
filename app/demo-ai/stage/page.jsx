import SectionStage from '@/components/sections/SectionStage';

export const metadata = {title: 'Taskmaverick · stage', robots: {index: false, follow: false}};

// The sections' art for the AI demo call (/demo-ai): a hidden frame of the call's page draws the storyboard's section videos with the visitor's data (their industry, the
// missions the AI added) and takes them apart into frames (components/demo-ai/liveCapture.js). The same stage as /section-stage, which the capture script uses.
export default function Page() {
  return <SectionStage live/>;
}
