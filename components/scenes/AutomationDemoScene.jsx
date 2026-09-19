'use client';

// Chapter 1 ("Automated Manager") renders the scripted Automation walkthrough
// (the real tablet interface driven by GSAP) instead of a video. It's the same
// component as the /automation-demo page, in its embedded `scene` layout so it
// fills the reel's video frame.
import AutomationDemo from '@/components/AutomationDemo';

export default function AutomationDemoScene() {
  return <AutomationDemo scene />;
}
