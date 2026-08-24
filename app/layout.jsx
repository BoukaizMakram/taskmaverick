import { Poppins, Inter, Montserrat, Cairo } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';

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

// Arabic-capable face, applied via CSS when the document is dir="rtl" / lang="ar"
// (the Latin faces above don't carry Arabic glyphs).
const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
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
      className={`${poppins.variable} ${inter.variable} ${montserrat.variable} ${cairo.variable}`}
      suppressHydrationWarning
    >
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
