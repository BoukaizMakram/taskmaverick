import DemoAI from '@/components/demo-ai/DemoAI';

export const metadata = {
  title: 'Live AI Demo · Taskmaverick',
  description: 'Talk to Mav, Taskmaverick’s AI product specialist, who shares its screen and walks you through the app on web, phone and tablet.',
};

// Public page: a live video-call style demo with an AI presenter. Needs
// GEMINI_API_KEY (and ELEVENLABS_API_KEY for the voice) on the server — see
// app/api/demo-ai/*. The microphone is allowed for this route in next.config.mjs.
export default function DemoAIPage() {
  return <DemoAI />;
}
