import Navbar from '@/components/Navbar';
import Contact from '@/components/Contact';

export const metadata = {
  title: 'Contact · Taskmaverick',
  description: 'Get in touch with the Taskmaverick team — talk to sales, book a demo, or send a message.',
};

export default function ContactPage() {
  return (
    <div className="page">
      <Navbar returnHome />
      <div className="lp">
        <Contact />
      </div>
    </div>
  );
}
