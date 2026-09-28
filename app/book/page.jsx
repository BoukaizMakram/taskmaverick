import Navbar from '@/components/Navbar';
import BookDemo from '@/components/BookDemo';

export const metadata = {
  title: 'Book a demo · Taskmaverick',
  description: 'See Taskmaverick run your everyday operations — book a tailored walkthrough.',
};

export default function BookDemoPage() {
  return (
    <div className="page">
      <Navbar returnHome />
      <div className="lp">
        <BookDemo />
      </div>
    </div>
  );
}
