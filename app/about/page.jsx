import Navbar from '@/components/Navbar';
import About from '@/components/About';
import AboutCta from '@/components/AboutCta';

export const metadata = {
  title: 'About · Taskmaverick',
  description: 'How Taskmaverick turns everyday operations into a system that runs itself.',
};

export default function AboutPage() {
  return (
    <div className="page">
      <Navbar />
      <div className="lp">
        <About />
        <AboutCta />
      </div>
    </div>
  );
}
