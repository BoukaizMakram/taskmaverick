import Navbar from '@/components/Navbar';
import IndustriesIndex from '@/components/IndustriesIndex';

export const metadata = {
  title: 'Use cases by industry · Taskmaverick',
  description:
    'A full index of how teams in every industry run their everyday operations with Taskmaverick — jump to any industry and section.',
};

export default function IndustriesPage() {
  return (
    <div className="page">
      <Navbar />
      <IndustriesIndex />
    </div>
  );
}
