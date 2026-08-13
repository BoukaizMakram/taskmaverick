import Navbar from '@/components/Navbar';
import IndustryGrid from '@/components/IndustryGrid';

export const metadata = {
  title: 'Use cases by industry · Taskmaverick',
  description: 'Pick an industry to see how teams run their everyday operations with Taskmaverick.',
};

export default function IndustriesPage() {
  return (
    <div className="page">
      <Navbar />
      <div className="lp">
        <section className="lp-section" id="use-cases">
          <div className="lp-container">
            <div className="lp-head center">
              <span className="lp-kicker">Use cases by industry</span>
              <h1 className="lp-h2">Endless applications, one for every industry.</h1>
              <p className="lp-lead">
                Pick an industry to open its walkthrough — a slide deck of the everyday missions
                Taskmaverick runs for teams like yours.
              </p>
            </div>
            <IndustryGrid />
          </div>
        </section>
      </div>
    </div>
  );
}
