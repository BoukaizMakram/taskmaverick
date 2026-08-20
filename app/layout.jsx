import { Poppins, Inter, Montserrat } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata = {
  title: 'Taskmaverick · Automated Business Manager',
  description: 'Watch the Taskmaverick overview, chapter by chapter.',
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: some browser extensions inject attributes onto
    // <html> (e.g. crxlauncher, Grammarly) before React hydrates, which would
    // otherwise trip a hydration mismatch warning on the root element. This only
    // relaxes attribute checking on <html> itself, nothing deeper.
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} ${montserrat.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
